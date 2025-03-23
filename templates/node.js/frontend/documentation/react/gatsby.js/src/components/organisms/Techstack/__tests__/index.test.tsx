import { render } from '@testing-library/react';
import { Techstack } from '../index';
import React from 'react';

describe('Techstack', () => {
  it('renders correctly', () => {
    const button = render(
      <Techstack title={''} description={''} services={[]} />
    );
    expect(button.container).toMatchSnapshot();
  });
});
