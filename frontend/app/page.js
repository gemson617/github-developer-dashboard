import Link from "next/link";

export default function Home() {
  return (
    <div className="page">
      <h1>GitHub Developer Dashboard</h1>

      <p>
        Connect your GitHub account to view your developer analytics.
      </p>

      <Link href="/dashboard" className="btn">
        Connect GitHub
      </Link>
    </div>
  );
}