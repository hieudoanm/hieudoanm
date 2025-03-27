import { render } from '@testing-library/react';
import { Insights } from '@web/services/chess/chess.dto';
import { mockResizeObserver } from '@web/utils/mock-resize-observer';
import { InsightsCalendarDaysOfWeek } from '..';

describe('InsightsCalendarDaysOfWeek', () => {
  beforeEach(() => {
    mockResizeObserver();
  });

  it('to match snapshot', () => {
    const { container } = render(
      <InsightsCalendarDaysOfWeek insights={{} as Insights} />
    );
    expect(container).toMatchSnapshot();
  });
});
