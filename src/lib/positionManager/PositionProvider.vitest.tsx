import { renderHook, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { StoreProvider } from "../store/provider";
import { ProcessedEvent } from "../types";
import { PositionProvider } from "./provider";
import usePosition from "./usePosition";

const makeEvent = (overrides: Partial<ProcessedEvent> = {}): ProcessedEvent => ({
  event_id: 1,
  title: "Event",
  start: new Date(2025, 0, 15, 9, 0),
  end: new Date(2025, 0, 15, 10, 0),
  ...overrides,
});

function createWrapper(events: ProcessedEvent[], view: "month" | "week" | "day" = "month") {
  return ({ children }: { children: ReactNode }) => (
    <StoreProvider initial={{ events, view }}>
      <PositionProvider>{children}</PositionProvider>
    </StoreProvider>
  );
}

describe("PositionProvider slot assignment", () => {
  it("assigns slot 0 to a single same-day event", async () => {
    const events = [makeEvent({ event_id: "a" })];
    const { result } = renderHook(() => usePosition(), {
      wrapper: createWrapper(events),
    });

    await waitFor(() => {
      expect(result.current.renderedSlots.all?.["2025-01-15"]?.a).toBe(0);
    });
  });

  it("stacks two same-day events in consecutive slots", async () => {
    const events = [
      makeEvent({
        event_id: "long",
        allDay: true,
        start: new Date(2025, 0, 15, 0, 0),
        end: new Date(2025, 0, 17, 0, 0),
      }),
      makeEvent({
        event_id: "short",
        allDay: true,
        start: new Date(2025, 0, 15, 0, 0),
        end: new Date(2025, 0, 16, 0, 0),
      }),
    ];

    const { result } = renderHook(() => usePosition(), {
      wrapper: createWrapper(events, "month"),
    });

    await waitFor(() => {
      const day = result.current.renderedSlots.all?.["2025-01-15"];
      expect(day).toBeDefined();
      // Month view sorts longest first, so "long" takes slot 0
      expect(day?.long).toBe(0);
      expect(day?.short).toBe(1);
    });
  });

  it("keeps a multi-day event in the same slot across days when free", async () => {
    const events = [
      makeEvent({
        event_id: "multi",
        allDay: true,
        start: new Date(2025, 0, 15, 0, 0),
        end: new Date(2025, 0, 17, 0, 0),
      }),
    ];

    const { result } = renderHook(() => usePosition(), {
      wrapper: createWrapper(events),
    });

    await waitFor(() => {
      const slots = result.current.renderedSlots.all;
      expect(slots?.["2025-01-15"]?.multi).toBe(0);
      expect(slots?.["2025-01-16"]?.multi).toBe(0);
      expect(slots?.["2025-01-17"]?.multi).toBe(0);
    });
  });

  it("avoids colliding slots when a second event starts mid-span", async () => {
    // Event A spans Jan 15–17 in slot 0.
    // Event B is only Jan 16 → must take slot 1 on that day.
    const events = [
      makeEvent({
        event_id: "a",
        allDay: true,
        start: new Date(2025, 0, 15, 0, 0),
        end: new Date(2025, 0, 17, 0, 0),
      }),
      makeEvent({
        event_id: "b",
        allDay: true,
        start: new Date(2025, 0, 16, 0, 0),
        end: new Date(2025, 0, 16, 23, 59),
      }),
    ];

    const { result } = renderHook(() => usePosition(), {
      wrapper: createWrapper(events, "month"),
    });

    await waitFor(() => {
      const slots = result.current.renderedSlots.all;
      expect(slots?.["2025-01-15"]?.a).toBe(0);
      expect(slots?.["2025-01-16"]?.a).toBe(0);
      expect(slots?.["2025-01-16"]?.b).toBe(1);
      expect(slots?.["2025-01-17"]?.a).toBe(0);
    });
  });

  it("scopes slots per resource when resources are configured", async () => {
    const events = [
      makeEvent({
        event_id: "alice-event",
        assignee: "alice",
        allDay: true,
        start: new Date(2025, 0, 15, 0, 0),
        end: new Date(2025, 0, 16, 0, 0),
      }),
      makeEvent({
        event_id: "bob-event",
        assignee: "bob",
        allDay: true,
        start: new Date(2025, 0, 15, 0, 0),
        end: new Date(2025, 0, 16, 0, 0),
      }),
    ];

    const wrapper = ({ children }: { children: ReactNode }) => (
      <StoreProvider
        initial={{
          events,
          view: "month",
          resources: [
            { assignee: "alice", text: "Alice" },
            { assignee: "bob", text: "Bob" },
          ],
          fields: [{ name: "assignee", type: "select" }],
        }}
      >
        <PositionProvider>{children}</PositionProvider>
      </StoreProvider>
    );

    const { result } = renderHook(() => usePosition(), { wrapper });

    await waitFor(() => {
      expect(result.current.renderedSlots.alice?.["2025-01-15"]?.["alice-event"]).toBe(0);
      expect(result.current.renderedSlots.bob?.["2025-01-15"]?.["bob-event"]).toBe(0);
      expect(result.current.renderedSlots.alice?.["2025-01-15"]?.["bob-event"]).toBeUndefined();
    });
  });
});
