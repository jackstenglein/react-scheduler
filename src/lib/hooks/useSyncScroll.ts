import { useEffect, useRef } from "react";

function maxScrollLeft(el: HTMLElement) {
  return Math.max(0, el.scrollWidth - el.clientWidth);
}

/**
 * Keeps a sticky header row horizontally aligned with a separately scrolling body.
 * Only the body owns the scrollbar; the header mirrors `scrollLeft`.
 *
 * Horizontal wheel/touch are applied manually (with preventDefault) so macOS/iOS
 * rubber-banding cannot push the body past the shared range and desync the header.
 */
const useSyncScroll = () => {
  const headersRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const header = headersRef.current;
    const body = bodyRef.current;
    if (!header || !body) {
      return;
    }

    const sharedMax = () => Math.min(maxScrollLeft(header), maxScrollLeft(body));

    const applyScrollLeft = (value: number) => {
      const next = Math.min(Math.max(0, value), sharedMax());
      if (body.scrollLeft !== next) {
        body.scrollLeft = next;
      }
      if (header.scrollLeft !== next) {
        header.scrollLeft = next;
      }
    };

    const syncFromBody = () => {
      applyScrollLeft(body.scrollLeft);
    };

    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) {
        return;
      }
      event.preventDefault();
      applyScrollLeft(body.scrollLeft + event.deltaX);
    };

    let touchStartX = 0;
    let touchStartScroll = 0;

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) {
        return;
      }
      touchStartX = event.touches[0].clientX;
      touchStartScroll = body.scrollLeft;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length !== 1) {
        return;
      }
      const deltaX = touchStartX - event.touches[0].clientX;
      // Only claim the gesture once it is clearly horizontal.
      if (Math.abs(deltaX) < 4) {
        return;
      }
      event.preventDefault();
      applyScrollLeft(touchStartScroll + deltaX);
    };

    body.addEventListener("scroll", syncFromBody, { passive: true });
    body.addEventListener("wheel", onWheel, { passive: false });
    header.addEventListener("wheel", onWheel, { passive: false });
    body.addEventListener("touchstart", onTouchStart, { passive: true });
    body.addEventListener("touchmove", onTouchMove, { passive: false });
    header.addEventListener("touchstart", onTouchStart, { passive: true });
    header.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      body.removeEventListener("scroll", syncFromBody);
      body.removeEventListener("wheel", onWheel);
      header.removeEventListener("wheel", onWheel);
      body.removeEventListener("touchstart", onTouchStart);
      body.removeEventListener("touchmove", onTouchMove);
      header.removeEventListener("touchstart", onTouchStart);
      header.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  return { headersRef, bodyRef };
};

export default useSyncScroll;
