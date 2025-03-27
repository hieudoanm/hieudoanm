import { render } from '@testing-library/react';
import { Footer } from '../index';
import React from 'react';

describe('Footer', () => {
  it('renders correctly', () => {
    const button = render(<Footer title="" socialLinks={[]} />);
    expect(button.container).toMatchSnapshot();
  });
});
