import { render } from '@testing-library/react';
import { Calendar } from './Calendar';

describe('Calendar', () => {
  test('render default', () => {
    const wrapper = render(<Calendar year={1995} month={12} date={4} />);
    expect(wrapper.container).toMatchSnapshot();
  });
});
