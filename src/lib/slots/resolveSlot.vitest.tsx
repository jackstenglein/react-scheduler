import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { createTheme, ThemeProvider } from "@mui/material";
import { renderSlot, resolveSlotProps } from "./resolveSlot";
import { Scheduler } from "../index";
import { EventSlotProps, ProcessedEvent } from "../types";

const sampleEvent: ProcessedEvent = {
  event_id: "1",
  title: "Standup",
  start: new Date(2025, 0, 15, 9, 0),
  end: new Date(2025, 0, 15, 9, 30),
};

describe("resolveSlotProps", () => {
  it("returns an empty object when slotProps is undefined", () => {
    expect(resolveSlotProps(undefined, { a: 1 })).toEqual({});
  });

  it("returns a static slotProps object", () => {
    expect(
      resolveSlotProps<{ a: number; className?: string }>({ className: "x" }, { a: 1 })
    ).toEqual({ className: "x" });
  });

  it("invokes callback slotProps with ownerState", () => {
    type Owner = { event: ProcessedEvent; "data-id"?: string };
    const ownerState: Owner = { event: sampleEvent };
    const result = resolveSlotProps<Owner>(
      (state) => ({ "data-id": String(state.event.event_id) }),
      ownerState
    );
    expect(result).toEqual({ "data-id": "1" });
  });
});

describe("renderSlot", () => {
  it("renders the default element when no slot is provided", () => {
    render(
      <>
        {renderSlot({
          slot: undefined,
          ownerState: { label: "x" },
          defaultElement: <span data-testid="default">Default</span>,
        })}
      </>
    );
    expect(screen.getByTestId("default")).toBeInTheDocument();
  });

  it("renders a custom slot with merged slotProps", () => {
    type Props = { label: string; className?: string };
    function Custom({ label, className }: Props) {
      return (
        <span data-testid="custom" className={className}>
          {label}
        </span>
      );
    }

    render(
      <>
        {renderSlot<Props>({
          slot: Custom,
          slotProps: { className: "slot-class" },
          ownerState: { label: "Hello" },
          defaultElement: <span>Default</span>,
        })}
      </>
    );

    const el = screen.getByTestId("custom");
    expect(el).toHaveTextContent("Hello");
    expect(el).toHaveClass("slot-class");
  });
});

const theme = createTheme();

function renderScheduler(props: React.ComponentProps<typeof Scheduler> = {}) {
  return render(
    <ThemeProvider theme={theme}>
      <Scheduler {...props} />
    </ThemeProvider>
  );
}

describe("Scheduler slots integration", () => {
  it("renders slots.event instead of the default event UI", () => {
    function CustomEvent({ event }: EventSlotProps) {
      return <div data-testid="slot-event">{event.title}</div>;
    }

    renderScheduler({
      view: "week",
      selectedDate: new Date(2025, 0, 15),
      events: [sampleEvent],
      slots: { event: CustomEvent },
    });

    expect(screen.getByTestId("slot-event")).toHaveTextContent("Standup");
  });

  it("renders slots.loadingOverlay when loading", () => {
    function CustomLoading({ loadingLabel }: { loadingLabel: string }) {
      return <div data-testid="slot-loading">{loadingLabel}</div>;
    }

    renderScheduler({
      loading: true,
      slots: { loadingOverlay: CustomLoading },
    });

    expect(screen.getByTestId("slot-loading")).toHaveTextContent("Loading...");
  });

  it("merges callback slotProps into slots.event", () => {
    function CustomEvent({ event, draggable }: EventSlotProps) {
      return (
        <div data-testid="slot-event" data-draggable={String(!!draggable)}>
          {event.title}
        </div>
      );
    }

    renderScheduler({
      view: "week",
      selectedDate: new Date(2025, 0, 15),
      events: [sampleEvent],
      slots: { event: CustomEvent },
      slotProps: {
        event: () => ({ draggable: false }),
      },
    });

    expect(screen.getByTestId("slot-event")).toHaveAttribute("data-draggable", "false");
  });

  it("renders slots.hourLabel in week view", () => {
    function CustomHour({ hour }: { hour: string }) {
      return <div data-testid="slot-hour">{hour}</div>;
    }

    renderScheduler({
      view: "week",
      selectedDate: new Date(2025, 0, 15),
      events: [],
      slots: { hourLabel: CustomHour },
    });

    expect(screen.getAllByTestId("slot-hour").length).toBeGreaterThan(0);
  });

  it("renders slots.cell instead of the default cell button", () => {
    function CustomCell({ start }: { start: Date }) {
      return <div data-testid="slot-cell">{start.toISOString()}</div>;
    }

    renderScheduler({
      view: "week",
      selectedDate: new Date(2025, 0, 15),
      events: [],
      slots: { cell: CustomCell },
    });

    expect(screen.getAllByTestId("slot-cell").length).toBeGreaterThan(0);
  });

  it("renders slots.resourceHeader for resources", () => {
    function CustomHeader({ resource }: { resource: { text?: string } }) {
      return <div data-testid="slot-resource">{resource.text}</div>;
    }

    renderScheduler({
      view: "week",
      selectedDate: new Date(2025, 0, 15),
      events: [],
      resources: [{ assignee: 1, text: "Alice", subtext: "Eng", color: "#333" }],
      slots: { resourceHeader: CustomHeader },
    });

    expect(screen.getByTestId("slot-resource")).toHaveTextContent("Alice");
  });
});
