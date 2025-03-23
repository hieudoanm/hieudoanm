import { TanstackVirtualTable } from '@n26/components/TanstackVirtualTable';
import { Country } from '@n26/server/routers/_app';
import { formatNumber } from '@n26/utils/number';
import { trpc } from '@n26/utils/trpc';
import { createColumnHelper } from '@tanstack/react-table';
import type { NextPage } from 'next';

const columnHelper = createColumnHelper<Country>();

const columns = [
  columnHelper.accessor('unMember', {
    id: 'unMember',
    header: () => 'United Nation',
    cell: (info) => {
      const unMember: boolean = info.renderValue() ?? false;
      return unMember ? 'Member' : '';
    },
    footer: (info) => info.column.id,
    filterFn: (row, columnId: string, filterValue: boolean) => {
      const unitedNationMember: boolean = row.getValue(columnId) ?? false;
      return filterValue ? unitedNationMember : true;
    },
  }),
  columnHelper.accessor('region', {
    id: 'region',
    header: () => 'Region',
    cell: (info) => info.renderValue(),
    footer: (info) => info.column.id,
    filterFn: 'equals',
  }),
  columnHelper.accessor('subregion', {
    id: 'subregion',
    header: () => 'Subregion',
    cell: (info) => info.renderValue(),
    footer: (info) => info.column.id,
    filterFn: 'equals',
  }),
  columnHelper.accessor('name.common', {
    id: 'common',
    header: () => 'Common',
    footer: (info) => info.column.id,
  }),
  columnHelper.accessor('name.official', {
    id: 'official',
    header: () => 'Official',
    footer: (info) => info.column.id,
  }),
  columnHelper.accessor('capital', {
    id: 'capital',
    header: () => 'Capital',
    cell: (info) => {
      const capitals: string[] = info.renderValue() ?? [];
      const capitalsString = capitals.join(', ');
      if (capitals.length === 0) return '';
      return capitals.length > 1
        ? `${capitals.length} - ${capitalsString}`
        : capitalsString;
    },
    footer: (info) => info.column.id,
  }),
  columnHelper.accessor('cca2', {
    id: 'cca2',
    header: () => 'CCA2',
    cell: (info) => info.renderValue(),
    footer: (info) => info.column.id,
  }),
  columnHelper.accessor('cca3', {
    id: 'cca3',
    header: () => 'CCA3',
    cell: (info) => info.renderValue(),
    footer: (info) => info.column.id,
  }),
  columnHelper.accessor('cioc', {
    id: 'cioc',
    header: () => 'CIOC',
    cell: (info) => info.renderValue(),
    footer: (info) => info.column.id,
  }),
  columnHelper.accessor('fifa', {
    id: 'fifa',
    header: () => 'FIFA',
    cell: (info) => info.renderValue(),
    footer: (info) => info.column.id,
  }),
  columnHelper.accessor('area', {
    id: 'area',
    header: () => 'Area',
    cell: (info) => formatNumber(info.renderValue() ?? 0),
    footer: (info) => info.column.id,
  }),
  columnHelper.accessor('population', {
    id: 'population',
    header: () => 'Population',
    cell: (info) => formatNumber(info.renderValue() ?? 0),
    footer: (info) => info.column.id,
  }),
];

const App: NextPage = () => {
  const { isPending, error, data: countries = [] } = trpc.countries.useQuery();

  if (isPending) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <p className="text-center">
          <span className="loading loading-infinity loading-lg"></span>
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <p className="text-center">
          <div className="badge badge-secondary badge-lg">{error.message}</div>
        </p>
      </div>
    );
  }

  if (!countries || countries.length === 0) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <p className="text-center uppercase">
          <div className="badge badge-primary badge-lg">No Data</div>
        </p>
      </div>
    );
  }

  return (
    <TanstackVirtualTable height={600} columns={columns} data={countries} />
  );
};

export default App;
