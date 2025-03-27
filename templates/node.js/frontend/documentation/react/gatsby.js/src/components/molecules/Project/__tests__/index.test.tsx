import { render } from '@testing-library/react';
import { Project } from '../index';
import React from 'react';

describe('Project', () => {
  it('renders correctly', () => {
    const button = render(<Project image={''}></Project>);
    expect(button.container).toMatchSnapshot();
  });
});
