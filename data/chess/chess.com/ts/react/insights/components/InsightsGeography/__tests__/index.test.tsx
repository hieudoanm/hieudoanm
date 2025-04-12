import { render } from '@testing-library/react';
import { Insights } from '@web/services/chess/chess.dto';
import { mockResizeObserver } from '@web/utils/mock-resize-observer';
import { InsightsGeography } from '..';

describe('InsightsGeography', () => {
  beforeEach(() => {
    mockResizeObserver();
  });

  it('to match snapshot', () => {
    const { container } = render(
      <InsightsGeography insights={{} as Insights} />
    );
    expect(container).toMatchSnapshot();
  });
});
