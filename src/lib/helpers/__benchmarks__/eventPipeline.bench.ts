import { bench, describe } from "vitest";
import {
  filterMultiDaySlot,
  filterTodayEvents,
  getTimeZonedDate,
  sortEventsByTheEarliest,
  sortEventsByTheLengthest,
  traversCrossingEvents,
} from "../generals";
import { WEEK_DAYS, makeEvents } from "./fixtures";

const events100 = makeEvents(100);
const events500 = makeEvents(500);
const events1000 = makeEvents(1000);
const today = WEEK_DAYS[2];
const todayEventsDense = filterTodayEvents(makeEvents(200, { overlapRatio: 0.8 }), today);

describe("filterTodayEvents", () => {
  bench("100 events × 1 day", () => {
    filterTodayEvents(events100, today);
  });

  bench("500 events × 1 day", () => {
    filterTodayEvents(events500, today);
  });

  bench("1000 events × 1 day", () => {
    filterTodayEvents(events1000, today);
  });

  bench("500 events × 7 days (week table pattern)", () => {
    for (const day of WEEK_DAYS) {
      filterTodayEvents(events500, day);
    }
  });
});

describe("sortEvents", () => {
  bench("sortEventsByTheLengthest · 500", () => {
    sortEventsByTheLengthest([...events500]);
  });

  bench("sortEventsByTheEarliest · 500", () => {
    sortEventsByTheEarliest([...events500]);
  });
});

describe("traversCrossingEvents", () => {
  bench("dense day · crossings for each event", () => {
    for (const event of todayEventsDense) {
      traversCrossingEvents(todayEventsDense, event);
    }
  });
});

describe("filterMultiDaySlot", () => {
  bench("500 events × week days", () => {
    filterMultiDaySlot(events500, WEEK_DAYS);
  });

  bench("500 events × week days · lengthOnly", () => {
    filterMultiDaySlot(events500, WEEK_DAYS, undefined, true);
  });
});

describe("getTimeZonedDate", () => {
  const date = new Date(2025, 0, 15, 12, 0);

  bench("no timezone · 1000 calls", () => {
    for (let i = 0; i < 1000; i++) {
      getTimeZonedDate(date);
    }
  });

  bench("America/New_York · 1000 calls", () => {
    for (let i = 0; i < 1000; i++) {
      getTimeZonedDate(date, "America/New_York");
    }
  });
});
