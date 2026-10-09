-- =====================================================================
-- Hotel Booking – Supabase schema
-- Run this whole file once in: Supabase Dashboard -> SQL Editor -> New query
-- It is safe to re-run (idempotent), except seed data only inserts when
-- the hotels table is empty.
-- =====================================================================

-- ---------- Tables ---------------------------------------------------

create table if not exists public.users (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (length(trim(name)) between 1 and 100),
  email       text not null unique check (email = lower(email)),
  created_at  timestamptz not null default now()
);

create table if not exists public.hotels (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  location        text not null,
  description     text,
  price           numeric(10,2) not null check (price >= 0),         -- per night
  available_rooms integer not null check (available_rooms >= 0),     -- total rooms for sale
  guest_capacity  integer not null check (guest_capacity >= 1),      -- max guests per booking
  image           text                                               -- image URL
);

create table if not exists public.bookings (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id)  on delete restrict,
  hotel_id    uuid not null references public.hotels(id) on delete restrict,
  check_in    date not null,
  check_out   date not null,
  guests      integer not null check (guests >= 1),
  status      text not null default 'confirmed'
              check (status in ('pending', 'confirmed', 'cancelled')),
  created_at  timestamptz not null default now(),
  constraint bookings_dates_valid check (check_out > check_in)
);

create index if not exists hotels_location_idx   on public.hotels (location);
create index if not exists bookings_user_id_idx  on public.bookings (user_id);
create index if not exists bookings_hotel_id_idx on public.bookings (hotel_id);
create index if not exists bookings_dates_idx    on public.bookings (hotel_id, check_in, check_out);

-- ---------- Row Level Security ----------------------------------------
-- hotels  : public read-only.
-- users / bookings : NO direct access for the anon key. They are reached
--                    only through the functions below (SECURITY DEFINER),
--                    so nobody can list all users or all bookings.

alter table public.users    enable row level security;
alter table public.hotels   enable row level security;
alter table public.bookings enable row level security;

drop policy if exists "Hotels are publicly readable" on public.hotels;
create policy "Hotels are publicly readable"
  on public.hotels for select
  to anon, authenticated
  using (true);

revoke all on public.users, public.bookings, public.hotels from anon, authenticated;
grant select on public.hotels to anon, authenticated;

-- ---------- Functions --------------------------------------------------

-- Search hotels with date-aware availability.
-- rooms_left = available_rooms - overlapping non-cancelled bookings.
create or replace function public.search_hotels(
  p_destination text,
  p_check_in    date,
  p_check_out   date,
  p_guests      integer
)
returns table (
  id uuid, name text, location text, description text, price numeric,
  available_rooms integer, guest_capacity integer, image text, rooms_left integer
)
language sql
stable
security definer
set search_path = public
as $$
  select h.id, h.name, h.location, h.description, h.price,
         h.available_rooms, h.guest_capacity, h.image,
         (h.available_rooms - coalesce(o.booked, 0))::integer as rooms_left
  from public.hotels h
  left join lateral (
    select count(*) as booked
    from public.bookings b
    where b.hotel_id = h.id
      and b.status <> 'cancelled'
      and b.check_in  < p_check_out
      and b.check_out > p_check_in
  ) o on true
  where h.location ilike
        '%' || replace(replace(replace(trim(p_destination), '\', '\\'), '%', '\%'), '_', '\_') || '%'
    and h.guest_capacity >= p_guests
    and h.available_rooms - coalesce(o.booked, 0) > 0
  order by h.price asc, h.name asc;
$$;

-- One hotel, with availability for the given dates (dates are optional).
create or replace function public.get_hotel(
  p_hotel_id  uuid,
  p_check_in  date default null,
  p_check_out date default null
)
returns table (
  id uuid, name text, location text, description text, price numeric,
  available_rooms integer, guest_capacity integer, image text, rooms_left integer
)
language sql
stable
security definer
set search_path = public
as $$
  select h.id, h.name, h.location, h.description, h.price,
         h.available_rooms, h.guest_capacity, h.image,
         case
           when p_check_in is null or p_check_out is null then h.available_rooms
           else (h.available_rooms - coalesce(o.booked, 0))::integer
         end as rooms_left
  from public.hotels h
  left join lateral (
    select count(*) as booked
    from public.bookings b
    where b.hotel_id = h.id
      and b.status <> 'cancelled'
      and b.check_in  < p_check_out
      and b.check_out > p_check_in
  ) o on true
  where h.id = p_hotel_id;
$$;

-- Create a booking atomically:
--   validates input -> locks the hotel row -> re-checks availability
--   -> finds or creates the user by email -> inserts the booking.
-- Raises readable error codes the frontend maps to friendly messages.
create or replace function public.create_booking(
  p_name      text,
  p_email     text,
  p_hotel_id  uuid,
  p_check_in  date,
  p_check_out date,
  p_guests    integer
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hotel      public.hotels%rowtype;
  v_email      text := lower(trim(p_email));
  v_user_id    uuid;
  v_booked     integer;
  v_booking_id uuid;
begin
  if p_name is null or length(trim(p_name)) = 0 or length(trim(p_name)) > 100 then
    raise exception 'INVALID_NAME';
  end if;
  if v_email is null or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'INVALID_EMAIL';
  end if;
  if p_check_in is null or p_check_out is null
     or p_check_out <= p_check_in
     or p_check_in < current_date - 1 then      -- 1 day of slack for time zones
    raise exception 'INVALID_DATES';
  end if;
  if p_guests is null or p_guests < 1 then
    raise exception 'INVALID_GUESTS';
  end if;

  -- Lock the hotel row so concurrent bookings are checked one at a time.
  select * into v_hotel from public.hotels where id = p_hotel_id for update;
  if not found then
    raise exception 'HOTEL_NOT_FOUND';
  end if;
  if p_guests > v_hotel.guest_capacity then
    raise exception 'CAPACITY_EXCEEDED';
  end if;

  select count(*) into v_booked
  from public.bookings b
  where b.hotel_id = p_hotel_id
    and b.status <> 'cancelled'
    and b.check_in  < p_check_out
    and b.check_out > p_check_in;

  if v_booked >= v_hotel.available_rooms then
    raise exception 'HOTEL_UNAVAILABLE';
  end if;

  insert into public.users (name, email)
  values (trim(p_name), v_email)
  on conflict (email) do nothing;

  select u.id into v_user_id from public.users u where u.email = v_email;

  insert into public.bookings (user_id, hotel_id, check_in, check_out, guests, status)
  values (v_user_id, p_hotel_id, p_check_in, p_check_out, p_guests, 'confirmed')
  returning bookings.id into v_booking_id;

  return v_booking_id;
end;
$$;

-- Read one booking (with hotel + guest info) by its unguessable UUID.
create or replace function public.get_booking(p_booking_id uuid)
returns table (
  id uuid, status text, check_in date, check_out date, guests integer,
  created_at timestamptz, guest_name text, guest_email text,
  hotel_id uuid, hotel_name text, hotel_location text, hotel_image text, hotel_price numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select b.id, b.status, b.check_in, b.check_out, b.guests, b.created_at,
         u.name, u.email,
         h.id, h.name, h.location, h.image, h.price
  from public.bookings b
  join public.users  u on u.id = b.user_id
  join public.hotels h on h.id = b.hotel_id
  where b.id = p_booking_id;
$$;

-- Return a user's recent bookings when both identifying details match.
create or replace function public.get_bookings_by_user(p_name text, p_email text)
returns table (
  id uuid, status text, check_in date, check_out date, guests integer,
  created_at timestamptz, hotel_id uuid, hotel_name text, hotel_location text,
  hotel_image text, hotel_price numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select b.id, b.status, b.check_in, b.check_out, b.guests, b.created_at,
         h.id, h.name, h.location, h.image, h.price
  from public.bookings b
  join public.users u on u.id = b.user_id
  join public.hotels h on h.id = b.hotel_id
  where nullif(trim(p_name), '') is not null
    and nullif(trim(p_email), '') is not null
    and u.email = lower(trim(p_email))
    and lower(u.name) = lower(trim(p_name))
  order by b.created_at desc
  limit 50;
$$;

revoke all on function public.search_hotels(text, date, date, integer) from public;
revoke all on function public.get_hotel(uuid, date, date)               from public;
revoke all on function public.create_booking(text, text, uuid, date, date, integer) from public;
revoke all on function public.get_booking(uuid)                         from public;
revoke all on function public.get_bookings_by_user(text, text)           from public;

grant execute on function public.search_hotels(text, date, date, integer) to anon, authenticated;
grant execute on function public.get_hotel(uuid, date, date)               to anon, authenticated;
grant execute on function public.create_booking(text, text, uuid, date, date, integer) to anon, authenticated;
grant execute on function public.get_booking(uuid)                         to anon, authenticated;
grant execute on function public.get_bookings_by_user(text, text)           to anon, authenticated;

-- ---------- Seed data (only when hotels is empty) ----------------------

insert into public.hotels (name, location, description, price, available_rooms, guest_capacity, image)
select * from (values
  ('Hôtel Lumière Seine',  'Paris, France',
   'Elegant rooms a short walk from the Seine, with a rooftop terrace and a breakfast buffet of fresh pastries.',
   189.00, 8, 3, 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=70'),
  ('Le Petit Marais',      'Paris, France',
   'A cosy boutique stay in the heart of the Marais, close to galleries, cafés and the metro.',
   129.00, 5, 2, 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=70'),
  ('Thames Gate Hotel',    'London, United Kingdom',
   'Modern rooms beside Tower Bridge with fast Wi-Fi, a gym and a 24-hour front desk.',
   165.00, 12, 4, 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=70'),
  ('Kensington Garden Inn','London, United Kingdom',
   'A quiet townhouse hotel facing the park, ideal for museum visits and weekend breaks.',
   142.00, 6, 2, 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1200&q=70'),
  ('Marina Skyline Resort','Dubai, United Arab Emirates',
   'Beachfront resort with two pools, a spa and sea-view suites that sleep the whole family.',
   220.00, 20, 5, 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=70'),
  ('Palm Court Suites',    'Dubai, United Arab Emirates',
   'Spacious apartments with kitchenettes, a rooftop pool and a free shuttle to the mall.',
   155.00, 10, 4, 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1200&q=70'),
  ('Bosphorus Pearl',      'Istanbul, Türkiye',
   'Restored Ottoman-era building with Bosphorus views, a hammam and a Turkish breakfast.',
   110.00, 9, 3, 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=70'),
  ('Galata Loft Hotel',    'Istanbul, Türkiye',
   'Bright industrial-style rooms near the Galata Tower, with a lively café downstairs.',
   85.00, 7, 2, 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=70'),
  ('Trastevere Terrace',   'Rome, Italy',
   'Family-run hotel on a cobbled street, with a garden courtyard and homemade breakfast.',
   118.00, 6, 3, 'https://images.unsplash.com/photo-1455587734955-081b22074882?auto=format&fit=crop&w=1200&q=70'),
  ('Colosseo View Palace', 'Rome, Italy',
   'Classic rooms with balconies looking over the Colosseum and a wine bar on the ground floor.',
   205.00, 4, 2, 'https://images.unsplash.com/photo-1568495248636-6432b97bd949?auto=format&fit=crop&w=1200&q=70'),
  ('Ubud Jungle Retreat',  'Bali, Indonesia',
   'Private villas among rice terraces, each with a plunge pool, yoga deck and daily breakfast.',
   98.00, 8, 4, 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=70'),
  ('Shinjuku Capsule Plus','Tokyo, Japan',
   'Compact, spotless rooms two minutes from Shinjuku Station, with a shared lounge and ramen bar.',
   72.00, 15, 2, 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=70')
) as v(name, location, description, price, available_rooms, guest_capacity, image)
where not exists (select 1 from public.hotels);
