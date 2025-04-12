import { render } from '@testing-library/react';
import { Insights } from '@web/services/chess/chess.dto';
import { mockResizeObserver } from '@web/utils/mock-resize-observer';
import { InsightsCalendar } from '..';

describe('InsightsCalendar', () => {
  beforeEach(() => {
    mockResizeObserver();
  });

  it('to match snapshot', () => {
    const { container } = render(
      <InsightsCalendar insights={{} as Insights} />
    );
    expect(container).toMatchSnapshot();
  });
});
