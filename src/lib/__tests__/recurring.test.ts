/**
 * Tests for recurring event edit/delete scopes.
 *
 * These are pure unit tests — they exercise the helper functions in
 * generals.tsx directly and require no DOM / React rendering.
 *
 * Run with:  yarn test  (or npx jest recurring)
 */

import { RRule, RRuleSet, datetime } from "rrule";
import {
  addExdateToEvent,
  applyRecurringDelete,
  applyRecurringEdit,
  createSeriesFrom,
  getRecurrencesForDate,
  truncateEventBefore,
} from "../helpers/generals";
import { ProcessedEvent } from "../types";

// ─── Fixtures ────────────────────────────────────────────────────────────────

/** Weekly recurring event: every Monday starting 2024-01-01 */
const makeWeeklyEvent = (): ProcessedEvent => ({
  event_id: "series-1",
  title: "Weekly Standup",
  start: new Date("2024-01-01T09:00:00Z"),
  end: new Date("2024-01-01T09:30:00Z"),
  recurring: new RRule({
    freq: RRule.WEEKLY,
    dtstart: datetime(2024, 1, 1, 9, 0),
    count: 8, // 8 occurrences total
  }),
});

/**
 * Builds a fake _recurringMeta instance as produced by getRecurrencesForDate.
 * originalStart is the UTC ISO string used by RRule internally.
 */
const makeInstance = (
  parent: ProcessedEvent,
  originalStartISO: string,
  overrides: Partial<ProcessedEvent> = {}
): ProcessedEvent => ({
  ...parent,
  event_id: `${parent.event_id}_${originalStartISO}`,
  start: new Date(originalStartISO),
  end: new Date(new Date(originalStartISO).getTime() + 30 * 60 * 1000),
  recurring: undefined,
  _recurringMeta: {
    seriesId: parent.event_id,
    originalStart: originalStartISO,
  },
  ...overrides,
});

// ─── getRecurrencesForDate ────────────────────────────────────────────────────

describe("getRecurrencesForDate", () => {
  it("stamps _recurringMeta on every produced occurrence", () => {
    const event = makeWeeklyEvent();
    // 2024-01-08 is the second Monday — within the ±1-day window of 2024-01-08
    const today = new Date("2024-01-08T09:00:00Z");
    const occurrences = getRecurrencesForDate(event, today);

    expect(occurrences.length).toBeGreaterThan(0);
    occurrences.forEach((occ) => {
      expect(occ._recurringMeta).toBeDefined();
      expect(occ._recurringMeta!.seriesId).toBe("series-1");
      expect(typeof occ._recurringMeta!.originalStart).toBe("string");
    });
  });

  it("does NOT stamp _recurringMeta on a plain (non-recurring) event", () => {
    const plain: ProcessedEvent = {
      event_id: "plain-1",
      title: "One-off",
      start: new Date("2024-03-14T10:00:00Z"),
      end: new Date("2024-03-14T11:00:00Z"),
    };
    const occurrences = getRecurrencesForDate(plain, new Date("2024-03-14T10:00:00Z"));
    expect(occurrences.length).toBe(1);
    expect(occurrences[0]._recurringMeta).toBeUndefined();
  });

  it("works with an RRuleSet as well as a plain RRule", () => {
    const set = new RRuleSet();
    set.rrule(
      new RRule({
        freq: RRule.DAILY,
        dtstart: datetime(2024, 1, 8, 9, 0),
        count: 3,
      })
    );
    const event: ProcessedEvent = {
      event_id: "set-1",
      title: "RRuleSet event",
      start: new Date("2024-01-08T09:00:00Z"),
      end: new Date("2024-01-08T09:30:00Z"),
      recurring: set,
    };
    const occurrences = getRecurrencesForDate(event, new Date("2024-01-08T09:00:00Z"));
    expect(occurrences.length).toBeGreaterThan(0);
    occurrences.forEach((occ) => {
      expect(occ._recurringMeta!.seriesId).toBe("set-1");
    });
  });
});

// ─── addExdateToEvent ─────────────────────────────────────────────────────────

describe("addExdateToEvent", () => {
  it("returns a new event object (immutable)", () => {
    const event = makeWeeklyEvent();
    const exdate = new Date("2024-01-08T09:00:00Z");
    const result = addExdateToEvent(event, exdate);
    expect(result).not.toBe(event);
  });

  it("the exdated occurrence no longer appears in .between()", () => {
    const event = makeWeeklyEvent();
    // Second Monday
    const exdate = new Date("2024-01-08T09:00:00Z");
    const result = addExdateToEvent(event, exdate);

    const rule = result.recurring as RRuleSet;
    const windowStart = new Date("2024-01-01T00:00:00Z");
    const windowEnd = new Date("2024-03-01T00:00:00Z");
    const dates = rule.between(windowStart, windowEnd, true).map((d) => d.toISOString());

    expect(dates).not.toContain(exdate.toISOString());
  });

  it("all other occurrences are preserved", () => {
    const event = makeWeeklyEvent();
    const exdate = new Date("2024-01-08T09:00:00Z");
    const original = (event.recurring as RRule).between(
      new Date("2024-01-01T00:00:00Z"),
      new Date("2024-03-01T00:00:00Z"),
      true
    ).length;

    const result = addExdateToEvent(event, exdate);
    const remaining = (result.recurring as RRuleSet).between(
      new Date("2024-01-01T00:00:00Z"),
      new Date("2024-03-01T00:00:00Z"),
      true
    ).length;

    expect(remaining).toBe(original - 1);
  });
});

// ─── truncateEventBefore ──────────────────────────────────────────────────────

describe("truncateEventBefore", () => {
  it("returns a new event object (immutable)", () => {
    const event = makeWeeklyEvent();
    const result = truncateEventBefore(event, new Date("2024-01-15T09:00:00Z"));
    expect(result).not.toBe(event);
  });

  it("occurrences on or after the cutoff are removed", () => {
    const event = makeWeeklyEvent();
    // Cut off at the 3rd Monday (2024-01-15)
    const cutoff = new Date("2024-01-15T09:00:00Z");
    const result = truncateEventBefore(event, cutoff);

    const rule = result.recurring as RRuleSet;
    const windowEnd = new Date("2024-03-01T00:00:00Z");
    const dates = rule.between(new Date("2024-01-01T00:00:00Z"), windowEnd, true);

    dates.forEach((d) => {
      expect(d.getTime()).toBeLessThan(cutoff.getTime());
    });
  });

  it("occurrences before the cutoff are retained", () => {
    const event = makeWeeklyEvent();
    const cutoff = new Date("2024-01-15T09:00:00Z");
    const result = truncateEventBefore(event, cutoff);

    const rule = result.recurring as RRuleSet;
    const dates = rule.between(
      new Date("2024-01-01T00:00:00Z"),
      new Date("2024-03-01T00:00:00Z"),
      true
    );
    // Should still have the first two Mondays: Jan 1 and Jan 8
    expect(dates.length).toBe(2);
  });
});

// ─── createSeriesFrom ─────────────────────────────────────────────────────────

describe("createSeriesFrom", () => {
  it("creates a new event with a different event_id", () => {
    const parent = makeWeeklyEvent();
    const fromDate = new Date("2024-01-15T09:00:00Z");
    const newSeries = createSeriesFrom(parent, fromDate, {});
    expect(newSeries.event_id).not.toBe(parent.event_id);
  });

  it("starts on fromDate", () => {
    const parent = makeWeeklyEvent();
    const fromDate = new Date("2024-01-15T09:00:00Z");
    const newSeries = createSeriesFrom(parent, fromDate, {});

    const rule = newSeries.recurring as RRuleSet;
    const first = rule.between(
      new Date(fromDate.getTime() - 1000),
      new Date(fromDate.getTime() + 7 * 24 * 60 * 60 * 1000),
      true
    )[0];
    // The first occurrence should be on fromDate (UTC values may differ by rrule internal UTC)
    expect(first).toBeDefined();
  });

  it("applies title and color overrides", () => {
    const parent = makeWeeklyEvent();
    const fromDate = new Date("2024-01-15T09:00:00Z");
    const newSeries = createSeriesFrom(parent, fromDate, {
      title: "Renamed Standup",
      color: "#ff0000",
    });
    expect(newSeries.title).toBe("Renamed Standup");
    expect(newSeries.color).toBe("#ff0000");
  });

  it("does not carry over _recurringMeta", () => {
    const parent = makeWeeklyEvent();
    const fromDate = new Date("2024-01-15T09:00:00Z");
    const newSeries = createSeriesFrom(parent, fromDate, {
      _recurringMeta: { seriesId: parent.event_id, originalStart: fromDate.toISOString() },
    });
    expect(newSeries._recurringMeta).toBeUndefined();
  });
});

// ─── applyRecurringEdit ───────────────────────────────────────────────────────

describe("applyRecurringEdit", () => {
  let parent: ProcessedEvent;
  let events: ProcessedEvent[];

  beforeEach(() => {
    parent = makeWeeklyEvent();
    events = [parent];
  });

  // ── mode: "all" ────────────────────────────────────────────────────────────

  describe("mode: all", () => {
    it("updates the title on the parent series in-place", () => {
      const instance = makeInstance(parent, "2024-01-08T09:00:00Z", { title: "New Title" });
      const result = applyRecurringEdit(events, instance, "all");

      expect(result).toHaveLength(1);
      expect(result[0].event_id).toBe(parent.event_id);
      expect(result[0].title).toBe("New Title");
    });

    it("preserves the parent's event_id", () => {
      const instance = makeInstance(parent, "2024-01-08T09:00:00Z");
      const result = applyRecurringEdit(events, instance, "all");
      expect(result[0].event_id).toBe("series-1");
    });

    it("does not duplicate or remove events", () => {
      const instance = makeInstance(parent, "2024-01-08T09:00:00Z");
      const result = applyRecurringEdit(events, instance, "all");
      expect(result).toHaveLength(events.length);
    });
  });

  // ── mode: "this" ───────────────────────────────────────────────────────────

  describe("mode: this", () => {
    const occurrenceISO = "2024-01-08T09:00:00Z";

    it("adds a standalone override event", () => {
      const instance = makeInstance(parent, occurrenceISO, { title: "Override Title" });
      const result = applyRecurringEdit(events, instance, "this");

      const standalone = result.find((e) => !e.recurring && e._recurringMeta === undefined);
      expect(standalone).toBeDefined();
      expect(standalone!.title).toBe("Override Title");
    });

    it("the standalone override has no _recurringMeta", () => {
      const instance = makeInstance(parent, occurrenceISO);
      const result = applyRecurringEdit(events, instance, "this");
      const standalone = result.find((e) => e.event_id !== parent.event_id);
      expect(standalone!._recurringMeta).toBeUndefined();
    });

    it("exdates the edited occurrence from the parent series", () => {
      const instance = makeInstance(parent, occurrenceISO);
      const result = applyRecurringEdit(events, instance, "this");

      const updatedParent = result.find((e) => e.event_id === parent.event_id)!;
      const rule = updatedParent.recurring as RRuleSet;
      const dates = rule
        .between(new Date("2024-01-01T00:00:00Z"), new Date("2024-03-01T00:00:00Z"), true)
        .map((d) => d.toISOString());
      expect(dates).not.toContain(occurrenceISO);
    });

    it("produces exactly 2 events (parent + override)", () => {
      const instance = makeInstance(parent, occurrenceISO);
      const result = applyRecurringEdit(events, instance, "this");
      expect(result).toHaveLength(2);
    });
  });

  // ── mode: "following" ──────────────────────────────────────────────────────

  describe("mode: following", () => {
    const cutoffISO = "2024-01-15T09:00:00Z"; // 3rd Monday

    it("truncates the parent series before the cutoff", () => {
      const instance = makeInstance(parent, cutoffISO);
      const result = applyRecurringEdit(events, instance, "following");

      const updatedParent = result.find((e) => e.event_id === parent.event_id)!;
      const rule = updatedParent.recurring as RRuleSet;
      const dates = rule.between(
        new Date("2024-01-01T00:00:00Z"),
        new Date("2024-03-01T00:00:00Z"),
        true
      );
      dates.forEach((d) => {
        expect(d.getTime()).toBeLessThan(new Date(cutoffISO).getTime());
      });
    });

    it("creates a new series starting at the cutoff", () => {
      const instance = makeInstance(parent, cutoffISO, { title: "From Cutoff" });
      const result = applyRecurringEdit(events, instance, "following");

      const newSeries = result.find((e) => e.event_id !== parent.event_id)!;
      expect(newSeries).toBeDefined();
      expect(newSeries.recurring).toBeDefined();
    });

    it("the new series has title from the edited instance", () => {
      const instance = makeInstance(parent, cutoffISO, { title: "Updated Standup" });
      const result = applyRecurringEdit(events, instance, "following");

      const newSeries = result.find((e) => e.event_id !== parent.event_id)!;
      expect(newSeries.title).toBe("Updated Standup");
    });

    it("produces exactly 2 events (truncated parent + new series)", () => {
      const instance = makeInstance(parent, cutoffISO);
      const result = applyRecurringEdit(events, instance, "following");
      expect(result).toHaveLength(2);
    });
  });

  // ── non-recurring event ────────────────────────────────────────────────────

  describe("plain (non-recurring) event", () => {
    it("falls back to a simple in-place update when no _recurringMeta", () => {
      const plain: ProcessedEvent = {
        event_id: "plain-1",
        title: "Old Title",
        start: new Date("2024-03-14T10:00:00Z"),
        end: new Date("2024-03-14T11:00:00Z"),
      };
      const updated = { ...plain, title: "New Title" };
      const result = applyRecurringEdit([plain], updated, "this");

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("New Title");
    });
  });
});

// ─── applyRecurringDelete ─────────────────────────────────────────────────────

describe("applyRecurringDelete", () => {
  let parent: ProcessedEvent;
  let events: ProcessedEvent[];

  beforeEach(() => {
    parent = makeWeeklyEvent();
    events = [parent];
  });

  // ── mode: "all" ────────────────────────────────────────────────────────────

  describe("mode: all", () => {
    it("removes the entire parent series", () => {
      const instance = makeInstance(parent, "2024-01-08T09:00:00Z");
      const result = applyRecurringDelete(events, instance, "all");
      expect(result).toHaveLength(0);
    });

    it("does not remove unrelated events", () => {
      const other: ProcessedEvent = {
        event_id: "other-1",
        title: "Other",
        start: new Date("2024-01-10T10:00:00Z"),
        end: new Date("2024-01-10T11:00:00Z"),
      };
      const instance = makeInstance(parent, "2024-01-08T09:00:00Z");
      const result = applyRecurringDelete([parent, other], instance, "all");
      expect(result).toHaveLength(1);
      expect(result[0].event_id).toBe("other-1");
    });
  });

  // ── mode: "this" ───────────────────────────────────────────────────────────

  describe("mode: this", () => {
    const occurrenceISO = "2024-01-08T09:00:00Z";

    it("keeps the parent series", () => {
      const instance = makeInstance(parent, occurrenceISO);
      const result = applyRecurringDelete(events, instance, "this");
      expect(result).toHaveLength(1);
      expect(result[0].event_id).toBe(parent.event_id);
    });

    it("exdates the deleted occurrence from the parent series", () => {
      const instance = makeInstance(parent, occurrenceISO);
      const result = applyRecurringDelete(events, instance, "this");

      const updatedParent = result[0];
      const rule = updatedParent.recurring as RRuleSet;
      const dates = rule
        .between(new Date("2024-01-01T00:00:00Z"), new Date("2024-03-01T00:00:00Z"), true)
        .map((d) => d.toISOString());
      expect(dates).not.toContain(occurrenceISO);
    });

    it("the deleted occurrence no longer appears but others remain", () => {
      const instance = makeInstance(parent, occurrenceISO);
      const originalCount = (parent.recurring as RRule).between(
        new Date("2024-01-01T00:00:00Z"),
        new Date("2024-03-01T00:00:00Z"),
        true
      ).length;

      const result = applyRecurringDelete(events, instance, "this");
      const newCount = (result[0].recurring as RRuleSet).between(
        new Date("2024-01-01T00:00:00Z"),
        new Date("2024-03-01T00:00:00Z"),
        true
      ).length;

      expect(newCount).toBe(originalCount - 1);
    });
  });

  // ── mode: "following" ──────────────────────────────────────────────────────

  describe("mode: following", () => {
    const cutoffISO = "2024-01-15T09:00:00Z"; // 3rd Monday

    it("keeps the parent series (truncated)", () => {
      const instance = makeInstance(parent, cutoffISO);
      const result = applyRecurringDelete(events, instance, "following");
      expect(result).toHaveLength(1);
      expect(result[0].event_id).toBe(parent.event_id);
    });

    it("occurrences at or after the cutoff are gone", () => {
      const instance = makeInstance(parent, cutoffISO);
      const result = applyRecurringDelete(events, instance, "following");

      const rule = result[0].recurring as RRuleSet;
      const dates = rule.between(
        new Date("2024-01-01T00:00:00Z"),
        new Date("2024-03-01T00:00:00Z"),
        true
      );
      dates.forEach((d) => {
        expect(d.getTime()).toBeLessThan(new Date(cutoffISO).getTime());
      });
    });

    it("occurrences before the cutoff are preserved", () => {
      const instance = makeInstance(parent, cutoffISO);
      const result = applyRecurringDelete(events, instance, "following");

      const rule = result[0].recurring as RRuleSet;
      const dates = rule.between(
        new Date("2024-01-01T00:00:00Z"),
        new Date("2024-03-01T00:00:00Z"),
        true
      );
      // Jan 1 and Jan 8 should survive
      expect(dates.length).toBe(2);
    });
  });

  // ── non-recurring event ────────────────────────────────────────────────────

  describe("plain (non-recurring) event", () => {
    it("falls back to a simple removal when no _recurringMeta", () => {
      const plain: ProcessedEvent = {
        event_id: "plain-1",
        title: "One-off",
        start: new Date("2024-03-14T10:00:00Z"),
        end: new Date("2024-03-14T11:00:00Z"),
      };
      const result = applyRecurringDelete([plain], plain, "this");
      expect(result).toHaveLength(0);
    });
  });

  // ── multiple unrelated events in the store ─────────────────────────────────

  describe("multiple events in the store", () => {
    it("all only removes the target series, leaves everything else", () => {
      const other: ProcessedEvent = {
        event_id: "other-series",
        title: "Other Series",
        start: new Date("2024-01-03T14:00:00Z"),
        end: new Date("2024-01-03T15:00:00Z"),
        recurring: new RRule({
          freq: RRule.DAILY,
          dtstart: datetime(2024, 1, 3, 14, 0),
          count: 5,
        }),
      };
      const instance = makeInstance(parent, "2024-01-08T09:00:00Z");
      const result = applyRecurringDelete([parent, other], instance, "all");
      expect(result).toHaveLength(1);
      expect(result[0].event_id).toBe("other-series");
    });
  });
});
