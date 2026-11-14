"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AppShell from "../../components/AppShell";
import RepositorySkeleton from "../../components/RepositorySkeleton";
import Link from "next/link";

const PAGE_SIZE = 5;

function LazyRepositoryCard({ repo }) {
  const cardRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = cardRef.current;
    if (!element) return;

    if (typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "150px" }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const ownerLogin = repo.owner?.login || repo.owner || "";

  return (
    <div ref={cardRef} className="min-h-[130px]">
      {isVisible ? (
        <article className="dashboard-card p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <Link
                href={`/dashboard/repositories/${ownerLogin}/${repo.name}`}
                className="font-medium text-white transition hover:text-blue-400"
              >
                {repo.name}
              </Link>

              <p className="mt-2 text-sm text-zinc-400">
                {repo.description || "No description provided"}
              </p>
            </div>

            <span className="rounded-full border border-zinc-700 px-2.5 py-1 text-xs text-zinc-400">
              {repo.private ? "Private" : "Public"}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-zinc-500">
            <span>{repo.language || "Not specified"}</span>
            <span>⭐ {repo.stargazers_count ?? 0}</span>
            <span>Forks: {repo.forks_count ?? 0}</span>
            <span>
              Updated{" "}
              {repo.updated_at
                ? new Date(repo.updated_at).toLocaleDateString()
                : "Recently"}
            </span>
          </div>
        </article>
      ) : (
        <div className="dashboard-card min-h-[130px] animate-pulse p-4">
          <div className="h-4 w-1/3 rounded bg-zinc-800" />
          <div className="mt-4 h-3 w-2/3 rounded bg-zinc-800" />
          <div className="mt-5 h-3 w-1/2 rounded bg-zinc-800" />
        </div>
      )}
    </div>
  );
}

export default function RepositoriesPage() {
  const [search, setSearch] = useState("");
  const [visibility, setVisibility] = useState("All");
  const [language, setLanguage] = useState("All languages");
  const [sort, setSort] = useState("updated");
  const [page, setPage] = useState(1);

  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchRepositories = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/github/repos", {
        cache: "no-store",
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            "Please connect your GitHub account to view repositories."
          );
        }

        throw new Error(
          "Failed to fetch GitHub repositories. Please try again."
        );
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Unexpected repository data received.");
      }

      setRepositories(data);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepositories();
  }, []);

  const languages = useMemo(() => {
    const uniqueLanguages = [
      ...new Set(
        repositories
          .map((repo) => repo.language)
          .filter(Boolean)
      ),
    ].sort();

    return ["All languages", ...uniqueLanguages];
  }, [repositories]);

  const filteredRepositories = useMemo(() => {
    const query = search.trim().toLowerCase();

    return repositories
      .filter((repo) => {
        const matchesSearch =
          repo.name.toLowerCase().includes(query) ||
          (repo.description || "").toLowerCase().includes(query);

        const matchesVisibility =
          visibility === "All" ||
          (visibility === "Private"
            ? repo.private
            : !repo.private);

        const matchesLanguage =
          language === "All languages" ||
          repo.language === language;

        return (
          matchesSearch &&
          matchesVisibility &&
          matchesLanguage
        );
      })
      .sort((a, b) => {
        if (sort === "stars") {
          return (b.stargazers_count || 0) - (a.stargazers_count || 0);
        }

        if (sort === "name") {
          return a.name.localeCompare(b.name);
        }

        if (sort === "created") {
          return (
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
          );
        }

        return (
          new Date(b.updated_at).getTime() -
          new Date(a.updated_at).getTime()
        );
      });
  }, [repositories, search, visibility, language, sort]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRepositories.length / PAGE_SIZE)
  );

  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;

  const visibleRepositories = filteredRepositories.slice(
    startIndex,
    startIndex + PAGE_SIZE
  );

  function changeFilter(setter, value) {
    setter(value);
    setPage(1);
  }

  const totalStars = repositories.reduce(
    (sum, repo) => sum + (repo.stargazers_count || 0),
    0
  );

  const totalForks = repositories.reduce(
    (sum, repo) => sum + (repo.forks_count || 0),
    0
  );

  const publicCount = repositories.filter(
    (repo) => !repo.private
  ).length;

  const privateCount = repositories.filter(
    (repo) => repo.private
  ).length;

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-7">
        <section>
          <p className="mb-2 text-sm text-blue-400">
            Workspace / Repositories
          </p>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white sm:text-3xl">
                Repositories
              </h1>
              <p className="mt-2 text-sm text-zinc-400">
                Explore and manage your GitHub projects in one place.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300">
                {loading
                  ? "Loading..."
                  : `${filteredRepositories.length} repositories`}
              </span>

              <button
                type="button"
                onClick={fetchRepositories}
                disabled={loading}
                className="flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className={loading ? "animate-spin" : ""}>↻</span>
                {loading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {[
            {
              label: "Total Repositories",
              value: repositories.length,
              icon: "▤",
            },
            {
              label: "Total Stars",
              value: totalStars.toLocaleString(),
              icon: "☆",
            },
            {
              label: "Total Forks",
              value: totalForks.toLocaleString(),
              icon: "⑂",
            },
            {
              label: "Public / Private",
              value: `${publicCount} / ${privateCount}`,
              icon: "◉",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-5"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-400">{stat.label}</p>
                <span className="text-xl text-zinc-500">{stat.icon}</span>
              </div>

              <p className="mt-3 text-2xl font-semibold text-white">
                {loading ? "—" : stat.value}
              </p>
            </div>
          ))}
        </section>

        <section className="dashboard-card space-y-4 p-4 sm:p-5">
          <input
            type="search"
            value={search}
            onChange={(event) =>
              changeFilter(setSearch, event.target.value)
            }
            placeholder="Search repositories..."
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-blue-500"
          />

          <div className="flex flex-wrap gap-3">
            <select
              value={visibility}
              onChange={(event) =>
                changeFilter(setVisibility, event.target.value)
              }
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-300 outline-none"
            >
              <option value="All">All visibility</option>
              <option value="Public">Public</option>
              <option value="Private">Private</option>
            </select>

            <select
              value={language}
              onChange={(event) =>
                changeFilter(setLanguage, event.target.value)
              }
              className="max-w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-300 outline-none"
            >
              {languages.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              value={sort}
              onChange={(event) =>
                changeFilter(setSort, event.target.value)
              }
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-300 outline-none"
            >
              <option value="updated">Recently updated</option>
              <option value="stars">Most stars</option>
              <option value="name">Repository name</option>
              <option value="created">Recently created</option>
            </select>
          </div>
        </section>

        {loading && (
          <section
            className="space-y-3"
            aria-label="Loading repositories"
            aria-busy="true"
          >
            {Array.from({ length: 5 }).map((_, index) => (
              <RepositorySkeleton key={index} />
            ))}
          </section>
        )}

        {error && (
          <div className="dashboard-card flex flex-wrap items-center justify-between gap-4 p-5">
            <p className="text-sm text-red-400">{error}</p>

            <button
              type="button"
              onClick={fetchRepositories}
              disabled={loading}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-white transition hover:bg-zinc-800 disabled:opacity-50"
            >
              {loading ? "Retrying..." : "Try again"}
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            <section className="space-y-3">
              {visibleRepositories.map((repo) => (
                <LazyRepositoryCard key={repo.id} repo={repo} />
              ))}

              {visibleRepositories.length === 0 && (
                <div className="dashboard-card p-8 text-center">
                  <p className="font-medium text-white">
                    No repositories found
                  </p>
                  <p className="mt-2 text-sm text-zinc-400">
                    Try changing your search or filters.
                  </p>
                </div>
              )}
            </section>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-zinc-500">
                {filteredRepositories.length === 0
                  ? "No results"
                  : `Showing ${startIndex + 1}–${Math.min(
                      startIndex + PAGE_SIZE,
                      filteredRepositories.length
                    )} of ${filteredRepositories.length}`}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() =>
                    setPage((p) => Math.max(1, p - 1))
                  }
                  className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                <span className="px-2 text-sm text-zinc-400">
                  {currentPage} / {totalPages}
                </span>

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setPage((p) => Math.min(totalPages, p + 1))
                  }
                  className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
