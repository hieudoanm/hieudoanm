import { render } from '@testing-library/react';
import React from 'react';
import { Service } from '../index';

describe('Service', () => {
  it('renders correctly', () => {
    const button = render(<Service image={''}></Service>);
    expect(button.container).toMatchSnapshot();
  });
});
