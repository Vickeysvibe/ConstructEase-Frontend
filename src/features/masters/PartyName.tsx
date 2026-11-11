import { Link } from "react-router-dom";
import type { Party } from "@/lib/api/types";
import { useSite } from "@/app/site";

/** Vendor/client name; links to the party ledger for people who can see finance. */
export function PartyName({ party }: { party: Party }) {
  const site = useSite();
  if (!site.can("finance:read")) return <strong>{party.name}</strong>;
  return (
    <Link to={site.to(`finance/ledger/${party.id}`)} title="Open ledger">
      <strong>{party.name}</strong>
    </Link>
  );
}

