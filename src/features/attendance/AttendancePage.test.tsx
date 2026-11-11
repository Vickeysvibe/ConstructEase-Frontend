import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api/client";
import type { AttendanceSheet, MeSite } from "@/lib/api/types";
import { SiteProvider } from "@/app/site";
import { ConfirmProvider } from "@/ui";
import AttendancePage from "./AttendancePage";

vi.mock(import("@/lib/api/client"), async (orig) => ({
  ...(await orig()),
  api: { get: vi.fn(), put: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn(), download: vi.fn() },
}));
vi.mock("@/app/auth", () => ({
  useAuth: () => ({ session: { org: { timezone: "Asia/Kolkata" }, user: { id: "u1" } } }),
}));

const sheet = (over: Partial<AttendanceSheet> = {}): AttendanceSheet => ({
  date: "2026-11-11",
  editable: true,
  rows: [
    { labourId: "l1", name: "Murugan", phone: "9840000001", category: "Mason", wageRatePaise: 90000, entry: { id: "e1", status: "present", shifts: 1, wageRatePaise: 90000, wagePaise: 90000 } },
    { labourId: "l2", name: "Selvi", phone: "9840000002", category: "Helper", wageRatePaise: 60000, entry: { id: "e2", status: "absent", shifts: 0, wageRatePaise: 60000, wagePaise: 0 } },
    { labourId: "l3", name: "Ravi", phone: "9840000003", category: "Helper", wageRatePaise: 60000, entry: null },
  ],
  summary: { present: 1, absent: 1, unmarked: 1, shifts: 1, wagesPaise: 90000, byCategory: [] },
  ...over,
});

function renderPage(role: MeSite["role"] = "engineer") {
  const router = createMemoryRouter(
    [
      {
        path: "/sites/s1/attendance",
        element: (
          <SiteProvider site={{ id: "s1", name: "Site", status: "active", role }}>
            <AttendancePage />
          </SiteProvider>
        ),
      },
    ],
    { initialEntries: ["/sites/s1/attendance"] },
  );
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <ConfirmProvider>
        <RouterProvider router={router} />
      </ConfirmProvider>
    </QueryClientProvider>,
  );
}

const rowOf = (name: string) => screen.getByText(name).closest("li")!;

describe("AttendancePage", () => {
  beforeEach(() => vi.mocked(api.get).mockResolvedValue(sheet()));
  afterEach(() => vi.clearAllMocks());

  it("saves only the changed rows in one PUT, absent with 0 shifts", async () => {
    const user = userEvent.setup();
    vi.mocked(api.put).mockResolvedValue(sheet());
    renderPage();
    await screen.findByText("Murugan");
    expect(screen.queryByRole("button", { name: /save/i })).not.toBeInTheDocument();

    await user.click(within(rowOf("Murugan")).getByRole("button", { name: "Absent" }));
    await user.click(within(rowOf("Ravi")).getByRole("button", { name: "Present" }));
    await user.click(within(rowOf("Ravi")).getByRole("button", { name: "More shifts for Ravi" }));
    // Selvi: present then back to absent → no change
    await user.click(within(rowOf("Selvi")).getByRole("button", { name: "Present" }));
    await user.click(within(rowOf("Selvi")).getByRole("button", { name: "Absent" }));

    await user.click(screen.getByRole("button", { name: "Save 2 changes" }));
    await waitFor(() => expect(api.put).toHaveBeenCalledTimes(1));
    const [path, body] = vi.mocked(api.put).mock.calls[0]!;
    expect(path).toBe("/sites/s1/attendance");
    expect(body).toEqual({
      date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      entries: [
        { labourId: "l1", status: "absent", shifts: 0 },
        { labourId: "l3", status: "present", shifts: 1.5 },
      ],
    });
    await waitFor(() => expect(screen.queryByRole("button", { name: /^Save/ })).not.toBeInTheDocument());
  });

  it("keeps the shift stepper within 0.5–3", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Murugan");
    const r = within(rowOf("Murugan"));
    const less = r.getByRole("button", { name: "Fewer shifts for Murugan" });
    const more = r.getByRole("button", { name: "More shifts for Murugan" });
    await user.click(less);
    expect(r.getByLabelText("Murugan shifts")).toHaveTextContent("0.5");
    expect(less).toBeDisabled();
    for (let i = 0; i < 6; i++) if (!more.hasAttribute("disabled")) await user.click(more);
    expect(r.getByLabelText("Murugan shifts")).toHaveTextContent("3");
    expect(more).toBeDisabled();
  });

  it("shows per-row errors from a 409", async () => {
    const user = userEvent.setup();
    vi.mocked(api.put).mockRejectedValue(
      new ApiError(409, "CONFLICT", "Conflict", "Already present elsewhere", [{ path: "entries.0.labourId", message: "Ravi is present on Tower B today" }]),
    );
    renderPage();
    await screen.findByText("Ravi");
    await user.click(within(rowOf("Ravi")).getByRole("button", { name: "Present" }));
    await user.click(screen.getByRole("button", { name: "Save 1 change" }));
    expect(await within(rowOf("Ravi")).findByRole("alert")).toHaveTextContent("Ravi is present on Tower B today");
  });

  it("is read-only with an explanation when the date isn't editable", async () => {
    vi.mocked(api.get).mockResolvedValue(sheet({ editable: false }));
    renderPage("supervisor");
    await screen.findByText("Murugan");
    expect(screen.getByText(/today and yesterday only/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Present" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /mark all present/i })).not.toBeInTheDocument();
  });

  it("points to Masters › Labour when the site has no labour", async () => {
    vi.mocked(api.get).mockResolvedValue(sheet({ rows: [] }));
    renderPage();
    expect(await screen.findByRole("link", { name: /Masters › Labour/ })).toHaveAttribute("href", "/sites/s1/masters/labour");
  });
});
