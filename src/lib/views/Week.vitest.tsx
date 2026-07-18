import { createTheme, ThemeProvider } from "@mui/material";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Scheduler } from "../index";
import { ProcessedEvent } from "../types";

const theme = createTheme();
const selectedDate = new Date(2025, 0, 15);

describe("Week remote fetch", () => {
  it("fetches remote events once for a stable selected week", async () => {
    const getRemoteEvents = vi.fn(async () => [] as ProcessedEvent[]);

    render(
      <ThemeProvider theme={theme}>
        <Scheduler
          view="week"
          selectedDate={selectedDate}
          events={[]}
          getRemoteEvents={getRemoteEvents}
        />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(getRemoteEvents).toHaveBeenCalled();
    });

    // Allow any cascading store updates (loading toggles) to settle.
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(getRemoteEvents).toHaveBeenCalledTimes(1);
  });
});

describe("Week multi-day events", () => {
  it("renders a multi-day all-day event spanning multiple columns", () => {
    const events: ProcessedEvent[] = [
      {
        event_id: "multi",
        title: "Conference",
        allDay: true,
        start: new Date(2025, 0, 15, 0, 0),
        end: new Date(2025, 0, 17, 23, 59),
      },
    ];

    render(
      <ThemeProvider theme={theme}>
        <Scheduler
          view="week"
          selectedDate={selectedDate}
          events={events}
          week={{
            weekDays: [0, 1, 2, 3, 4, 5, 6],
            weekStartOn: 1,
            startHour: 9,
            endHour: 17,
            step: 60,
          }}
        />
      </ThemeProvider>
    );

    const bar = screen.getByTestId("week-allday-event-multi");
    expect(bar).toBeInTheDocument();
    expect(bar).toHaveAttribute("data-span", "3");
    expect(bar.style.width).toBe("calc(300% + 2px)");
    expect(screen.getByText("Conference")).toBeInTheDocument();
  });
});
