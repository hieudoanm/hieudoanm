import { logger } from '@n26/log';
import axios from 'axios';
import { procedure, router } from '../trpc';

export type Country = {
  name: { common: string; official: string };
  cca2: string;
  cca3: string;
  cioc: string;
  fifa: string;
  region: string;
  subregion: string;
  capital: string[];
  area: number;
  population: number;
  unMember: boolean;
};

const getCountries = async (): Promise<Country[]> => {
  const controller: AbortController = new AbortController();
  const { signal } = controller;
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const url: string = 'https://restcountries.com/v3.1/all';
    const headers = { 'Content-Type': 'application/json' };
    const options = { signal, headers };
    const { data: countries } = await axios.get<Country[]>(url, options);
    clearTimeout(timeout);
    return countries;
  } catch (error) {
    logger.error(`getCountries error=${error}`);
    clearTimeout(timeout);
    return [];
  }
};

export const appRouter = router({
  countries: procedure.query(async (): Promise<Country[]> => {
    return getCountries();
  }),
});

// export type definition of API
export type AppRouter = typeof appRouter;
