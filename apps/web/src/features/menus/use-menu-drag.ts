"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { AdminPortalMenu } from "@/features/menus/admin-api";

export type DragKind = "menu" | "section";

export type DragState = {
  kind: DragKind;
  id: string;
  label: string;
  icon: string;
  width: number;
  offsetX: number;
  offsetY: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
  active: boolean;
};

export type DropTarget =
  | { kind: "menu"; id: string; mode: "before" | "after" | "nest" }
  | { kind: "section-end"; id: string }
  | { kind: "section"; id: string; mode: "before" | "after" };

type MenuDragOptions = Readonly<{
  locked: boolean;
  onDrop: (kind: DragKind, id: string, drop: DropTarget) => Promise<void>;
}>;

const DRAG_THRESHOLD = 6;
const AUTO_SCROLL_EDGE = 80;
const AUTO_SCROLL_SPEED = 16;

function resolveTarget(
  kind: DragKind,
  x: number,
  y: number,
): DropTarget | null {
  const element = document.elementFromPoint(x, y) as HTMLElement | null;

  if (!element) {
    return null;
  }

  if (kind === "section") {
    const column = element.closest<HTMLElement>("[data-drop-column]");
    const id = column?.dataset.dropColumn;

    if (!column || !id) {
      return null;
    }

    if (column.dataset.dropAxis === "y") {
      const parts = Array.from(
        document.querySelectorAll<HTMLElement>(
          `[data-drop-column="${CSS.escape(id)}"]`,
        ),
      );
      const top = parts[0].getBoundingClientRect().top;
      const bottom = parts[parts.length - 1].getBoundingClientRect().bottom;

      return {
        kind: "section",
        id,
        mode: y < (top + bottom) / 2 ? "before" : "after",
      };
    }

    const rect = column.getBoundingClientRect();

    return {
      kind: "section",
      id,
      mode: x < rect.left + rect.width / 2 ? "before" : "after",
    };
  }

  const row = element.closest<HTMLElement>("[data-drop-menu]");
  const rowId = row?.dataset.dropMenu;

  if (row && rowId) {
    const rect = row.getBoundingClientRect();
    const ratio = (y - rect.top) / rect.height;

    return {
      kind: "menu",
      id: rowId,
      mode: ratio < 0.3 ? "before" : ratio > 0.7 ? "after" : "nest",
    };
  }

  const column = element.closest<HTMLElement>("[data-drop-column]");
  const columnId = column?.dataset.dropColumn;

  return column && columnId ? { kind: "section-end", id: columnId } : null;
}

function sameTarget(left: DropTarget | null, right: DropTarget | null) {
  return (
    left?.kind === right?.kind &&
    left?.id === right?.id &&
    (left && "mode" in left ? left.mode : "") ===
      (right && "mode" in right ? right.mode : "")
  );
}

export function dropHint(target: DropTarget | null, axis: "x" | "y" = "x") {
  if (!target) {
    return "Geser ke posisi tujuan";
  }

  if (target.kind === "section-end") {
    return "Lepas untuk memindahkan ke bagian ini";
  }

  if (target.kind === "section") {
    if (axis === "y") {
      return target.mode === "before"
        ? "Lepas untuk menaruh di atas bagian ini"
        : "Lepas untuk menaruh di bawah bagian ini";
    }

    return target.mode === "before"
      ? "Lepas untuk menaruh di kiri"
      : "Lepas untuk menaruh di kanan";
  }

  if (target.mode === "nest") {
    return "Lepas untuk menjadikan submenu";
  }

  return target.mode === "before"
    ? "Lepas untuk menaruh di atas"
    : "Lepas untuk menaruh di bawah";
}

export function useMenuDrag({ locked, onDrop }: MenuDragOptions) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const [target, setTarget] = useState<DropTarget | null>(null);
  const dropRef = useRef(onDrop);
  const dragRef = useRef<DragState | null>(null);

  useEffect(() => {
    dropRef.current = onDrop;
  });

  useEffect(() => {
    dragRef.current = drag;
  });

  const dragKey = drag ? `${drag.kind}:${drag.id}` : "";

  useEffect(() => {
    if (!dragKey) {
      return;
    }

    let pointer = { x: 0, y: 0 };
    let frame = 0;
    let current = dragRef.current;
    let drop: DropTarget | null = null;

    const scroll = () => {
      const fromTop = pointer.y;
      const fromBottom = window.innerHeight - pointer.y;
      const delta =
        fromTop < AUTO_SCROLL_EDGE
          ? -AUTO_SCROLL_SPEED
          : fromBottom < AUTO_SCROLL_EDGE
            ? AUTO_SCROLL_SPEED
            : 0;

      if (delta !== 0) {
        window.scrollBy(0, delta);
      }

      frame = requestAnimationFrame(scroll);
    };

    const move = (event: PointerEvent) => {
      if (!current) {
        return;
      }

      pointer = { x: event.clientX, y: event.clientY };

      const active =
        current.active ||
        Math.hypot(
          event.clientX - current.startX,
          event.clientY - current.startY,
        ) > DRAG_THRESHOLD;

      if (active && !current.active) {
        frame = requestAnimationFrame(scroll);
      }

      if (active) {
        const next = resolveTarget(current.kind, event.clientX, event.clientY);

        if (!sameTarget(drop, next)) {
          drop = next;
          setTarget(next);
        }
      }

      current = { ...current, x: event.clientX, y: event.clientY, active };
      setDrag(current);
    };

    const end = () => {
      cancelAnimationFrame(frame);

      if (current?.active && drop) {
        void dropRef.current(current.kind, current.id, drop);
      }

      current = null;
      setDrag(null);
      setTarget(null);
    };

    const cancel = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        cancelAnimationFrame(frame);
        setDrag(null);
        setTarget(null);
      }
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    window.addEventListener("keydown", cancel);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      window.removeEventListener("keydown", cancel);
    };
  }, [dragKey]);

  function startDrag(
    event: ReactPointerEvent<HTMLElement>,
    kind: DragKind,
    menu: AdminPortalMenu,
  ) {
    const origin = event.target as HTMLElement;

    if (
      locked ||
      event.button !== 0 ||
      origin.closest("button, input, label, a")
    ) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();

    setDrag({
      kind,
      id: menu.id,
      label: menu.label,
      icon: menu.icon,
      width: Math.min(rect.width, 320),
      offsetX: Math.min(event.clientX - rect.left, 40),
      offsetY: event.clientY - rect.top,
      startX: event.clientX,
      startY: event.clientY,
      x: event.clientX,
      y: event.clientY,
      active: false,
    });
  }

  return { drag, target, startDrag };
}
