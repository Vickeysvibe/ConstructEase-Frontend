import { z } from "zod";
import { api } from "@/lib/api/client";
import type { ImportResult, JobRef, List, Party, PartyKind, Product } from "@/lib/api/types";
import { money, percentFromBp } from "@/lib/format";
import { StatusBadge } from "@/ui";
import type { ResourceConfig } from "./ResourcePage";
import type { SiteContextValue } from "@/app/site";

// ---------- shared validation (mirrors the API; the API stays the authority) ----------
const phone = z
  .string()
  .trim()
  .transform((s) => s.replace(/[\s-]/g, "").replace(/^\+91/, ""))
  .pipe(z.string().regex(/^\d{10}$/, "Enter a 10-digit mobile number"));
const optional = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));
const gstIn = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/, "Enter a valid 15-character GSTIN")
  .optional()
  .or(z.literal(""));
const pan = z.string().trim().toUpperCase().regex(/^[A-Z]{5}\d{4}[A-Z]$/, "Enter a valid PAN").optional().or(z.literal(""));
const name = z.string().trim().min(1, "Name is required").max(120);

/** Removes empty strings so the API treats them as "not provided". */
const clean = <T extends Record<string, unknown>>(v: T) =>
  Object.fromEntries(Object.entries(v).filter(([, x]) => x !== "" && x !== undefined && x !== null)) as Partial<T>;

function uploadParties(kind: PartyKind) {
  return (s: SiteContextValue, file: File, dryRun: boolean) => {
    const fd = new FormData();
    fd.append("file", file);
    return api.post<ImportResult>(`${s.base}/imports/parties?kind=${kind}&dryRun=${dryRun}`, fd);
  };
}
const template = (entity: string) => () => api.download(`/imports/templates/${entity}`, `${entity}-template.xlsx`);
const exportEntity = (entity: string) => (s: SiteContextValue) => api.post<JobRef>(`${s.base}/exports`, { entity });

function partyBase<F extends Record<string, unknown>>(kind: PartyKind) {
  return {
    queryKey: (s: SiteContextValue) => ["parties", s.site.id, kind],
    list: (s: SiteContextValue, params: Record<string, unknown>) => api.get<List<Party>>(`${s.base}/parties`, { ...params, kind }),
    create: (s: SiteContextValue, v: F) => api.post<Party>(`${s.base}/parties`, { kind, ...clean(v) }),
    update: (s: SiteContextValue, id: string, v: F) => api.patch<Party>(`${s.base}/parties/${id}`, clean(v)),
    remove: {
      label: "Remove from site",
      confirmTitle: (p: Party) => `Remove ${p.name} from this site?`,
      confirmMessage: "Past purchase orders, payments and attendance keep their records. You can add them back later.",
      run: (s: SiteContextValue, p: Party) => api.delete(`${s.base}/parties/${p.id}`),
    },
    import: {
      upload: uploadParties(kind),
      template: template(kind),
      describe:
        kind === "labour"
          ? "Columns: Name, Phone, Category (trade), Sub category, Wage rate (₹ per shift). Existing people with the same name and phone are updated."
          : "Columns: Name, Phone, Contact name, GSTIN, PAN, Address. Existing records with the same name and phone are updated.",
    },
    export: exportEntity(kind),
    defaultSort: "name",
  };
}

// ---------- vendors ----------
const vendorSchema = z.object({ name, phone, contactName: optional(120), gstIn, pan, address: optional(500), category: optional(60) });
type VendorForm = z.input<typeof vendorSchema>;
export const vendorsResource: ResourceConfig<Party, VendorForm> = {
  ...partyBase<VendorForm>("vendor"),
  title: "Vendors",
  singular: "Vendor",
  description: "Suppliers you raise purchase orders with.",
  searchPlaceholder: "Search name, phone, GSTIN…",
  canWrite: (s) => s.can("masters:write"),
  emptyDescription: "Add your cement, steel and sand suppliers to start raising purchase orders.",
  columns: [
    { accessorKey: "name", header: "Vendor", meta: { sortKey: "name" }, cell: ({ row }) => <strong>{row.original.name}</strong> },
    { accessorKey: "contactName", header: "Contact", meta: { hideBelow: 900 } },
    { accessorKey: "phone", header: "Phone", cell: ({ row }) => <span className="ce-num">{row.original.phone}</span> },
    { accessorKey: "gstIn", header: "GSTIN", meta: { hideBelow: 700 }, cell: ({ row }) => <span className="ce-num">{row.original.gstIn ?? "—"}</span> },
    { accessorKey: "category", header: "Supplies", meta: { hideBelow: 1000 } },
  ],
  form: {
    schema: vendorSchema,
    defaults: { name: "", phone: "", contactName: "", gstIn: "", pan: "", address: "", category: "" },
    fromItem: (p) => ({ name: p.name, phone: p.phone, contactName: p.contactName ?? "", gstIn: p.gstIn ?? "", pan: p.pan ?? "", address: p.address ?? "", category: p.category ?? "" }),
    fields: [
      { name: "name", label: "Vendor name", required: true, placeholder: "Sri Balaji Traders" },
      { name: "phone", label: "Phone", type: "tel", required: true, placeholder: "98401 23456" },
      { name: "contactName", label: "Contact person" },
      { name: "gstIn", label: "GSTIN", hint: "Printed on purchase orders", placeholder: "33AABCS1429B1Z5" },
      { name: "pan", label: "PAN" },
      { name: "category", label: "Supplies", placeholder: "Cement, steel…" },
      { name: "address", label: "Address", type: "textarea" },
    ],
  },
};

// ---------- clients ----------
const clientSchema = z.object({ name, phone, contactName: optional(120), gstIn, pan, address: optional(500) });
type ClientForm = z.input<typeof clientSchema>;
export const clientsResource: ResourceConfig<Party, ClientForm> = {
  ...partyBase<ClientForm>("client"),
  title: "Clients",
  singular: "Client",
  description: "The people or companies you are building for.",
  searchPlaceholder: "Search name or phone…",
  canWrite: (s) => s.can("masters:write"),
  emptyDescription: "Add the client for this site to record the payments you receive from them.",
  columns: [
    { accessorKey: "name", header: "Client", meta: { sortKey: "name" }, cell: ({ row }) => <strong>{row.original.name}</strong> },
    { accessorKey: "contactName", header: "Contact", meta: { hideBelow: 800 } },
    { accessorKey: "phone", header: "Phone", cell: ({ row }) => <span className="ce-num">{row.original.phone}</span> },
    { accessorKey: "address", header: "Address", meta: { hideBelow: 1000 } },
  ],
  form: {
    schema: clientSchema,
    defaults: { name: "", phone: "", contactName: "", gstIn: "", pan: "", address: "" },
    fromItem: (p) => ({ name: p.name, phone: p.phone, contactName: p.contactName ?? "", gstIn: p.gstIn ?? "", pan: p.pan ?? "", address: p.address ?? "" }),
    fields: [
      { name: "name", label: "Client name", required: true },
      { name: "phone", label: "Phone", type: "tel", required: true },
      { name: "contactName", label: "Contact person" },
      { name: "gstIn", label: "GSTIN" },
      { name: "pan", label: "PAN" },
      { name: "address", label: "Address", type: "textarea" },
    ],
  },
};

// ---------- labour ----------
const labourSchema = z.object({
  name,
  phone,
  category: z.string().trim().min(1, "Trade is required").max(60),
  subCategory: optional(60),
  wageRatePaise: z.number({ invalid_type_error: "Wage per shift is required" }).int().positive("Wage per shift is required"),
});
type LabourForm = z.input<typeof labourSchema>;
export const labourResource: ResourceConfig<Party, LabourForm> = {
  ...partyBase<LabourForm>("labour"),
  title: "Labour",
  singular: "Labourer",
  description: "Workers on this site and their wage per shift.",
  searchPlaceholder: "Search name, phone, trade…",
  canWrite: (s) => s.can("labour:write"),
  emptyDescription: "Add masons, helpers and other workers to mark daily attendance.",
  columns: [
    { accessorKey: "name", header: "Name", meta: { sortKey: "name" }, cell: ({ row }) => <strong>{row.original.name}</strong> },
    { accessorKey: "category", header: "Trade", meta: { sortKey: "category" } },
    { accessorKey: "subCategory", header: "Speciality", meta: { hideBelow: 900 } },
    { accessorKey: "phone", header: "Phone", meta: { hideBelow: 700 }, cell: ({ row }) => <span className="ce-num">{row.original.phone}</span> },
    { accessorKey: "wageRatePaise", header: "Wage / shift", meta: { numeric: true, sortKey: "wageRatePaise" }, cell: ({ row }) => money(row.original.wageRatePaise) },
  ],
  form: {
    schema: labourSchema,
    defaults: { name: "", phone: "", category: "", subCategory: "", wageRatePaise: undefined as unknown as number },
    fromItem: (p) => ({ name: p.name, phone: p.phone, category: p.category ?? "", subCategory: p.subCategory ?? "", wageRatePaise: p.wageRatePaise ?? 0 }),
    fields: [
      { name: "name", label: "Name", required: true },
      { name: "phone", label: "Phone", type: "tel", required: true },
      { name: "category", label: "Trade", required: true, placeholder: "Mason, Carpenter, Helper…" },
      { name: "subCategory", label: "Speciality", placeholder: "Brickwork, shuttering…" },
      { name: "wageRatePaise", label: "Wage per shift", type: "money", required: true, hint: "Changing it doesn't alter attendance already recorded." },
    ],
  },
};

// ---------- products (org catalogue) ----------
const productSchema = z.object({
  name,
  unit: z.string().trim().min(1, "Unit is required").max(20),
  category: optional(60),
  description: optional(500),
  defaultTaxRateBp: z.string().regex(/^\d{1,4}$/),
});
type ProductForm = z.input<typeof productSchema>;
const GST_OPTIONS = ["0", "500", "1200", "1800", "2800"].map((v) => ({ value: v, label: `${Number(v) / 100}% GST` }));
const productBody = (v: ProductForm) => ({ ...clean({ ...v, defaultTaxRateBp: undefined }), defaultTaxRateBp: Number(v.defaultTaxRateBp) });
export const productsResource: ResourceConfig<Product, ProductForm> = {
  title: "Products",
  singular: "Product",
  description: "Materials you buy. The catalogue is shared by all your sites.",
  searchPlaceholder: "Search product or category…",
  queryKey: () => ["products"],
  list: (_s, params) => api.get<List<Product>>("/products", params),
  defaultSort: "name",
  canWrite: (s) => s.can("masters:write"),
  emptyDescription: "Add cement, steel, sand and other materials before raising purchase orders.",
  columns: [
    { accessorKey: "name", header: "Product", meta: { sortKey: "name" }, cell: ({ row }) => <strong>{row.original.name}</strong> },
    { accessorKey: "unit", header: "Unit" },
    { accessorKey: "category", header: "Category", meta: { sortKey: "category", hideBelow: 700 } },
    { accessorKey: "defaultTaxRateBp", header: "GST", meta: { numeric: true }, cell: ({ row }) => percentFromBp(row.original.defaultTaxRateBp) },
    { accessorKey: "status", header: "Status", meta: { hideBelow: 900 }, cell: ({ row }) => <StatusBadge status={row.original.status} /> },
  ],
  form: {
    schema: productSchema,
    defaults: { name: "", unit: "", category: "", description: "", defaultTaxRateBp: "1800" },
    fromItem: (p) => ({ name: p.name, unit: p.unit, category: p.category ?? "", description: p.description ?? "", defaultTaxRateBp: String(p.defaultTaxRateBp) }),
    fields: [
      { name: "name", label: "Product name", required: true, placeholder: "OPC 53 cement" },
      { name: "unit", label: "Unit", required: true, placeholder: "bag, tonne, cu.m, nos" },
      { name: "category", label: "Category", placeholder: "Cement" },
      { name: "defaultTaxRateBp", label: "GST rate", type: "select", required: true, options: GST_OPTIONS },
      { name: "description", label: "Description", type: "textarea" },
    ],
  },
  create: (_s, v) => api.post<Product>("/products", productBody(v)),
  update: (_s, id, v) => api.patch<Product>(`/products/${id}`, productBody(v)),
  remove: {
    label: "Archive",
    confirmTitle: (p) => `Archive ${p.name}?`,
    confirmMessage: "It disappears from new purchase orders. Existing orders, stock and reports keep it.",
    run: (_s, p) => api.post(`/products/${p.id}/archive`),
  },
  import: {
    upload: (_s, file, dryRun) => {
      const fd = new FormData();
      fd.append("file", file);
      return api.post<ImportResult>(`/imports/products?dryRun=${dryRun}`, fd);
    },
    template: template("product"),
    describe: "Columns: Name, Unit, Category, Description, GST rate (%). Products with the same name are updated.",
  },
  export: exportEntity("product"),
};
