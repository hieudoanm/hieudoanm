import { getCountriesFromAPI } from './countries.service';

describe('getCountriesFromAPI', () => {
  beforeAll(() => {
    global.fetch = () =>
      Promise.resolve({
        json: () => Promise.resolve([]),
      } as Response);
  });

  it('return array', async () => {
    const countries = await getCountriesFromAPI();
    expect(countries).toEqual([]);
  });
});
