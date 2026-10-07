import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="page">
      <h1>GitHub Developer Dashboard</h1>

      <p>Connect your GitHub account to view your developer analytics.</p>

      <Link to="/dashboard" className="btn">
        Connect GitHub
      </Link>
    </div>
  );
}

export default Home;