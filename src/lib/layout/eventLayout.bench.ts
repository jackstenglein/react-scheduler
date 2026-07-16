import { addDays, startOfWeek } from "date-fns";
import { bench, describe } from "vitest";
import { makeEvents, WEEK_DAYS } from "../helpers/__benchmarks__/fixtures";
import {
  computeMonthGridEvents,
  computeRenderedSlots,
  computeWeekLayout,
  layoutTimedEvents,
} from "./eventLayout";

const events500 = makeEvents(500);
const todayTimed = events500.filter(
  (e) => !e.allDay && e.start.getDate() === WEEK_DAYS[2].getDate()
);

describe("layout pipeline", () => {
  bench("computeRenderedSlots · month · 500", () => {
    computeRenderedSlots(events500, [], { idField: "assignee", textField: "text" }, [], "month");
  });

  bench("computeWeekLayout · 500", () => {
    computeWeekLayout({
      allDaySourceEvents: events500,
      timedSourceEvents: events500,
      daysList: WEEK_DAYS,
      timedLayout: { startHour: 9, endHour: 17, minuteHeight: 1.2, direction: "ltr" },
    });
  });

  bench("layoutTimedEvents · dense day", () => {
    layoutTimedEvents(todayTimed, {
      startHour: 9,
      endHour: 17,
      minuteHeight: 1,
      direction: "ltr",
    });
  });

  bench("computeMonthGridEvents · 500", () => {
    const weekStart = startOfWeek(new Date(2025, 0, 13), { weekStartsOn: 1 });
    const eachWeekStart = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i * 7));
    computeMonthGridEvents({
      events: events500,
      resourceFields: { idField: "assignee", textField: "text" },
      fields: [],
      eachWeekStart,
      weekDays: [0, 1, 2, 3, 4, 5, 6],
    });
  });
});
