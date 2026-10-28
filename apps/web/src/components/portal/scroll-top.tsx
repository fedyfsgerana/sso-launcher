"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import styles from "./scroll-top.module.css";

const MIN_OFFSET = 160;

type ScrollTopProps = Readonly<{
  hidden?: boolean;
}>;

export function ScrollTop({ hidden = false }: ScrollTopProps) {
  const [scrolled, setVisible] = useState(false);
  const visible = scrolled && !hidden;

  useEffect(() => {
    function update() {
      const scrolled =
        window.scrollY ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0;

      const height = document.documentElement.scrollHeight - window.innerHeight;

      const threshold = Math.min(MIN_OFFSET, Math.max(80, height * 0.25));

      setVisible(height > 120 && scrolled > threshold);
    }

    update();

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <button
      className={visible ? `${styles.button} ${styles.show}` : styles.button}
      type="button"
      aria-label="Kembali ke atas"
      title="Kembali ke atas"
      tabIndex={visible ? 0 : -1}
      onClick={() =>
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        })
      }
    >
      <Icon icon={ArrowUp} size={18} />
    </button>
  );
}
