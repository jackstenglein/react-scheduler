import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../test-utils/render";
import EmptyAgenda from "./EmptyAgenda";
import { Translations } from "../../types";

describe("EmptyAgenda", () => {
  it("renders the no-data translation", () => {
    renderWithProviders(<EmptyAgenda />);
    expect(screen.getByText("No data to display")).toBeInTheDocument();
  });

  it("renders a custom no-data message from store translations", () => {
    renderWithProviders(<EmptyAgenda />, {
      initial: {
        translations: {
          noDataToDisplay: "Nothing scheduled",
        } as Translations,
      },
    });
    expect(screen.getByText("Nothing scheduled")).toBeInTheDocument();
  });

  it("renders inside the agenda cell container", () => {
    const { container } = renderWithProviders(<EmptyAgenda />);
    expect(container.querySelector(".rs__agenda_items")).toBeInTheDocument();
  });
});
