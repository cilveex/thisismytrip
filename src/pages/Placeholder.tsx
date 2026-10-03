import { Link } from "react-router";
import { PageHead } from "@/components/ui";

export function Placeholder({ title }: { title: string }) {
  return (
    <main className="mx-auto max-w-3xl px-4 pt-8">
      <PageHead title={title} sub="This page doesn't exist." />
      <Link to="/" className="inline-flex min-h-11 items-center font-bold text-primary underline">
        Back to the trip
      </Link>
    </main>
  );
}
