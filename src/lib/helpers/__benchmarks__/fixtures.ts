import { addDays, addHours, addMinutes, startOfWeek } from "date-fns";
import { ProcessedEvent } from "../../types";

/** Deterministic event fixtures for performance benchmarks. */
export function makeEvents(
  count: number,
  options: {
    baseDate?: Date;
    overlapRatio?: number;
    multiDayRatio?: number;
    allDayRatio?: number;
  } = {}
): ProcessedEvent[] {
  const {
    baseDate = new Date(2025, 0, 13, 9, 0),
    overlapRatio = 0.3,
    multiDayRatio = 0.1,
    allDayRatio = 0.05,
  } = options;

  const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 });
  const events: ProcessedEvent[] = [];

  for (let i = 0; i < count; i++) {
    const dayOffset = i % 7;
    const hourOffset = Math.floor(i / 7) % 8;
    const start = addHours(addDays(weekStart, dayOffset), 9 + hourOffset);

    let end = addMinutes(start, 60);
    let allDay = false;

    if (i / count < allDayRatio) {
      allDay = true;
      end = addDays(start, 1);
    } else if (i / count < allDayRatio + multiDayRatio) {
      end = addDays(start, 2 + (i % 3));
    } else if (i / count < allDayRatio + multiDayRatio + overlapRatio) {
      // Cluster overlaps in the morning window
      end = addMinutes(start, 90);
    }

    events.push({
      event_id: `evt-${i}`,
      title: `Event ${i}`,
      start,
      end,
      allDay,
    });
  }

  return events;
}

export const WEEK_DAYS = Array.from({ length: 7 }, (_, i) =>
  addDays(startOfWeek(new Date(2025, 0, 13), { weekStartsOn: 1 }), i)
);
