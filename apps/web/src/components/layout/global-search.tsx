"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { Search } from "lucide-react";
import { LaunchOverlay } from "@/components/portal/launch-overlay";
import { useToast } from "@/components/portal/toast";
import { Icon } from "@/components/ui/icon";
import { useLauncher } from "@/features/applications/use-launcher";
import { usePortalData } from "@/features/portal/portal-data-provider";
import { resolveIcon } from "@/lib/icons";
import { menuHref } from "@/lib/portal/menu-path";
import { useAppRouter } from "@/lib/portal/use-app-router";
import type { PortalApplication, PortalMenuItem } from "@/types/portal";
import styles from "./global-search.module.css";

const APPLICATION_LIMIT = 6;
const MENU_LIMIT = 5;

type Result =
  | { kind: "application"; key: string; application: PortalApplication }
  | { kind: "menu"; key: string; menu: PortalMenuItem };

function matches(keyword: string, ...values: Array<string | null | undefined>) {
  return values.some((value) => value?.toLowerCase().includes(keyword));
}

type GlobalSearchProps = Readonly<{
  loading?: boolean;
}>;

export function GlobalSearch({ loading = false }: GlobalSearchProps) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useAppRouter();
  const { showToast } = useToast();
  const { applications, menus } = usePortalData();
  const { launching, open } = useLauncher();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [cursor, setCursor] = useState(0);

  const keyword = query.trim().toLowerCase();

  const results = useMemo<Result[]>(() => {
    if (!keyword) {
      return [];
    }

    const applicationResults: Result[] = applications
      .filter((application) =>
        matches(
          keyword,
          application.name,
          application.description,
          application.category,
        ),
      )
      .slice(0, APPLICATION_LIMIT)
      .map((application) => ({
        kind: "application",
        key: `application-${application.id}`,
        application,
      }));

    const menuResults: Result[] = menus
      .filter(
        (menu) =>
          menu.targetType !== "section" &&
          !menus.some((child) => child.parentId === menu.id) &&
          matches(keyword, menu.label),
      )
      .slice(0, MENU_LIMIT)
      .map((menu) => ({ kind: "menu", key: `menu-${menu.id}`, menu }));

    return [...applicationResults, ...menuResults];
  }, [applications, menus, keyword]);

  useEffect(() => {
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const expanded = focused && keyword.length > 0;
  const active = Math.min(cursor, Math.max(results.length - 1, 0));
  const applicationItems = results.filter(
    (item) => item.kind === "application",
  );
  const menuItems = results.filter((item) => item.kind === "menu");

  function close() {
    setQuery("");
    setCursor(0);
    inputRef.current?.blur();
  }

  function choose(result: Result | undefined) {
    if (!result) {
      return;
    }

    if (result.kind === "application") {
      if (result.application.status !== "active") {
        showToast(`${result.application.name} sedang maintenance.`, "warning");
        return;
      }

      void open(result.application);
    } else if (result.menu.targetType === "url") {
      window.open(menuHref(result.menu), "_blank", "noopener");
    } else {
      router.push(menuHref(result.menu));
    }

    close();
  }

  function onKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setCursor((value) => Math.min(value + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setCursor((value) => Math.max(value - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      choose(results[active]);
    } else if (event.key === "Escape") {
      close();
    }
  }

  function renderItem(result: Result) {
    const index = results.indexOf(result);
    const selected = index === active;
    const common = {
      id: `${listId}-${result.key}`,
      className: styles.item,
      role: "option" as const,
      "aria-selected": selected,
      onMouseEnter: () => setCursor(index),
      onMouseDown: (event: MouseEvent) => {
        event.preventDefault();
        choose(result);
      },
    };

    if (result.kind === "application") {
      const { application } = result;

      return (
        <li key={result.key} {...common}>
          <span className={`${styles.logo} ${application.color}`}>
            <Icon icon={resolveIcon(application.icon)} size={16} />
          </span>
          <span className={styles.text}>
            <b>{application.name}</b>
            <small>
              {application.status === "active"
                ? [
                    application.usesSso ? "SSO" : "Tanpa SSO",
                    application.category || application.description,
                  ]
                    .filter(Boolean)
                    .join(" · ")
                : "Sedang maintenance"}
            </small>
          </span>
        </li>
      );
    }

    return (
      <li key={result.key} {...common}>
        <span className={styles.menuIcon}>
          <Icon icon={resolveIcon(result.menu.icon)} size={16} />
        </span>
        <span className={styles.text}>
          <b>{result.menu.label}</b>
          <small>Menu portal</small>
        </span>
      </li>
    );
  }

  if (loading) {
    return (
      <div className={styles.wrap} aria-hidden="true">
        <span className="sk sk-search" />
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <label className="search">
        <Icon icon={Search} size={18} />
        <input
          ref={inputRef}
          id="globalSearch"
          value={query}
          placeholder="Cari aplikasi atau menu"
          autoComplete="off"
          role="combobox"
          aria-expanded={expanded}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            expanded && results[active]
              ? `${listId}-${results[active].key}`
              : undefined
          }
          onChange={(event) => {
            setQuery(event.target.value);
            setCursor(0);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={onKey}
        />
        <span className={styles.kbd} aria-hidden="true">
          Ctrl K
        </span>
      </label>

      {expanded ? (
        <div className={styles.panel} id={listId} role="listbox">
          {results.length === 0 ? (
            <div className={styles.empty}>
              Tidak ada aplikasi atau menu yang cocok.
            </div>
          ) : (
            <>
              {applicationItems.length > 0 ? (
                <ul className={styles.group} role="group" aria-label="Aplikasi">
                  <li className={styles.groupLabel} role="presentation">
                    Aplikasi
                  </li>
                  {applicationItems.map(renderItem)}
                </ul>
              ) : null}

              {menuItems.length > 0 ? (
                <ul className={styles.group} role="group" aria-label="Menu">
                  <li className={styles.groupLabel} role="presentation">
                    Menu
                  </li>
                  {menuItems.map(renderItem)}
                </ul>
              ) : null}
            </>
          )}
        </div>
      ) : null}

      <LaunchOverlay launch={launching} />
    </div>
  );
}
