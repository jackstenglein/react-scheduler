import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import useSyncScroll from "./useSyncScroll";

function mockScrollMetrics(el: HTMLElement, scrollWidth: number, clientWidth: number) {
  Object.defineProperty(el, "scrollWidth", { configurable: true, get: () => scrollWidth });
  Object.defineProperty(el, "clientWidth", { configurable: true, get: () => clientWidth });
}

function SyncScrollHarness() {
  const { headersRef, bodyRef } = useSyncScroll();
  return (
    <>
      <div
        ref={headersRef}
        data-testid="sync-header"
        style={{ overflowX: "hidden", width: 100, height: 20, overscrollBehaviorX: "none" }}
      >
        <div style={{ width: 400, height: 20 }} />
      </div>
      <div
        ref={bodyRef}
        data-testid="sync-body"
        style={{ overflowX: "auto", width: 100, height: 40, overscrollBehaviorX: "none" }}
      >
        <div style={{ width: 400, height: 20 }} />
      </div>
    </>
  );
}

describe("useSyncScroll", () => {
  it("mirrors the body horizontal scroll onto the header", () => {
    render(<SyncScrollHarness />);
    const header = screen.getByTestId("sync-header");
    const body = screen.getByTestId("sync-body");
    mockScrollMetrics(header, 400, 100);
    mockScrollMetrics(body, 400, 100);

    body.scrollLeft = 120;
    body.dispatchEvent(new Event("scroll"));

    expect(header.scrollLeft).toBe(120);
  });

  it("clamps body scroll to the shared max so it cannot drift past the header", () => {
    render(<SyncScrollHarness />);
    const header = screen.getByTestId("sync-header");
    const body = screen.getByTestId("sync-body");
    // Header content narrower than body → shared max is header's.
    mockScrollMetrics(header, 300, 100);
    mockScrollMetrics(body, 500, 100);

    body.scrollLeft = 9999;
    body.dispatchEvent(new Event("scroll"));

    expect(body.scrollLeft).toBe(200);
    expect(header.scrollLeft).toBe(200);
  });

  it("applies horizontal wheel deltas without exceeding the shared max", () => {
    render(<SyncScrollHarness />);
    const header = screen.getByTestId("sync-header");
    const body = screen.getByTestId("sync-body");
    mockScrollMetrics(header, 400, 100);
    mockScrollMetrics(body, 400, 100);

    body.scrollLeft = 280;
    body.dispatchEvent(new WheelEvent("wheel", { deltaX: 100, deltaY: 0, cancelable: true }));

    expect(body.scrollLeft).toBe(300);
    expect(header.scrollLeft).toBe(300);
  });
});
