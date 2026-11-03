
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

    const { searchParams } = new URL(request.url);
    const owner = searchParams.get("owner");
    const repo = searchParams.get("repo");

    if (!owner || !repo) {
      return NextResponse.json(
        { error: "Both owner and repo are required." },
        { status: 400 }
      );
    }

    // Validate that the repository belongs to the authenticated user.
    const repoResponse = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
      {
        headers: {
          Authorization: `Bearer ${token.accessToken}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        cache: "no-store",
      }
    );

    if (!repoResponse.ok) {
      return NextResponse.json(
        { error: "Repository not found or access denied." },
        { status: repoResponse.status === 401 ? 401 : 404 }
      );
    }

    const repository = await repoResponse.json();

    // Restrict this endpoint to repositories owned by the signed-in user.
    if (repository.owner.login.toLowerCase() !== owner.toLowerCase()) {
      return NextResponse.json(
        { error: "You can only view commits for repositories you own." },
        { status: 403 }
      );
    }

    const commitsResponse = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?per_page=20`,
      {
        headers: {
          Authorization: `Bearer ${token.accessToken}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        cache: "no-store",
      }
    );

    if (!commitsResponse.ok) {
      return NextResponse.json(
        { error: "Unable to fetch repository commits." },
        { status: commitsResponse.status === 401 ? 401 : 502 }
      );
    }

    const data = await commitsResponse.json();

    const commits = data.map((item) => ({
      sha: item.sha,
      message: item.commit.message,
      author: item.author?.login ?? item.commit.author?.name ?? "Unknown",
      avatar: item.author?.avatar_url ?? null,
      date: item.commit.author?.date ?? null,
      url: item.html_url,
    }));

    return NextResponse.json({
      repository: repository.full_name,
      commits,
    });
  } catch (error) {
    console.error("GitHub commits API error:", error);

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
