import { render } from '@testing-library/react';
import { Portfolio } from '../index';
import React from 'react';

describe('Portfolio', () => {
  it('renders correctly', () => {
    const button = render(
      <Portfolio title={''} description={''} projects={[]} />
    );
    expect(button.container).toMatchSnapshot();
  });
});
