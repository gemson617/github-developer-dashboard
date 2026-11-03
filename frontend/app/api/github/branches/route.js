
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

    // Verify that the repository belongs to the signed-in user.
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

    if (
      repository.owner.login.toLowerCase() !== owner.toLowerCase()
    ) {
      return NextResponse.json(
        { error: "You can only view branches for repositories you own." },
        { status: 403 }
      );
    }

    const branchesResponse = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/branches?per_page=100`,
      {
        headers: {
          Authorization: `Bearer ${token.accessToken}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        cache: "no-store",
      }
    );

    if (!branchesResponse.ok) {
      return NextResponse.json(
        { error: "Unable to fetch repository branches." },
        { status: branchesResponse.status === 401 ? 401 : 502 }
      );
    }

    const data = await branchesResponse.json();

    const branches = data.map((branch) => ({
      name: branch.name,
      commitSha: branch.commit.sha,
      protected: branch.protected,
      url: `https://github.com/${repository.full_name}/tree/${encodeURIComponent(branch.name)}`,
    }));

    return NextResponse.json({
      repository: repository.full_name,
      total: branches.length,
      branches,
    });
  } catch (error) {
    console.error("GitHub branches API error:", error);

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
