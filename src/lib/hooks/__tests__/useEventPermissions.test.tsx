import { renderHook } from "@testing-library/react";
import { ReactNode } from "react";
import useEventPermissions from "../useEventPermissions";
import { StoreProvider } from "../../store/provider";
import { ProcessedEvent } from "../../types";

const makeEvent = (overrides: Partial<ProcessedEvent> = {}): ProcessedEvent => ({
  event_id: 1,
  title: "Test Event",
  start: new Date(2025, 0, 15, 10, 0),
  end: new Date(2025, 0, 15, 11, 0),
  ...overrides,
});

const createWrapper =
  (storeProps: Record<string, unknown> = {}) =>
  ({ children }: { children: ReactNode }) => (
    <StoreProvider initial={storeProps}>{children}</StoreProvider>
  );

describe("useEventPermissions", () => {
  it("uses global store defaults when event has no overrides", () => {
    const { result } = renderHook(() => useEventPermissions(makeEvent()), {
      wrapper: createWrapper({ editable: true, deletable: true, draggable: true }),
    });
    expect(result.current.canEdit).toBe(true);
    expect(result.current.canDelete).toBe(true);
    expect(result.current.canDrag).toBe(true);
  });

  it("respects event-level editable override", () => {
    const { result } = renderHook(() => useEventPermissions(makeEvent({ editable: false })), {
      wrapper: createWrapper({ editable: true }),
    });
    expect(result.current.canEdit).toBe(false);
  });

  it("respects event-level deletable override", () => {
    const { result } = renderHook(() => useEventPermissions(makeEvent({ deletable: false })), {
      wrapper: createWrapper({ deletable: true }),
    });
    expect(result.current.canDelete).toBe(false);
  });

  it("respects event-level draggable override", () => {
    const { result } = renderHook(() => useEventPermissions(makeEvent({ draggable: false })), {
      wrapper: createWrapper({ draggable: true }),
    });
    expect(result.current.canDrag).toBe(false);
  });

  it("disables drag when event is not editable", () => {
    const { result } = renderHook(
      () => useEventPermissions(makeEvent({ editable: false, draggable: true })),
      { wrapper: createWrapper({ editable: true, draggable: true }) }
    );
    expect(result.current.canEdit).toBe(false);
    expect(result.current.canDrag).toBeUndefined();
  });

  it("inherits global draggable when event editable and no event draggable set", () => {
    const { result } = renderHook(() => useEventPermissions(makeEvent()), {
      wrapper: createWrapper({ editable: true, draggable: false }),
    });
    expect(result.current.canDrag).toBe(false);
  });
});
