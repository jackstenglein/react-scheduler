import { createTheme, ThemeProvider } from "@mui/material";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Scheduler } from "./index";

const theme = createTheme();

function renderScheduler(props: React.ComponentProps<typeof Scheduler> = {}) {
  return render(
    <ThemeProvider theme={theme}>
      <Scheduler {...props} />
    </ThemeProvider>
  );
}

describe("Scheduler", () => {
  it("renders the scheduler shell and navigation", () => {
    renderScheduler();
    expect(screen.getByTestId("rs-wrapper")).toBeInTheDocument();
    expect(screen.getByTestId("view-navigator")).toBeInTheDocument();
    expect(screen.getByTestId("date-navigator")).toBeInTheDocument();
    expect(screen.getByTestId("grid")).toBeInTheDocument();
  });

  it("renders view navigation button", () => {
    renderScheduler();
    expect(screen.getByTestId("view-button")).toBeInTheDocument();
  });

  it("switches to month view when the month button is clicked", async () => {
    const user = userEvent.setup();
    renderScheduler({ view: "week" });

    await user.click(screen.getByTestId("view-button"));
    await user.click(screen.getByRole("menuitem", { name: "Month" }));
    expect(screen.getByTestId("view-button")).toHaveTextContent("Month");
  });

  it("renders a loading overlay when loading is true", () => {
    renderScheduler({ loading: true });
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("hides view navigator when disableViewNavigator is true", () => {
    renderScheduler({ disableViewNavigator: true });
    expect(screen.getByTestId("view-navigator")).toHaveStyle({ visibility: "hidden" });
  });
});
