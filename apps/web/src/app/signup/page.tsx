"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createAccount } from "@/lib/auth";

export default function SignupPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setIsSubmitting(true);

    const result = createAccount(
      fullName,
      email,
      password
    );

    if (!result.success) {
      setError(result.error ?? "Could not create account.");
      setIsSubmitting(false);
      return;
    }

    router.push("/login");
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

        <h1>Create your workspace.</h1>

        <p>
          Start monitoring incidents and operational
          signals with VANTA.
        </p>

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >
          <label>
            Full name

            <input
              type="text"
              value={fullName}
              onChange={(event) =>
                setFullName(event.target.value)
              }
              placeholder="Your name"
              autoComplete="name"
              disabled={isSubmitting}
              required
            />
          </label>

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
              placeholder="Create a password"
              autoComplete="new-password"
              disabled={isSubmitting}
              minLength={6}
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
              ? "Creating workspace..."
              : "Create account"}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{" "}
          <Link href="/login">Sign in</Link>
        </div>
      </div>
    </main>
  );
}