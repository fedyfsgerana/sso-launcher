"use client";

import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

type FloatingMenuProps = Readonly<{
  anchor: HTMLElement | null;
  onClose: () => void;
  children: ReactNode;
  width?: number;
}>;

const GAP = 6;
const EDGE = 12;

export function FloatingMenu({
  anchor,
  onClose,
  children,
  width = 220,
}: FloatingMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const menu = menuRef.current;

    if (!menu || !anchor) {
      return;
    }

    const target = anchor;
    const panel = menu;

    function place() {
      const rect = target.getBoundingClientRect();
      const height = panel.offsetHeight;
      const below = window.innerHeight - rect.bottom - GAP - EDGE;
      const openUp = below < height && rect.top > below;

      const top = openUp
        ? Math.max(EDGE, rect.top - GAP - height)
        : Math.min(rect.bottom + GAP, window.innerHeight - EDGE - height);

      const left = Math.min(
        Math.max(EDGE, rect.right - width),
        window.innerWidth - EDGE - width,
      );

      panel.style.top = `${top}px`;
      panel.style.left = `${left}px`;
      panel.style.visibility = "visible";
    }

    place();
    window.addEventListener("resize", place);

    return () => window.removeEventListener("resize", place);
  }, [anchor, width]);

  useEffect(() => {
    function handleDown(event: MouseEvent) {
      const target = event.target as Node;

      if (menuRef.current?.contains(target) || anchor?.contains(target)) {
        return;
      }

      onClose();
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    function handleScroll(event: Event) {
      if (menuRef.current?.contains(event.target as Node)) {
        return;
      }

      onClose();
    }

    document.addEventListener("mousedown", handleDown);
    document.addEventListener("keydown", handleKey);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("mousedown", handleDown);
      document.removeEventListener("keydown", handleKey);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [anchor, onClose]);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      ref={menuRef}
      className="menu-pop floating-menu"
      role="menu"
      style={{ width, visibility: "hidden" }}
      onClick={(event) => event.stopPropagation()}
    >
      {children}
    </div>,
    document.body,
  );
}
