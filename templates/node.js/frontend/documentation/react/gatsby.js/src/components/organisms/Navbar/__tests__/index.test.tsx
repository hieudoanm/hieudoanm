import { render } from '@testing-library/react';
import { Navbar } from '../index';
import React from 'react';

describe('Navbar', () => {
  it('renders correctly', () => {
    const button = render(<Navbar title={''} />);
    expect(button.container).toMatchSnapshot();
  });
});
