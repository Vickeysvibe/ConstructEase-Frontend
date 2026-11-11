import type { ReactNode } from "react";

/**
 * One entry per screen: its breadcrumb label and the help shown by the (?) next to the page title.
 * Patterns use react-router syntax and are matched against every prefix of the current path,
 * so the breadcrumb trail is built from the URL itself.
 */
export interface PageMeta {
  pattern: string;
  /** breadcrumb label; `null` = not shown as a crumb. Detail pages can override at runtime with useCrumbLabel. */
  crumb: string | null;
  /** where the crumb links to, when different from its own path (e.g. a section without a page) */
  to?: string;
  help?: { title: string; body: ReactNode };
}

const S = "/sites/:siteId";

export const PAGES: PageMeta[] = [
  {
    pattern: "/",
    crumb: "Sites",
    help: {
      title: "Your sites",
      body: (
        <>
          <p>Every construction site you can work on. Open a site to manage its purchases, stock, labour and payments.</p>
          <p>Each card shows today's labour count and open purchase orders. Organisation admins can create new sites here.</p>
        </>
      ),
    },
  },
  {
    pattern: "/account",
    crumb: "Your account",
    help: { title: "Your account", body: <p>Your profile and password. Changing your password signs you out on your other devices.</p> },
  },
  {
    pattern: "/settings",
    crumb: "Organisation settings",
    help: {
      title: "Organisation settings",
      body: (
        <>
          <p>
            <strong>Organisation</strong>: company name, logo, GSTIN and timezone. They appear on purchase order PDFs, and the timezone
            decides what "today" means for attendance.
          </p>
          <p>
            <strong>Users</strong>: everyone who can sign in. Owners and admins see every site; members only see the sites they're
            added to from a site's Team page.
          </p>
        </>
      ),
    },
  },
  { pattern: "/settings/users", crumb: "Users" },

  {
    pattern: S,
    crumb: "{site}",
    help: {
      title: "Site overview",
      body: (
        <>
          <p>A snapshot of the site today: who's working, which orders are still waiting for material, what you owe vendors, and spending over the last six months.</p>
          <p>Use the buttons on the right for the jobs you do most often.</p>
        </>
      ),
    },
  },

  // ---- purchasing ----
  { pattern: `${S}/purchasing`, crumb: "Purchasing", to: "orders" },
  {
    pattern: `${S}/purchasing/orders`,
    crumb: "Purchase orders",
    help: {
      title: "Purchase orders",
      body: (
        <>
          <p>Orders you place with vendors for materials.</p>
          <ul>
            <li>
              <strong>Draft</strong>: still being prepared; you can edit it.
            </li>
            <li>
              <strong>Issued</strong>: final. It can't be edited and the site can now receive goods against it. Download the PDF to share it with the vendor.
            </li>
            <li>
              <strong>Partially received / Received</strong>: updates automatically as deliveries are recorded.
            </li>
          </ul>
        </>
      ),
    },
  },
  {
    pattern: `${S}/purchasing/orders/new`,
    crumb: "New order",
    help: {
      title: "New purchase order",
      body: (
        <>
          <p>Choose the vendor, then add a line for each material with quantity, rate and GST. Totals update as you type.</p>
          <p>
            <strong>Save as draft</strong> keeps it editable. <strong>Save &amp; issue</strong> finalises it so the site can receive goods against it.
          </p>
        </>
      ),
    },
  },
  {
    pattern: `${S}/purchasing/orders/:poId`,
    crumb: "Order",
    help: {
      title: "Purchase order",
      body: (
        <>
          <p>Everything about one order: what was ordered, what has arrived, and what's still pending.</p>
          <ul>
            <li>
              <strong>Issue PO</strong> locks a draft and lets the team receive goods. It doesn't email the vendor; use <strong>Download PDF</strong> to share it.
            </li>
            <li>
              <strong>Receive goods</strong> records a delivery and adds it to site stock. Partial deliveries are fine.
            </li>
            <li>
              <strong>Return goods</strong> sends material back and reduces stock and what you owe the vendor.
            </li>
          </ul>
        </>
      ),
    },
  },
  { pattern: `${S}/purchasing/orders/:poId/edit`, crumb: "Edit" },
  {
    pattern: `${S}/purchasing/receipts`,
    crumb: "Goods receipts",
    help: {
      title: "Goods receipts",
      body: <p>Every delivery recorded against a purchase order, with the challan number and what it cost. To record a new delivery, open the purchase order and choose Receive goods.</p>,
    },
  },
  { pattern: `${S}/purchasing/receipts/:receiptId`, crumb: "Receipt" },
  {
    pattern: `${S}/purchasing/returns`,
    crumb: "Returns",
    help: {
      title: "Purchase returns",
      body: <p>Material sent back to vendors. A return reduces site stock and the amount you owe that vendor. To make one, open the purchase order and choose Return goods.</p>,
    },
  },
  { pattern: `${S}/purchasing/returns/:returnId`, crumb: "Return" },

  // ---- stock ----
  {
    pattern: `${S}/stock`,
    crumb: "Stock",
    help: {
      title: "Stock on hand",
      body: (
        <>
          <p>What's on site right now, worked out from deliveries, returns, usage and adjustments. Nobody types stock in directly, so it can't drift.</p>
          <ul>
            <li>
              <strong>Record usage</strong> when material is consumed on site.
            </li>
            <li>
              <strong>Adjust stock</strong> after a physical count, for breakage or theft. A reason is required.
            </li>
          </ul>
          <p>Click a row to see its full movement history.</p>
        </>
      ),
    },
  },
  {
    pattern: `${S}/stock/movements`,
    crumb: "Movements",
    help: { title: "Stock movements", body: <p>Every change to stock, newest first: deliveries (+), returns and usage (−) and adjustments. Use the filters to trace one material.</p> },
  },

  // ---- people ----
  {
    pattern: `${S}/attendance`,
    crumb: "Attendance",
    help: {
      title: "Labour attendance",
      body: (
        <>
          <p>Mark who worked today. Tap <strong>Present</strong> or <strong>Absent</strong> for each person, and use − / + for half or extra shifts.</p>
          <p>Changes are saved together with the <strong>Save</strong> bar at the bottom. Wages use each person's rate on that day, so later rate changes don't alter past days.</p>
          <p>Supervisors can mark today and yesterday; engineers can correct older days.</p>
        </>
      ),
    },
  },
  {
    pattern: `${S}/attendance/checkins`,
    crumb: "Check-ins",
    help: {
      title: "Check-ins",
      body: (
        <>
          <p>Record when you arrive at and leave the site. Your phone's location is saved with each check-in.</p>
          <p>Engineers can see everyone's hours for any day.</p>
        </>
      ),
    },
  },

  // ---- money ----
  { pattern: `${S}/finance`, crumb: "Money", to: "payments" },
  {
    pattern: `${S}/finance/payments`,
    crumb: "Payments",
    help: {
      title: "Payments",
      body: (
        <>
          <p>Money paid out to vendors and labour, money received from clients, and other site expenses.</p>
          <p>Vendor and client payments update their ledgers. Click a vendor or client name to see what's owed. A wrong payment can be voided; it stays in history with the reason.</p>
        </>
      ),
    },
  },
  {
    pattern: `${S}/finance/ledger/:partyId`,
    crumb: "Ledger",
    help: {
      title: "Ledger",
      body: (
        <>
          <p>A running account with one vendor or client on this site.</p>
          <p>
            For a <strong>vendor</strong>, goods received add to the balance and payments and returns reduce it; the closing balance is what you still owe. For a{" "}
            <strong>client</strong>, the balance is the total received.
          </p>
        </>
      ),
    },
  },

  // ---- work ----
  {
    pattern: `${S}/worklog`,
    crumb: "Trackers",
    help: {
      title: "Trackers",
      body: <p>Simple tables for site work: the to-do list, work done each day, or anything else you want to track. Create your own with the columns you need.</p>,
    },
  },
  {
    pattern: `${S}/worklog/:trackerId`,
    crumb: "Tracker",
    help: { title: "Tracker", body: <p>Add a row for each item and tick it off when it's done. Use <strong>Edit columns</strong> to add, rename or remove columns.</p> },
  },
  {
    pattern: `${S}/notes`,
    crumb: "Notes",
    help: { title: "Notes", body: <p>Shared notes for the site team: decisions, measurements, phone numbers, links to drawings or sheets.</p> },
  },

  // ---- masters ----
  { pattern: `${S}/masters`, crumb: "Masters", to: "vendors" },
  {
    pattern: `${S}/masters/vendors`,
    crumb: "Vendors",
    help: {
      title: "Vendors",
      body: (
        <>
          <p>Suppliers you raise purchase orders with. Their GSTIN is printed on PO PDFs.</p>
          <p>Use <strong>Import</strong> to add many from an Excel sheet; you'll see a preview before anything is saved. Click a vendor's name to open their ledger.</p>
        </>
      ),
    },
  },
  {
    pattern: `${S}/masters/clients`,
    crumb: "Clients",
    help: { title: "Clients", body: <p>The people or companies you're building for. Payments received from them are recorded under Payments.</p> },
  },
  {
    pattern: `${S}/masters/labour`,
    crumb: "Labour",
    help: {
      title: "Labour",
      body: <p>Workers on this site with their trade and wage per shift. Everyone listed here appears on the daily attendance sheet. Changing a wage only affects attendance marked afterwards.</p>,
    },
  },
  {
    pattern: `${S}/masters/products`,
    crumb: "Products",
    help: {
      title: "Products",
      body: <p>Materials you buy, with their unit and default GST. The list is shared by all your sites, so add each material once.</p>,
    },
  },
  {
    pattern: `${S}/masters/team`,
    crumb: "Team",
    help: {
      title: "Team",
      body: (
        <>
          <p>People who can sign in to this site.</p>
          <ul>
            <li>
              <strong>Engineers</strong> manage everything on the site, including purchases, payments and reports.
            </li>
            <li>
              <strong>Supervisors</strong> mark attendance, receive goods, record usage and keep the worklog.
            </li>
          </ul>
        </>
      ),
    },
  },

  // ---- reports ----
  {
    pattern: `${S}/reports`,
    crumb: "Reports",
    to: "labour-wages",
    help: {
      title: "Reports",
      body: <p>Choose a report and a period. Every report can be downloaded as an Excel file, which is prepared in the background and downloads when it's ready.</p>,
    },
  },
  { pattern: `${S}/reports/labour-wages`, crumb: "Labour wages" },
  { pattern: `${S}/reports/vendor-ledger`, crumb: "Vendor ledger" },
  { pattern: `${S}/reports/payments`, crumb: "Payments" },
  { pattern: `${S}/reports/stock`, crumb: "Stock" },
  { pattern: `${S}/reports/site-summary`, crumb: "Site summary" },
];
