import type { PortalActivity, PortalApplication } from "@/types/portal";

export type RecentPeriod = "all" | "today" | "week";

export type RecentFilter = Readonly<{
  query: string;
  category: string;
  favorite: string;
  period: RecentPeriod;
}>;

export const EMPTY_RECENT_FILTER: RecentFilter = {
  query: "",
  category: "",
  favorite: "",
  period: "all",
};

const WEEK_MS = 7 * 86_400_000;

function applicationIndex(applications: readonly PortalApplication[]) {
  return new Map(
    applications.map((application) => [application.id, application]),
  );
}

function withinPeriod(
  occurredAt: string,
  period: RecentPeriod,
  now: Date | null,
) {
  if (period === "all" || !now) {
    return true;
  }

  const time = new Date(occurredAt);

  return period === "today"
    ? time.toDateString() === now.toDateString()
    : now.getTime() - time.getTime() <= WEEK_MS;
}

export function isRecentFiltered(filter: RecentFilter) {
  return (
    Boolean(filter.query.trim()) ||
    Boolean(filter.category) ||
    Boolean(filter.favorite) ||
    filter.period !== "all"
  );
}

export function filterRecentActivities(
  activities: readonly PortalActivity[],
  applications: readonly PortalApplication[],
  filter: RecentFilter,
  now: Date | null,
) {
  const byId = applicationIndex(applications);
  const keyword = filter.query.trim().toLowerCase();

  return activities.filter((activity) => {
    const application = activity.applicationId
      ? byId.get(activity.applicationId)
      : undefined;

    if (filter.category && (application?.category ?? "") !== filter.category) {
      return false;
    }

    if (filter.favorite === "yes" && !application?.isFavorite) {
      return false;
    }

    if (filter.favorite === "no" && application?.isFavorite) {
      return false;
    }

    if (!withinPeriod(activity.occurredAt, filter.period, now)) {
      return false;
    }

    return (
      !keyword ||
      `${activity.title} ${activity.subtitle}`.toLowerCase().includes(keyword)
    );
  });
}

export function openedApplications(
  activities: readonly PortalActivity[],
  applications: readonly PortalApplication[],
) {
  const byId = applicationIndex(applications);
  const ids = [
    ...new Set(activities.map((activity) => activity.applicationId)),
  ];

  return ids
    .map((id) => (id ? byId.get(id) : undefined))
    .filter((item): item is PortalApplication => Boolean(item));
}

export function usedCategories(
  activities: readonly PortalActivity[],
  applications: readonly PortalApplication[],
) {
  const byId = applicationIndex(applications);

  return new Set(
    activities
      .map((activity) =>
        activity.applicationId
          ? byId.get(activity.applicationId)?.category
          : undefined,
      )
      .filter((value): value is string => Boolean(value)),
  );
}
