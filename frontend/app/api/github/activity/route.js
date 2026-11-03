
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

    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
        Accept: "application/vnd.github+json",
      },
      cache: "no-store",
    });

    if (!userResponse.ok) {
      return NextResponse.json(
        { error: "Unable to fetch GitHub user." },
        { status: userResponse.status === 401 ? 401 : 502 }
      );
    }

    const user = await userResponse.json();

    const activityResponse = await fetch(
      `https://api.github.com/users/${encodeURIComponent(user.login)}/events?per_page=30`,
      {
        headers: {
          Authorization: `Bearer ${token.accessToken}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        cache: "no-store",
      }
    );

    if (!activityResponse.ok) {
      return NextResponse.json(
        { error: "Unable to fetch recent activity." },
        { status: activityResponse.status === 401 ? 401 : 502 }
      );
    }

    const events = await activityResponse.json();

    const activity = events.map((event) => ({
      id: event.id,
      type: event.type,
      actor: event.actor?.login,
      repository: event.repo?.name,
      createdAt: event.created_at,
      details: getEventDetails(event),
      url: event.repo?.name
        ? `https://github.com/${event.repo.name}`
        : null,
    }));

    return NextResponse.json({ activity });
  } catch (error) {
    console.error("GitHub activity API error:", error);

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

function getEventDetails(event) {
  switch (event.type) {
    case "PushEvent":
      return `${event.payload?.commits?.length ?? 0} commit(s) pushed`;

    case "PullRequestEvent":
      return `${event.payload?.action ?? "updated"} a pull request`;

    case "IssuesEvent":
      return `${event.payload?.action ?? "updated"} an issue`;

    case "IssueCommentEvent":
      return "Commented on an issue";

    case "CreateEvent":
      return `Created ${event.payload?.ref_type ?? "an item"}`;

    case "WatchEvent":
      return "Starred a repository";

    case "ForkEvent":
      return "Forked a repository";

    default:
      return event.type?.replace("Event", "") ?? "Activity";
  }
}