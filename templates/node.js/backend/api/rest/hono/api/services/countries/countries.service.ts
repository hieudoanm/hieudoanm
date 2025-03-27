import { Country } from '@prisma/client';
import { prismaClient } from '../../prisma/prisma.client';

export type RestCountry = {
  name: { common: string; official: string };
  cca2: string;
  cca3: string;
};

export const getCountriesFromAPI = async (): Promise<RestCountry[]> => {
  try {
    const url = 'https://restcountries.com/v3.1/all';
    const response = await fetch(url);
    const restCountries: RestCountry[] = await response.json();
    console.log('countries', restCountries.length);
    return restCountries;
  } catch (error) {
    console.error('error', error);
    return [];
  }
};

export const getCountries = async (): Promise<Country[]> => {
  let countries: Country[] = [];
  try {
    await prismaClient.$connect();
    countries = await prismaClient.country.findMany();
  } catch (error) {
    console.error('error', error);
  } finally {
    await prismaClient.$disconnect();
  }
  return countries;
};

export const getCountry = async (cca3: string): Promise<RestCountry> => {
  const countries = await getCountriesFromAPI();
  return (
    countries.find((country) => country.cca3 === cca3) ?? ({} as RestCountry)
  );
};

export const syncCountries = async (): Promise<Country[]> => {
  const countries = await getCountriesFromAPI();
  await Promise.all(
    countries.map(async ({ name: { common, official }, cca2, cca3 }) => {
      return await prismaClient.country.upsert({
        create: { cca2, cca3, common, official },
        update: { cca2, cca3, common, official },
        where: { cca2, cca3 },
      });
    })
  );
  return await prismaClient.country.findMany();
};
