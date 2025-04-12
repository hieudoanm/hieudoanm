import { render } from '@testing-library/react';
import { Insights } from '@web/services/chess/chess.dto';
import { mockResizeObserver } from '@web/utils/mock-resize-observer';
import { InsightsGames } from '..';

describe('InsightsGames', () => {
  beforeEach(() => {
    mockResizeObserver();
  });

  it('to match snapshot', () => {
    const { container } = render(<InsightsGames insights={{} as Insights} />);
    expect(container).toMatchSnapshot();
  });
});
