import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../test-utils/render";
import { ResourceHeader } from "./ResourceHeader";
import { DefaultResource } from "../../types";

describe("ResourceHeader", () => {
  const resource = {
    assignee: "alice",
    text: "Alice Smith",
    subtext: "Engineering",
    avatar: "/avatar.png",
    color: "#336699",
  };

  it("renders resource text and subtext", () => {
    renderWithProviders(<ResourceHeader resource={resource} />);
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.getByText("Engineering")).toBeInTheDocument();
  });

  it("renders avatar with resource text as alt", () => {
    renderWithProviders(<ResourceHeader resource={resource} />);
    expect(screen.getByAltText("Alice Smith")).toBeInTheDocument();
  });

  it("uses a custom header component when provided", () => {
    renderWithProviders(<ResourceHeader resource={resource} />, {
      initial: {
        resourceHeaderComponent: (res: DefaultResource) => (
          <div data-testid="custom-header">{res.text}</div>
        ),
      },
    });
    expect(screen.getByTestId("custom-header")).toHaveTextContent("Alice Smith");
    expect(screen.queryByText("Engineering")).not.toBeInTheDocument();
  });
});
