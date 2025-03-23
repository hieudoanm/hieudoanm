import { render } from '@testing-library/react';
import { Testimonial } from '../index';
import React from 'react';

describe('Testimonial', () => {
  it('renders correctly', () => {
    const button = render(<Testimonial></Testimonial>);
    expect(button.container).toMatchSnapshot();
  });
});
