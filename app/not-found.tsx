import Link from "next/link";

export default function NotFound() {
  return (
    <main className="task-not-found">
      <p className="eyebrow">404 · Page unavailable</p>
      <h1>We could not find that page.</h1>
      <p>Choose a current Today task from the dashboard.</p>
      <Link className="task-back" href="/">Back to Today</Link>
    </main>
  );
}
