import { render } from '@testing-library/react';
import { Contact } from '../index';
import React from 'react';

describe('Contact', () => {
  it('renders correctly', () => {
    const button = render(<Contact />);
    expect(button.container).toMatchSnapshot();
  });
});
