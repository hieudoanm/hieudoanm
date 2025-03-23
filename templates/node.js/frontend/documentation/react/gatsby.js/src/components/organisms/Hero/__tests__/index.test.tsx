import { render } from '@testing-library/react';
import { Hero } from '../index';
import React from 'react';

describe('Hero', () => {
  it('renders correctly', () => {
    const button = render(<Hero title={''} description={''} />);
    expect(button.container).toMatchSnapshot();
  });
});
