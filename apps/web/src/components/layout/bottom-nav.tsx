"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Ellipsis } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { isMenuActive, menuHref } from "@/lib/portal/menu-path";
import { resolveIcon } from "@/lib/icons";
import type { PortalMenuItem } from "@/types/portal";

type BottomNavProps = Readonly<{
  menus: PortalMenuItem[];
  moreMenus: PortalMenuItem[];
  sheetOpen: boolean;
  onMore: () => void;
}>;

export function BottomNav({
  menus,
  moreMenus,
  sheetOpen,
  onMore,
}: BottomNavProps) {
  const pathname = usePathname();
  const moreActive =
    sheetOpen || moreMenus.some((menu) => isMenuActive(menu, pathname));

  return (
    <nav className="bn" aria-label="Navigasi bawah">
      {menus.map((menu) => {
        const active = !sheetOpen && isMenuActive(menu, pathname);

        return (
          <Link
            key={menu.id}
            href={menuHref(menu)}
            className={active ? "active" : undefined}
            aria-current={active ? "page" : undefined}
          >
            <Icon icon={resolveIcon(menu.icon)} />
            {menu.label}
          </Link>
        );
      })}

      <button
        type="button"
        className={moreActive ? "active" : undefined}
        aria-expanded={sheetOpen}
        onClick={onMore}
      >
        <Icon icon={Ellipsis} />
        Lainnya
      </button>
    </nav>
  );
}
