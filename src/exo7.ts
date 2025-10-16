import { addMinutes } from "date-fns";

export type TimeSlot = {
  start: Date;
  end: Date;
  login?: string;
};

export function mk_slots(props: {
  start: Date;
  mins: number;
  qty: number;
  mins_between_each?: number;
  break?: { qty_before_break: number; duration: number };
}) {
  const slots: TimeSlot[] = [];
  for (let pos = 1; pos <= props.qty; pos += 1) {
    slots.push({
      start: props.start,
      end: addMinutes(props.start, props.mins),
    });
    let mins_to_add = props.mins;
    mins_to_add += props.mins_between_each ?? 0;
    mins_to_add += props.break
      ? pos % props.break.qty_before_break
        ? 0
        : props.break.duration
      : 0;
    props.start = addMinutes(props.start, mins_to_add);
  }
  return slots;
}
