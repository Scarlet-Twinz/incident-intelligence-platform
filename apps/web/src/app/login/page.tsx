"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setIsSubmitting(true);

    const result = login(email, password);

    if (!result.success) {
      setError(result.error ?? "Could not sign in.");
      setIsSubmitting(false);
      return;
    }

    router.push("/");
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-mark">V</div>

          <div>
            <strong>VANTA</strong>
            <span>Operational Intelligence</span>
          </div>
        </div>

        <span className="section-kicker">
          VANTA WORKSPACE
        </span>

        <h1>Welcome back.</h1>

        <p>
          Sign in to your operational intelligence
          workspace.
        </p>

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >
          <label>
            Email

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="you@company.com"
              autoComplete="email"
              disabled={isSubmitting}
              required
            />
          </label>

          <label>
            Password

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Enter your password"
              autoComplete="current-password"
              disabled={isSubmitting}
              required
            />
          </label>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2.5 text-sm text-red-300"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Signing in..."
              : "Sign in"}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account?{" "}
          <Link href="/signup">Create one</Link>
        </div>
      </div>
    </main>
  );
}