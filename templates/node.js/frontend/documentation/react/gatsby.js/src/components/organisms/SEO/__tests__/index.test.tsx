import { render } from '@testing-library/react';
import { SEO } from '../index';
import React from 'react';

describe('SEO', () => {
  it('renders correctly', () => {
    const button = render(<SEO />);
    expect(button.container).toMatchSnapshot();
  });
});
