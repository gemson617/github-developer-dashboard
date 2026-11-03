"use client";

import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";


const contributionLevels = [
  "bg-zinc-800",
  "bg-emerald-950",
  "bg-emerald-800",
  "bg-emerald-600",
  "bg-emerald-400",
];

function getContributionLevel(count, maxCount) {
  if (count === 0) return 0;

  const ratio = count / Math.max(maxCount, 1);

  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;

  return 4;
}


function SectionHeading({ title, subtitle, action }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h3 className="text-base font-semibold text-white">{title}</h3>
        {subtitle && (
          <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

function getActivityDetails(event) {
  const repoName = event.repo?.name || "Unknown repository";
  const payload = event.payload || {};

  switch (event.type) {
    case "PushEvent": {
      const count = payload.size ?? payload.commits?.length ?? 0;
      const branch = payload.ref?.replace("refs/heads/", "") || "unknown";

      return {
        title: `Pushed ${count} ${count === 1 ? "commit" : "commits"}`,
        detail: `${repoName} · ${branch}`,
        icon: "↥",
      };
    }

    case "PullRequestEvent":
      return {
        title: `${capitalize(payload.action || "updated")} a pull request`,
        detail: `${repoName} · ${payload.pull_request?.title || "Pull request"}`,
        icon: "⑂",
      };

    case "IssuesEvent":
      return {
        title: `${capitalize(payload.action || "updated")} an issue`,
        detail: `${repoName} · ${payload.issue?.title || "Issue"}`,
        icon: "#",
      };

    case "WatchEvent":
      return {
        title: "Starred a repository",
        detail: repoName,
        icon: "☆",
      };

    case "ForkEvent":
      return {
        title: "Forked a repository",
        detail: repoName,
        icon: "⑂",
      };

    case "CreateEvent":
      return {
        title: `Created ${payload.ref_type || "a resource"}`,
        detail: `${repoName}${payload.ref ? ` · ${payload.ref}` : ""}`,
        icon: "+",
      };

    case "DeleteEvent":
      return {
        title: `Deleted ${payload.ref_type || "a resource"}`,
        detail: `${repoName}${payload.ref ? ` · ${payload.ref}` : ""}`,
        icon: "−",
      };

    case "ReleaseEvent":
      return {
        title: "Published a release",
        detail: `${repoName} · ${payload.release?.name || payload.release?.tag_name || ""}`,
        icon: "◉",
      };

    default:
      return {
        title: event.type?.replace(/Event$/, "").replace(/([a-z])([A-Z])/g, "$1 $2") || "Activity",
        detail: repoName,
        icon: "•",
      };
  }
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getRelativeTime(dateString) {
  const timestamp = new Date(dateString).getTime();

  if (!Number.isFinite(timestamp)) return "Recently";

  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return new Date(dateString).toLocaleDateString();
}

export default function DashboardPage() {
  
  const [profile, setProfile] = useState(null);
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activities, setActivities] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState("");
  const [contributionData, setContributionData] = useState(null);
  const [contributionLoading, setContributionLoading] = useState(true);
  const [contributionError, setContributionError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const [profileResponse, reposResponse] = await Promise.all([
          fetch("/api/github/profile", { cache: "no-store" }),
          fetch("/api/github/repos", { cache: "no-store" }),
        ]);

        if (!profileResponse.ok || !reposResponse.ok) {
          throw new Error(
            "Unable to load dashboard data. Please reconnect GitHub if needed."
          );
        }

        const [profileData, reposData] = await Promise.all([
          profileResponse.json(),
          reposResponse.json(),
        ]);

        setProfile(profileData);
        setRepositories(reposData);
      } catch (err) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  useEffect(() => {
    if (!profile?.username) return;

    const controller = new AbortController();

    async function loadActivities() {
      try {
        setActivityLoading(true);
        setActivityError("");

        const response = await fetch(
          `https://api.github.com/users/${encodeURIComponent(
            profile.username
          )}/events?per_page=10`,
          {
            cache: "no-store",
            signal: controller.signal,
            headers: {
              Accept: "application/vnd.github+json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            response.status === 403
              ? "GitHub API rate limit reached. Please try again later."
              : "Unable to load GitHub activity."
          );
        }

        const data = await response.json();

        const uniqueEvents = Array.from(
          new Map(
            data.map((event) => [
              event.id,
              {
                id: event.id,
                ...getActivityDetails(event),
                time: getRelativeTime(event.created_at),
                url: `https://github.com/${event.repo.name}`,
              },
            ])
          ).values()
        );

        setActivities(uniqueEvents.slice(0, 5));
      } catch (err) {
        if (err.name !== "AbortError") {
          setActivityError(err.message || "Something went wrong.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setActivityLoading(false);
        }
      }
    }

    loadActivities();

    return () => controller.abort();
  }, [profile?.username]);

  
  useEffect(() => {
    const controller = new AbortController();

    async function loadContributions() {
      try {
        setContributionLoading(true);
        setContributionError("");

        const response = await fetch("/api/github/contributions", {
          cache: "no-store",
          signal: controller.signal,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Unable to load contribution activity."
          );
        }

        setContributionData(data);
      } catch (err) {
        if (err.name !== "AbortError") {
          setContributionError(
            err.message || "Unable to load contribution activity."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setContributionLoading(false);
        }
      }
    }

    loadContributions();

    return () => controller.abort();
  }, []);


  const totalStars = repositories.reduce(
    (total, repo) => total + repo.stargazers_count,
    0
  );

  const totalForks = repositories.reduce(
    (total, repo) => total + repo.forks_count,
    0
  );

  const stats = [
    {
      label: "Public Repositories",
      value: profile?.publicRepos ?? "—",
      change: "On GitHub",
      icon: "▤",
    },
    {
      label: "Total Stars",
      value: totalStars.toLocaleString(),
      change: "Across loaded repositories",
      icon: "☆",
    },
    {
      label: "Total Forks",
      value: totalForks.toLocaleString(),
      change: "Across loaded repositories",
      icon: "⑂",
    },
    {
      label: "Followers",
      value: profile?.followers?.toLocaleString() ?? "—",
      change: "GitHub followers",
      icon: "♙",
    },
  ];

  const popularRepositories = [...repositories]
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 4);


  const contributionWeeks = contributionData?.weeks ?? [];

  const maxContributionCount = Math.max(
    0,
    ...contributionWeeks.flatMap((week) =>
      week.contributionDays.map((day) => day.contributionCount)
    )
  );


  
  const languageStats = Object.entries(
    repositories.reduce((counts, repo) => {
      const language = repo.language;

      if (language) {
        counts[language] = (counts[language] || 0) + 1;
      }

      return counts;
    }, {})
  )
  .map(([name, count]) => ({
    name,
    count,
    percentage:
      (count /
        Object.values(
          repositories.reduce((counts, repo) => {
            if (repo.language) {
              counts[repo.language] =
                (counts[repo.language] || 0) + 1;
            }
            return counts;
          }, {})
        ).reduce((total, value) => total + value, 0)) *
      100,
  }))
  .sort((a, b) => b.count - a.count)
  .slice(0, 6);


  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Welcome section */}
        <section className="flex flex-wrap items-center justify-between gap-5">
          <p className="mb-2 text-sm text-blue-400">
            Your GitHub overview
          </p>

          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Welcome back, {profile?.name || profile?.username || "Developer"} 👋
          </h1>

          <p className="mt-2 text-sm text-zinc-400">
            Here's what's happening with your GitHub activity.
          </p>

          {error && (
            <p className="mt-3 text-sm text-red-400">{error}</p>
          )}

          {profile?.profileUrl && (
            <a
              href={profile.profileUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-zinc-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              View GitHub Profile ↗
            </a>
          )}
        </section>

        {/* Statistics */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="dashboard-card p-5 transition hover:border-zinc-700"
            >
              <div className="mb-5 flex items-center justify-between">
                <p className="text-sm text-zinc-400">{stat.label}</p>
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-xl text-blue-400">
                  {stat.icon}
                </span>
              </div>

              <p className="text-3xl font-bold tracking-tight text-white">
                {stat.value}
              </p>
              <p className="mt-2 text-xs text-emerald-400">
                {stat.change}
              </p>
            </div>
          ))}
        </section>

        
        {/* Contributions */}
        <section className="dashboard-card p-5 sm:p-6">
          <SectionHeading
            title="Contribution Activity"
            subtitle="Your contribution activity over the past year"
            action={
              <span className="text-xs text-zinc-400">
                {contributionLoading
                  ? "Loading..."
                  : contributionData
                    ? `${contributionData.totalContributions.toLocaleString()} contributions`
                    : "Contributions unavailable"}
              </span>
            }
          />

          {contributionLoading ? (
            <div className="flex h-28 items-center justify-center">
              <p className="text-sm text-zinc-400">
                Loading your contribution calendar...
              </p>
            </div>
          ) : contributionError ? (
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
              <p className="text-sm text-red-400">
                {contributionError}
              </p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-2 text-sm text-blue-400 hover:text-blue-300"
              >
                Try again
              </button>
            </div>
          ) : contributionWeeks.length === 0 ? (
            <p className="py-8 text-sm text-zinc-400">
              No contribution calendar data available.
            </p>
          ) : (
            <>
              <div className="custom-scrollbar overflow-x-auto pb-2">
                <div className="flex min-w-max gap-1">
                  {contributionWeeks.map((week, weekIndex) => {
                    const firstDay = week.contributionDays[0]?.date;
                    const monthStart = week.contributionDays.find(
                      (day) => day.date.endsWith("-01")
                    );

                    const monthLabel =
                      weekIndex === 0
                        ? firstDay
                          ? new Date(
                              `${firstDay}T12:00:00`
                            ).toLocaleDateString("en-US", {
                              month: "short",
                            })
                          : ""
                        : monthStart
                          ? new Date(
                              `${monthStart.date}T12:00:00`
                            ).toLocaleDateString("en-US", {
                              month: "short",
                            })
                          : "";

                    return (
                      <div
                        key={firstDay || weekIndex}
                        className="flex w-3 flex-col gap-1"
                      >
                        <div className="mb-1 h-4 text-[10px] text-zinc-500">
                          {monthLabel}
                        </div>

                        {week.contributionDays.map((day) => {
                          const level = getContributionLevel(
                            day.contributionCount,
                            maxContributionCount
                          );

                          return (
                            <div
                              key={day.date}
                              title={`${day.contributionCount} ${
                                day.contributionCount === 1
                                  ? "contribution"
                                  : "contributions"
                              } on ${day.date}`}
                              aria-label={`${day.contributionCount} contributions on ${day.date}`}
                              className={`h-3 w-3 shrink-0 rounded-[3px] ${
                                contributionLevels[level]
                              }`}
                            />
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3">
                <p className="text-xs text-zinc-500">
                  {contributionData.username
                    ? `@${contributionData.username}`
                    : "GitHub contributions"}
                </p>

                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <span>Less</span>
                  {contributionLevels.map((level) => (
                    <span
                      key={level}
                      className={`h-3 w-3 rounded-[3px] ${level}`}
                    />
                  ))}
                  <span>More</span>
                </div>
              </div>
            </>
          )}
        </section>

        {/* Repositories */}
        <section>
          <SectionHeading
            title="Popular Repositories"
            subtitle="A quick look at your featured projects"
            action={
              <a
                href="/dashboard/repositories"
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                View all →
              </a>
            }
          />

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {loading ? (
  <p className="text-sm text-zinc-400">Loading repositories...</p>
) : popularRepositories.length === 0 ? (
  <p className="text-sm text-zinc-400">
    {error || "No repositories found."}
  </p>
) : (
  popularRepositories.map((repo) => (
              <article
                key={repo.name}
                className="dashboard-card p-5 transition hover:border-zinc-700"
              >
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-lg text-zinc-400">▤</span>
                  <h4 className="font-semibold text-blue-400">
                    {repo.name}
                  </h4>
                  <span className="ml-auto rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-400">
                    Public
                  </span>
                </div>

                <p className="mb-5 min-h-10 text-sm leading-5 text-zinc-400">
                  {repo.description}
                </p>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-zinc-500">
                  <span className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${repo.color}`} />
                    {repo.language}
                  </span>
                  <span>☆ {repo.stars}</span>
                  <span>⑂ {repo.forks}</span>
                  <span className="ml-auto">{repo.updated}</span>
                </div>
              </article>
            ))
          )}
          </div>
        </section>

       
{/* Language Analytics */}
<section>
  <SectionHeading
    title="Language Analytics"
    subtitle="Programming languages across your repositories"
  />

  <div className="dashboard-card p-5 sm:p-6">
    {loading ? (
      <p className="text-sm text-zinc-400">
        Loading language statistics...
      </p>
    ) : languageStats.length === 0 ? (
      <p className="text-sm text-zinc-400">
        No language statistics available yet.
      </p>
    ) : (
      <div className="space-y-5">
        {languageStats.map((language) => (
          <div key={language.name}>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-200">
                {language.name}
              </span>

              <span className="text-xs text-zinc-400">
                {language.count} repos ·{" "}
                {language.percentage.toFixed(1)}%
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-500"
                style={{
                  width: `${language.percentage}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
</section>


        {/* Recent activity */}
        <section>
          <SectionHeading
            title="Recent Activity"
            subtitle="Your latest developer activity"
            action={
              <a
                href={`https://github.com/${profile?.username || ""}?tab=overview`}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                View activity →
              </a>
            }
          />

          <div className="dashboard-card divide-y divide-zinc-800">
            {activityLoading ? (
              <div className="p-6 text-sm text-zinc-400">
                Loading your GitHub activity...
              </div>
            ) : activityError ? (
              <div className="p-6 text-sm text-red-400">
                {activityError}
              </div>
            ) : activities.length === 0 ? (
              <div className="p-6 text-sm text-zinc-400">
                No recent public activity found.
              </div>
            ) : (
              activities.map((activity) => (
                <a
                  key={activity.id}
                  href={activity.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-start gap-4 p-5 transition hover:bg-zinc-900/60"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-lg text-blue-400">
                    {activity.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-200">
                      {activity.title}
                    </p>

                    <p className="mt-1 break-words text-xs text-zinc-500">
                      {activity.detail}
                    </p>
                  </div>

                  <span className="shrink-0 text-xs text-zinc-500">
                    {activity.time}
                  </span>
                </a>
              ))
            )}
          </div>
        </section>

        
      </div>
    </AppShell>
  );
}