import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../test-utils/render";
import { ProcessedEvent } from "../../types";
import TodayEvents from "./TodayEvents";

const today = new Date(2025, 0, 15, 12, 0);

const makeEvent = (overrides: Partial<ProcessedEvent> = {}): ProcessedEvent => ({
  event_id: 1,
  title: "Event",
  start: new Date(2025, 0, 15, 9, 0),
  end: new Date(2025, 0, 15, 10, 0),
  ...overrides,
});

/** Positioned wrapper around EventItem (absolute top/height/left/width). */
function getEventWrapper(title: string): HTMLElement {
  const titleEl = screen.getByText(title);
  const wrapper = titleEl.closest("div[class*='MuiPaper-root']") as HTMLElement | null;
  if (!wrapper) {
    throw new Error(`Could not find positioned wrapper for event "${title}"`);
  }
  return wrapper;
}

describe("TodayEvents time and position", () => {
  const baseProps = {
    today,
    startHour: 9,
    endHour: 17,
    step: 60,
    minuteHeight: 1,
    direction: "ltr" as const,
  };

  it("positions a 9:00–10:00 event at the top of the day column", () => {
    renderWithProviders(
      <TodayEvents {...baseProps} todayEvents={[makeEvent({ event_id: 1, title: "Morning" })]} />
    );

    const wrapper = getEventWrapper("Morning");
    expect(wrapper).toHaveStyle({ top: "0px", height: "60px", width: "calc(98% - 4px)" });
  });

  it("offsets top by minutes past startHour", () => {
    // 10:30 with startHour 9 and minuteHeight 1 → top = 90
    renderWithProviders(
      <TodayEvents
        {...baseProps}
        todayEvents={[
          makeEvent({
            event_id: 1,
            title: "Late morning",
            start: new Date(2025, 0, 15, 10, 30),
            end: new Date(2025, 0, 15, 11, 0),
          }),
        ]}
      />
    );

    const wrapper = getEventWrapper("Late morning");
    expect(wrapper).toHaveStyle({ top: "90px", height: "30px" });
  });

  it("scales top and height by minuteHeight", () => {
    // minuteHeight 2: 9:00–10:00 → top 0, height 120
    // 11:00–12:00 → top 240, height 120
    renderWithProviders(
      <TodayEvents
        {...baseProps}
        minuteHeight={2}
        todayEvents={[
          makeEvent({
            event_id: 1,
            title: "A",
            start: new Date(2025, 0, 15, 9, 0),
            end: new Date(2025, 0, 15, 10, 0),
          }),
          makeEvent({
            event_id: 2,
            title: "B",
            start: new Date(2025, 0, 15, 11, 0),
            end: new Date(2025, 0, 15, 12, 0),
          }),
        ]}
      />
    );

    const wrapperA = getEventWrapper("A");
    const wrapperB = getEventWrapper("B");

    expect(wrapperA).toHaveStyle({ top: "0px", height: "120px" });
    expect(wrapperB).toHaveStyle({ top: "240px", height: "120px" });
  });

  it("clamps height to the visible day range", () => {
    // Day window is 9–17 (8 hours = 480 minutes). Event spans 9:00–20:00.
    renderWithProviders(
      <TodayEvents
        {...baseProps}
        todayEvents={[
          makeEvent({
            event_id: 1,
            title: "Long",
            start: new Date(2025, 0, 15, 9, 0),
            end: new Date(2025, 0, 15, 20, 0),
          }),
        ]}
      />
    );

    const wrapper = getEventWrapper("Long");
    expect(wrapper).toHaveStyle({ height: "480px" });
  });

  it("keeps non-overlapping events at full width with no left offset", () => {
    renderWithProviders(
      <TodayEvents
        {...baseProps}
        todayEvents={[
          makeEvent({
            event_id: 1,
            title: "First",
            start: new Date(2025, 0, 15, 9, 0),
            end: new Date(2025, 0, 15, 10, 0),
          }),
          makeEvent({
            event_id: 2,
            title: "Second",
            start: new Date(2025, 0, 15, 11, 0),
            end: new Date(2025, 0, 15, 12, 0),
          }),
        ]}
      />
    );

    const wrapperFirst = getEventWrapper("First");
    const wrapperSecond = getEventWrapper("Second");

    expect(wrapperFirst).toHaveStyle({ width: "calc(98% - 4px)" });
    expect(wrapperSecond).toHaveStyle({ width: "calc(98% - 4px)" });
  });

  it("narrows and offsets overlapping events horizontally", () => {
    // A 9:00–11:00 rendered first; B 10:00–12:00 overlaps and is offset.
    const events = [
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
    ];

    renderWithProviders(<TodayEvents {...baseProps} todayEvents={events} />);

    const first = getEventWrapper("Longer");
    const second = getEventWrapper("Overlap");

    expect(first).toHaveStyle({ width: "calc(98% - 4px)", top: "0px", height: "120px" });
    expect(second).toHaveStyle({
      width: "calc(49% - 4px)",
      left: "50%",
      top: "60px",
      height: "120px",
    });
  });

  it("uses right instead of left when direction is rtl", () => {
    const events = [
      makeEvent({
        event_id: 1,
        title: "First",
        start: new Date(2025, 0, 15, 9, 0),
        end: new Date(2025, 0, 15, 11, 0),
      }),
      makeEvent({
        event_id: 2,
        title: "Second",
        start: new Date(2025, 0, 15, 10, 0),
        end: new Date(2025, 0, 15, 12, 0),
      }),
    ];

    renderWithProviders(<TodayEvents {...baseProps} direction="rtl" todayEvents={events} />);

    const second = getEventWrapper("Second");
    expect(second).toHaveStyle({ right: "50%" });
  });

  it("renders start and end times on each event", () => {
    renderWithProviders(
      <TodayEvents
        {...baseProps}
        todayEvents={[
          makeEvent({
            event_id: 1,
            title: "Timed",
            start: new Date(2025, 0, 15, 9, 0),
            end: new Date(2025, 0, 15, 10, 30),
          }),
        ]}
      />
    );

    expect(screen.getByText(/9:00 AM - 10:30 AM/)).toBeInTheDocument();
  });
});
