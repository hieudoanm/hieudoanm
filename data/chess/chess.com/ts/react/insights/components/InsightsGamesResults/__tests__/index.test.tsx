import { render } from '@testing-library/react';
import { Insights } from '@web/services/chess/chess.dto';
import { mockResizeObserver } from '@web/utils/mock-resize-observer';
import { InsightsGamesResults } from '..';

describe('InsightsGamesResults', () => {
  beforeEach(() => {
    mockResizeObserver();
  });

  it('to match snapshot', () => {
    const { container } = render(
      <InsightsGamesResults insights={{} as Insights} />
    );
    expect(container).toMatchSnapshot();
  });
});
