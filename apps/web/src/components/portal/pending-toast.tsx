"use client";

import { useEffect } from "react";
import { useToast } from "@/components/portal/toast";
import { takeToast } from "@/lib/portal/pending-toast";

export function PendingToast() {
  const { showToast } = useToast();

  useEffect(() => {
    const pending = takeToast();

    if (!pending) {
      return;
    }

    void Promise.resolve().then(() =>
      showToast(pending.message, pending.tone),
    );
  }, [showToast]);

  return null;
}