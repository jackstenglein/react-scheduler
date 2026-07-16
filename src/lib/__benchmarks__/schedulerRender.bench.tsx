import { createTheme, ThemeProvider } from "@mui/material";
import { cleanup, render } from "@testing-library/react";
import { afterEach, bench, describe } from "vitest";
import { Scheduler } from "../index";
import { makeEvents } from "../helpers/__benchmarks__/fixtures";

const theme = createTheme();
const selectedDate = new Date(2025, 0, 15);
const events100 = makeEvents(100);
const events500 = makeEvents(500);

function renderScheduler(events: typeof events100, view: "week" | "month") {
  return render(
    <ThemeProvider theme={theme}>
      <Scheduler events={events} view={view} selectedDate={selectedDate} />
    </ThemeProvider>
  );
}

afterEach(() => {
  cleanup();
});

describe("Scheduler render", () => {
  bench("week view · 100 events", () => {
    const { unmount } = renderScheduler(events100, "week");
    unmount();
  });

  bench("week view · 500 events", () => {
    const { unmount } = renderScheduler(events500, "week");
    unmount();
  });

  bench("month view · 100 events", () => {
    const { unmount } = renderScheduler(events100, "month");
    unmount();
  });

  bench("month view · 500 events", () => {
    const { unmount } = renderScheduler(events500, "month");
    unmount();
  });
});
