import { useEffect } from "react";

const SCROLL_IDLE_MS = 500;
const ATTR = "data-scrolling";

const timeouts = new Map<Element, ReturnType<typeof setTimeout>>();

function scheduleRemove(el: Element) {
  const existing = timeouts.get(el);
  if (existing !== undefined) clearTimeout(existing);
  const id = setTimeout(() => {
    el.removeAttribute(ATTR);
    timeouts.delete(el);
  }, SCROLL_IDLE_MS);
  timeouts.set(el, id);
}

function isScrollable(el: Element): boolean {
  const { overflow, overflowY, overflowX } = getComputedStyle(el);
  const vals = [overflow, overflowY, overflowX];
  return vals.some((v) => v === "scroll" || v === "auto" || v === "overlay");
}

function markScrolling(el: Element) {
  if (!isScrollable(el)) return;
  el.setAttribute(ATTR, "true");
  scheduleRemove(el);
}

/** wheel/touch 시 타겟의 스크롤 가능한 조상 찾기 */
function findScrollableAncestor(el: Element): Element | null {
  let current: Element | null = el;
  while (current && current !== document.body) {
    if (isScrollable(current)) {
      const canScroll =
        current.scrollHeight > current.clientHeight ||
        current.scrollWidth > current.clientWidth;
      if (canScroll) return current;
    }
    current = current.parentElement;
  }
  return null;
}

function handleScroll(e: Event) {
  const el = e.target;
  if (!(el instanceof Element)) return;
  markScrolling(el);
}

function handleWheel(e: WheelEvent) {
  if (e.deltaX === 0 && e.deltaY === 0) return;
  const el = e.target;
  if (!(el instanceof Element)) return;
  const scrollable = findScrollableAncestor(el);
  if (scrollable) markScrolling(scrollable);
}

function handleTouchMove(e: TouchEvent) {
  const el = e.target;
  if (!(el instanceof Element)) return;
  const scrollable = findScrollableAncestor(el);
  if (scrollable) markScrolling(scrollable);
}

/**
 * 전역 스크롤바 오버레이: 스크롤할 때만 스크롤바 표시, 멈추면 fade out.
 * wheel/scroll/touch 로 스크롤 감지.
 */
export function useScrollbarOverlay(): void {
  useEffect(() => {
    if (typeof document === "undefined") return;

    const opts = { capture: true, passive: true } as AddEventListenerOptions;
    document.addEventListener("scroll", handleScroll, opts);
    document.addEventListener("wheel", handleWheel, opts);
    document.addEventListener("touchmove", handleTouchMove, opts);

    return () => {
      document.removeEventListener("scroll", handleScroll, opts);
      document.removeEventListener("wheel", handleWheel, opts);
      document.removeEventListener("touchmove", handleTouchMove, opts);
      timeouts.forEach((id) => clearTimeout(id));
      timeouts.clear();
      document.querySelectorAll(`[${ATTR}]`).forEach((el) => el.removeAttribute(ATTR));
    };
  }, []);
}
