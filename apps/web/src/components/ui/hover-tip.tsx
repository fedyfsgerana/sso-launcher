"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

type Placement = Readonly<{
  top: number;
  left: number;
  below: boolean;
}>;

const ROOM_BELOW = 100;
const OFFSET = 6;
const EDGE = 120;
const SHOW_DELAY = 120;
const HIDE_DURATION = 140;

function placementFor(target: HTMLElement): Placement {
  const rect = target.getBoundingClientRect();
  const below = rect.bottom + ROOM_BELOW < window.innerHeight;
  const center = rect.left + rect.width / 2;

  return {
    left: Math.min(Math.max(center, EDGE), window.innerWidth - EDGE),
    top: below ? rect.bottom + OFFSET : rect.top - OFFSET,
    below,
  };
}

export function useHoverTip() {
  const id = useId();
  const [placement, setPlacement] = useState<Placement | null>(null);
  const [leaving, setLeaving] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const pending = timer;

    return () => window.clearTimeout(pending.current);
  }, []);

  useEffect(() => {
    if (!placement) {
      return;
    }

    const close = () => setPlacement(null);

    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);

    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [placement]);

  function show(event: MouseEvent<HTMLElement> | FocusEvent<HTMLElement>) {
    const target = event.currentTarget;

    window.clearTimeout(timer.current);

    if (placement && !leaving) {
      return;
    }

    timer.current = window.setTimeout(
      () => {
        setLeaving(false);
        setPlacement(placementFor(target));
      },
      placement ? 0 : SHOW_DELAY,
    );
  }

  function hide() {
    window.clearTimeout(timer.current);

    if (!placement) {
      return;
    }

    setLeaving(true);
    timer.current = window.setTimeout(() => {
      setPlacement(null);
      setLeaving(false);
    }, HIDE_DURATION);
  }

  return {
    id,
    placement,
    leaving,
    triggerProps: {
      onMouseEnter: show,
      onMouseLeave: hide,
      onFocus: show,
      onBlur: hide,
      "aria-describedby": placement ? id : undefined,
    },
  };
}

type HoverTipProps = Readonly<{
  id: string;
  placement: Placement | null;
  leaving?: boolean;
  children: ReactNode;
}>;

export function HoverTip({
  id,
  placement,
  leaving = false,
  children,
}: HoverTipProps) {
  if (!placement || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      id={id}
      role="tooltip"
      className={[
        "hover-tip",
        placement.below ? "below" : "above",
        leaving ? "is-leaving" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ top: placement.top, left: placement.left }}
    >
      {children}
    </div>,
    document.body,
  );
}
