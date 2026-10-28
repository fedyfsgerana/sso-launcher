type TableSkeletonProps = Readonly<{
  rows?: number;
  columns?: number;
}>;

export function TableSkeleton({ rows = 6, columns = 5 }: TableSkeletonProps) {
  return (
    <div className="sk-table" aria-hidden="true">
      {Array.from({ length: rows }).map((_, row) => (
        <div className="sk-row" key={row}>
          <span className="sk sk-avatar" />

          <div className="sk-lines">
            <span className="sk sk-line lg" />
            <span className="sk sk-line sm" />
          </div>

          {Array.from({ length: Math.max(0, columns - 2) }).map((_, cell) => (
            <span className="sk sk-line md" key={cell} />
          ))}
        </div>
      ))}
    </div>
  );
}

type GridSkeletonProps = Readonly<{
  cards?: number;
}>;

export function HeroSkeleton() {
  return <div className="sk sk-hero" aria-hidden="true" />;
}

export function BarSkeleton() {
  return (
    <div className="ma-bar us-bar" aria-hidden="true">
      <span className="sk sk-field" />
      <span className="sk sk-chip" />
      <span className="sk sk-chip" />
      <span className="sk sk-chip" />
    </div>
  );
}

export function BlockSkeleton({ lines = 3 }: Readonly<{ lines?: number }>) {
  return (
    <div className="sk-block" aria-hidden="true">
      {Array.from({ length: lines }).map((_, index) => (
        <span className="sk sk-line" key={index} />
      ))}
    </div>
  );
}

export function TabBarSkeleton() {
  return (
    <div className="tab-bar" aria-hidden="true">
      <span className="sk sk-chip" />
      <span className="sk sk-chip" />
    </div>
  );
}

export function PagerSkeleton() {
  return (
    <div className="pager" aria-hidden="true">
      <span className="sk sk-line md" />
      <span className="sk sk-chip" />
    </div>
  );
}

export function GridSkeleton({ cards = 6 }: GridSkeletonProps) {
  return (
    <div className="ma-grid" aria-hidden="true">
      {Array.from({ length: cards }).map((_, index) => (
        <article className="ac sk-card" key={index}>
          <div className="ac-hit">
            <span className="sk sk-avatar" />

            <div className="ac-txt">
              <span className="sk sk-line lg" />
              <span className="sk sk-line sm" />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export function FieldsSkeleton({ fields = 5 }: Readonly<{ fields?: number }>) {
  return (
    <div className="sk-form" aria-hidden="true">
      {Array.from({ length: fields }).map((_, index) => (
        <div className="sk-form-field" key={index}>
          <span className="sk sk-line sm" />
          <span className="sk sk-field" />
        </div>
      ))}
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <header aria-hidden="true">
      <div className="sk-head">
        <span className="sk sk-line sk-head-title" />
        <span className="sk sk-line sk-head-text" />
      </div>
      <span className="sk sk-chip sk-head-back" />
    </header>
  );
}

export function FormFooterSkeleton() {
  return (
    <footer aria-hidden="true">
      <span className="sk sk-chip" />
      <span className="sk sk-chip" />
    </footer>
  );
}

export function PageSkeleton() {
  return (
    <div className="page" aria-hidden="true">
      <div className="sk sk-hero" />

      <div className="card ma-panel">
        <div className="ma-bar">
          <span className="sk sk-line lg" />
        </div>
        <GridSkeleton cards={6} />
      </div>
    </div>
  );
}
