
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    // 1. Read the authenticated user's NextAuth JWT.
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // 2. Reject unauthenticated requests.
    if (!token) {
      return NextResponse.json(
        { error: "Please connect your GitHub account." },
        { status: 401 }
      );
    }

    // 3. Retrieve the GitHub access token securely.
    const accessToken = token.accessToken;

    if (!accessToken) {
      return NextResponse.json(
        { error: "GitHub access token not found. Please sign in again." },
        { status: 401 }
      );
    }

    // 4. Request repositories from GitHub.
    const githubResponse = await fetch(
      "https://api.github.com/user/repos?sort=updated&per_page=100",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        cache: "no-store",
      }
    );

    // 5. Handle GitHub API errors.
    if (!githubResponse.ok) {
      console.error(
        "GitHub API error:",
        githubResponse.status
      );

      return NextResponse.json(
        { error: "Unable to fetch GitHub repositories." },
        { status: githubResponse.status === 401 ? 401 : 502 }
      );
    }

    // 6. Return repository data to our frontend.
    const repositories = await githubResponse.json();

    return NextResponse.json(repositories);
  } catch (error) {
    console.error("Repository API error:", error);

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
