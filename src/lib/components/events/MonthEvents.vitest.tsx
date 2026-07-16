import { createTheme, ThemeProvider } from "@mui/material";
import { screen } from "@testing-library/react";
import { addDays, startOfWeek } from "date-fns";
import { describe, expect, it, vi } from "vitest";
import { MULTI_DAY_EVENT_HEIGHT, MONTH_NUMBER_HEIGHT } from "../../helpers/constants";
import { PositionProvider } from "../../positionManger/provider";
import { renderWithProviders } from "../../test-utils/render";
import { ProcessedEvent } from "../../types";
import MonthEvents from "./MonthEvents";

const theme = createTheme();
const today = new Date(2025, 0, 15, 12, 0);
const weekStart = startOfWeek(today, { weekStartsOn: 0 });
const daysList = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
const eachWeekStart = [weekStart];

const makeEvent = (overrides: Partial<ProcessedEvent> = {}): ProcessedEvent => ({
  event_id: 1,
  title: "Event",
  start: new Date(2025, 0, 15, 0, 0),
  end: new Date(2025, 0, 16, 0, 0),
  allDay: true,
  ...overrides,
});

function getEventWrapper(title: string): HTMLElement {
  const titleEl = screen.getByText(title);
  const wrapper = titleEl.closest("div[style*='position']") as HTMLElement | null;
  if (!wrapper) {
    throw new Error(`Could not find positioned wrapper for event "${title}"`);
  }
  return wrapper;
}

function renderMonthEvents(events: ProcessedEvent[], cellHeight = 200) {
  return renderWithProviders(
    <ThemeProvider theme={theme}>
      <PositionProvider>
        <MonthEvents
          events={events}
          today={today}
          eachWeekStart={eachWeekStart}
          eachFirstDayInCalcRow={weekStart}
          daysList={daysList}
          onViewMore={vi.fn()}
          cellHeight={cellHeight}
        />
      </PositionProvider>
    </ThemeProvider>,
    {
      initial: {
        events,
        view: "month",
        selectedDate: today,
        month: {
          weekDays: [0, 1, 2, 3, 4, 5, 6],
          weekStartOn: 0,
          startHour: 9,
          endHour: 17,
          step: 60,
        },
      },
    }
  );
}

describe("MonthEvents time and position", () => {
  it("places the first event under the day number with fixed bar height", () => {
    renderMonthEvents([makeEvent({ event_id: "a", title: "All day A" })]);

    const wrapper = getEventWrapper("All day A");
    // position 0 → 0*18 + 24 + 0 = 24px (jsdom may simplify the calc expression)
    expect(wrapper.style.top).toMatch(/calc\(24px\)/);
    expect(wrapper.style.height).toBe(`${MULTI_DAY_EVENT_HEIGHT}px`);
  });

  it("stacks a second same-day event in the next vertical slot", async () => {
    renderMonthEvents([
      makeEvent({
        event_id: "long",
        title: "Long span",
        start: new Date(2025, 0, 14, 0, 0),
        end: new Date(2025, 0, 17, 0, 0),
      }),
      makeEvent({
        event_id: "short",
        title: "Short span",
        start: new Date(2025, 0, 15, 0, 0),
        end: new Date(2025, 0, 16, 0, 0),
      }),
    ]);

    // slot 1 → 18 + 24 + spacing(0.25)=2 → 44px
    const expectedShortTop = MULTI_DAY_EVENT_HEIGHT + MONTH_NUMBER_HEIGHT + 2;

    await vi.waitFor(() => {
      expect(getEventWrapper("Short span").style.top).toMatch(
        new RegExp(`calc\\(${expectedShortTop}px\\)`)
      );
    });

    expect(getEventWrapper("Long span").style.top).toMatch(/calc\(24px\)/);
    expect(getEventWrapper("Short span").style.top).toMatch(
      new RegExp(`calc\\(${expectedShortTop}px\\)`)
    );
  });

  it("sets width as a percentage of days spanned in the week row", () => {
    // From week start row context: event on Jan 15 only → 1 day → 100%
    renderMonthEvents([
      makeEvent({
        event_id: "one-day",
        title: "One day",
        start: new Date(2025, 0, 15, 0, 0),
        end: new Date(2025, 0, 15, 23, 59),
      }),
    ]);

    expect(getEventWrapper("One day").style.width).toBe("100%");
  });

  it("widens multi-day events across multiple day cells", () => {
    // eachFirstDayInCalcRow = weekStart (Sun Jan 12). Event Jan 15–17.
    // fromPrevWeek is false (start is after week start).
    // eventLength = differenceInDaysOmitTime(start, end) + 1
    renderMonthEvents([
      makeEvent({
        event_id: "multi",
        title: "Multi day",
        start: new Date(2025, 0, 15, 0, 0),
        end: new Date(2025, 0, 17, 0, 0),
      }),
    ]);

    const wrapper = getEventWrapper("Multi day");
    // Jan 15 → Jan 17 inclusive via differenceInDaysOmitTime + 1
    const widthPercent = Number.parseFloat(wrapper.style.width);
    expect(widthPercent).toBeGreaterThan(100);
  });
});
