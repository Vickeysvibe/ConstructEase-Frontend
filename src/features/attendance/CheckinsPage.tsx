import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LogIn, LogOut, MapPin } from "lucide-react";
import { api } from "@/lib/api/client";
import type { CheckinDay, CheckinEvent, CheckinInput } from "@/lib/api/types";
import { date as fmtDate, minutes, time } from "@/lib/format";
import { useAuth } from "@/app/auth";
import { useSite } from "@/app/site";
import { Badge, Button, Card, DataTable, DateStepper, EmptyState, ErrorState, LoadingBlock, NavTabs, PageHeader, notify, type ColumnDef } from "@/ui";
import { describeGeoError, getPosition, osmLink } from "./geo";
import { attendanceTabs, useToday } from "./shared";
import "./attendance.css";

const lastEvent = (day?: CheckinDay) => day?.events[day.events.length - 1];

function Where({ e }: { e: CheckinEvent }) {
  const label = e.address ?? `${e.lat.toFixed(5)}, ${e.lng.toFixed(5)}`;
  return (
    <a href={osmLink(e.lat, e.lng)} target="_blank" rel="noreferrer" title="Open in OpenStreetMap">
      {label}
    </a>
  );
}

/** Check in / out with the phone's location; engineers also see everyone's day. */
export default function CheckinsPage() {
  const site = useSite();
  const { session } = useAuth();
  const todayStr = useToday();
  const qc = useQueryClient();
  const me = session?.user.id;
  const [geoError, setGeoError] = useState<string | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);

  const mine = useQuery({
    queryKey: ["checkins", site.site.id, todayStr, me],
    queryFn: () => api.get<{ items: CheckinDay[] }>(`${site.base}/checkins`, { date: todayStr, userId: me }),
    enabled: !!me,
  });
  const myDay = mine.data?.items.find((d) => d.user.id === me);
  const checkedIn = lastEvent(myDay)?.type === "in";
  const nextType: CheckinInput["type"] = checkedIn ? "out" : "in";

  const post = useMutation({
    mutationFn: (body: CheckinInput) => api.post<CheckinDay>(`${site.base}/checkins`, body),
    onSuccess: (_d, body) => {
      notify.success(body.type === "in" ? "Checked in." : "Checked out.");
      void qc.invalidateQueries({ queryKey: ["checkins", site.site.id] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e) => notify.error(e),
  });

  const act = async () => {
    setGeoError(null);
    setLocating(true);
    try {
      const pos = await getPosition();
      const acc = Math.round(pos.coords.accuracy);
      setAccuracy(acc);
      post.mutate({ type: nextType, lat: pos.coords.latitude, lng: pos.coords.longitude, accuracyM: acc });
    } catch (err) {
      setGeoError(describeGeoError(err));
    } finally {
      setLocating(false);
    }
  };

  return (
    <div className="ce-page">
      <PageHeader title="Check-ins" description="Your site arrival and departure, recorded with your phone's location." />
      <NavTabs label="Attendance" tabs={attendanceTabs(site.to)} />
      <div className="ce-grid-2">
        <Card title="Today">
          <div className="chk-action">
            {mine.isLoading ? (
              <LoadingBlock rows={2} />
            ) : mine.error ? (
              <ErrorState error={mine.error} onRetry={() => void mine.refetch()} />
            ) : (
              <>
                <div className="chk-status">
                  {checkedIn ? <Badge tone="ok">Checked in</Badge> : <Badge>Not checked in</Badge>}
                  {myDay && myDay.workedMinutes > 0 && <span className="ce-muted">Worked {minutes(myDay.workedMinutes)} today</span>}
                </div>
                {site.archived ? (
                  <p className="ce-muted">This site is archived, so you can't check in here.</p>
                ) : (
                  <Button
                    variant="primary"
                    className="chk-action__btn"
                    icon={checkedIn ? <LogOut /> : <LogIn />}
                    loading={locating || post.isPending}
                    onClick={() => void act()}
                  >
                    {locating ? "Finding your location…" : checkedIn ? "Check out" : "Check in"}
                  </Button>
                )}
                {geoError && (
                  <p className="chk-geo-error" role="alert">
                    {geoError}
                  </p>
                )}
                {accuracy !== null && !geoError && (
                  <p className="ce-muted">
                    Location accurate to about {accuracy} m{accuracy > 100 ? " — weak signal; move into the open for a better fix next time." : "."}
                  </p>
                )}
              </>
            )}
          </div>
        </Card>
        <Card title="My day">
          {myDay?.events.length ? (
            <ol className="chk-timeline">
              {myDay.events.map((e, i) => (
                <li key={`${e.at}-${i}`}>
                  <span className="chk-timeline__time">{time(e.at)}</span>
                  <div className="ce-stack" style={{ gap: 2 }}>
                    <Badge tone={e.type === "in" ? "ok" : "neutral"}>{e.type === "in" ? "In" : "Out"}</Badge>
                    <span className="chk-timeline__where">
                      <Where e={e} />
                      {e.accuracyM !== undefined && ` (±${Math.round(e.accuracyM)} m)`}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState plain icon={<MapPin aria-hidden />} title="No check-ins today" description="Tap Check in when you reach the site." />
          )}
        </Card>
      </div>
      {site.can("checkins:viewAll") && <TeamDay />}
    </div>
  );
}

function TeamDay() {
  const site = useSite();
  const todayStr = useToday();
  const [sp, setSp] = useSearchParams();
  const raw = sp.get("date");
  const day = raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) && raw <= todayStr ? raw : todayStr;
  const setDay = (d: string) =>
    setSp(
      (prev) => {
        const n = new URLSearchParams(prev);
        if (d >= todayStr) n.delete("date");
        else n.set("date", d);
        return n;
      },
      { replace: true },
    );
  const query = useQuery({
    queryKey: ["checkins", site.site.id, day, "all"],
    queryFn: () => api.get<{ items: CheckinDay[] }>(`${site.base}/checkins`, { date: day }),
  });

  const columns: ColumnDef<CheckinDay, unknown>[] = [
    { id: "name", header: "Person", cell: ({ row }) => <strong>{row.original.user.name}</strong> },
    { id: "in", header: "First in", cell: ({ row }) => time(row.original.firstIn) },
    { id: "out", header: "Last out", cell: ({ row }) => (row.original.lastOut ? time(row.original.lastOut) : lastEvent(row.original)?.type === "in" ? <Badge tone="ok">On site</Badge> : "—") },
    { id: "worked", header: "Worked", meta: { numeric: true }, cell: ({ row }) => minutes(row.original.workedMinutes) },
    {
      id: "where",
      header: "Last location",
      meta: { hideBelow: 700 },
      cell: ({ row }) => {
        const e = lastEvent(row.original);
        return e ? <Where e={e} /> : "—";
      },
    },
  ];

  return (
    <section className="ce-stack">
      <h2>Team on {fmtDate(day)}</h2>
      <DataTable
        columns={columns}
        data={query.data?.items}
        rowKey={(d) => d.id}
        loading={query.isFetching}
        error={query.error}
        onRetry={() => void query.refetch()}
        caption={`Check-ins on ${fmtDate(day)}`}
        toolbar={<DateStepper label="Check-in date" value={day} max={todayStr} today={todayStr} onChange={setDay} />}
        empty={<EmptyState plain title="Nobody checked in" description="Engineers and supervisors appear here once they check in on this site." />}
      />
    </section>
  );
}
