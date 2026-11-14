"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "../../components/AppShell";
import { GitPullRequest } from "lucide-react";
// Language colors.
const languageColors = {
  JavaScript: "#eab308",
  TypeScript: "#3b82f6",
  PHP: "#818cf8",
  Python: "#22c55e",
  Java: "#f97316",
  HTML: "#ef4444",
  CSS: "#06b6d4",
  Go: "#14b8a6",
  Rust: "#f59e0b",
  Ruby: "#dc2626",
  Dart: "#38bdf8",
  "C++": "#a78bfa",
  C: "#64748b",
};

const fallbackColors = [
  "#a78bfa",
  "#f472b6",
  "#fb923c",
  "#2dd4bf",
  "#94a3b8",
];

// Reusable skeleton.
function Skeleton({ className = "" }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-zinc-800 ${className}`}
    />
  );
}

// Metric card.
function MetricCard({ label, value, change, icon }) {
  return (
    <article className="dashboard-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-zinc-400">{label}</p>
        <span className="text-xl text-blue-400">{icon}</span>
      </div>

      <p className="text-3xl font-bold text-white">{value}</p>

      <p className="mt-2 text-xs text-zinc-500">{change}</p>
    </article>
  );
}

// Metric skeleton.
function MetricSkeleton() {
  return (
    <article className="dashboard-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>

      <Skeleton className="h-9 w-24" />

      <Skeleton className="mt-3 h-3 w-36" />
    </article>
  );
}

// Monthly activity skeleton.
function ActivityChartSkeleton() {
  return (
    <div className="space-y-7">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index}>
          <div className="mb-3 flex items-center gap-3">
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-3 flex-1 rounded-full" />
            <Skeleton className="h-4 w-8" />
          </div>

          <div className="ml-[52px] flex gap-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Language distribution skeleton.
function LanguageSkeleton() {
  return (
    <div className="mt-6 space-y-5">
      <Skeleton className="h-3 w-full rounded-full" />

      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3">
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-10" />
        </div>
      ))}
    </div>
  );
}

// Repository skeleton.
function RepositorySkeleton() {
  return (
    <div className="flex items-center gap-4 p-5">
      <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />

      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-24" />
      </div>

      <Skeleton className="h-4 w-12" />
      <Skeleton className="h-4 w-12" />
    </div>
  );
}

// Highlight skeleton.
function HighlightSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
      <Skeleton className="h-3 w-32" />
      <Skeleton className="mt-3 h-6 w-40" />
      <Skeleton className="mt-3 h-3 w-48" />
    </div>
  );
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("6");

  const [repositories, setRepositories] = useState([]);
  const [contributionData, setContributionData] = useState(null);

  const [repositoriesLoading, setRepositoriesLoading] = useState(true);
  const [contributionsLoading, setContributionsLoading] = useState(true);

  const [repositoriesError, setRepositoriesError] = useState("");
  const [contributionsError, setContributionsError] = useState("");

  // Fetch public repositories.
  useEffect(() => {
    const controller = new AbortController();

    async function fetchRepositories() {
      try {
        setRepositoriesLoading(true);
        setRepositoriesError("");

        const response = await fetch("/api/github/repos", {
          cache: "no-store",
          signal: controller.signal,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Unable to load repositories."
          );
        }

        setRepositories(
          Array.isArray(data)
            ? data.filter((repo) => !repo.private)
            : []
        );
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Repository fetch error:", error);
          setRepositoriesError(error.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setRepositoriesLoading(false);
        }
      }
    }

    fetchRepositories();

    return () => controller.abort();
  }, []);

  // Fetch contributions whenever the selected period changes.
  useEffect(() => {
    const controller = new AbortController();

    async function fetchContributions() {
      try {
        setContributionsLoading(true);
        setContributionsError("");

        const response = await fetch(
          `/api/github/contributions?period=${period}`,
          {
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Unable to load contribution data."
          );
        }

        setContributionData(data);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Contribution fetch error:", error);
          setContributionsError(error.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setContributionsLoading(false);
        }
      }
    }

    fetchContributions();

    return () => controller.abort();
  }, [period]);

  // Calculate repository statistics.
  const totalRepositories = repositories.length;

  const totalStars = repositories.reduce(
    (total, repo) => total + (repo.stargazers_count || 0),
    0
  );

  const totalForks = repositories.reduce(
    (total, repo) => total + (repo.forks_count || 0),
    0
  );

  // Calculate language distribution by repository count.
  const languageStats = useMemo(() => {
    const languageCounts = {};

    repositories.forEach((repo) => {
      if (repo.language) {
        languageCounts[repo.language] =
          (languageCounts[repo.language] || 0) + 1;
      }
    });

    const totalLanguageRepositories = Object.values(
      languageCounts
    ).reduce((total, count) => total + count, 0);

    return Object.entries(languageCounts)
      .map(([name, count], index) => ({
        name,
        repositories: count,
        percentage:
          totalLanguageRepositories > 0
            ? Math.round(
                (count / totalLanguageRepositories) * 100
              )
            : 0,
        color:
          languageColors[name] ||
          fallbackColors[index % fallbackColors.length],
      }))
      .sort((a, b) => b.repositories - a.repositories);
  }, [repositories]);

  // Get top repositories by stars.
  const topRepositories = useMemo(() => {
    return [...repositories]
      .sort(
        (a, b) =>
          (b.stargazers_count || 0) -
          (a.stargazers_count || 0)
      )
      .slice(0, 5);
  }, [repositories]);

  const monthlyActivity = contributionData?.monthlyActivity || [];

  const maxContributions = Math.max(
    1,
    ...monthlyActivity.map((month) => month.contributions)
  );

  const mostUsedLanguage = languageStats[0];
  const topRepository = topRepositories[0];

  const formatNumber = (number) =>
    (number || 0).toLocaleString("en-US");

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-8">

        {/* Page heading */}
        <section className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-sm text-blue-400">
              Workspace / Analytics
            </p>

            <h1 className="text-2xl font-bold text-white sm:text-3xl">
              Developer Analytics
            </h1>

            <p className="mt-2 text-sm text-zinc-400">
              Understand your coding activity and repository performance.
            </p>
          </div>

          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500"
          >
            <option value="3">3 months</option>
            <option value="6">6 months</option>
          </select>
        </section>

        {/* Summary metrics */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {repositoriesLoading ? (
            <MetricSkeleton />
          ) : (
            <MetricCard
              label="Public Repositories"
              value={formatNumber(totalRepositories)}
              change="Across your GitHub account"
              icon="▤"
            />
          )}

          {repositoriesLoading ? (
            <MetricSkeleton />
          ) : (
            <MetricCard
              label="Total Stars"
              value={formatNumber(totalStars)}
              change="Across public repositories"
              icon="☆"
            />
          )}

          {contributionsLoading ? (
            <MetricSkeleton />
          ) : (
            <MetricCard
              label="Contributions"
              value={formatNumber(
                contributionData?.totalContributions
              )}
              change={`During the last ${period} months`}
              icon="▦"
            />
          )}

          {contributionsLoading ? (
            <MetricSkeleton />
          ) : (
            <MetricCard
              label="Commits"
              value={formatNumber(
                contributionData?.totalCommits
              )}
              change={`During the last ${period} months`}
              icon="↥"
            />
          )}
        </section>

        {/* API errors */}
        {(repositoriesError || contributionsError) && (
          <div className="space-y-2">
            {repositoriesError && (
              <p className="rounded-lg border border-red-900/50 bg-red-950/30 p-3 text-sm text-red-400">
                Repository data: {repositoriesError}
              </p>
            )}

            {contributionsError && (
              <p className="rounded-lg border border-red-900/50 bg-red-950/30 p-3 text-sm text-red-400">
                Contribution data: {contributionsError}
              </p>
            )}
          </div>
        )}

        {/* Monthly activity chart */}
        <section className="dashboard-card p-5 sm:p-6">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-white">
              Monthly Activity
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Contributions, commits and pull requests by month
            </p>
          </div>

          {contributionsLoading ? (
            <ActivityChartSkeleton />
          ) : contributionsError ? (
            <p className="py-10 text-center text-sm text-zinc-500">
              Unable to load monthly activity.
            </p>
          ) : monthlyActivity.length === 0 ? (
            <p className="py-10 text-center text-sm text-zinc-500">
              No contribution activity found for this period.
            </p>
          ) : (
            <div className="space-y-6">
              {monthlyActivity.map((month) => (
                <div key={month.key}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="w-10 text-zinc-400">
                      {month.month}
                    </span>

                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all duration-500"
                        style={{
                          width: `${
                            (month.contributions /
                              maxContributions) *
                            100
                          }%`,
                        }}
                      />
                    </div>

                    <span className="w-10 text-right text-zinc-300">
                      {formatNumber(month.contributions)}
                    </span>
                  </div>

                  <div className="ml-[52px] flex flex-wrap gap-4 text-xs text-zinc-500">
                    <span>
                      Commits: {formatNumber(month.commits)}
                    </span>

                    <span>
                      PRs: {formatNumber(month.pullRequests)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-4 border-t border-zinc-800 pt-4 text-xs text-zinc-400">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
              Contributions
            </span>

            <span>
              Commit and PR figures are shown separately per month.
            </span>
          </div>
        </section>

        {/* Language distribution and developer highlights */}
        <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">

          {/* Language distribution */}
          <div className="dashboard-card p-5 sm:p-6">
            <h2 className="text-base font-semibold text-white">
              Language Distribution
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Breakdown by primary language across public repositories
            </p>

            {repositoriesLoading ? (
              <LanguageSkeleton />
            ) : repositoriesError ? (
              <p className="py-10 text-center text-sm text-zinc-500">
                Unable to load language statistics.
              </p>
            ) : languageStats.length === 0 ? (
              <p className="py-10 text-center text-sm text-zinc-500">
                No language information available.
              </p>
            ) : (
              <>
                <div className="mt-6 flex h-3 overflow-hidden rounded-full bg-zinc-800">
                  {languageStats.map((language) => (
                    <div
                      key={language.name}
                      title={`${language.name}: ${language.percentage}%`}
                      style={{
                        width: `${language.percentage}%`,
                        backgroundColor: language.color,
                      }}
                    />
                  ))}
                </div>

                <div className="mt-6 space-y-4">
                  {languageStats.map((language) => (
                    <div
                      key={language.name}
                      className="flex items-center gap-3"
                    >
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{
                          backgroundColor: language.color,
                        }}
                      />

                      <span className="flex-1 text-sm text-zinc-300">
                        {language.name}
                      </span>

                      <span className="text-sm text-zinc-400">
                        {language.repositories} repos
                      </span>

                      <span className="w-12 text-right text-sm text-white">
                        {language.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Developer highlights */}
          <div className="dashboard-card p-5 sm:p-6">
            <h2 className="text-base font-semibold text-white">
              Developer Highlights
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              A quick summary of your developer profile
            </p>

            <div className="mt-6 space-y-4">

              {/* Most-used language */}
              {repositoriesLoading ? (
                <HighlightSkeleton />
              ) : (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                  <p className="text-xs text-zinc-500">
                    Most-used language
                  </p>

                  <p className="mt-2 text-lg font-semibold text-white">
                    {mostUsedLanguage?.name || "Not available"}
                  </p>

                  <p className="mt-1 text-sm text-zinc-400">
                    {mostUsedLanguage
                      ? `${mostUsedLanguage.percentage}% of your public repositories`
                      : "No language data available"}
                  </p>
                </div>
              )}

              {/* Top repository */}
              {repositoriesLoading ? (
                <HighlightSkeleton />
              ) : (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                  <p className="text-xs text-zinc-500">
                    Top repository by stars
                  </p>

                  <p className="mt-2 break-all text-lg font-semibold text-blue-400">
                    {topRepository?.name || "Not available"}
                  </p>

                  <p className="mt-1 text-sm text-zinc-400">
                    {topRepository
                      ? `☆ ${formatNumber(
                          topRepository.stargazers_count
                        )} stars · ${formatNumber(
                          topRepository.forks_count
                        )} forks`
                      : "No repositories available"}
                  </p>
                </div>
              )}

              {/* Pull requests */}
              {contributionsLoading ? (
                <HighlightSkeleton />
              ) : (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                  <p className="text-xs text-zinc-500">
                    Pull requests
                  </p>

                  <p className="mt-2 text-lg font-semibold text-white">
                    {formatNumber(
                      contributionData?.totalPullRequests
                    )}
                  </p>

                  <p className="mt-1 text-sm text-zinc-400">
                    During the last {period} months
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Top repositories */}
        <section>
          <div className="mb-5">
            <h2 className="text-base font-semibold text-white">
              Top Repositories
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Your public repositories ranked by stars
            </p>
          </div>

          <div className="dashboard-card divide-y divide-zinc-800">

            {repositoriesLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <RepositorySkeleton key={index} />
              ))
            ) : repositoriesError ? (
              <p className="p-6 text-center text-sm text-zinc-500">
                Unable to load repositories.
              </p>
            ) : topRepositories.length === 0 ? (
              <p className="p-6 text-center text-sm text-zinc-500">
                No public repositories found.
              </p>
            ) : (
              topRepositories.map((repo, index) => (
                <div
                  key={repo.id}
                  className="flex flex-wrap items-center gap-4 p-5"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-sm font-semibold text-zinc-300">
                    {index + 1}
                  </span>

                  <div className="min-w-0 flex-1">
                    <a
                      href={repo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-sm font-semibold text-blue-400 hover:text-blue-300"
                    >
                      {repo.name}
                    </a>

                    <p className="mt-1 text-xs text-zinc-500">
                      {repo.language || "No language specified"}
                    </p>
                  </div>

                  <span className="text-sm text-zinc-300">
                    ☆ {formatNumber(repo.stargazers_count)}
                  </span>

                  <span className="flex gap-1 text-sm text-zinc-500">
                    <GitPullRequest size={18} /> {formatNumber(repo.forks_count)}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}