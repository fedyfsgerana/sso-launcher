import styles from "./recent.module.css";

export function RecentSkeleton() {
  return (
    <div className="page" aria-hidden="true">
      <div className="sk sk-hero" />

      <div className="rc-layout">
        <div className="card rc-table">
          <div className={`ma-bar ${styles.skBar}`}>
            <span className="sk sk-field" />
            <span className={`sk ${styles.skFilter}`} />
            <span className={`sk ${styles.skFilter}`} />
            <span className={`sk ${styles.skFilter}`} />
            <span className={`sk ${styles.skSquare}`} />
            <span className="sk sk-chip" />
          </div>

          {Array.from({ length: 5 }).map((_, index) => (
            <div className="sk-row" key={index}>
              <span className={`sk ${styles.skCheck}`} />
              <span className={`sk sk-line ${styles.skNo}`} />
              <span className={`sk ${styles.skLogo}`} />
              <span className={styles.skName}>
                <span className={`sk sk-line ${styles.skTitle}`} />
                <span className={`sk sk-line ${styles.skSub}`} />
              </span>
              <span className={`sk sk-line ${styles.skTime}`} />
              <span className={styles.skActions}>
                <span className={`sk ${styles.skAction}`} />
                <span className={`sk ${styles.skAction}`} />
                <span className={`sk ${styles.skAction}`} />
              </span>
            </div>
          ))}

          <div className="pager">
            <span className={`sk sk-line ${styles.skPagerText}`} />
            <span className="sk sk-chip" />
          </div>
        </div>

        <aside className="rc-aside">
          <section className={`card ${styles.skTip}`}>
            <span className={styles.skTipTitle}>
              <span className={`sk ${styles.skSquare}`} />
              <span className={`sk sk-line ${styles.skLine}`} />
            </span>
            <span className="sk sk-line lg" />
            <span className="sk sk-line" />
            <span className={`sk ${styles.skTipStat}`} />
            <span className={`sk ${styles.skTipButton}`} />
          </section>
        </aside>
      </div>
    </div>
  );
}
