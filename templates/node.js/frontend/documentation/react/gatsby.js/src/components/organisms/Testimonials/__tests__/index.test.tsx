import { render } from '@testing-library/react';
import { Testimonials } from '../index';
import React from 'react';

describe('Testimonials', () => {
  it('renders correctly', () => {
    const button = render(<Testimonials testimonials={[]} />);
    expect(button.container).toMatchSnapshot();
  });
});
