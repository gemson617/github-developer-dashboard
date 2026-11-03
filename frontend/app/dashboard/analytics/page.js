
"use client";

import { useState } from "react";
import AppShell from "../../components/AppShell";

const monthlyActivity = [
  { month: "May", contributions: 96, commits: 62, pullRequests: 18 },
  { month: "Jun", contributions: 128, commits: 84, pullRequests: 24 },
  { month: "Jul", contributions: 105, commits: 69, pullRequests: 20 },
  { month: "Aug", contributions: 164, commits: 110, pullRequests: 31 },
  { month: "Sep", contributions: 142, commits: 93, pullRequests: 27 },
  { month: "Oct", contributions: 86, commits: 57, pullRequests: 16 },
  { month: "Nov", contributions: 186, commits: 157, pullRequests: 146 }
];

const languages = [
  { name: "JavaScript", percentage: 38, color: "#eab308", repositories: 8 },
  { name: "PHP", percentage: 27, color: "#818cf8", repositories: 6 },
  { name: "TypeScript", percentage: 20, color: "#3b82f6", repositories: 4 },
  { name: "Python", percentage: 10, color: "#22c55e", repositories: 3 },
  { name: "Other", percentage: 5, color: "#a1a1aa", repositories: 3 },
];

const topRepositories = [
  { name: "developer-dashboard", language: "JavaScript", stars: 128, forks: 24 },
  { name: "api-starter-kit", language: "TypeScript", stars: 86, forks: 17 },
  { name: "laravel-inventory", language: "PHP", stars: 64, forks: 12 },
  { name: "awesome-dev-tools", language: "Python", stars: 42, forks: 9 },
];

function MetricCard({ label, value, change, icon }) {
  return (
    <article className="dashboard-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-zinc-400">{label}</p>
        <span className="text-xl text-blue-400">{icon}</span>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
      <p className="mt-2 text-xs text-emerald-400">{change}</p>
    </article>
  );
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("6 months");
console.log("Selected period:", period);
  const visibleMonths =
    period === "3 months" ? monthlyActivity.slice(-3) : monthlyActivity.slice(-6);

  const totalContributions = visibleMonths.reduce(
    (total, month) => total + month.contributions,
    0
  );

  const totalCommits = visibleMonths.reduce(
    (total, month) => total + month.commits,
    0
  );

  const maxContributions = Math.max(
    ...visibleMonths.map((month) => month.contributions)
  );

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
            <option>3 months</option>
            <option>6 months</option>
          </select>
        </section>

<p className="text-sm text-yellow-400">
  Debug: Selected period is {period}
</p>

        {/* Summary metrics */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Repositories"
            value="30"
            change="Across your workspace"
            icon="▤"
          />
          <MetricCard
            label="Total Stars"
            value="386"
            change="Across all repositories"
            icon="☆"
          />
          <MetricCard
            label="Contributions"
            value={totalContributions.toLocaleString()}
            change={`During the last ${period}`}
            icon="▦"
          />
          <MetricCard
            label="Commits"
            value={totalCommits.toLocaleString()}
            change="During the selected period"
            icon="↥"
          />
        </section>

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

          <div className="space-y-6">
            {visibleMonths.map((month) => (
              <div key={month.month}>
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <span className="w-10 text-zinc-400">{month.month}</span>
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all"
                      style={{
                        width: `${(month.contributions / maxContributions) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="w-8 text-right text-zinc-300">
                    {month.contributions}
                  </span>
                </div>

                <div className="ml-[52px] flex gap-4 text-xs text-zinc-500">
                  <span>Commits: {month.commits}</span>
                  <span>PRs: {month.pullRequests}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-4 border-t border-zinc-800 pt-4 text-xs text-zinc-400">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
              Contributions
            </span>
            <span>Commit and PR figures are shown separately per month.</span>
          </div>
        </section>

        {/* Language distribution */}
        <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <div className="dashboard-card p-5 sm:p-6">
            <h2 className="text-base font-semibold text-white">
              Language Distribution
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Estimated breakdown across your repositories
            </p>

            <div className="mt-6 flex h-3 overflow-hidden rounded-full bg-zinc-800">
              {languages.map((language) => (
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
              {languages.map((language) => (
                <div
                  key={language.name}
                  className="flex items-center gap-3"
                >
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: language.color }}
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
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                <p className="text-xs text-zinc-500">Most-used language</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  JavaScript
                </p>
                <p className="mt-1 text-sm text-zinc-400">
                  38% of the sample language breakdown
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                <p className="text-xs text-zinc-500">Top repository by stars</p>
                <p className="mt-2 break-all text-lg font-semibold text-blue-400">
                  developer-dashboard
                </p>
                <p className="mt-1 text-sm text-zinc-400">
                  ☆ 128 stars · 24 forks
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                <p className="text-xs text-zinc-500">Current activity streak</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  12 days ⚡
                </p>
                <p className="mt-1 text-sm text-zinc-400">
                  Sample data — not yet synced with GitHub.
                </p>
              </div>
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
              Repositories ranked by stars
            </p>
          </div>

          <div className="dashboard-card divide-y divide-zinc-800">
            {[...topRepositories]
              .sort((a, b) => b.stars - a.stars)
              .map((repo, index) => (
                <div
                  key={repo.name}
                  className="flex flex-wrap items-center gap-4 p-5"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-sm font-semibold text-zinc-300">
                    {index + 1}
                  </span>

                  <div className="min-w-0 flex-1">
                    <h3 className="break-all text-sm font-semibold text-blue-400">
                      {repo.name}
                    </h3>
                    <p className="mt-1 text-xs text-zinc-500">
                      {repo.language}
                    </p>
                  </div>

                  <span className="text-sm text-zinc-300">
                    ☆ {repo.stars}
                  </span>
                  <span className="text-sm text-zinc-500">
                    ⑂ {repo.forks}
                  </span>
                </div>
              ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}