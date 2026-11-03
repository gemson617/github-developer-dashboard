
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export const dynamic = "force-dynamic";

const query = `
  query Contributions($from: DateTime!, $to: DateTime!) {
    viewer {
      login

      contributionsCollection(from: $from, to: $to) {
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
            name
            nameWithOwner
            url
            isPrivate
          }
          contributions(first: 100) {
            totalCount
          }
        }

        pullRequestContributionsByRepository(maxRepositories: 100) {
          repository {
            name
            nameWithOwner
            url
            isPrivate
          }
          contributions(first: 100) {
            totalCount
          }
        }

        issueContributionsByRepository(maxRepositories: 100) {
          repository {
            name
            nameWithOwner
            url
            isPrivate
          }
          contributions(first: 100) {
            totalCount
          }
        }

        pullRequestReviewContributionsByRepository(maxRepositories: 100) {
          repository {
            name
            nameWithOwner
            url
            isPrivate
          }
          contributions(first: 100) {
            totalCount
          }
        }
      }
    }
  }
`;

export async function GET(request) {
  try {
    const token = await getToken({ req: request });

    if (!token?.accessToken) {
      return NextResponse.json(
        { error: "Please connect your GitHub account." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "365";

    if (!["30", "90", "365"].includes(period)) {
      return NextResponse.json(
        { error: "Invalid contribution period." },
        { status: 400 }
      );
    }

    const to = new Date();
    const from = new Date(to);

    from.setUTCDate(from.getUTCDate() - Number(period) + 1);
    from.setUTCHours(0, 0, 0, 0);

    const variables = {
      from: from.toISOString(),
      to: to.toISOString(),
    };

    const githubResponse = await fetch(
      "https://api.github.com/graphql",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token.accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/vnd.github+json",
        },
        body: JSON.stringify({ query, variables }),
        cache: "no-store",
      }
    );

    const result = await githubResponse.json();

    if (!githubResponse.ok || result.errors) {
      console.error("GitHub GraphQL error:", result.errors);

      return NextResponse.json(
        { error: "GitHub could not provide contribution data." },
        { status: 502 }
      );
    }

    const viewer = result.data.viewer;
    const collection = viewer.contributionsCollection;
    const calendar = collection.contributionCalendar;

    // Combine repository activity from all contribution types.
    const repositories = new Map();

    function addRepositoryContributions(items, type) {
      for (const item of items ?? []) {
        const repo = item.repository;
        const key = repo.nameWithOwner;

        if (!repositories.has(key)) {
          repositories.set(key, {
            name: repo.name,
            nameWithOwner: repo.nameWithOwner,
            url: repo.url,
            isPrivate: repo.isPrivate,
            commits: 0,
            pullRequests: 0,
            issues: 0,
            reviews: 0,
            totalContributions: 0,
          });
        }

        const repository = repositories.get(key);
        const count = item.contributions.totalCount;

        repository[type] += count;
        repository.totalContributions += count;
      }
    }

    addRepositoryContributions(
      collection.commitContributionsByRepository,
      "commits"
    );

    addRepositoryContributions(
      collection.pullRequestContributionsByRepository,
      "pullRequests"
    );

    addRepositoryContributions(
      collection.issueContributionsByRepository,
      "issues"
    );

    addRepositoryContributions(
      collection.pullRequestReviewContributionsByRepository,
      "reviews"
    );

    const repositoryActivity = Array.from(repositories.values())
      .sort(
        (a, b) =>
          b.totalContributions - a.totalContributions
      );

    return NextResponse.json({
      username: viewer.login,

      totalContributions: calendar.totalContributions,
      weeks: calendar.weeks,

      repositoryActivity,
    });
  } catch (error) {
    console.error("Contributions API error:", error);

    return NextResponse.json(
      { error: "Unable to load contributions." },
      { status: 500 }
    );
  }
}
