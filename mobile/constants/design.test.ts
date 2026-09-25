import { wasteAccent, Palette } from './design';

describe('wasteAccent', () => {
  it('returns the matching accent for a known waste type', () => {
    expect(wasteAccent('plastic')).toBe(Palette.waste.plastic);
    expect(wasteAccent('food')).toBe(Palette.waste.food);
  });

  it('is case-insensitive', () => {
    expect(wasteAccent('METAL')).toBe(Palette.waste.metal);
  });

  it('falls back to metal for an unknown or missing type', () => {
    expect(wasteAccent('glass')).toBe(Palette.waste.metal);
    expect(wasteAccent(undefined)).toBe(Palette.waste.metal);
  });
});
