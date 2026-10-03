import { useId, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { LockKeyhole } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { ADMIN_EMAIL } from "@/lib/supabase";
import { Button } from "@/components/ui";

export function Login() {
  const { logIn } = useAuth();
  const id = useId();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!password || busy) return;
    setBusy(true);
    setError(await logIn(password));
    setBusy(false);
  };

  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <form onSubmit={submit} className="surface w-full max-w-sm space-y-4 p-6" aria-labelledby={`${id}-h`}>
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-soft">
            <LockKeyhole className="h-5 w-5" aria-hidden />
          </span>
          <h1 id={`${id}-h`} className="text-2xl font-extrabold">
            Planner
          </h1>
        </div>
        {/* Hidden username so password managers save and fill the right account */}
        <input type="email" name="username" autoComplete="username" value={ADMIN_EMAIL} readOnly hidden />
        <div>
          <label htmlFor={`${id}-pw`} className="mb-1 block text-sm font-bold text-muted">
            Password
          </label>
          <input
            id={`${id}-pw`}
            type="password"
            name="password"
            autoComplete="current-password"
            className="field"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-err` : undefined}
            autoFocus
          />
        </div>
        {error && (
          <p id={`${id}-err`} role="alert" className="font-bold text-bad">
            {error}
          </p>
        )}
        <Button type="submit" className="h-12 w-full text-lg" disabled={!password || busy}>
          {busy ? "Logging in…" : "Log in"}
        </Button>
        <p className="text-center text-sm">
          <Link to="/" className="inline-flex min-h-11 items-center text-muted underline">
            Back to the trip page
          </Link>
        </p>
      </form>
    </main>
  );
}
