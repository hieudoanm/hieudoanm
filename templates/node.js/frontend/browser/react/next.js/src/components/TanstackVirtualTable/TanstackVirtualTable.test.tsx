import { render } from '@testing-library/react';
import { TanstackVirtualTable } from './TanstackVirtualTable';

describe('TanstackVirtualTable', () => {
  test('render default', () => {
    const wrapper = render(
      <TanstackVirtualTable height={0} columns={[]} data={[]} />
    );
    expect(wrapper.container).toMatchSnapshot();
  });
});
