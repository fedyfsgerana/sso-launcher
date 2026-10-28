"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  addFavorite as addFavoriteRequest,
  removeFavorite as removeFavoriteRequest,
} from "@/features/favorites/api";
import {
  clearActivities as clearActivitiesRequest,
  deleteActivity as deleteActivityRequest,
  getActivities,
} from "@/features/activities/api";
import { getMyApplications } from "@/features/applications/api";
import { getMyMenus } from "@/features/menus/api";
import { PORTAL_DATA_CHANGED_EVENT } from "@/lib/portal/portal-data-events";
import type {
  PortalActivity,
  PortalApplication,
  PortalMenuItem,
} from "@/types/portal";

type PortalDataContextValue = {
  menus: PortalMenuItem[];
  applications: PortalApplication[];
  activities: PortalActivity[];
  loading: boolean;
  favorites: PortalApplication[];
  recent: PortalApplication[];
  toggleFavorite: (applicationId: string) => Promise<void>;
  removeActivity: (activityId: string) => Promise<void>;
  clearActivity: () => Promise<void>;
  refresh: () => Promise<void>;
};

const PortalDataContext = createContext<PortalDataContextValue | null>(null);

type PortalDataProviderProps = Readonly<{
  children: ReactNode;
}>;

export function PortalDataProvider({ children }: PortalDataProviderProps) {
  const [menus, setMenus] = useState<PortalMenuItem[]>([]);
  const [applications, setApplications] = useState<PortalApplication[]>([]);
  const [activities, setActivities] = useState<PortalActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const requestRef = useRef(0);

  const fetchAll = useCallback(async () => {
    const [menuList, applicationList, activityList] = await Promise.all([
      getMyMenus().catch(() => [] as PortalMenuItem[]),
      getMyApplications().catch(() => [] as PortalApplication[]),
      getActivities(20).catch(() => [] as PortalActivity[]),
    ]);

    return { menuList, applicationList, activityList };
  }, []);

  const refresh = useCallback(async () => {
    const requestId = ++requestRef.current;
    const { menuList, applicationList, activityList } = await fetchAll();

    if (requestId !== requestRef.current) {
      return;
    }

    setMenus(menuList);
    setApplications(applicationList);
    setActivities(activityList);
    setLoading(false);
  }, [fetchAll]);

  useEffect(() => {
    void refresh();

    return () => {
      requestRef.current += 1;
    };
  }, [refresh]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    function handleChanged() {
      clearTimeout(timer);
      timer = setTimeout(() => {
        void refresh();
      }, 150);
    }

    window.addEventListener(PORTAL_DATA_CHANGED_EVENT, handleChanged);

    return () => {
      clearTimeout(timer);
      window.removeEventListener(PORTAL_DATA_CHANGED_EVENT, handleChanged);
    };
  }, [refresh]);

  const toggleFavorite = useCallback(
    async (applicationId: string) => {
      const application = applications.find(
        (item) => item.id === applicationId,
      );

      if (!application) {
        return;
      }

      const next = !application.isFavorite;

      setApplications((current) =>
        current.map((item) =>
          item.id === applicationId ? { ...item, isFavorite: next } : item,
        ),
      );

      try {
        if (next) {
          await addFavoriteRequest(applicationId);
          return;
        }

        await removeFavoriteRequest(applicationId);
      } catch {
        setApplications((current) =>
          current.map((item) =>
            item.id === applicationId ? { ...item, isFavorite: !next } : item,
          ),
        );
      }
    },
    [applications],
  );

  const removeActivity = useCallback(
    async (activityId: string) => {
      const previous = activities;

      setActivities((current) =>
        current.filter((item) => item.id !== activityId),
      );

      try {
        await deleteActivityRequest(activityId);
      } catch (error) {
        setActivities(previous);
        throw error;
      }
    },
    [activities],
  );

  const clearActivity = useCallback(async () => {
    const previous = activities;

    setActivities([]);

    try {
      await clearActivitiesRequest();
    } catch (error) {
      setActivities(previous);
      throw error;
    }
  }, [activities]);

  const favorites = useMemo(
    () => applications.filter((item) => item.isFavorite),
    [applications],
  );

  const recent = useMemo(() => {
    return applications
      .filter((item) => item.lastOpenedAt)
      .sort((left, right) =>
        (right.lastOpenedAt ?? "").localeCompare(left.lastOpenedAt ?? ""),
      );
  }, [applications]);

  const value = useMemo<PortalDataContextValue>(
    () => ({
      menus,
      applications,
      activities,
      loading,
      favorites,
      recent,
      toggleFavorite,
      removeActivity,
      clearActivity,
      refresh,
    }),
    [
      menus,
      applications,
      activities,
      loading,
      favorites,
      recent,
      toggleFavorite,
      removeActivity,
      clearActivity,
      refresh,
    ],
  );

  return (
    <PortalDataContext.Provider value={value}>
      {children}
    </PortalDataContext.Provider>
  );
}

export function usePortalData() {
  const context = useContext(PortalDataContext);

  if (!context) {
    throw new Error("usePortalData must be used inside PortalDataProvider");
  }

  return context;
}
