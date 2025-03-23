import { render } from '@testing-library/react';
import React from 'react';
import HomePage from '../pages';

describe('HomePage', () => {
  it('renders correctly', () => {
    const button = render(<HomePage />);
    expect(button.container).toMatchSnapshot();
  });
});
