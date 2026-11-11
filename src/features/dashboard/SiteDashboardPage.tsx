import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ClipboardCheck, IndianRupee, ShoppingCart } from "lucide-react";
import { api } from "@/lib/api/client";
import type { SiteDashboard } from "@/lib/api/types";
import { date, moneyShort, qty, time } from "@/lib/format";
import { useSite } from "@/app/site";
import { Badge, ButtonLink, Card, EmptyState, ErrorState, LoadingBlock, PageHeader, StatCard } from "@/ui";
import { MonthlyChart, type ChartSeries } from "./MonthlyChart";
import "./dashboard.css";

const SERIES: ChartSeries[] = [
  { key: "materialSpendPaise", label: "Material spend", tone: "brand" },
  { key: "wagesPaise", label: "Wages", tone: "interactive" },
  { key: "paymentsOutPaise", label: "Payments out", tone: "ok", hatched: true },
];

/** Site overview: today on site, purchasing, money (engineers only), stock and the last six months. */
export default function SiteDashboardPage() {
  const site = useSite();
  const query = useQuery({
    queryKey: ["dashboard", site.site.id],
    queryFn: () => api.get<SiteDashboard>(`${site.base}/dashboard`),
  });
  // The API omits money for supervisors; the permission check is a second guard so a supervisor never sees amounts.
  const showMoney = site.can("finance:read");

  const actions = (
    <>
      {site.can("attendance:write") && (
        <ButtonLink to={site.to("attendance")} icon={<ClipboardCheck />}>
          Mark attendance
        </ButtonLink>
      )}
      {site.can("purchasing:write") && (
        <ButtonLink to={site.to("purchasing/orders/new")} icon={<ShoppingCart />}>
          New PO
        </ButtonLink>
      )}
      {site.can("finance:write") && (
        <ButtonLink to={site.to("finance/payments?new=1")} icon={<IndianRupee />} variant="primary">
          Record payment
        </ButtonLink>
      )}
    </>
  );

  let body;
  if (query.isPending) body = <LoadingBlock rows={8} />;
  else if (query.isError) body = <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  else body = <DashboardBody data={query.data} showMoney={showMoney} />;

  return (
    <div className="ce-page">
      <PageHeader
        title="Overview"
        crumbs={site.site.name}
        description={site.archived ? "This site is archived. You can still read its records." : undefined}
        actions={actions}
      />
      {body}
    </div>
  );
}

export function DashboardBody({ data, showMoney }: { data: SiteDashboard; showMoney: boolean }) {
  const site = useSite();
  const { today, purchasing, finance, stock } = data;
  const series = data.series ?? [];
  const wages = showMoney ? today.wagesPaise : undefined;
  const stockValue = showMoney ? stock.valuePaise : undefined;

  return (
    <div className="ce-stack">
      <Card title={`Today · ${date(today.date)}`}>
        <div className="ce-stats">
          <StatCard label="Labour present" value={<span className="ce-num">{today.labourPresent}</span>} />
          <StatCard label="Absent" value={<span className="ce-num">{today.labourAbsent}</span>} />
          <StatCard label="Shifts" value={<span className="ce-num">{qty(today.shifts)}</span>} />
          {wages !== undefined && <StatCard label="Wages today" value={<span className="ce-num">{moneyShort(wages)}</span>} />}
        </div>
        <h3 className="dash-section-title">Checked in</h3>
        {today.checkedIn.length === 0 ? (
          <p className="ce-muted">Nobody has checked in yet today. Team members check in from the Attendance → Check-ins page.</p>
        ) : (
          <ul className="dash-list">
            {today.checkedIn.map((c) => (
              <li key={c.userId}>
                <span>{c.name}</span>
                <span className="dash-list__sub ce-num">in at {time(c.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="dash-grid">
        <Card
          title="Purchasing"
          actions={
            <ButtonLink size="sm" variant="ghost" to={site.to("purchasing/orders")}>
              All orders
            </ButtonLink>
          }
        >
          <div className="ce-stats">
            <StatCard label="Open POs" value={<span className="ce-num">{purchasing.openPOs}</span>} />
            <StatCard label="Partially received" value={<span className="ce-num">{purchasing.partiallyReceived}</span>} />
          </div>
          <h3 className="dash-section-title">Awaiting delivery</h3>
          {purchasing.awaitingDelivery.length === 0 ? (
            <p className="ce-muted">No orders are waiting for material. Sent purchase orders appear here until fully received.</p>
          ) : (
            <ul className="dash-list">
              {purchasing.awaitingDelivery.map((po) => (
                <li key={po.id}>
                  <span>
                    <Link to={site.to(`purchasing/orders/${po.id}`)}>{po.number}</Link> <span className="dash-list__sub">{po.vendorName}</span>
                  </span>
                  <Badge tone="warn">
                    {po.pendingLines} {po.pendingLines === 1 ? "line" : "lines"} pending
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          title="Stock"
          actions={
            <ButtonLink size="sm" variant="ghost" to={site.to("stock")}>
              View stock
            </ButtonLink>
          }
        >
          <div className="ce-stats">
            <StatCard label="Items in stock" value={<span className="ce-num">{stock.items}</span>} />
            {stockValue !== undefined && <StatCard label="Stock value" value={<span className="ce-num">{moneyShort(stockValue)}</span>} />}
          </div>
        </Card>
      </div>

      {showMoney && finance && (
        <Card title="Finance">
          <div className="ce-stats" data-testid="finance-stats">
            <StatCard label="Vendor payable" value={<span className="ce-num">{moneyShort(finance.vendorPayablePaise)}</span>} sub="Owed to vendors on this site" />
            <StatCard label="Received from client" value={<span className="ce-num">{moneyShort(finance.clientReceivedPaise)}</span>} />
            <StatCard label="Paid out this month" value={<span className="ce-num">{moneyShort(finance.monthPaymentsOutPaise)}</span>} />
          </div>
        </Card>
      )}

      {showMoney && finance && (
        <Card title="Last 6 months">
          {series.length === 0 ? (
            <EmptyState plain title="No monthly figures yet" description="Material received, wages and payments will be charted here month by month." />
          ) : (
            <MonthlyChart
              title="Material spend, wages and payments out by month"
              series={SERIES}
              format={moneyShort}
              groups={series.map((s) => ({
                month: s.month,
                values: { materialSpendPaise: s.materialSpendPaise, wagesPaise: s.wagesPaise, paymentsOutPaise: s.paymentsOutPaise },
              }))}
              emptyText="No spending recorded in these months yet."
            />
          )}
        </Card>
      )}
    </div>
  );
}
