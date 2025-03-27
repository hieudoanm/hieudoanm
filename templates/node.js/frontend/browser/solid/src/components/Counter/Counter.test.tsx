import { render } from '@solidjs/testing-library';
import { describe, expect, it } from 'vitest';
import { Counter } from './Counter';

describe('Counter', () => {
  it('to have button', () => {
    const { queryByTestId } = render(() => <Counter />);
    expect(queryByTestId('counter')).toBeTruthy();
  });
});
