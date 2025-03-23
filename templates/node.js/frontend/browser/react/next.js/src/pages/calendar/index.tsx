import { CalendarPage } from '@n26/router/CalendarPage/CalendarPage';
import { NextPage } from 'next';

const CalendarNextPage: NextPage = () => (
  <CalendarPage date={4} month={12} year={1995} />
);

export default CalendarNextPage;
