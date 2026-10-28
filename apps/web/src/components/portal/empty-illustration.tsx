import { SearchX, type LucideIcon } from "lucide-react";
import styles from "./empty-illustration.module.css";

type EmptyIllustrationProps = Readonly<{
  badge?: LucideIcon;
}>;

export function EmptyIllustration({ badge }: EmptyIllustrationProps) {
  const searching = badge === SearchX;

  return (
    <div className={styles.art} aria-hidden="true">
      <svg className={styles.scene} viewBox="0 0 240 170">
        <circle className={styles.backdrop} cx="120" cy="84" r="72" />
        <ellipse className={styles.ground} cx="120" cy="150" rx="78" ry="7" />

        <g className={styles.leafLeft}>
          <path d="M48 150c-4-26-20-38-34-40 2 16 14 34 34 40z" />
          <path d="M48 150c6-24-2-42-14-52-6 18-2 40 14 52z" />
        </g>
        <g className={styles.leafRight}>
          <path d="M192 150c4-26 20-38 34-40-2 16-14 34-34 40z" />
          <path d="M192 150c-6-24 2-42 14-52 6 18 2 40-14 52z" />
        </g>

        <g className={styles.card}>
          <rect
            className={styles.sheet}
            x="64"
            y="46"
            width="112"
            height="92"
            rx="12"
          />
          <path
            className={styles.head}
            d="M64 58a12 12 0 0 1 12-12h88a12 12 0 0 1 12 12v8H64z"
          />
          <circle className={styles.headDot} cx="76" cy="56" r="3" />
          <circle className={styles.headDot} cx="86" cy="56" r="3" />
          <rect
            className={styles.row}
            x="76"
            y="78"
            width="88"
            height="12"
            rx="6"
          />
          <rect
            className={styles.row}
            x="76"
            y="98"
            width="88"
            height="12"
            rx="6"
          />
          <rect
            className={styles.row}
            x="76"
            y="118"
            width="60"
            height="12"
            rx="6"
          />
        </g>

        {searching ? (
          <g className={styles.lens}>
            <circle className={styles.lensGlass} cx="168" cy="112" r="20" />
            <path
              className={styles.lensMark}
              d="M161 105l14 14M175 105l-14 14"
            />
            <path className={styles.lensHandle} d="M183 127l14 14" />
          </g>
        ) : (
          <g className={styles.sparkles}>
            <path className={styles.spark} d="M188 52v12M182 58h12" />
            <path
              className={`${styles.spark} ${styles.sparkLate}`}
              d="M52 70v8M48 74h8"
            />
          </g>
        )}

        <circle
          className={`${styles.dot} ${styles.dotA}`}
          cx="40"
          cy="44"
          r="4"
        />
        <circle
          className={`${styles.dot} ${styles.dotB}`}
          cx="204"
          cy="86"
          r="3"
        />
        <circle
          className={`${styles.dot} ${styles.dotC}`}
          cx="150"
          cy="26"
          r="3"
        />
      </svg>
    </div>
  );
}
