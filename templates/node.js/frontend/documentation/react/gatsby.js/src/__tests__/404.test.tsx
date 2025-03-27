import { render } from '@testing-library/react';
import NotFoundPage from '../pages';
import React from 'react';

describe('NotFoundPage', () => {
  it('renders correctly', () => {
    const button = render(<NotFoundPage />);
    expect(button.container).toMatchSnapshot();
  });
});
