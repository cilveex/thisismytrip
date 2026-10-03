import { Link } from "react-router";
import { PageHead } from "@/components/ui";

export function Placeholder({ title, step }: { title: string; step?: number }) {
  return (
    <>
      <PageHead title={title} sub={step ? `Coming in step ${step}.` : "This page doesn't exist."} />
      <Link to="/" className="font-bold text-primary underline">
        Back to the map
      </Link>
    </>
  );
}
