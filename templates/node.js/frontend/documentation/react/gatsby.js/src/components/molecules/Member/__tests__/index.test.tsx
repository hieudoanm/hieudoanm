import { render } from '@testing-library/react';

import { Member } from '../index';
import React from 'react';

describe('Member', () => {
  it('renders correctly', () => {
    const button = render(<Member avatar={''}></Member>);
    expect(button.container).toMatchSnapshot();
  });
});
