import { render } from '@testing-library/react';
import { Insights } from '@web/services/chess/chess.dto';
import { mockResizeObserver } from '@web/utils/mock-resize-observer';
import { InsightsOpponents } from '..';

describe('InsightsOpponents', () => {
  beforeEach(() => {
    mockResizeObserver();
  });

  it('to match snapshot', () => {
    const { container } = render(
      <InsightsOpponents insights={{ opponents: [] } as unknown as Insights} />
    );
    expect(container).toMatchSnapshot();
  });
});
