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

    const response = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Unable to fetch GitHub profile." },
        { status: response.status === 401 ? 401 : 502 }
      );
    }

    const profile = await response.json();

    return NextResponse.json({
      id: profile.id,
      username: profile.login,
      name: profile.name,
      avatar: profile.avatar_url,
      bio: profile.bio,
      email: profile.email,
      company: profile.company,
      location: profile.location,
      publicRepos: profile.public_repos,
      followers: profile.followers,
      following: profile.following,
      profileUrl: profile.html_url,
    });
  } catch (error) {
    console.error("GitHub profile API error:", error);

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}