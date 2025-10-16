import { addMinutes } from "date-fns";

export function mk_dates_every_minute(params: {start: Date, interval: number , count: number}): Date[] {
  const dates: Date[] = [];
  for (let i = 0; i < params.count; i += 1) {
    dates.push(params.start);
    params.start = addMinutes(params.start, params.interval);
  }
  return dates;
}
