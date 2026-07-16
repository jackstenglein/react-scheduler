import { createTheme, ThemeProvider } from "@mui/material";
import { render, waitFor } from "@testing-library/react";
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
