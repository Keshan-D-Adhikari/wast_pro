import { parseRoute, routeUrl } from './route';

describe('parseRoute', () => {
  const ok = {
    code: 'Ok',
    routes: [{ distance: 14997.6, duration: 1177.4, geometry: { coordinates: [[79.963049, 6.918773], [79.9629, 6.9187], [79.8612, 6.9271]] } }],
  };

  it('turns an OSRM answer into points, kilometres and minutes', () => {
    const route = parseRoute(ok);
    expect(route?.points[0]).toEqual({ latitude: 6.918773, longitude: 79.963049 });
    expect(route?.points).toHaveLength(3);
    expect(route?.distanceKm).toBeCloseTo(15, 1);
    expect(route?.durationMin).toBeCloseTo(19.6, 1);
  });

  it('returns null when there is no route or the answer is not usable', () => {
    expect(parseRoute({ code: 'NoRoute', routes: [] })).toBeNull();
    expect(parseRoute({ code: 'Ok', routes: [{ geometry: { coordinates: [[1, 2]] } }] })).toBeNull();
    expect(parseRoute(null)).toBeNull();
  });
});

describe('routeUrl', () => {
  it('puts longitude before latitude, as OSRM expects', () => {
    expect(routeUrl({ latitude: 6.9, longitude: 79.9 }, { latitude: 7.1, longitude: 80.1 })).toContain('/driving/79.9,6.9;80.1,7.1?');
  });
});
