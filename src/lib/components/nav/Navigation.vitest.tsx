import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../test-utils/render";
import { Navigation } from "./Navigation";

describe("Navigation", () => {
  it("renders the today button with translated label", () => {
    renderWithProviders(<Navigation />);
    expect(screen.getByRole("button", { name: "Today" })).toBeInTheDocument();
  });

  it("renders view items for each enabled view", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Navigation />, {
      initial: { week: {}, day: {}, enableAgenda: true },
    });
    await user.click(screen.getByTestId("view-button"));
    expect(screen.getByRole("menuitem", { name: "Day" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Week" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Agenda" })).toBeInTheDocument();
    // TODO: look up how to assert month does not exist
  });

  it("highlights the active view item", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Navigation />, {
      initial: { view: "day", month: {}, week: {}, day: {} },
    });

    await user.click(screen.getByTestId("view-button"));

    expect(screen.getByRole("menuitem", { name: "Day" })).toHaveClass("Mui-selected");
    expect(screen.getByRole("menuitem", { name: "Week" })).not.toHaveClass("Mui-selected");
  });

  it("switches view when a view item is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Navigation />, {
      initial: { view: "week", month: {}, week: {}, day: {} },
    });

    await user.click(screen.getByTestId("view-button"));
    await user.click(screen.getByRole("menuitem", { name: "Day" }));

    expect(screen.getByTestId("view-button")).toHaveTextContent("Day");
  });

  it("returns null when navigation and view navigator are both disabled", () => {
    const { container } = renderWithProviders(<Navigation />, {
      initial: { navigation: false, disableViewNavigator: true },
    });
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the navigationExtra slot after the view dropdown", () => {
    renderWithProviders(<Navigation />, {
      initial: {
        view: "week",
        month: {},
        week: {},
        day: {},
        slots: {
          navigationExtra: ({ view }: { view: string }) => (
            <button type="button">Extra for {view}</button>
          ),
        },
      },
    });

    const viewNavigator = screen.getByTestId("view-navigator");
    const extra = screen.getByRole("button", { name: "Extra for week" });
    expect(viewNavigator).toContainElement(extra);
    expect(viewNavigator.lastElementChild).toBe(extra);
  });
});
