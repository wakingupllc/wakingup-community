import { registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import moment from '../../lib/moment-timezone';
import { useTimezone } from '../common/withTimezone';
import classNames from 'classnames';

/// A date rendered with moment().calendar(). Includes a plethora of special
/// cases like "Yesterday at 1:00 PM", "Last Tuesday at 1:00 PM". Turns into a
/// more normal date (in locale format) if more than a week away.
const CalendarDate = ({date, displayStyle}: {
  date: Date,
  displayStyle?: React.CSSProperties | string;
}) => {
  const { timezone } = useTimezone();
  return <span className={classNames(displayStyle)}>{moment(new Date(date)).tz(timezone).calendar()}</span>
};

const CalendarDateComponent = registerComponent('CalendarDate', CalendarDate);

declare global {
  interface ComponentTypes {
    CalendarDate: typeof CalendarDateComponent
  }
}
