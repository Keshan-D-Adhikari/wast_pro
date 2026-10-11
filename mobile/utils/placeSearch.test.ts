import { parsePlaces, placeSuggestUrl } from './placeSearch';

const feature = (props: Record<string, string>, coords: unknown = [79.9630065, 6.9190684]) => ({
  type: 'Feature',
  properties: props,
  geometry: { type: 'Point', coordinates: coords },
});

describe('parsePlaces', () => {
  it('turns Photon features into results with a name, address and coordinates', () => {
    const results = parsePlaces({
      features: [
        feature({ name: 'Horizon Campus', street: 'Suhada Mawatha', city: 'Malabe', county: 'Colombo District', state: 'Western Province' }),
      ],
    });
    expect(results).toEqual([
      {
        name: 'Horizon Campus',
        address: 'Suhada Mawatha, Malabe, Colombo District, Western Province',
        latitude: 6.9190684,
        longitude: 79.9630065,
      },
    ]);
  });

  it('falls back to the first address part when there is no name', () => {
    const [r] = parsePlaces({ features: [feature({ street: 'Galle Road', city: 'Colombo' })] });
    expect(r.name).toBe('Galle Road');
  });

  it('drops entries without usable coordinates and removes duplicates', () => {
    const same = feature({ name: 'Acme', city: 'Kandy' });
    expect(parsePlaces({ features: [same, same, feature({ name: 'Bad' }, ['x', 'y']), feature({ name: 'Far' }, [10, 95])] })).toHaveLength(1);
  });

  it('copes with bad input', () => {
    expect(parsePlaces(null)).toEqual([]);
    expect(parsePlaces({})).toEqual([]);
    expect(parsePlaces({ features: 'x' })).toEqual([]);
  });
});

describe('placeSuggestUrl', () => {
  it('encodes the text and limits the search to Sri Lanka', () => {
    const url = placeSuggestUrl(' Acme & Sons ');
    expect(url).toContain('q=Acme%20%26%20Sons');
    expect(url).toContain('bbox=79.4,5.8,82.0,9.9');
  });
});
