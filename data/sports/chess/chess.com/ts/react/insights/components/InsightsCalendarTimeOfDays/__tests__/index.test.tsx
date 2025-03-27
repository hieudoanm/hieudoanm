import { render } from '@testing-library/react';
import { Insights } from '@web/services/chess/chess.dto';
import { mockResizeObserver } from '@web/utils/mock-resize-observer';
import { InsightsCalendarTimeOfDays } from '..';

describe('InsightsCalendarTimeOfDays', () => {
  beforeEach(() => {
    mockResizeObserver();
  });

  it('to match snapshot', () => {
    const { container } = render(
      <InsightsCalendarTimeOfDays insights={{} as Insights} />
    );
    expect(container).toMatchSnapshot();
  });
});
