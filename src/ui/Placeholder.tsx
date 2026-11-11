import { PageHeader } from "./Display";
import { EmptyState } from "./Display";

/** Temporary page body while a feature is being built. */
export function Placeholder({ title }: { title: string }) {
  return (
    <div className="ce-page">
      <PageHeader title={title} />
      <EmptyState title="Coming in this rebuild" description="This screen is being rebuilt on the new API." />
    </div>
  );
}
