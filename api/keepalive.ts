/**
 * Daily Vercel cron (see vercel.json) that keeps the free Supabase project from pausing.
 * Does one read of the shared trip row — never writes. Always answers 200; failures are only logged.
 */
const TRIP_ID = "tenerife-2026";

export async function GET(request: Request) {
  // If CRON_SECRET is set in Vercel, only Vercel's cron (which sends it as a bearer token) gets through.
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.warn("[keepalive] Supabase env vars missing");
    return Response.json({ ok: false, reason: "not configured" });
  }

  try {
    const headers: Record<string, string> = { apikey: key };
    // Legacy anon keys are JWTs and go in Authorization too; new sb_publishable_ keys must not.
    if (!key.startsWith("sb_")) headers.Authorization = `Bearer ${key}`;
    const res = await fetch(`${url}/rest/v1/trips?id=eq.${TRIP_ID}&select=id`, {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.warn("[keepalive] Supabase answered", res.status);
      return Response.json({ ok: false, status: res.status });
    }
    const rows = (await res.json()) as unknown[];
    return Response.json({ ok: true, found: rows.length > 0, at: new Date().toISOString() });
  } catch (e) {
    console.warn("[keepalive] request failed", e instanceof Error ? e.message : e);
    return Response.json({ ok: false, reason: "request failed" });
  }
}
