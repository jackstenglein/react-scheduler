import { act, render, renderHook } from "@testing-library/react";
import { ReactNode, useEffect, useRef } from "react";
import { describe, expect, it } from "vitest";
import useStore, { shallowEqual } from "../hooks/useStore";
import { StoreProvider } from "./provider";
import { ProcessedEvent } from "../types";

const sampleEvent: ProcessedEvent = {
  event_id: "a",
  title: "A",
  start: new Date(2025, 0, 15, 9, 0),
  end: new Date(2025, 0, 15, 10, 0),
};

function createWrapper(events: ProcessedEvent[] = []) {
  return ({ children }: { children: ReactNode }) => (
    <StoreProvider initial={{ events }}>{children}</StoreProvider>
  );
}

describe("store selectors", () => {
  it("keeps action identities stable across state updates", () => {
    const { result } = renderHook(
      () =>
        useStore(
          (s) => ({
            setCurrentDragged: s.setCurrentDragged,
            handleState: s.handleState,
            triggerLoading: s.triggerLoading,
          }),
          shallowEqual
        ),
      { wrapper: createWrapper() }
    );

    const first = result.current;

    act(() => {
      first.setCurrentDragged(sampleEvent);
    });

    expect(result.current.setCurrentDragged).toBe(first.setCurrentDragged);
    expect(result.current.handleState).toBe(first.handleState);
    expect(result.current.triggerLoading).toBe(first.triggerLoading);
  });

  it("does not re-render a locale-only subscriber when drag state changes", () => {
    const localeRenderCount = { current: 0 };
    const draggedRenderCount = { current: 0 };

    function LocaleOnly() {
      useStore((s) => s.locale);
      localeRenderCount.current += 1;
      return null;
    }

    function DraggedOnly() {
      useStore((s) => s.currentDragged);
      draggedRenderCount.current += 1;
      return null;
    }

    function Actions() {
      const setCurrentDragged = useStore((s) => s.setCurrentDragged);
      const setRef = useRef(setCurrentDragged);
      useEffect(() => {
        setRef.current = setCurrentDragged;
      }, [setCurrentDragged]);

      // Expose for the test via DOM dataset
      return (
        <button type="button" data-testid="drag" onClick={() => setRef.current(sampleEvent)} />
      );
    }

    const { getByTestId } = render(
      <StoreProvider initial={{ events: [] }}>
        <LocaleOnly />
        <DraggedOnly />
        <Actions />
      </StoreProvider>
    );

    expect(localeRenderCount.current).toBe(1);
    expect(draggedRenderCount.current).toBe(1);

    act(() => {
      getByTestId("drag").click();
    });

    expect(localeRenderCount.current).toBe(1);
    expect(draggedRenderCount.current).toBe(2);
  });
});
