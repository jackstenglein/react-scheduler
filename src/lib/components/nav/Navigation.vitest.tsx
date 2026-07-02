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

  it("renders agenda toggle when agenda is enabled on desktop", () => {
    renderWithProviders(<Navigation />, { initial: { enableAgenda: true } });
    expect(screen.getByRole("button", { name: "Agenda" })).toBeInTheDocument();
  });

  it("renders view buttons for each enabled view", () => {
    renderWithProviders(<Navigation />, {
      initial: { month: {}, week: {}, day: {} },
    });
    expect(screen.getByRole("button", { name: "Month" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Week" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Day" })).toBeInTheDocument();
  });

  it("highlights the active view button", () => {
    renderWithProviders(<Navigation />, {
      initial: { view: "day", month: {}, week: {}, day: {} },
    });
    expect(screen.getByRole("button", { name: "Day" })).toHaveClass("MuiButton-colorPrimary");
    expect(screen.getByRole("button", { name: "Week" })).not.toHaveClass("MuiButton-colorPrimary");
  });

  it("switches view when a view button is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Navigation />, {
      initial: { view: "week", month: {}, week: {}, day: {} },
    });

    await user.click(screen.getByRole("button", { name: "Day" }));
    expect(screen.getByRole("button", { name: "Day" })).toHaveClass("MuiButton-colorPrimary");
  });

  it("returns null when navigation and view navigator are both disabled", () => {
    const { container } = renderWithProviders(<Navigation />, {
      initial: { navigation: false, disableViewNavigator: true },
    });
    expect(container).toBeEmptyDOMElement();
  });
});
