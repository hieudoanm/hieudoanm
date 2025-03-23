import { render } from '@testing-library/react';
import { Input } from '../index';
import React from 'react';

describe('Input', () => {
  it('renders correctly', () => {
    const button = render(<Input />);
    expect(button.container).toMatchSnapshot();
  });
});
