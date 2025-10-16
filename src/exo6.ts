import { addMinutes } from "date-fns";

export type TimeSlot = {
  start: Date;
  end: Date;
  login?: string;
};

export function mk_slots(props: { start: Date; mins: number; qty: number }) {
  const slots: TimeSlot[] = [];
  for (let _i = 0; _i < props.qty; _i += 1) {
    slots.push({
      start: props.start,
      end: addMinutes(props.start, props.mins),
    });
    props.start = addMinutes(props.start, props.mins);
  }
  return slots;
}
