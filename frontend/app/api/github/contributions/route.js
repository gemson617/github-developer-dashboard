
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const GITHUB_API = "https://api.github.com/graphql";

function getDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function getMonthKey(date) {
  return `${date.getUTCFullYear()}-${String(
    date.getUTCMonth() + 1
  ).padStart(2, "0")}`;
}

function getMonthName(date) {
  return date.toLocaleString("en-US", {
    month: "short",
    timeZone: "UTC",
  });
}

function getMonthsInRange(from, to) {
  const months = [];

  const cursor = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 1)
  );

  while (cursor <= to) {
    const monthStart = new Date(cursor);

    const nextMonth = new Date(
      Date.UTC(
        cursor.getUTCFullYear(),
        cursor.getUTCMonth() + 1,
        1
      )
    );

    const monthEnd = new Date(nextMonth.getTime() - 1);

    const rangeStart = new Date(
      Math.max(monthStart.getTime(), from.getTime())
    );

    const rangeEnd = new Date(
      Math.min(monthEnd.getTime(), to.getTime())
    );

    months.push({
      key: getMonthKey(monthStart),
      name: getMonthName(monthStart),
      from: rangeStart.toISOString(),
      to: rangeEnd.toISOString(),
    });

    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  return months;
}

function addRepositoryContributions(
  repositories,
  contributions,
  type
) {
  for (const item of contributions ?? []) {
    const repositoryName =
      item.repository?.nameWithOwner ||
      item.repository?.name ||
      "Unknown repository";

    if (!repositories.has(repositoryName)) {
      repositories.set(repositoryName, {
        name: repositoryName,
        repository: repositoryName,
        nameWithOwner: repositoryName,
        url:
          item.repository?.url ||
          `https://github.com/${repositoryName}`,
        isPrivate: Boolean(item.repository?.isPrivate),
        commits: 0,
        pullRequests: 0,
        issues: 0,
        reviews: 0,
        totalContributions: 0,
      });
    }

    const repository = repositories.get(repositoryName);
    const count = item.contributions?.totalCount ?? 0;

    repository[type] += count;
    repository.totalContributions += count;
  }
}

export async function GET(request) {
  try {
    // 1. Authenticate the user.
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.accessToken) {
      return NextResponse.json(
        { error: "Please connect your GitHub account." },
        { status: 401 }
      );
    }

    // 2. Read the selected period.
    // Supported values: 30, 90 and 365 days.
    // No period means the full year (Overview).
    const { searchParams } = new URL(request.url);

    const requestedPeriod = Number(
      searchParams.get("period")
    );

    const period = [30, 90, 365].includes(requestedPeriod)
      ? requestedPeriod
      : 365;

    // 3. Calculate the date range.
    const now = new Date();

    const to = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        23,
        59,
        59
      )
    );

    const from = new Date(to);
    from.setUTCDate(from.getUTCDate() - (period - 1));
    from.setUTCHours(0, 0, 0, 0);

    // 4. Build monthly date ranges.
    const months = getMonthsInRange(from, to);

    const monthVariables = {};
    const variableDefinitions = [
      "$from: DateTime!",
      "$to: DateTime!",
    ];

    months.forEach((month, index) => {
      variableDefinitions.push(
        `$month${index}From: DateTime!`,
        `$month${index}To: DateTime!`
      );

      monthVariables[`month${index}From`] = month.from;
      monthVariables[`month${index}To`] = month.to;
    });

    // 5. Create monthly GraphQL fields.
    const monthlyFields = months
      .map(
        (_, index) => `
          month${index}: contributionsCollection(
            from: $month${index}From,
            to: $month${index}To
          ) {
            totalCommitContributions
            totalPullRequestContributions
          }
        `
      )
      .join("\n");

    // 6. Query GitHub contribution data.
    const query = `
      query Contributions(${variableDefinitions.join(", ")}) {
        viewer {
          login

          selected: contributionsCollection(
            from: $from,
            to: $to
          ) {
            totalCommitContributions
            totalPullRequestContributions
            totalIssueContributions
            totalPullRequestReviewContributions

            contributionCalendar {
              totalContributions

              weeks {
                contributionDays {
                  date
                  contributionCount
                  weekday
                }
              }
            }

            commitContributionsByRepository(maxRepositories: 100) {
              repository {
                nameWithOwner
              }
              contributions {
                totalCount
              }
            }

            pullRequestContributionsByRepository(maxRepositories: 100) {
              repository {
                nameWithOwner
              }
              contributions {
                totalCount
              }
            }

            issueContributionsByRepository(maxRepositories: 100) {
              repository {
                nameWithOwner
              }
              contributions {
                totalCount
              }
            }

            pullRequestReviewContributionsByRepository(maxRepositories: 100) {
              repository {
                nameWithOwner
              }
              contributions {
                totalCount
              }
            }
          }

          ${monthlyFields}
        }
      }
    `;

    // 7. Call GitHub GraphQL API.
    const githubResponse = await fetch(GITHUB_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        query,
        variables: {
          from: from.toISOString(),
          to: to.toISOString(),
          ...monthVariables,
        },
      }),
      cache: "no-store",
    });

    const result = await githubResponse.json();

    // 8. Handle GitHub API errors.
    if (!githubResponse.ok || result.errors?.length) {
      console.error(
        "GitHub contributions API error:",
        result.errors || result
      );

      return NextResponse.json(
        {
          error:
            result.errors?.[0]?.message ||
            "Unable to fetch GitHub contributions.",
        },
        {
          status:
            githubResponse.status === 401 ? 401 : 502,
        }
      );
    }

    const viewer = result.data?.viewer;
    const selected = viewer?.selected;

    if (!selected?.contributionCalendar) {
      return NextResponse.json(
        {
          error: "GitHub contribution data is unavailable.",
        },
        { status: 502 }
      );
    }

    const calendar = selected.contributionCalendar;

    // 9. Preserve the original weeks structure.
    const weeks = calendar.weeks ?? [];

    // Also provide daily contributions for Analytics.
    const dailyContributions = weeks.flatMap((week) =>
      (week.contributionDays ?? []).map((day) => ({
        date: day.date,
        contributionCount: day.contributionCount,
        weekday: day.weekday,
      }))
    );

    // 10. Build monthly activity.
    const monthlyActivity = months.map((month, index) => {
      const monthlyData = viewer[`month${index}`];

      const contributions = dailyContributions
        .filter((day) => day.date.startsWith(month.key))
        .reduce(
          (total, day) => total + day.contributionCount,
          0
        );

      return {
        month: month.name,
        key: month.key,
        contributions,
        commits:
          monthlyData?.totalCommitContributions ?? 0,
        pullRequests:
          monthlyData?.totalPullRequestContributions ?? 0,
      };
    });

    // 11. Build repository activity.
    const repositories = new Map();

    addRepositoryContributions(
      repositories,
      selected.commitContributionsByRepository,
      "commits"
    );

    addRepositoryContributions(
      repositories,
      selected.pullRequestContributionsByRepository,
      "pullRequests"
    );

    addRepositoryContributions(
      repositories,
      selected.issueContributionsByRepository,
      "issues"
    );

    addRepositoryContributions(
      repositories,
      selected.pullRequestReviewContributionsByRepository,
      "reviews"
    );

    const repositoryActivity = Array.from(
      repositories.values()
    ).sort(
      (a, b) =>
        b.totalContributions - a.totalContributions
    );

    // 12. Return a backward-compatible response.
    return NextResponse.json({
      username: viewer.login,

      period,

      // Existing Contributions and Overview pages.
      totalContributions: calendar.totalContributions,
      weeks,
      repositoryActivity,

      // Analytics page.
      dailyContributions,
      monthlyActivity,

      totalCommits: selected.totalCommitContributions,
      totalPullRequests:
        selected.totalPullRequestContributions,
      totalIssues: selected.totalIssueContributions,
      totalReviews:
        selected.totalPullRequestReviewContributions,
    });
  } catch (error) {
    console.error("Contributions API error:", error);

    return NextResponse.json(
      {
        error:
          error.message ||
          "Unable to load contribution activity.",
      },
      { status: 500 }
    );
  }
}
