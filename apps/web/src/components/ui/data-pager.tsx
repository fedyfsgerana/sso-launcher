"use client";

import { useMemo, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { TomSelect } from "@/components/ui/tom-select";

export const PAGE_SIZES = [10, 20, 50, 100];

type DataPagerProps = Readonly<{
  page: number;
  pageSize: number;
  total: number;
  unit: string;
  summary?: ReactNode;
  sizes?: number[];
  sizeLabel?: string;
  onPage: (page: number) => void;
  onPageSize: (pageSize: number) => void;
}>;

export function DataPager({
  page,
  pageSize,
  total,
  unit,
  summary,
  sizes = PAGE_SIZES,
  sizeLabel = "per halaman",
  onPage,
  onPageSize,
}: DataPagerProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, pages);
  const start = total === 0 ? 0 : (current - 1) * pageSize + 1;
  const end = Math.min(current * pageSize, total);

  const numbers = useMemo(() => {
    const items: Array<number | "gap"> = [];

    for (let index = 1; index <= pages; index += 1) {
      if (
        pages <= 7 ||
        index === 1 ||
        index === pages ||
        Math.abs(index - current) <= 1
      ) {
        items.push(index);
      } else if (items[items.length - 1] !== "gap") {
        items.push("gap");
      }
    }

    return items;
  }, [pages, current]);

  return (
    <div className="pager">
      {summary ?? (
        <span className="muted">
          {total === 0
            ? "Tidak ada data"
            : `Menampilkan ${start}–${end} dari ${total} ${unit}`}
        </span>
      )}

      <div className="pager-r">
        {summary && total > 0 ? (
          <span className="muted">
            {start}–{end} dari {total}
          </span>
        ) : null}

        <div className="seg-select">
          <TomSelect
            ariaLabel="Jumlah per halaman"
            value={String(pageSize)}
            variant="filter"
            options={sizes.map((size) => ({
              value: String(size),
              label: `${size} ${sizeLabel}`,
            }))}
            onChange={(value) => onPageSize(Number(value))}
          />
        </div>

        <nav className="pages" aria-label="Halaman">
          <button
            type="button"
            aria-label="Sebelumnya"
            disabled={current === 1}
            onClick={() => onPage(current - 1)}
          >
            <Icon icon={ChevronLeft} size={16} />
          </button>

          {numbers.map((item, index) =>
            item === "gap" ? (
              <span key={`gap-${index}`}>…</span>
            ) : (
              <button
                key={item}
                type="button"
                className={item === current ? "on" : undefined}
                aria-current={item === current ? "page" : undefined}
                onClick={() => onPage(item)}
              >
                {item}
              </button>
            ),
          )}

          <button
            type="button"
            aria-label="Berikutnya"
            disabled={current === pages}
            onClick={() => onPage(current + 1)}
          >
            <Icon icon={ChevronRight} size={16} />
          </button>
        </nav>
      </div>
    </div>
  );
}
