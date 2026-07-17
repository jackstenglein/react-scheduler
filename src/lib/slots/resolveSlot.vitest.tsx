import { createElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { createTheme, ThemeProvider } from "@mui/material";
import { mergeLegacySlots, renderSlot, resolveSlotProps } from "./resolveSlot";
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
    const { container } = render(
      <>
        {renderSlot({
          slot: undefined,
          ownerState: { label: "x" },
          defaultElement: <span data-testid="default">Default</span>,
        })}
      </>
    );
    expect(screen.getByTestId("default")).toBeInTheDocument();
    expect(container).toHaveTextContent("Default");
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

describe("mergeLegacySlots", () => {
  it("bridges loadingComponent into slots.loadingOverlay", () => {
    const { slots } = mergeLegacySlots(undefined, undefined, {
      loadingComponent: <div data-testid="legacy-loading">Wait</div>,
    });
    expect(slots.loadingOverlay).toBeTypeOf("function");
    const { getByTestId } = render(createElement(slots.loadingOverlay!, { loadingLabel: "x" }));
    expect(getByTestId("legacy-loading")).toBeInTheDocument();
  });

  it("bridges viewerTitleComponent into slots.eventViewerTitle", () => {
    const { slots } = mergeLegacySlots(undefined, undefined, {
      viewerTitleComponent: (event) => <h1>{event.title}</h1>,
    });
    expect(slots.eventViewerTitle).toBeTypeOf("function");
    render(createElement(slots.eventViewerTitle!, { event: sampleEvent }));
    expect(screen.getByRole("heading", { name: "Standup" })).toBeInTheDocument();
  });

  it("lets explicit slots win over legacy bridges", () => {
    function ExplicitLoading() {
      return <div data-testid="explicit-loading">Explicit</div>;
    }
    const { slots } = mergeLegacySlots({ loadingOverlay: ExplicitLoading }, undefined, {
      loadingComponent: <div data-testid="legacy-loading">Legacy</div>,
    });
    expect(slots.loadingOverlay).toBe(ExplicitLoading);
  });

  it("does not bridge eventRenderer into slots.event", () => {
    const { slots } = mergeLegacySlots(undefined, undefined, {
      eventRenderer: () => <div>Custom</div>,
    });
    expect(slots.event).toBeUndefined();
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

  it("still supports legacy eventRenderer", () => {
    renderScheduler({
      view: "week",
      selectedDate: new Date(2025, 0, 15),
      events: [sampleEvent],
      eventRenderer: ({ event }) => <div data-testid="legacy-event">{event.title}</div>,
    });

    expect(screen.getByTestId("legacy-event")).toHaveTextContent("Standup");
  });

  it("prefers slots.event over legacy eventRenderer", () => {
    function SlotEvent({ event }: EventSlotProps) {
      return <div data-testid="slot-event">{event.title}</div>;
    }

    renderScheduler({
      view: "week",
      selectedDate: new Date(2025, 0, 15),
      events: [sampleEvent],
      slots: { event: SlotEvent },
      eventRenderer: () => <div data-testid="legacy-event">Legacy</div>,
    });

    expect(screen.getByTestId("slot-event")).toBeInTheDocument();
    expect(screen.queryByTestId("legacy-event")).not.toBeInTheDocument();
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

  it("bridges legacy loadingComponent into the loading overlay", () => {
    renderScheduler({
      loading: true,
      loadingComponent: <div data-testid="legacy-loading">Please wait</div>,
    });

    expect(screen.getByTestId("legacy-loading")).toHaveTextContent("Please wait");
  });

  it("falls back to the default event UI when eventRenderer returns null", () => {
    const renderer = vi.fn(() => null);
    renderScheduler({
      view: "week",
      selectedDate: new Date(2025, 0, 15),
      events: [sampleEvent],
      eventRenderer: renderer,
    });

    expect(renderer).toHaveBeenCalled();
    expect(screen.getByText("Standup")).toBeInTheDocument();
  });
});
