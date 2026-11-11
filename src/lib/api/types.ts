/**
 * API types — mirror of Constructease-Backend/docs/API.md. Keep in sync with that file.
 * Money is integer paise, quantities are decimals (≤ 3 dp), business dates are 'YYYY-MM-DD'.
 */

export type Id = string;
export type IsoDate = string; // YYYY-MM-DD
export type IsoInstant = string;

export interface List<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface ListParams {
  page?: number;
  pageSize?: number;
  q?: string;
  sort?: string;
  [key: string]: string | number | boolean | undefined;
}

// ---------- identity ----------
export type OrgRole = "owner" | "admin" | "member";
export type SiteRole = "engineer" | "supervisor";

export interface User {
  id: Id;
  name: string;
  email: string;
  phone: string;
  orgRole: OrgRole;
  status: "active" | "disabled";
  createdAt?: IsoInstant;
  updatedAt?: IsoInstant;
}

export interface Org {
  id: Id;
  name: string;
  logoUrl?: string;
  description?: string;
  address?: string;
  phone?: string;
  gstIn?: string;
  timezone: string;
  createdAt?: IsoInstant;
  updatedAt?: IsoInstant;
}
export type OrgInput = Partial<Pick<Org, "name" | "logoUrl" | "description" | "address" | "phone" | "gstIn" | "timezone">>;
export interface UserInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  orgRole: OrgRole;
}

export interface Session {
  accessToken: string;
  expiresIn: number;
  user: User;
  org: Org;
}

export interface MeSite {
  id: Id;
  name: string;
  status: "active" | "archived";
  role: SiteRole;
}
export interface Me {
  user: User;
  org: Org;
  sites: MeSite[];
}

export interface Site {
  id: Id;
  name: string;
  address: string;
  status: "active" | "archived";
  createdAt?: IsoInstant;
}

export interface Member {
  userId: Id;
  name: string;
  email: string;
  phone: string;
  role: SiteRole;
  status: User["status"];
}

// ---------- masters ----------
export type PartyKind = "vendor" | "client" | "labour";
export interface Party {
  id: Id;
  kind: PartyKind;
  name: string;
  phone: string;
  address?: string;
  contactName?: string;
  gstIn?: string;
  pan?: string;
  category?: string;
  subCategory?: string;
  wageRatePaise?: number;
  siteIds: Id[];
  status: "active" | "archived";
  createdAt?: IsoInstant;
}

export interface Product {
  id: Id;
  name: string;
  unit: string;
  category?: string;
  description?: string;
  defaultTaxRateBp: number;
  status: "active" | "archived";
}

export interface ImportRow {
  row: number;
  status: "create" | "update" | "skip" | "error";
  data: Record<string, unknown>;
  errors: { path: string; message: string }[];
}
export interface ImportResult {
  dryRun: boolean;
  total: number;
  valid: number;
  created: number;
  updated: number;
  skipped: number;
  rows: ImportRow[];
}

// ---------- purchasing ----------
export type POStatus = "draft" | "sent" | "partially_received" | "received" | "cancelled";

export interface POLine {
  id: Id;
  productId: Id;
  productName: string;
  unit: string;
  qty: number;
  unitPricePaise: number;
  taxRateBp: number;
  amountPaise: number;
  taxPaise: number;
  totalPaise: number;
  receivedQty: number;
  returnedQty: number;
  pendingQty: number;
}

export interface DocRef {
  id: Id;
  number: string;
  date: IsoDate;
  totalPaise: number;
}

export interface PurchaseOrder {
  id: Id;
  number: string;
  siteId: Id;
  vendor: { id: Id; name: string; gstIn?: string };
  date: IsoDate;
  expectedDate?: IsoDate;
  transport?: string;
  notes?: string;
  status: POStatus;
  lines: POLine[];
  subtotalPaise: number;
  taxPaise: number;
  totalPaise: number;
  receivedValuePaise: number;
  /** set when a PO is cancelled with a reason */
  cancelReason?: string;
  receipts: DocRef[];
  returns: DocRef[];
  createdAt?: IsoInstant;
  updatedAt?: IsoInstant;
}
export type PurchaseOrderSummary = Omit<PurchaseOrder, "lines" | "receipts" | "returns"> & { lineCount: number };

export interface POInput {
  vendorId: Id;
  date: IsoDate;
  expectedDate?: IsoDate;
  transport?: string;
  notes?: string;
  lines: { productId: Id; qty: number; unitPricePaise?: number; taxRateBp?: number }[];
}

export interface ReceiptLine {
  id: Id;
  poLineId: Id;
  productId: Id;
  productName: string;
  unit: string;
  qty: number;
  unitPricePaise: number;
  taxRateBp: number;
  amountPaise: number;
  taxPaise: number;
  totalPaise: number;
}
export interface GoodsReceipt {
  id: Id;
  number: string;
  poId: Id;
  poNumber: string;
  vendor: { id: Id; name: string };
  date: IsoDate;
  challanNo?: string;
  vehicleNo?: string;
  notes?: string;
  lines: ReceiptLine[];
  subtotalPaise: number;
  taxPaise: number;
  totalPaise: number;
  createdBy: { id: Id; name: string };
  createdAt: IsoInstant;
}
export type GoodsReceiptSummary = Omit<GoodsReceipt, "lines"> & { lineCount: number };
export interface PurchaseReturn extends Omit<GoodsReceipt, "challanNo" | "vehicleNo"> {
  reason?: string;
}
export type PurchaseReturnSummary = Omit<PurchaseReturn, "lines"> & { lineCount: number };

export interface GRInput {
  poId: Id;
  date: IsoDate;
  challanNo?: string;
  vehicleNo?: string;
  notes?: string;
  lines: { poLineId: Id; qty: number; unitPricePaise?: number; taxRateBp?: number }[];
}
export interface PRInput {
  poId: Id;
  date: IsoDate;
  reason?: string;
  lines: { poLineId: Id; qty: number }[];
}

// ---------- inventory ----------
export interface StockItem {
  productId: Id;
  productName: string;
  unit: string;
  category?: string;
  receivedQty: number;
  returnedQty: number;
  consumedQty: number;
  adjustedQty: number;
  onHandQty: number;
  avgCostPaise: number;
  valuePaise: number;
}
export type MovementType = "receipt" | "return" | "consumption" | "adjustment";
export type MovementSource = "goods_receipt" | "purchase_return" | "consumption" | "adjustment" | "legacy";
export interface StockMovement {
  id: Id;
  productId: Id;
  productName: string;
  unit: string;
  date: IsoDate;
  type: MovementType;
  /** signed: + into stock, − out of stock */
  qty: number;
  unitCostPaise: number;
  sourceType: MovementSource;
  /** groups the movements of one receipt / return / consumption */
  sourceId: Id | null;
  reference: string;
  notes?: string;
  createdBy: { id: Id; name: string };
  createdAt: IsoInstant;
}
export interface ConsumptionInput {
  date: IsoDate;
  notes?: string;
  lines: { productId: Id; qty: number; usedFor?: string }[];
}
export interface StockAdjustmentInput {
  date: IsoDate;
  productId: Id;
  /** signed, ≠ 0 */
  qty: number;
  reason: string;
}

// ---------- workforce ----------
export interface AttendanceEntry {
  id: Id;
  status: "present" | "absent";
  shifts: number;
  wageRatePaise: number;
  wagePaise: number;
}
export interface AttendanceRow {
  labourId: Id;
  name: string;
  phone: string;
  category?: string;
  subCategory?: string;
  wageRatePaise: number;
  entry: AttendanceEntry | null;
}
export interface AttendanceSheet {
  date: IsoDate;
  editable: boolean;
  rows: AttendanceRow[];
  summary: {
    present: number;
    absent: number;
    unmarked: number;
    shifts: number;
    wagesPaise: number;
    byCategory: { category: string; present: number; shifts: number }[];
  };
}
export interface CheckinEvent {
  type: "in" | "out";
  at: IsoInstant;
  lat: number;
  lng: number;
  accuracyM?: number;
  address?: string;
}
export interface CheckinDay {
  id: Id;
  user: { id: Id; name: string };
  date: IsoDate;
  events: CheckinEvent[];
  firstIn?: IsoInstant;
  lastOut?: IsoInstant;
  workedMinutes: number;
}
export interface AttendanceSaveInput {
  date: IsoDate;
  /** 1–500 entries; absent entries carry shifts 0, present 0.5–3 in 0.5 steps */
  entries: { labourId: Id; status: AttendanceEntry["status"]; shifts?: number }[];
  /** engineer only: re-copy current wage rates onto the day's entries */
  refreshRates?: boolean;
}
export interface CheckinInput {
  type: CheckinEvent["type"];
  lat: number;
  lng: number;
  accuracyM?: number;
}

// ---------- finance ----------
export type PaymentCategory = "vendor" | "client" | "labour" | "other";
export type PaymentMethod = "cash" | "bank" | "upi" | "cheque" | "other";
export interface PaymentInput {
  date: IsoDate;
  direction: "out" | "in";
  category: PaymentCategory;
  partyId?: Id;
  amountPaise: number;
  method?: PaymentMethod;
  reference?: string;
  description?: string;
  quantity?: number;
  unit?: string;
  unitCostPaise?: number;
}
export interface Payment extends PaymentInput {
  id: Id;
  siteId: Id | null;
  party?: { id: Id; name: string; kind: PartyKind };
  status: "posted" | "void";
  voidReason?: string;
  createdBy: { id: Id; name: string };
  createdAt: IsoInstant;
  updatedAt?: IsoInstant;
}
/** PATCH body: optional fields accept null to clear them. */
export type PaymentPatch = Partial<
  Pick<PaymentInput, "date" | "direction" | "category" | "amountPaise"> & {
    [K in "partyId" | "method" | "reference" | "description" | "quantity" | "unit" | "unitCostPaise"]: PaymentInput[K] | null;
  }
>;
export interface LedgerRow {
  id: Id;
  date: IsoDate;
  sourceType: "goods_receipt" | "purchase_return" | "payment" | "legacy";
  sourceId: Id;
  reference: string;
  description: string;
  debitPaise: number;
  creditPaise: number;
  balancePaise: number;
}
export interface Ledger {
  party: Party;
  from: IsoDate;
  to: IsoDate;
  openingBalancePaise: number;
  entries: LedgerRow[];
  closingBalancePaise: number;
}

// ---------- worklog & notes ----------
export type ColumnType = "text" | "number" | "date" | "status";
export interface TrackerColumn {
  key: string;
  label: string;
  type: ColumnType;
  /** responses always include required and options (`[]` for non-status columns) */
  required: boolean;
  options: string[];
}
/** Column as sent to the API: `key` omitted for a new column (never sent on create). */
export interface ColumnInput {
  key?: string;
  label: string;
  type: ColumnType;
  required?: boolean;
  options?: string[];
}
export interface Tracker {
  id: Id;
  name: string;
  kind: "todo" | "work" | "custom";
  columns: TrackerColumn[];
  rowCount: number;
  createdAt?: IsoInstant;
  updatedAt?: IsoInstant;
}
export interface TrackerRow {
  id: Id;
  values: Record<string, string | number | null>;
  done: boolean;
  createdBy: { id: Id; name: string };
  createdAt: IsoInstant;
  updatedAt: IsoInstant;
}
export interface Note {
  id: Id;
  title: string;
  body: string;
  link?: string;
  createdBy: { id: Id; name: string };
  createdAt: IsoInstant;
  updatedAt: IsoInstant;
}

// ---------- dashboard ----------
export interface SiteDashboard {
  today: {
    date: IsoDate;
    labourPresent: number;
    labourAbsent: number;
    shifts: number;
    wagesPaise?: number;
    checkedIn: { userId: Id; name: string; at: IsoInstant }[];
  };
  purchasing: {
    openPOs: number;
    partiallyReceived: number;
    awaitingDelivery: { id: Id; number: string; vendorName: string; pendingLines: number }[];
  };
  finance?: { vendorPayablePaise: number; clientReceivedPaise: number; monthPaymentsOutPaise: number };
  stock: { items: number; valuePaise?: number };
  /** last 6 months incl. current; omitted for supervisors */
  series?: {
    month: string;
    materialSpendPaise: number;
    wagesPaise: number;
    paymentsOutPaise: number;
    paymentsInPaise: number;
  }[];
}
export interface OrgDashboard {
  sites: {
    id: Id;
    name: string;
    status: Site["status"];
    today: { labourPresent: number; checkedIn: number };
    openPOs: number;
    monthSpendPaise?: number;
  }[];
}

// ---------- reports ----------
export interface ReportRange {
  from: IsoDate;
  to: IsoDate;
}
export interface LabourWagesRow {
  labourId: Id;
  name: string;
  category?: string;
  subCategory?: string;
  shiftsByDate: Record<IsoDate, number>;
  days: number;
  shifts: number;
  wagesPaise: number;
  paidPaise: number;
  balancePaise: number;
}
export interface LabourWagesReport extends ReportRange {
  days: IsoDate[];
  rows: LabourWagesRow[];
  totals: { shifts: number; wagesPaise: number; paidPaise: number; balancePaise: number };
}
export interface VendorLedgerSummaryRow {
  vendorId: Id;
  name: string;
  openingBalancePaise: number;
  receivedPaise: number;
  returnedPaise: number;
  paidPaise: number;
  closingBalancePaise: number;
}
export interface VendorLedgerSummary {
  from?: IsoDate;
  to?: IsoDate;
  rows: VendorLedgerSummaryRow[];
  totals: Omit<VendorLedgerSummaryRow, "vendorId" | "name">;
}
export interface PaymentsReport {
  from?: IsoDate;
  to?: IsoDate;
  rows: Payment[];
  totals: { inPaise: number; outPaise: number; byCategory: { category: PaymentCategory; inPaise: number; outPaise: number }[] };
}
export interface StockReportRow {
  productId: Id;
  productName: string;
  unit: string;
  openingQty: number;
  receivedQty: number;
  returnedQty: number;
  consumedQty: number;
  adjustedQty: number;
  closingQty: number;
  avgCostPaise: number;
  closingValuePaise: number;
}
export interface StockReport {
  from?: IsoDate;
  to?: IsoDate;
  rows: StockReportRow[];
  totals: { closingValuePaise: number };
}
export interface SiteSummaryReport {
  from?: IsoDate;
  to?: IsoDate;
  materials: { receivedPaise: number; returnedPaise: number; netPaise: number };
  labour: { shifts: number; wagesPaise: number };
  payments: { inPaise: number; outPaise: number };
  byMonth: { month: string; materialsPaise: number; wagesPaise: number; paymentsOutPaise: number; paymentsInPaise: number }[];
}

// ---------- jobs ----------
export interface Job {
  id: Id;
  type: string;
  status: "queued" | "running" | "done" | "failed";
  error?: string;
  file?: { id: Id; filename: string; contentType: string; size: number };
}
export interface JobRef {
  jobId: Id;
}
