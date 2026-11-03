
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
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

    // Fetch repositories belonging to the authenticated user.
    const reposResponse = await fetch(
      "https://api.github.com/user/repos?sort=updated&per_page=100",
      {
        headers: {
          Authorization: `Bearer ${token.accessToken}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        cache: "no-store",
      }
    );

    if (!reposResponse.ok) {
      return NextResponse.json(
        { error: "Unable to fetch repositories." },
        { status: reposResponse.status === 401 ? 401 : 502 }
      );
    }

    const repos = await reposResponse.json();

    // Fetch the language breakdown for each repository.
    const languageResults = await Promise.all(
      repos.map(async (repo) => {
        const response = await fetch(repo.languages_url, {
          headers: {
            Authorization: `Bearer ${token.accessToken}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(
            `Unable to fetch languages for ${repo.full_name}`
          );
        }

        return response.json();
      })
    );

    // Aggregate bytes of code by programming language.
    const totals = {};

    for (const languages of languageResults) {
      for (const [language, bytes] of Object.entries(languages)) {
        totals[language] = (totals[language] || 0) + bytes;
      }
    }

    const totalBytes = Object.values(totals).reduce(
      (sum, bytes) => sum + bytes,
      0
    );

    const languages = Object.entries(totals)
      .map(([name, bytes]) => ({
        name,
        bytes,
        percentage: totalBytes
          ? Number(((bytes / totalBytes) * 100).toFixed(2))
          : 0,
      }))
      .sort((a, b) => b.bytes - a.bytes);

    return NextResponse.json({
      repositoryCount: repos.length,
      totalBytes,
      languages,
    });
  } catch (error) {
    console.error("GitHub languages API error:", error);

    return NextResponse.json(
      { error: "Unable to calculate language statistics." },
      { status: 502 }
    );
  }
}
