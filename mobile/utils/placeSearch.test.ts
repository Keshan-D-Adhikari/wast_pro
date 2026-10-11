import { parsePlaces, placeSearchUrl } from './placeSearch';

describe('parsePlaces', () => {
  it('turns Nominatim items into results with a name, address and coordinates', () => {
    const results = parsePlaces([
      { lat: '6.9271', lon: '79.8612', name: 'Acme Recyclers', display_name: 'Acme Recyclers, Galle Road, Colombo, Sri Lanka' },
    ]);
    expect(results).toEqual([
      { name: 'Acme Recyclers', address: 'Acme Recyclers, Galle Road, Colombo, Sri Lanka', latitude: 6.9271, longitude: 79.8612 },
    ]);
  });

  it('falls back to the first part of the address when there is no name', () => {
    const [r] = parsePlaces([{ lat: '7', lon: '80', name: '', display_name: 'Industrial Zone, Kandy, Sri Lanka' }]);
    expect(r.name).toBe('Industrial Zone');
  });

  it('drops entries without usable coordinates and copes with bad input', () => {
    expect(parsePlaces([{ lat: 'x', lon: '80' }, { lat: '95', lon: '10' }, { name: 'No coords' }])).toEqual([]);
    expect(parsePlaces(null)).toEqual([]);
    expect(parsePlaces({})).toEqual([]);
  });
});

describe('placeSearchUrl', () => {
  it('encodes the text and limits the search to Sri Lanka', () => {
    const url = placeSearchUrl(' Acme & Sons ');
    expect(url).toContain('q=Acme%20%26%20Sons');
    expect(url).toContain('countrycodes=lk');
  });
});
