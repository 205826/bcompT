import { Link } from "react-router-dom";

const E404 = () => {
  return (
    <div style={styles.container}>
      <h1 style={styles.header}>404 - Page Not Found</h1>
      <p style={styles.message}>
        Oops! The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link to="/#" style={styles.link}>
        Go back to Home
      </Link>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    color: "#d3d3d3",
  },
  header: {
    fontSize: "3rem",
    marginBottom: "1rem",
  },
  message: {
    fontSize: "1.5rem",
    marginBottom: "2rem",
  },
  link: {
    fontSize: "1.2rem",
    color: "#007bff",
    textDecoration: "none",
  },
};

export default E404;
