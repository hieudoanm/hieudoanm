import { createSignal } from 'solid-js';
import './Counter.css';

export const Counter = () => {
  const [count, setCount] = createSignal(0);
  return (
    <button
      id="counter"
      data-testid="counter"
      class="increment"
      onClick={() => setCount(count() + 1)}>
      Clicks: {count()}
    </button>
  );
};
