import { render } from '@testing-library/react';
import { Team } from '../index';
import React from 'react';

describe('Team', () => {
  it('renders correctly', () => {
    const button = render(<Team title={''} description={''} members={[]} />);
    expect(button.container).toMatchSnapshot();
  });
});
