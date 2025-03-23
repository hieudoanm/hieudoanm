import { Calendar } from '@n26/components/Calendar';
import React from 'react';

export type CalendarPageProperties = {
  date: number;
  month: number;
  year: number;
};

const d = new Date();

export const CalendarPage: React.FC<CalendarPageProperties> = ({
  date = d.getDate(),
  month = d.getMonth() + 1,
  year = d.getFullYear(),
}) => {
  return (
    <div className="h-screen">
      <div className="flex h-full items-center justify-center">
        <Calendar date={date} month={month} year={year} />
      </div>
    </div>
  );
};
