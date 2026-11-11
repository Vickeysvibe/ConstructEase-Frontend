import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api/client";
import type { Tracker, TrackerColumn } from "@/lib/api/types";
import { SiteProvider } from "@/app/site";
import { RowDrawer } from "./RowDrawer";
import { applyTrackerErrors, rowSchema, rowValuesBody, trackerSchema, type RowForm } from "./trackerForm";

vi.mock(import("@/lib/api/client"), async (orig) => ({
  ...(await orig()),
  api: { get: vi.fn(), put: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn(), download: vi.fn() },
}));

const columns: TrackerColumn[] = [
  { key: "c_task", label: "Task", type: "text", required: true, options: [] },
  { key: "c_qty", label: "Qty", type: "number", required: false, options: [] },
  { key: "c_due", label: "Due", type: "date", required: false, options: [] },
  { key: "c_status", label: "Status", type: "status", required: false, options: ["Open", "Done"] },
];
const form = (values: Record<string, string>, done = false): RowForm => ({ done, values: { c_task: "", c_qty: "", c_due: "", c_status: "", ...values } });
const issues = (r: ReturnType<ReturnType<typeof rowSchema>["safeParse"]>) =>
  r.success ? {} : Object.fromEntries(r.error.issues.map((i) => [i.path.join("."), i.message]));

describe("row form validation by column type", () => {
  it("accepts a valid row", () => {
    expect(rowSchema(columns).safeParse(form({ c_task: "Pour slab", c_qty: "12.5", c_due: "2026-11-20", c_status: "Open" })).success).toBe(true);
  });

  it("flags required, number, date and status problems", () => {
    const r = rowSchema(columns).safeParse(form({ c_qty: "twelve", c_due: "2026-02-30", c_status: "Closed" }));
    expect(issues(r)).toEqual({
      "values.c_task": "Task is required",
      "values.c_qty": "Must be a number",
      "values.c_due": "Enter a valid date",
      "values.c_status": "Must be one of: Open, Done",
    });
  });

  it("limits text to 2000 characters", () => {
    expect(issues(rowSchema(columns).safeParse(form({ c_task: "x".repeat(2001) })))).toEqual({ "values.c_task": "At most 2000 characters" });
  });

  it("lets an old row stay empty in a required column added later, but not clear a filled one", () => {
    const initialEmpty = form({});
    expect(rowSchema(columns, initialEmpty).safeParse(form({ c_qty: "3" })).success).toBe(true);
    const initialFilled = form({ c_task: "Pour slab" });
    expect(issues(rowSchema(columns, initialFilled).safeParse(form({})))).toEqual({ "values.c_task": "Task is required" });
  });
});

describe("row values body", () => {
  it("sends numbers as numbers and leaves empty cells out on create", () => {
    expect(rowValuesBody(columns, form({ c_task: " Pour slab ", c_qty: "1,200" }))).toEqual({ c_task: "Pour slab", c_qty: 1200 });
  });
  it("sends only changed cells on edit, cleared ones as null", () => {
    const initial = form({ c_task: "Pour slab", c_qty: "5", c_status: "Open" });
    expect(rowValuesBody(columns, form({ c_task: "Pour slab", c_qty: "", c_status: "Done" }), initial)).toEqual({ c_qty: null, c_status: "Done" });
  });
});

describe("columns builder", () => {
  it("needs options for status columns and unique labels", () => {
    const r = trackerSchema.safeParse({
      name: "Snags",
      columns: [
        { label: "Status", type: "status", required: false, options: " , " },
        { label: "status", type: "text", required: false, options: "" },
      ],
    });
    expect(r.success).toBe(false);
    const paths = r.success ? [] : r.error.issues.map((i) => i.path.join("."));
    expect(paths).toEqual(expect.arrayContaining(["columns.0.options", "columns.1.label"]));
  });

  it("places 409 column errors on the column's type field", () => {
    const setError = vi.fn();
    const msg = applyTrackerErrors(new ApiError(409, "CONFLICT", "Conflict", undefined, [{ path: "columns.1", message: "3 rows have text in Qty" }]), setError);
    expect(setError).toHaveBeenCalledWith("columns.1.type", { message: "3 rows have text in Qty" });
    expect(msg).toMatch(/don't fit/);
  });
});

describe("RowDrawer", () => {
  const tracker: Tracker = { id: "t1", name: "To-do", kind: "todo", columns, rowCount: 0 };
  function renderDrawer() {
    const onSaved = vi.fn();
    render(
      <QueryClientProvider client={new QueryClient()}>
        <SiteProvider site={{ id: "s1", name: "Site", status: "active", role: "supervisor" }}>
          <RowDrawer tracker={tracker} row={null} onClose={vi.fn()} onSaved={onSaved} />
        </SiteProvider>
      </QueryClientProvider>,
    );
    return { onSaved };
  }
  afterEach(() => vi.clearAllMocks());

  it("validates client-side before posting", async () => {
    const user = userEvent.setup();
    renderDrawer();
    await user.type(screen.getByLabelText(/^Qty/), "abc");
    await user.click(screen.getByRole("button", { name: "Add row" }));
    expect(await screen.findByText("Task is required")).toBeInTheDocument();
    expect(screen.getByText("Must be a number")).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it("posts typed values and maps API errors on values.<key> to the field", async () => {
    const user = userEvent.setup();
    vi.mocked(api.post).mockRejectedValueOnce(new ApiError(422, "VALIDATION_FAILED", "Invalid", undefined, [{ path: "values.c_task", message: "Too long for the server" }]));
    renderDrawer();
    await user.type(screen.getByLabelText(/^Task/), "Pour slab");
    await user.type(screen.getByLabelText(/^Qty/), "4");
    await user.selectOptions(screen.getByLabelText(/^Status/), "Open");
    await user.click(screen.getByRole("button", { name: "Add row" }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/sites/s1/trackers/t1/rows", { values: { c_task: "Pour slab", c_qty: 4, c_status: "Open" }, done: false }));
    expect(await screen.findByText("Too long for the server")).toBeInTheDocument();
  });
});
