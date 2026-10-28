"use client";

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  AppWindow,
  ChevronLeft,
  ChevronRight,
  History,
  LayoutGrid,
  Search,
  SearchX,
  Star,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { ResetFilterButton } from "@/components/portal/reset-filter-button";
import { EmptyState } from "@/components/portal/empty-state";
import { AppStack } from "@/components/portal/app-stack";
import { HelpCard } from "@/components/portal/help-card";
import { StatCard, StatGrid } from "@/components/portal/stat-card";
import { TomSelect } from "@/components/ui/tom-select";
import { getOverviewInsights } from "@/features/overview/api";
import { useDepartments } from "@/features/departments/use-departments";
import { applicationCategories, sortCategories } from "@/lib/portal/options";
import { LaunchOverlay } from "@/components/portal/launch-overlay";
import { PageHero } from "@/components/portal/page-hero";
import { useToast } from "@/components/portal/toast";
import { AppStateDot } from "@/components/portal/app-state-dot";
import { MaintenanceTip } from "@/components/portal/maintenance-tip";
import { useHoverTip } from "@/components/ui/hover-tip";
import { ViewToggle, type ViewMode } from "@/components/ui/view-toggle";
import { Icon } from "@/components/ui/icon";
import { useAuthSession } from "@/features/auth/auth-session-provider";
import { useLauncher } from "@/features/applications/use-launcher";
import { usePortalData } from "@/features/portal/portal-data-provider";
import { getRecentActions, type RecentAction } from "@/features/activities/api";
import {
  actionIcon,
  actionTone,
  describeActivity,
} from "@/lib/portal/audit-options";
import { resolveIcon } from "@/lib/icons";
import {
  formatFullDate,
  formatRelative,
  greeting,
  initials,
} from "@/lib/portal/format";
import { useMinuteClock } from "@/lib/portal/use-clock";
import { useMinLoading } from "@/lib/portal/use-min-loading";
import type { PortalApplication } from "@/types/portal";
import { ACTIVITY_LIMIT, LIST_PAGE_SIZE, STACK_LIMIT } from "./overview-config";
import { OverviewSkeleton } from "./overview-skeleton";
import styles from "./overview.module.css";
import { useTileColumns } from "./use-tile-columns";

type TileProps = Readonly<{
  application: PortalApplication;
  detail: string;
  onOpen: (application: PortalApplication) => void;
}>;

function AppTile({ application, detail, onOpen }: TileProps) {
  const inactive = application.status !== "active";
  const maintenance = application.status === "maintenance";
  const tip = useHoverTip();

  return (
    <>
      <button
        {...(maintenance ? tip.triggerProps : {})}
        className={[
          styles.tile,
          inactive ? styles.disabled : "",
          maintenance ? styles.maintenance : "",
        ]
          .filter(Boolean)
          .join(" ")}
        type="button"
        onClick={() => onOpen(application)}
      >
        <span className={styles.tileIcon}>
          <span className={`${styles.logo} ${application.color}`}>
            {application.icon ? (
              <Icon icon={resolveIcon(application.icon)} size={24} />
            ) : (
              <b className="ac-mono">{initials(application.name)}</b>
            )}
          </span>
          <AppStateDot application={application} />
        </span>

        <b className={styles.tileName}>{application.name}</b>
        <small className={styles.tileMeta}>{detail}</small>
      </button>

      {maintenance ? (
        <MaintenanceTip
          id={tip.id}
          placement={tip.placement}
          leaving={tip.leaving}
          name={application.name}
          message={application.maintenanceMessage}
        />
      ) : null}
    </>
  );
}

function AppRow({ application, detail, onOpen }: TileProps) {
  const inactive = application.status !== "active";
  const maintenance = application.status === "maintenance";
  const tip = useHoverTip();

  return (
    <>
      <button
        {...(maintenance ? tip.triggerProps : {})}
        className={[
          styles.listRow,
          inactive ? styles.disabled : "",
          maintenance ? styles.maintenance : "",
        ]
          .filter(Boolean)
          .join(" ")}
        type="button"
        onClick={() => onOpen(application)}
      >
        <span className={styles.tileIcon}>
          <span
            className={`${styles.logo} ${styles.listLogo} ${application.color}`}
          >
            {application.icon ? (
              <Icon icon={resolveIcon(application.icon)} size={20} />
            ) : (
              <b className="ac-mono">{initials(application.name)}</b>
            )}
          </span>
          <AppStateDot application={application} />
        </span>

        <span className={styles.listText}>
          <b>{application.name}</b>
          <small>{detail}</small>
        </span>

        <Icon icon={ChevronRight} size={18} />
      </button>

      {maintenance ? (
        <MaintenanceTip
          id={tip.id}
          placement={tip.placement}
          leaving={tip.leaving}
          name={application.name}
          message={application.maintenanceMessage}
        />
      ) : null}
    </>
  );
}

function AppItem(props: TileProps & Readonly<{ view: ViewMode }>) {
  const { view, ...rest } = props;

  return view === "list" ? <AppRow {...rest} /> : <AppTile {...rest} />;
}

function tileDetail(application: PortalApplication) {
  return application.category || application.description;
}

function TilePager({
  applications,
  summary,
  view,
  renderTile,
}: Readonly<{
  applications: PortalApplication[];
  summary: ReactNode;
  view: ViewMode;
  renderTile: (application: PortalApplication) => ReactNode;
}>) {
  const { ref: grid, columns } = useTileColumns<HTMLDivElement>();
  const [page, setPage] = useState(0);

  const size = view === "list" ? LIST_PAGE_SIZE : columns;
  const pages = Math.max(1, Math.ceil(applications.length / size));
  const current = Math.min(page, pages - 1);
  const start = current * size;
  const shown = applications.slice(start, start + size);

  return (
    <>
      <div
        ref={grid}
        className={view === "list" ? styles.listGrid : styles.pagerGrid}
        style={{ "--columns": columns } as CSSProperties}
      >
        {shown.map(renderTile)}
      </div>

      <footer className={styles.sectionFoot}>
        {summary}

        <div className={styles.pagerNav}>
          <span className={styles.pagerInfo}>
            {start + 1}–{start + shown.length} dari {applications.length}
          </span>

          <button
            className={`${styles.pagerButton} ${styles.pagerPrev}`}
            type="button"
            aria-label="Halaman sebelumnya"
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
          >
            <Icon icon={ChevronLeft} size={18} />
          </button>

          <button
            className={`${styles.pagerButton} ${styles.pagerNext}`}
            type="button"
            aria-label="Halaman berikutnya"
            disabled={current >= pages - 1}
            onClick={() => setPage(current + 1)}
          >
            <Icon icon={ChevronRight} size={18} />
          </button>
        </div>
      </footer>
    </>
  );
}

type SectionProps = Readonly<{
  title: string;
  icon: LucideIcon;
  toolbar?: ReactNode;
  children: ReactNode;
}>;

function Section({ title, icon, toolbar, children }: SectionProps) {
  return (
    <section className={`card ${styles.section}`}>
      <header className={styles.sectionHead}>
        <h3>
          <i className="ch-ic">
            <Icon icon={icon} size={18} />
          </i>
          {title}
        </h3>
        {toolbar}
      </header>
      {children}
    </section>
  );
}

export default function OverviewPage() {
  const { user } = useAuthSession();
  const { applications, favorites, loading } = usePortalData();
  const { departments } = useDepartments();
  const { launching, open } = useLauncher();
  const { showToast } = useToast();
  const now = useMinuteClock();
  const [recentActions, setRecentActions] = useState<RecentAction[]>([]);
  const [actionsLoading, setActionsLoading] = useState(true);
  const [openedLastWeek, setOpenedLastWeek] = useState(0);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [favoriteView, setFavoriteView] = useState<ViewMode>("grid");
  const [appView, setAppView] = useState<ViewMode>("grid");
  const showSkeleton = useMinLoading(loading || actionsLoading);

  useEffect(() => {
    let active = true;

    getRecentActions(ACTIVITY_LIMIT)
      .then((value) => {
        if (active) {
          setRecentActions(value);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) {
          setActionsLoading(false);
        }
      });

    getOverviewInsights()
      .then((value) => {
        if (active) {
          setOpenedLastWeek(value.openedLastWeek);
        }
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  const sorted = useMemo(
    () =>
      [...applications].sort((left, right) => {
        const opened =
          (right.lastOpenedAt ? Date.parse(right.lastOpenedAt) : 0) -
          (left.lastOpenedAt ? Date.parse(left.lastOpenedAt) : 0);

        return opened !== 0 ? opened : left.name.localeCompare(right.name);
      }),
    [applications],
  );

  const categories = useMemo(
    () =>
      sortCategories(
        applications.map((application) => application.category).filter(Boolean),
        applicationCategories(departments),
      ),
    [applications, departments],
  );

  const shown = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return sorted.filter(
      (application) =>
        (!category || application.category === category) &&
        (!keyword ||
          `${application.name} ${application.category} ${application.description}`
            .toLowerCase()
            .includes(keyword)),
    );
  }, [category, query, sorted]);

  const maintenanceCount = applications.filter(
    (application) => application.status === "maintenance",
  ).length;

  function launch(application: PortalApplication) {
    if (application.status !== "active") {
      showToast(`${application.name} sedang maintenance.`, "warning");
      return;
    }

    void open(application);
  }

  if (showSkeleton) {
    return <OverviewSkeleton />;
  }

  const firstName = user?.name.split(" ")[0] ?? "";
  const salutation = `${now ? greeting(now) : "Selamat datang"}${firstName ? `, ${firstName}` : ""}`;
  const description = now ? formatFullDate(now) : undefined;

  return (
    <div className="page" id="overviewPage">
      <PageHero title={`Beranda — ${salutation}`} description={description} />

      <div className={styles.stack}>
        <StatGrid>
          <StatCard
            icon={AppWindow}
            label="Aplikasi tersedia"
            value={applications.length}
          />
          <StatCard icon={Star} label="Favorit" value={favorites.length} />
          <StatCard
            icon={History}
            label="Dibuka minggu ini"
            value={openedLastWeek}
            tone="info"
          />
          <StatCard
            icon={Wrench}
            label="Sedang perbaikan"
            value={maintenanceCount}
            tone="warn"
          />
        </StatGrid>

        <Section
          title="Favorit"
          icon={Star}
          toolbar={
            favorites.length > 0 ? (
              <ViewToggle value={favoriteView} onChange={setFavoriteView} />
            ) : null
          }
        >
          {favorites.length === 0 ? (
            <EmptyState
              title="Belum ada favorit"
              description="Tandai aplikasi yang sering dipakai dengan ikon bintang di Aplikasi Saya."
              inPanel
            />
          ) : (
            <TilePager
              key={favoriteView}
              applications={favorites}
              view={favoriteView}
              summary={
                <AppStack
                  limit={STACK_LIMIT}
                  applications={favorites}
                  label={`${favorites.length} favorit`}
                />
              }
              renderTile={(application) => (
                <AppItem
                  key={application.id}
                  application={application}
                  detail={tileDetail(application)}
                  onOpen={launch}
                  view={favoriteView}
                />
              )}
            />
          )}
        </Section>

        <Section
          title="Aplikasi Saya"
          icon={LayoutGrid}
          toolbar={
            applications.length > 0 ? (
              <div className={styles.toolbar}>
                <label className="search us-search">
                  <Icon icon={Search} size={18} />
                  <input
                    placeholder="Cari aplikasi"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </label>

                <div className="seg-select">
                  <TomSelect
                    ariaLabel="Semua kategori"
                    value={category}
                    variant="filter"
                    options={[
                      { value: "", label: "Semua kategori" },
                      ...categories.map((item) => ({
                        value: item,
                        label: item,
                      })),
                    ]}
                    onChange={setCategory}
                  />
                </div>

                <ViewToggle value={appView} onChange={setAppView} />

                <ResetFilterButton
                  onReset={() => {
                    setQuery("");
                    setCategory("");
                  }}
                />
              </div>
            ) : null
          }
        >
          {applications.length === 0 ? (
            <EmptyState
              title="Belum ada aplikasi"
              description="Hubungi Administrator Sistem untuk mendapatkan akses aplikasi."
              inPanel
            />
          ) : shown.length === 0 ? (
            <EmptyState
              badge={SearchX}
              title="Aplikasi tidak ditemukan"
              description="Coba ubah kata kunci atau kategori."
              inPanel
            />
          ) : (
            <TilePager
              key={`${query}|${category}|${appView}`}
              applications={shown}
              view={appView}
              summary={
                <AppStack
                  limit={STACK_LIMIT}
                  applications={shown}
                  label={`${shown.length} aplikasi`}
                />
              }
              renderTile={(application) => (
                <AppItem
                  key={application.id}
                  application={application}
                  detail={tileDetail(application)}
                  onOpen={launch}
                  view={appView}
                />
              )}
            />
          )}
        </Section>

        <div className={styles.row}>
          <Section title="Aktivitas Terbaru" icon={History}>
            {recentActions.length === 0 ? (
              <EmptyState
                title="Belum ada aktivitas"
                description="Data yang Anda tambah, ubah, hapus, serta aplikasi yang Anda buka akan tercatat di sini."
                inPanel
              />
            ) : (
              <ul className={styles.activities}>
                {recentActions.map((action) => {
                  const { title, detail } = describeActivity(action);

                  return (
                    <li key={action.id} className={styles.activity}>
                      <span
                        className={`${styles.activityIcon} ${styles.soft} ${actionTone(action.action)}`}
                      >
                        <Icon icon={actionIcon(action.action)} size={17} />
                      </span>

                      <span className={styles.activityText}>
                        <b>{title}</b>
                        <small>{detail}</small>
                      </span>

                      <time
                        className={styles.activityTime}
                        dateTime={action.occurredAt}
                      >
                        {formatRelative(action.occurredAt)}
                      </time>
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>
          <HelpCard />
        </div>
      </div>

      <LaunchOverlay launch={launching} />
    </div>
  );
}
