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

    const repositories = [];
    let page = 1;

    while (true) {
      const githubResponse = await fetch(
        `https://api.github.com/user/repos?type=public&sort=updated&per_page=100&page=${page}`,
        {
          headers: {
            Authorization: `Bearer ${token.accessToken}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
          cache: "no-store",
        }
      );

      if (!githubResponse.ok) {
        console.error(
          "GitHub repositories API error:",
          githubResponse.status
        );

        return NextResponse.json(
          { error: "Unable to fetch GitHub repositories." },
          {
            status: githubResponse.status === 401 ? 401 : 502,
          }
        );
      }

      const batch = await githubResponse.json();

      repositories.push(...batch.filter((repo) => !repo.private));

      if (batch.length < 100) {
        break;
      }

      page++;
    }

    return NextResponse.json(repositories);
  } catch (error) {
    console.error("Repository API error:", error);

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}