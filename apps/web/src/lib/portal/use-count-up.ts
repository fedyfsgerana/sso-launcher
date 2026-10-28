"use client";

import { useEffect, useRef, useState } from "react";

function reducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    let frame = 0;

    if (reducedMotion()) {
      from.current = target;
      frame = requestAnimationFrame(() => setValue(target));

      return () => cancelAnimationFrame(frame);
    }

    const start = performance.now();
    const origin = from.current;

    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const next = Math.round(
        origin + (target - origin) * (1 - Math.pow(1 - progress, 3)),
      );

      from.current = next;
      setValue(next);

      if (progress < 1) {
        frame = requestAnimationFrame(step);
      }
    };

    frame = requestAnimationFrame(step);

    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}
