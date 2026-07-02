import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test-utils/render";
import { LocaleArrow } from "./LocaleArrow";

describe("LocaleArrow", () => {
  it("renders a navigation button", () => {
    renderWithProviders(<LocaleArrow type="prev" aria-label="Previous" />);
    expect(screen.getByRole("button", { name: "Previous" })).toBeInTheDocument();
  });

  it("calls onClick when the button is clicked", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    renderWithProviders(<LocaleArrow type="next" aria-label="Next" onClick={onClick} />);

    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renders prev and next buttons in ltr direction", () => {
    renderWithProviders(
      <>
        <LocaleArrow type="prev" aria-label="Previous" />
        <LocaleArrow type="next" aria-label="Next" />
      </>,
      { initial: { direction: "ltr" } }
    );
    expect(screen.getByRole("button", { name: "Previous" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
  });

  it("renders prev and next buttons in rtl direction", () => {
    renderWithProviders(
      <>
        <LocaleArrow type="prev" aria-label="Previous" />
        <LocaleArrow type="next" aria-label="Next" />
      </>,
      { initial: { direction: "rtl" } }
    );
    expect(screen.getByRole("button", { name: "Previous" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
  });
});
