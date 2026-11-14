
"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import AppShell from "../../../../components/AppShell";
import RepositoryDetailsSkeleton from "../../../../components/RepositoryDetailsSkeleton";
import { GitPullRequest } from "lucide-react";

function StatCard({ label, value, detail, icon }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5 transition hover:border-zinc-700">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-zinc-400">{label}</p>
        <span className="text-lg text-blue-400">{icon}</span>
      </div>

      <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
        {value}
      </p>

      <p className="mt-1 text-xs text-zinc-500">{detail}</p>
    </div>
  );
}

function InfoRow({ label, children }) {
  return (
    <div className="flex flex-col gap-1 border-b border-zinc-800/80 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <span className="text-sm text-zinc-400">{label}</span>
      <span className="break-all text-sm font-medium text-zinc-200 sm:text-right">
        {children}
      </span>
    </div>
  );
}

export default function RepositoryDetailsPage() {
  const params = useParams();
  const owner = params?.owner;
  const repo = params?.repo;

  const [repository, setRepository] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchRepository = useCallback(async () => {
    if (!owner || !repo) return;

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/github/repository?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`,
        { cache: "no-store" }
      );

      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? "Connect your GitHub account to view this repository."
            : response.status === 404
              ? "Repository not found or you don't have access to it."
              : "Unable to load repository details. Please try again."
        );
      }

      setRepository(await response.json());
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [owner, repo]);

  useEffect(() => {
    fetchRepository();
  }, [fetchRepository]);

  const number = (value) => Number(value || 0).toLocaleString();

  return (
    <AppShell>
      <main className="min-w-0 space-y-6 p-5 sm:p-7 lg:p-8">
        {loading ? (
          <RepositoryDetailsSkeleton />
        ) : error ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-xl text-red-400">
              !
            </div>

            <h2 className="mt-4 text-lg font-semibold text-white">
              Couldn't load repository
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-zinc-400">
              {error}
            </p>

            <button
              type="button"
              onClick={fetchRepository}
              className="mt-5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500"
            >
              Try again
            </button>
          </div>
        ) : repository ? (
          <>
            {/* Breadcrumb */}
            <Link
              href="/dashboard/repositories"
              className="inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
            >
              <span aria-hidden="true">←</span>
              Back to repositories
            </Link>

            {/* Repository header */}
            <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-xl text-blue-300">
                    ◈
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm text-zinc-500">
                      {repository.owner?.login || owner}
                    </p>

                    <h1 className="break-words text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                      {repository.name}
                    </h1>
                  </div>
                </div>

                <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-400 sm:text-base">
                  {repository.description || "No repository description provided."}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs text-zinc-300">
                    {repository.private ? "Private" : "Public"}
                  </span>

                  {repository.language && (
                    <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs text-blue-300">
                      {repository.language}
                    </span>
                  )}

                  {repository.archived && (
                    <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs text-amber-300">
                      Archived
                    </span>
                  )}
                </div>
              </div>

              <a
                href={repository.html_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-blue-500/50 hover:bg-zinc-800"
              >
                Open on GitHub <span aria-hidden="true">↗</span>
              </a>
            </section>

            {/* Stats */}
            <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
              <StatCard
                label="Stars"
                value={number(repository.stargazers_count)}
                detail="People who starred this repo"
                icon="☆"
              />

              <StatCard
                label="Forks"
                value={number(repository.forks_count)}
                detail="Repository copies"
                icon={<GitPullRequest size={18} />}
              />

              <StatCard
                label="Open issues"
                value={number(repository.open_issues_count)}
                detail="Reported issues and PRs"
                icon="◎"
              />

              <StatCard
                label="Watchers"
                value={number(repository.subscribers_count)}
                detail="Repository subscribers"
                icon="◉"
              />
            </section>

            {/* Content */}
            <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <div className="min-w-0 rounded-xl border border-zinc-800 bg-zinc-900/70 p-5 sm:p-6 xl:col-span-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-white">
                      Repository overview
                    </h2>

                    <p className="mt-1 text-sm text-zinc-500">
                      Project information and links
                    </p>
                  </div>

                  <span className="text-xl text-zinc-500">▤</span>
                </div>

                <div className="mt-5">
                  <InfoRow label="Full name">
                    {repository.full_name}
                  </InfoRow>

                  <InfoRow label="Default branch">
                    {repository.default_branch || "Not available"}
                  </InfoRow>

                  <InfoRow label="License">
                    {repository.license?.spdx_id || "Not specified"}
                  </InfoRow>

                  <InfoRow label="Topics">
                    {repository.topics?.length
                      ? repository.topics.join(", ")
                      : "No topics added"}
                  </InfoRow>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  {repository.homepage && (
                    <a
                      href={repository.homepage}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 transition hover:border-blue-500/50 hover:bg-zinc-800"
                    >
                      Project website ↗
                    </a>
                  )}

                  <a
                    href={`${repository.html_url}/issues`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 transition hover:border-blue-500/50 hover:bg-zinc-800"
                  >
                    View issues ↗
                  </a>

                  <a
                    href={`${repository.html_url}/commits/${encodeURIComponent(repository.default_branch || "main")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 transition hover:border-blue-500/50 hover:bg-zinc-800"
                  >
                    View commits ↗
                  </a>
                </div>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5 sm:p-6">
                <h2 className="font-semibold text-white">
                  Repository details
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Visibility and timestamps
                </p>

                <div className="mt-5">
                  <InfoRow label="Visibility">
                    {repository.private ? "Private" : "Public"}
                  </InfoRow>

                  <InfoRow label="Created">
                    {new Date(repository.created_at).toLocaleDateString()}
                  </InfoRow>

                  <InfoRow label="Last updated">
                    {new Date(repository.updated_at).toLocaleDateString()}
                  </InfoRow>

                  <InfoRow label="Last pushed">
                    {repository.pushed_at
                      ? new Date(repository.pushed_at).toLocaleDateString()
                      : "Not available"}
                  </InfoRow>

                  <InfoRow label="Size">
                    {number(repository.size)} KB
                  </InfoRow>
                </div>
              </div>
            </section>
          </>
        ) : null}
      </main>
    </AppShell>
  );
}
