"use client";

import { Wrench } from "lucide-react";
import { HoverTip } from "@/components/ui/hover-tip";
import { Icon } from "@/components/ui/icon";

type MaintenanceTipProps = Readonly<{
  id: string;
  placement: Parameters<typeof HoverTip>[0]["placement"];
  leaving: boolean;
  name: string;
  message: string;
}>;

export function MaintenanceTip({
  id,
  placement,
  leaving,
  name,
  message,
}: MaintenanceTipProps) {
  return (
    <HoverTip id={id} placement={placement} leaving={leaving}>
      <b>{name}</b>
      <span className="hover-tip-row warn">
        <Icon icon={Wrench} size={13} />
        {message || "Sedang maintenance"}
      </span>
    </HoverTip>
  );
}
