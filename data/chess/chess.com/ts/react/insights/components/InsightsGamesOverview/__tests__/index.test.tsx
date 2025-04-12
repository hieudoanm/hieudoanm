import { render } from '@testing-library/react';
import { Insights } from '@web/services/chess/chess.dto';
import { mockResizeObserver } from '@web/utils/mock-resize-observer';
import { InsightsGamesOverview } from '..';

describe('InsightsGamesOverview', () => {
  beforeEach(() => {
    mockResizeObserver();
  });

  it('to match snapshot', () => {
    const { container } = render(
      <InsightsGamesOverview insights={{} as Insights} />
    );
    expect(container).toMatchSnapshot();
  });
});
