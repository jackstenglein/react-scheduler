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
  const wrapper = titleEl.closest("div[style*='position']") as HTMLElement | null;
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
    expect(wrapper.style.top).toBe("0px");
    expect(wrapper.style.height).toBe("60px");
    expect(wrapper.style.width).toBe("98%");
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
    expect(wrapper.style.top).toBe("90px");
    expect(wrapper.style.height).toBe("30px");
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

    expect(getEventWrapper("A").style.top).toBe("0px");
    expect(getEventWrapper("A").style.height).toBe("120px");
    expect(getEventWrapper("B").style.top).toBe("240px");
    expect(getEventWrapper("B").style.height).toBe("120px");
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

    expect(getEventWrapper("Long").style.height).toBe("480px");
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

    expect(getEventWrapper("First").style.width).toBe("98%");
    expect(getEventWrapper("First").style.left).toBe("");
    expect(getEventWrapper("Second").style.width).toBe("98%");
    expect(getEventWrapper("Second").style.left).toBe("");
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

    expect(first.style.width).toBe("98%");
    expect(first.style.left).toBe("");
    expect(first.style.top).toBe("0px");
    expect(first.style.height).toBe("120px");

    // alreadyRendered=[Longer] → width calc(100% - 51%) (jsdom may simplify to calc(49%))
    expect(second.style.width).toMatch(/calc\((100% - 51%|49%)\)/);
    expect(second.style.left).toBe("50%");
    expect(second.style.top).toBe("60px");
    expect(second.style.height).toBe("120px");
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

    expect(getEventWrapper("Second").style.right).toBe("50%");
    expect(getEventWrapper("Second").style.left).toBe("");
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
