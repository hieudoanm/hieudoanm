import { render } from '@testing-library/react';
import { Heading } from '../index';
import React from 'react';

describe('Heading', () => {
  it('renders correctly', () => {
    const button = render(<Heading />);
    expect(button.container).toMatchSnapshot();
  });
});
