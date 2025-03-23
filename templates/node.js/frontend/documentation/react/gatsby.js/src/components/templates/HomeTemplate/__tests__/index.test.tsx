import { render } from '@testing-library/react';
import { HomeTemplate } from '../index';
import React from 'react';

describe('HomeTemplate', () => {
  it('renders correctly', () => {
    const button = render(<HomeTemplate />);
    expect(button.container).toMatchSnapshot();
  });
});
