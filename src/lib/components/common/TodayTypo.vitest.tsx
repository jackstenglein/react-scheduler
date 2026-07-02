import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test-utils/render";
import TodayTypo from "./TodayTypo";

describe("TodayTypo", () => {
  const date = new Date(2025, 0, 15, 12, 0);

  it("renders the day number and weekday label", () => {
    renderWithProviders(<TodayTypo date={date} locale={enUS} />);
    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("Wed")).toBeInTheDocument();
  });

  it("calls onClick with the date when clicked", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    renderWithProviders(<TodayTypo date={date} locale={enUS} onClick={onClick} />);

    await user.click(screen.getByText("15"));
    expect(onClick).toHaveBeenCalledWith(date);
  });

  it("applies bold styling when the date is today", () => {
    const today = new Date();
    renderWithProviders(<TodayTypo date={today} locale={enUS} />);
    const dayNumber = screen.getByText(format(today, "dd", { locale: enUS }));
    expect(dayNumber).toHaveStyle({ fontWeight: "bold" });
  });

  it("does not apply bold styling for non-today dates", () => {
    renderWithProviders(<TodayTypo date={date} locale={enUS} />);
    expect(screen.getByText("15")).not.toHaveStyle({ fontWeight: "bold" });
  });
});
