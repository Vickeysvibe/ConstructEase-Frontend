import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { Party } from "@/lib/api/types";
import { SiteProvider } from "@/app/site";
import { PaymentDrawer } from "./PaymentDrawer";
import { blankPayment, toPaymentInput, toPaymentPatch } from "./paymentForm";

vi.mock(import("@/lib/api/client"), async (orig) => ({
  ...(await orig()),
  api: { get: vi.fn(), put: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn(), download: vi.fn() },
}));

const party = (id: string, name: string, kind: Party["kind"]): Party => ({ id, name, kind, phone: "9840000000", siteIds: ["s1"], status: "active" });

function renderDrawer() {
  const onClose = vi.fn();
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <SiteProvider site={{ id: "s1", name: "Site", status: "active", role: "engineer" }}>
          <PaymentDrawer payment={null} today="2026-11-11" onClose={onClose} />
        </SiteProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { onClose };
}

describe("PaymentDrawer", () => {
  beforeEach(() => {
    vi.mocked(api.get).mockImplementation(async (_path, params) => {
      const kind = (params as { kind: Party["kind"] }).kind;
      const items = kind === "vendor" ? [party("v1", "Sri Balaji Traders", "vendor")] : kind === "client" ? [party("c1", "Mr Kumar", "client")] : [];
      return { items, page: 1, pageSize: 100, total: items.length } as never;
    });
  });
  afterEach(() => vi.clearAllMocks());

  it("requires a party for vendor payments", async () => {
    const user = userEvent.setup();
    renderDrawer();
    expect(screen.getByLabelText(/^Vendor/)).toBeInTheDocument();
    await user.type(screen.getByLabelText(/^Amount/), "5000");
    await user.click(screen.getByRole("button", { name: "Record payment" }));
    expect(await screen.findByText("Choose the vendor this payment is for")).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it("hides the party picker for 'other' and posts without a party, with an idempotency key", async () => {
    const user = userEvent.setup();
    vi.mocked(api.post).mockResolvedValue({ amountPaise: 120000, direction: "out" } as never);
    const { onClose } = renderDrawer();
    await user.selectOptions(screen.getByLabelText(/^Category/), "other");
    expect(screen.queryByLabelText(/^Vendor/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^Quantity/)).not.toBeInTheDocument();
    await user.type(screen.getByLabelText(/^Amount/), "1200");
    await user.type(screen.getByLabelText(/^Description/), "Diesel for mixer");
    await user.click(screen.getByRole("button", { name: "Record payment" }));
    await waitFor(() => expect(api.post).toHaveBeenCalledTimes(1));
    const [path, body, opts] = vi.mocked(api.post).mock.calls[0]!;
    expect(path).toBe("/sites/s1/payments");
    expect(body).toEqual({ date: "2026-11-11", direction: "out", category: "other", amountPaise: 120000, description: "Diesel for mixer" });
    expect(opts?.idempotencyKey).toBeTruthy();
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("defaults client payments to received and offers that kind of party", async () => {
    const user = userEvent.setup();
    renderDrawer();
    await user.selectOptions(screen.getByLabelText(/^Category/), "client");
    expect(screen.getByLabelText(/^Direction/)).toHaveValue("in");
    expect(await screen.findByRole("option", { name: "Mr Kumar" })).toBeInTheDocument();
  });
});

describe("payment bodies", () => {
  it("drops the party for 'other' and material details for non-vendor payments", () => {
    const v = { ...blankPayment("2026-11-11"), category: "labour" as const, partyId: "l1", amountPaise: 500, quantity: 2, unit: "bags", unitCostPaise: 250 };
    expect(toPaymentInput(v)).toEqual({ date: "2026-11-11", direction: "out", category: "labour", partyId: "l1", amountPaise: 500 });
    expect(toPaymentInput({ ...v, category: "other" })).not.toHaveProperty("partyId");
  });

  it("clears empty optional fields with null on edit", () => {
    const v = { ...blankPayment("2026-11-11"), category: "vendor" as const, partyId: "v1", amountPaise: 500, method: "upi" as const };
    expect(toPaymentPatch(v)).toEqual({
      date: "2026-11-11",
      direction: "out",
      category: "vendor",
      amountPaise: 500,
      partyId: "v1",
      method: "upi",
      reference: null,
      description: null,
      quantity: null,
      unit: null,
      unitCostPaise: null,
    });
  });
});
