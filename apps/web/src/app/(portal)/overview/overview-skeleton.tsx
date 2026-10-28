"use client";

import type { CSSProperties } from "react";
import { STACK_LIMIT } from "./overview-config";
import styles from "./overview.module.css";
import { useTileColumns } from "./use-tile-columns";

function SectionSkeleton() {
  const { ref, columns } = useTileColumns<HTMLDivElement>();

  return (
    <section className={`card ${styles.section}`}>
      <header className={styles.sectionHead}>
        <span className={`sk sk-line ${styles.skTitle}`} />
      </header>

      <div
        ref={ref}
        className={styles.pagerGrid}
        style={{ "--columns": columns } as CSSProperties}
      >
        {Array.from({ length: columns }).map((_, index) => (
          <div className={styles.skTile} key={index}>
            <span className={`sk ${styles.skLogo}`} />
            <span className={styles.skText}>
              <span className="sk sk-line lg" />
              <span className="sk sk-line sm" />
            </span>
          </div>
        ))}
      </div>

      <footer className={styles.sectionFoot}>
        <span className={`sk ${styles.skStack}`}>
          {Array.from({ length: STACK_LIMIT }).map((_, index) => (
            <span className={styles.skStackLogo} key={index} />
          ))}
          <span className={styles.skStackCount} />
        </span>

        <span className={styles.pagerNav}>
          <span className={`sk sk-line ${styles.skCount}`} />
          <span className={`sk ${styles.skButton}`} />
          <span className={`sk ${styles.skButton}`} />
        </span>
      </footer>
    </section>
  );
}

export function OverviewSkeleton() {
  return (
    <div className="page" aria-hidden="true">
      <div className="sk sk-hero" />

      <div className={styles.stack}>
        <SectionSkeleton />
        <SectionSkeleton />

        <div className={styles.row}>
          <section className={`card ${styles.section}`}>
            <header className={styles.sectionHead}>
              <span className={`sk sk-line ${styles.skTitle}`} />
            </header>

            <ul className={styles.activities}>
              {Array.from({ length: 5 }).map((_, index) => (
                <li className={styles.activity} key={index}>
                  <span className={`sk ${styles.skActivityIcon}`} />
                  <span className={styles.skText}>
                    <span className="sk sk-line lg" />
                    <span className="sk sk-line sm" />
                  </span>
                  <span className={`sk sk-line ${styles.skCount}`} />
                </li>
              ))}
            </ul>
          </section>

          <section className={`card ${styles.skHelp}`}>
            <span className={`sk ${styles.skRule}`} />
            <span className={`sk sk-line ${styles.skTitle}`} />
            <span className="sk sk-line lg" />
            <span className={`sk ${styles.skHelpButton}`} />
          </section>
        </div>
      </div>
    </div>
  );
}
