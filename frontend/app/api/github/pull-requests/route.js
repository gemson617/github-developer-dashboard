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

    const response = await fetch(
      "https://api.github.com/search/issues?q=author:@me+type:pr&sort=updated&order=desc&per_page=20",
      {
        headers: {
          Authorization: `Bearer ${token.accessToken}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      console.error("GitHub pull requests error:", response.status);

      return NextResponse.json(
        { error: "Unable to fetch pull requests." },
        { status: response.status === 401 ? 401 : 502 }
      );
    }

    const data = await response.json();

    const pullRequests = data.items.map((pr) => ({
      id: pr.id,
      number: pr.number,
      title: pr.title,
      state: pr.state,
      url: pr.html_url,
      repository: pr.repository_url.split("/").slice(-2).join("/"),
      createdAt: pr.created_at,
      updatedAt: pr.updated_at,
      comments: pr.comments,
      author: pr.user.login,
      avatar: pr.user.avatar_url,
    }));

    return NextResponse.json({
      total: data.total_count,
      pullRequests,
    });
  } catch (error) {
    console.error("Pull requests API error:", error);

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}