import { describe, expect, it } from 'vitest';
import { formatReference } from './format';

describe('formatReference', () => {
  it('returns the first eight UUID characters in uppercase', () => {
    expect(formatReference('a1b2c3d4-1234-5678-9abc-def012345678')).toBe('A1B2C3D4');
  });
});
