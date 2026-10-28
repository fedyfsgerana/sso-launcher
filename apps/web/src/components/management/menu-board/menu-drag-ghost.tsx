"use client";

import { createPortal } from "react-dom";
import { Icon } from "@/components/ui/icon";
import type { DragState } from "@/features/menus/use-menu-drag";
import { resolveIcon } from "@/lib/icons";

type MenuDragGhostProps = Readonly<{
  drag: DragState;
  hint: string;
}>;

export function MenuDragGhost({ drag, hint }: MenuDragGhostProps) {
  return createPortal(
    <div
      className="mn-drag-ghost"
      style={{
        width: drag.width,
        transform: `translate3d(${drag.x - drag.offsetX}px, ${drag.y - drag.offsetY}px, 0)`,
      }}
      aria-hidden="true"
    >
      {drag.icon ? (
        <i className="ch-ic">
          <Icon icon={resolveIcon(drag.icon)} size={18} />
        </i>
      ) : null}
      <div className="mn-tree-copy">
        <b>{drag.label}</b>
        <small>{hint}</small>
      </div>
    </div>,
    document.body,
  );
}
