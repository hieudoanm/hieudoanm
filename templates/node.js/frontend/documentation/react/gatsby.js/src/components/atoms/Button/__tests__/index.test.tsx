import { render } from '@testing-library/react';
import React from 'react';
import { Button } from '../index';

describe('Button', () => {
  it('renders correctly', () => {
    const button = render(<Button />);
    expect(button.container).toMatchSnapshot();
  });
});
