import { addDays, startOfWeek } from "date-fns";
import { datetime, RRule, RRuleSet } from "rrule";
import { describe, expect, it } from "vitest";
import {
  computeEventSlots,
  computeMonthGridEvents,
  computeRenderedSlots,
  computeWeekLayout,
  layoutTimedEvents,
} from "./eventLayout";
import { ProcessedEvent } from "../types";
import { getEventOccurrenceKey } from "../helpers/generals";

const makeEvent = (overrides: Partial<ProcessedEvent> = {}): ProcessedEvent => ({
  event_id: 1,
  title: "Event",
  start: new Date(2025, 0, 15, 9, 0),
  end: new Date(2025, 0, 15, 10, 0),
  ...overrides,
});

describe("computeEventSlots", () => {
  it("assigns slot 0 to a single event", () => {
    const slots = computeEventSlots([makeEvent({ event_id: "a" })]);
    expect(slots["2025-01-15"]?.a).toBe(0);
  });

  it("stacks overlapping multi-day events", () => {
    const slots = computeEventSlots([
      makeEvent({
        event_id: "long",
        allDay: true,
        start: new Date(2025, 0, 15, 0, 0),
        end: new Date(2025, 0, 17, 0, 0),
      }),
      makeEvent({
        event_id: "short",
        allDay: true,
        start: new Date(2025, 0, 15, 0, 0),
        end: new Date(2025, 0, 16, 0, 0),
      }),
    ]);
    // Insertion order: long first → slot 0, short → slot 1
    expect(slots["2025-01-15"]?.long).toBe(0);
    expect(slots["2025-01-15"]?.short).toBe(1);
  });
});

describe("computeRenderedSlots", () => {
  it("scopes slots per resource", () => {
    const slots = computeRenderedSlots(
      [
        makeEvent({
          event_id: "alice-event",
          assignee: "alice",
          allDay: true,
          start: new Date(2025, 0, 15, 0, 0),
          end: new Date(2025, 0, 16, 0, 0),
        }),
        makeEvent({
          event_id: "bob-event",
          assignee: "bob",
          allDay: true,
          start: new Date(2025, 0, 15, 0, 0),
          end: new Date(2025, 0, 16, 0, 0),
        }),
      ],
      [
        { assignee: "alice", text: "Alice" },
        { assignee: "bob", text: "Bob" },
      ],
      { idField: "assignee", textField: "text" },
      [{ name: "assignee", type: "select" }],
      "month"
    );

    expect(slots.alice?.["2025-01-15"]?.["alice-event"]).toBe(0);
    expect(slots.bob?.["2025-01-15"]?.["bob-event"]).toBe(0);
    expect(slots.alice?.["2025-01-15"]?.["bob-event"]).toBeUndefined();
  });

  it("stacks recurring occurrences below multi-day events and keeps free days at slot 0", () => {
    // Mirrors demo Event 6 (multi-day all-day) + Event 11 (daily recurring with a gap)
    const set = new RRuleSet();
    set.rrule(
      new RRule({
        freq: RRule.DAILY,
        count: 5,
        dtstart: datetime(2025, 1, 18, 16, 0),
      })
    );
    set.exdate(datetime(2025, 1, 19, 16, 0));

    const multiDay = makeEvent({
      event_id: 6,
      title: "Event 6",
      allDay: true,
      start: new Date(2025, 0, 15, 20, 30),
      end: new Date(2025, 0, 20, 23, 0),
    });
    const recurring = makeEvent({
      event_id: 11,
      title: "Event 11",
      start: new Date(2025, 0, 18, 16, 0),
      end: new Date(2025, 0, 18, 16, 30),
      recurring: set,
    });

    const slots = computeRenderedSlots(
      [multiDay, recurring],
      [],
      { idField: "assignee", textField: "text" },
      [],
      "month",
      { start: new Date(2025, 0, 1), end: new Date(2025, 0, 31) }
    );

    const day = slots.all!;
    // Multi-day keeps slot 0; recurring occurrence on the 20th must not collide
    expect(day["2025-01-20"]?.["6"]).toBe(0);
    const occ20Key = getEventOccurrenceKey({
      ...recurring,
      recurrenceId: new Date(2025, 0, 20, 16, 0).getTime(),
      start: new Date(2025, 0, 20, 16, 0),
      end: new Date(2025, 0, 20, 16, 30),
    });
    expect(day["2025-01-20"]?.[occ20Key]).toBe(1);

    // After the multi-day ends, recurring occurrences sit at the top
    const occ21Key = getEventOccurrenceKey({
      ...recurring,
      recurrenceId: new Date(2025, 0, 21, 16, 0).getTime(),
      start: new Date(2025, 0, 21, 16, 0),
      end: new Date(2025, 0, 21, 16, 30),
    });
    const occ22Key = getEventOccurrenceKey({
      ...recurring,
      recurrenceId: new Date(2025, 0, 22, 16, 0).getTime(),
      start: new Date(2025, 0, 22, 16, 0),
      end: new Date(2025, 0, 22, 16, 30),
    });
    expect(day["2025-01-21"]?.[occ21Key]).toBe(0);
    expect(day["2025-01-22"]?.[occ22Key]).toBe(0);
  });
});

describe("layoutTimedEvents", () => {
  const opts = { startHour: 9, endHour: 17, minuteHeight: 1, direction: "ltr" as const };

  it("positions a morning event at the top", () => {
    const [placement] = layoutTimedEvents([makeEvent({ title: "Morning" })], opts);
    expect(placement.top).toBe(0);
    expect(placement.height).toBe(60);
    expect(placement.width).toBe("98%");
    expect(placement.horizontalOffset).toBe("");
  });

  it("offsets overlapping events", () => {
    const placements = layoutTimedEvents(
      [
        makeEvent({
          event_id: 1,
          title: "Longer",
          start: new Date(2025, 0, 15, 9, 0),
          end: new Date(2025, 0, 15, 11, 0),
        }),
        makeEvent({
          event_id: 2,
          title: "Overlap",
          start: new Date(2025, 0, 15, 10, 0),
          end: new Date(2025, 0, 15, 12, 0),
        }),
      ],
      opts
    );

    expect(placements[0].width).toBe("98%");
    expect(placements[0].horizontalOffset).toBe("");
    expect(placements[1].horizontalOffset).toBe("50%");
    expect(placements[1].top).toBe(60);
  });

  it("does not stack a later recurring occurrence on top of an earlier one when overlapping another event", () => {
    // Mirrors demo events 10 (hourly ×3) and 11 (16:00–16:30): earlier
    // occurrences of the same event_id must not make both overlapping bars
    // think a column was already taken.
    const events = [
      makeEvent({
        event_id: 10,
        title: "Hourly 14:15",
        recurrenceId: 0,
        start: new Date(2025, 0, 15, 14, 15),
        end: new Date(2025, 0, 15, 14, 45),
      }),
      makeEvent({
        event_id: 10,
        title: "Hourly 15:15",
        recurrenceId: 1,
        start: new Date(2025, 0, 15, 15, 15),
        end: new Date(2025, 0, 15, 15, 45),
      }),
      makeEvent({
        event_id: 11,
        title: "Daily 16:00",
        start: new Date(2025, 0, 15, 16, 0),
        end: new Date(2025, 0, 15, 16, 30),
      }),
      makeEvent({
        event_id: 10,
        title: "Hourly 16:15",
        recurrenceId: 2,
        start: new Date(2025, 0, 15, 16, 15),
        end: new Date(2025, 0, 15, 16, 45),
      }),
    ];

    const placements = layoutTimedEvents(events, {
      ...opts,
      startHour: 14,
      endHour: 18,
    });

    const daily = placements.find((p) => p.event.event_id === 11)!;
    const hourlyLate = placements.find(
      (p) => p.event.event_id === 10 && p.event.recurrenceId === 2
    )!;

    expect(daily.horizontalOffset).toBe("");
    expect(daily.width).toBe("98%");
    expect(hourlyLate.horizontalOffset).toBe("50%");
    expect(hourlyLate.width).toMatch(/calc\((100% - 51%|49%)\)/);
    // Regression: both must not share the same offset (fully stacked).
    expect(daily.horizontalOffset).not.toBe(hourlyLate.horizontalOffset);
  });
});

describe("computeWeekLayout", () => {
  it("splits timed and all-day events per day", () => {
    const weekStart = startOfWeek(new Date(2025, 0, 15), { weekStartsOn: 1 });
    const daysList = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const events = [
      makeEvent({
        event_id: "timed",
        start: new Date(2025, 0, 15, 10, 0),
        end: new Date(2025, 0, 15, 11, 0),
      }),
      makeEvent({
        event_id: "allday",
        allDay: true,
        start: new Date(2025, 0, 15, 0, 0),
        end: new Date(2025, 0, 15, 23, 59),
      }),
    ];

    const layout = computeWeekLayout({
      allDaySourceEvents: events,
      timedSourceEvents: events,
      daysList,
      timedLayout: { startHour: 9, endHour: 17, minuteHeight: 1, direction: "ltr" },
    });

    const wed = layout.find((d) => d.date.getDate() === 15);
    expect(wed?.timed.map((e) => e.event_id)).toEqual(["timed"]);
    expect(wed?.allDay.map((p) => p.event.event_id)).toEqual(["allday"]);
    expect(wed?.allDay[0]?.span).toBe(1);
    expect(wed?.timedPlacements).toHaveLength(1);
  });

  it("spans multi-day all-day events across visible columns", () => {
    // Mon Jan 13 – Sun Jan 19, 2025
    const weekStart = startOfWeek(new Date(2025, 0, 15), { weekStartsOn: 1 });
    const daysList = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const events = [
      makeEvent({
        event_id: "span3",
        title: "Wed–Fri",
        allDay: true,
        start: new Date(2025, 0, 15, 0, 0),
        end: new Date(2025, 0, 17, 23, 59),
      }),
    ];

    const layout = computeWeekLayout({
      allDaySourceEvents: events,
      timedSourceEvents: events,
      daysList,
      timedLayout: { startHour: 9, endHour: 17, minuteHeight: 1, direction: "ltr" },
    });

    const byDate = Object.fromEntries(
      layout.map((d) => [
        formatDay(d.date),
        d.allDay.map((p) => ({ id: p.event.event_id, span: p.span })),
      ])
    );

    expect(byDate["2025-01-15"]).toEqual([{ id: "span3", span: 3 }]);
    expect(byDate["2025-01-16"]).toEqual([]);
    expect(byDate["2025-01-17"]).toEqual([]);
  });

  it("clamps multi-day events that start before the visible week", () => {
    const weekStart = startOfWeek(new Date(2025, 0, 15), { weekStartsOn: 1 }); // Mon 13
    const daysList = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const events = [
      makeEvent({
        event_id: "carry",
        allDay: true,
        start: new Date(2025, 0, 10, 0, 0), // previous Friday
        end: new Date(2025, 0, 15, 23, 59), // Wednesday
      }),
    ];

    const layout = computeWeekLayout({
      allDaySourceEvents: events,
      timedSourceEvents: [],
      daysList,
      timedLayout: { startHour: 9, endHour: 17, minuteHeight: 1, direction: "ltr" },
    });

    const mon = layout[0];
    expect(mon.allDay).toHaveLength(1);
    expect(mon.allDay[0].event.event_id).toBe("carry");
    expect(mon.allDay[0].span).toBe(3); // Mon–Wed
    expect(mon.allDay[0].hasPrev).toBe(true);
    expect(mon.allDay[0].hasNext).toBe(false);
    expect(layout.slice(1).every((d) => d.allDay.length === 0)).toBe(true);
  });

  it("stacks overlapping multi-day events into different slots", () => {
    const weekStart = startOfWeek(new Date(2025, 0, 15), { weekStartsOn: 1 });
    const daysList = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const events = [
      makeEvent({
        event_id: "long",
        allDay: true,
        start: new Date(2025, 0, 15, 0, 0),
        end: new Date(2025, 0, 17, 23, 59),
      }),
      makeEvent({
        event_id: "short",
        allDay: true,
        start: new Date(2025, 0, 15, 0, 0),
        end: new Date(2025, 0, 16, 23, 59),
      }),
    ];

    const layout = computeWeekLayout({
      allDaySourceEvents: events,
      timedSourceEvents: [],
      daysList,
      timedLayout: { startHour: 9, endHour: 17, minuteHeight: 1, direction: "ltr" },
    });

    const wed = layout.find((d) => d.date.getDate() === 15)!;
    expect(wed.allDay).toHaveLength(2);
    const slots = wed.allDay.map((p) => p.slot).sort();
    expect(slots).toEqual([0, 1]);
    expect(wed.allDay.find((p) => p.event.event_id === "long")?.span).toBe(3);
    expect(wed.allDay.find((p) => p.event.event_id === "short")?.span).toBe(2);
  });
});

function formatDay(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

describe("computeMonthGridEvents", () => {
  it("indexes cell events by yyyy-MM-dd", () => {
    const weekStart = startOfWeek(new Date(2025, 0, 15), { weekStartsOn: 0 });
    const { byDay } = computeMonthGridEvents({
      events: [
        makeEvent({
          event_id: "cell",
          start: new Date(2025, 0, 15, 9, 0),
          end: new Date(2025, 0, 15, 10, 0),
        }),
      ],
      resourceFields: { idField: "assignee", textField: "text" },
      fields: [],
      eachWeekStart: [weekStart],
      weekDays: [0, 1, 2, 3, 4, 5, 6],
    });

    expect(byDay["2025-01-15"]?.map((e) => e.event_id)).toEqual(["cell"]);
  });
});
