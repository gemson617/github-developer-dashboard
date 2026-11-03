
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
      "https://api.github.com/search/issues?q=author:@me+type:issue&sort=updated&order=desc&per_page=20",
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
      console.error("GitHub issues error:", response.status);

      return NextResponse.json(
        { error: "Unable to fetch issues." },
        { status: response.status === 401 ? 401 : 502 }
      );
    }

    const data = await response.json();

    const issues = data.items.map((issue) => ({
      id: issue.id,
      number: issue.number,
      title: issue.title,
      state: issue.state,
      url: issue.html_url,
      repository: issue.repository_url.split("/").slice(-2).join("/"),
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,
      comments: issue.comments,
      author: issue.user.login,
      avatar: issue.user.avatar_url,
    }));

    return NextResponse.json({
      total: data.total_count,
      issues,
    });
  } catch (error) {
    console.error("Issues API error:", error);

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}