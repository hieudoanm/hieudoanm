import { render } from '@testing-library/react';
import { Checkbox } from '../index';
import React from 'react';

describe('Checkbox', () => {
  it('renders correctly', () => {
    const button = render(<Checkbox />);
    expect(button.container).toMatchSnapshot();
  });
});
