
"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "../../components/AppShell";

const PERIODS = {
  "30 days": 30,
  "90 days": 90,
  "12 months": 365,
};

const CONTRIBUTION_LEVELS = [
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

function formatDate(dateString) {
  return new Date(`${dateString}T12:00:00`).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );
}

function calculateStreaks(days) {
  let longestStreak = 0;
  let currentStreak = 0;
  let runningStreak = 0;

  for (const day of days) {
    if (day.contributionCount > 0) {
      runningStreak++;
      longestStreak = Math.max(longestStreak, runningStreak);
    } else {
      runningStreak = 0;
    }
  }

  const today = new Date();
  const todayKey = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const yesterdayKey = [
    yesterday.getFullYear(),
    String(yesterday.getMonth() + 1).padStart(2, "0"),
    String(yesterday.getDate()).padStart(2, "0"),
  ].join("-");

  const activeDates = new Set(
    days
      .filter((day) => day.contributionCount > 0)
      .map((day) => day.date)
  );

  let cursor = activeDates.has(todayKey)
    ? todayKey
    : activeDates.has(yesterdayKey)
      ? yesterdayKey
      : null;

  while (cursor && activeDates.has(cursor)) {
    currentStreak++;

    const previous = new Date(`${cursor}T12:00:00`);
    previous.setDate(previous.getDate() - 1);

    cursor = [
      previous.getFullYear(),
      String(previous.getMonth() + 1).padStart(2, "0"),
      String(previous.getDate()).padStart(2, "0"),
    ].join("-");
  }

  return { currentStreak, longestStreak };
}

function getMonthKey(dateString) {
  return dateString.slice(0, 7);
}

function getMonthLabels(weeks) {
  let previousMonth = "";

  return weeks.map((week, index) => {
    const firstDate = week.find((day) => day.date)?.date;

    if (!firstDate) {
      return { index, label: "" };
    }

    const monthKey = firstDate.slice(0, 7);
    const isNewMonth = monthKey !== previousMonth;

    previousMonth = monthKey;

    return {
      index,
      label: isNewMonth
        ? new Date(`${monthKey}-15T12:00:00`).toLocaleDateString(
            "en-US",
            { month: "short" }
          )
        : "",
    };
  });
}

export default function ContributionsPage() {
  const [period, setPeriod] = useState("12 months");
  const [contributionData, setContributionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadContributions() {
      try {
        setLoading(true);
        setError("");

        const days = PERIODS[period];

        const response = await fetch(
          `/api/github/contributions?period=${days}`,
          {
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Unable to load contributions."
          );
        }

        setContributionData(data);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Unable to load contributions.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadContributions();

    return () => controller.abort();
  }, [period]);

  const days = useMemo(() => {
    return (contributionData?.weeks ?? [])
      .flatMap((week) => week.contributionDays)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [contributionData]);

  const stats = useMemo(() => {
    const total = days.reduce(
      (sum, day) => sum + day.contributionCount,
      0
    );

    const activeDays = days.filter(
      (day) => day.contributionCount > 0
    ).length;

    const { currentStreak, longestStreak } =
      calculateStreaks(days);

    return {
      total,
      activeDays,
      currentStreak,
      longestStreak,
    };
  }, [days]);

  const monthlyData = useMemo(() => {
    const months = new Map();

    for (const day of days) {
      const key = getMonthKey(day.date);

      if (!months.has(key)) {
        months.set(key, {
          key,
          month: new Date(`${key}-15T12:00:00`).toLocaleDateString(
            "en-US",
            { month: "short", year: "numeric" }
          ),
          count: 0,
        });
      }

      months.get(key).count += day.contributionCount;
    }

    return [...months.values()].slice(-6);
  }, [days]);

  const additionalStats = useMemo(() => {
    const weekdayTotals = Array(7).fill(0);

    days.forEach((day) => {
      const weekday = new Date(`${day.date}T12:00:00`).getDay();
      weekdayTotals[weekday] += day.contributionCount;
    });

    const weekdays = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    const mostProductiveDay = Math.max(...weekdayTotals);
    const productiveDayIndex = weekdayTotals.indexOf(mostProductiveDay);

    const bestMonth = monthlyData.reduce(
      (best, month) =>
        month.count > (best?.count ?? 0) ? month : best,
      null
    );

    return {
      mostProductiveDay:
        mostProductiveDay > 0 ? weekdays[productiveDayIndex] : "—",
      dailyAverage: stats.activeDays
        ? (stats.total / stats.activeDays).toFixed(1)
        : "0.0",
      bestMonth: bestMonth?.count
        ? bestMonth.month
        : "—",
    };
  }, [days, monthlyData, stats]);

  const maxContributionCount = Math.max(
    0,
    ...days.map((day) => day.contributionCount)
  );

  const monthMaximum = Math.max(
    1,
    ...monthlyData.map((month) => month.count)
  );

  const firstWeekday = days.length
    ? new Date(`${days[0].date}T12:00:00`).getDay()
    : 0;

  const calendarCells = [
    ...Array.from({ length: firstWeekday }, (_, index) => ({
      id: `empty-${index}`,
      empty: true,
    })),
    ...days.map((day) => ({ ...day, empty: false })),
  ];

  const weeks = [];

  for (let index = 0; index < calendarCells.length; index += 7) {
    weeks.push(calendarCells.slice(index, index + 7));
  }

  const monthLabels = getMonthLabels(weeks);

  const repositoryActivity = contributionData?.repositoryActivity ?? [];

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-2 text-sm text-blue-400">
              Workspace / Contributions
            </p>

            <h1 className="text-2xl font-bold text-white sm:text-3xl">
              Contributions
            </h1>

            <p className="mt-2 text-sm text-zinc-400">
              Track your real GitHub coding activity and consistency.
            </p>
          </div>

          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500"
          >
            {Object.keys(PERIODS).map((label) => (
              <option key={label}>{label}</option>
            ))}
          </select>
        </section>

        {error && (
          <section className="dashboard-card p-5">
            <p className="text-sm text-red-400">{error}</p>
            <button
              type="button"
              onClick={() => setPeriod((value) => value)}
              className="mt-3 text-sm text-blue-400 hover:text-blue-300"
            >
              Retry
            </button>
          </section>
        )}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Total Contributions",
              value: stats.total.toLocaleString(),
              note: "Selected period",
              icon: "▦",
            },
            {
              label: "Current Streak",
              value: `${stats.currentStreak} days`,
              note: "Consecutive active days",
              icon: "⚡",
            },
            {
              label: "Longest Streak",
              value: `${stats.longestStreak} days`,
              note: "Within selected period",
              icon: "🏆",
            },
            {
              label: "Active Days",
              value: stats.activeDays.toLocaleString(),
              note: "Days with contributions",
              icon: "✓",
            },
            {
              label: "Most Productive Day",
              value: additionalStats.mostProductiveDay,
              note: "Highest contribution weekday",
              icon: "📅",
            },
            {
              label: "Daily Average",
              value: additionalStats.dailyAverage,
              note: "Contributions per active day",
              icon: "📊",
            },
            {
              label: "Best Month",
              value: additionalStats.bestMonth,
              note: "Highest contributions",
              icon: "🏅",
            },
          ].map((stat) => (
            <div key={stat.label} className="dashboard-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-zinc-400">{stat.label}</p>
                <span className="text-xl text-emerald-400">
                  {stat.icon}
                </span>
              </div>

              <p className="text-2xl font-bold text-white">
                {loading ? "—" : stat.value}
              </p>

              <p className="mt-2 text-xs text-zinc-500">
                {stat.note}
              </p>
            </div>
          ))}
        </section>

        <section className="dashboard-card w-fit max-w-full p-5 sm:p-6">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-white">
                Contribution Activity
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Each square represents one day.
              </p>
            </div>

            <span className="text-sm font-medium text-emerald-400">
              {loading
                ? "Loading..."
                : `${stats.total.toLocaleString()} contributions`}
            </span>
          </div>

          {loading ? (
            <p className="py-10 text-center text-sm text-zinc-400">
              Loading your contribution calendar...
            </p>
          ) : !error && days.length === 0 ? (
            <p className="py-10 text-center text-sm text-zinc-400">
              No contribution data available.
            </p>
          ) : !error ? (
            
              <div className="custom-scrollbar overflow-x-auto pb-3">
                <div className="w-fit">
                  {/* Month labels */}
                  <div className="mb-3 grid grid-cols-[32px_auto] gap-2">
                    <div />

                    <div className="flex gap-1">
                      {monthLabels.map((month) => (
                        <div
                          key={month.index}
                          className="w-3 shrink-0"
                        >
                          <span className="block w-max text-[10px] text-zinc-500">
                            {month.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Weekday labels and contribution squares */}
                  <div className="flex gap-2">
                    <div className="flex h-[108px] w-8 shrink-0 flex-col justify-between text-[10px] text-zinc-500">
                      <span>Sun</span>
                      <span>Tue</span>
                      <span>Thu</span>
                      <span>Sat</span>
                    </div>

                    <div className="flex gap-1">
                      {weeks.map((week, weekIndex) => (
                        <div
                          key={weekIndex}
                          className="flex w-3 shrink-0 flex-col gap-1"
                        >
                          {Array.from({ length: 7 }, (_, dayIndex) => {
                            const day = week[dayIndex];

                            if (!day || day.empty) {
                              return (
                                <div
                                  key={`empty-${weekIndex}-${dayIndex}`}
                                  className="h-3 w-3"
                                />
                              );
                            }

                            const level = getContributionLevel(
                              day.contributionCount,
                              maxContributionCount
                            );

                            return (
                              <div
                                key={day.date}
                                title={`${day.contributionCount} contributions on ${day.date}`}
                                className={`h-3 w-3 shrink-0 rounded-[3px] ${
                                  CONTRIBUTION_LEVELS[level]
                                }`}
                              />
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-zinc-500">
              {contributionData?.username
                ? `@${contributionData.username}`
                : "GitHub contributions"}
            </p>

            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span>Less</span>
              {CONTRIBUTION_LEVELS.map((level) => (
                <span
                  key={level}
                  className={`h-3 w-3 rounded-[3px] ${level}`}
                />
              ))}
              <span>More</span>
            </div>
          </div>
        </section>

        <section className="dashboard-card p-5 sm:p-6">
          <h2 className="text-base font-semibold text-white">
            Monthly Contributions
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Your contribution trend over recent months
          </p>

          <div className="mt-6 space-y-5">
            {loading ? (
              <p className="text-sm text-zinc-400">
                Loading monthly activity...
              </p>
            ) : (
              monthlyData.map((item) => (
                <div key={item.key}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-zinc-300">
                      {item.month}
                    </span>
                    <span className="text-zinc-400">
                      {item.count.toLocaleString()}
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{
                        width: `${(item.count / monthMaximum) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        
<section className="dashboard-card p-5 sm:p-6">
  <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
    <div>
      <h2 className="text-base font-semibold text-white">
        Repository Activity
      </h2>
      <p className="mt-1 text-sm text-zinc-500">
        Your contributions grouped by GitHub repository
      </p>
    </div>

    <span className="text-sm text-emerald-400">
      {loading
        ? "Loading..."
        : `${repositoryActivity.length} repositories`}
    </span>
  </div>

  {loading ? (
    <p className="py-8 text-center text-sm text-zinc-400">
      Loading repository activity...
    </p>
  ) : error ? (
    <p className="py-8 text-center text-sm text-zinc-400">
      Unable to load repository activity.
    </p>
  ) : repositoryActivity.length === 0 ? (
    <p className="py-8 text-center text-sm text-zinc-400">
      No repository activity found for this period.
    </p>
  ) : (
    <div className="space-y-4">
      {repositoryActivity.map((repo) => (
        <div
          key={repo.nameWithOwner}
          className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <a
                href={repo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-sm font-semibold text-blue-400 hover:text-blue-300"
              >
                {repo.nameWithOwner}
              </a>

              <p className="mt-1 text-xs text-zinc-500">
                {repo.isPrivate ? "Private repository" : "Public repository"}
              </p>
            </div>

            <div className="text-right">
              <p className="text-lg font-bold text-white">
                {repo.totalContributions.toLocaleString()}
              </p>
              <p className="text-xs text-zinc-500">
                Contributions
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Commits", value: repo.commits },
              { label: "Pull Requests", value: repo.pullRequests },
              { label: "Issues", value: repo.issues },
              { label: "Reviews", value: repo.reviews },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-lg bg-zinc-800/70 p-3"
              >
                <p className="text-lg font-semibold text-white">
                  {item.value.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )}
</section>

      </div>
    </AppShell>
  );
}
