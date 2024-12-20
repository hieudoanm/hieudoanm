import { GridTemplate } from '@web/router/apps/Apps';
import { NextPage } from 'next';

const CountriesApps: NextPage = () => {
  return <GridTemplate folder='countries' />;
};

export const dynamic = 'force-static';

export default CountriesApps;
