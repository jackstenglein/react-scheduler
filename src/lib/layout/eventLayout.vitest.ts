import { addDays, startOfWeek } from "date-fns";
import { describe, expect, it } from "vitest";
import {
  computeEventSlots,
  computeMonthGridEvents,
  computeRenderedSlots,
  computeWeekLayout,
  layoutTimedEvents,
} from "./eventLayout";
import { ProcessedEvent } from "../types";

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
        end: new Date(2025, 0, 16, 0, 0),
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
    expect(wed?.allDay.map((e) => e.event_id)).toEqual(["allday"]);
    expect(wed?.timedPlacements).toHaveLength(1);
  });
});

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
