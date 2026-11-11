import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { api } from "@/lib/api/client";
import { ReceiveGoodsDrawer } from "./ReceiveGoodsDrawer";
import { renderInSite } from "./testUtils";
import { samplePO } from "./fixtures";

vi.mock("@/app/auth", () => ({ useAuth: () => ({ session: { org: { timezone: "Asia/Kolkata" } } }) }));
vi.mock("@/lib/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/client")>();
  return { ...actual, api: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } };
});

describe("ReceiveGoodsDrawer", () => {
  beforeEach(() => vi.mocked(api.post).mockReset());

  it("prefills pending quantities and rejects a quantity above what is pending", async () => {
    const user = userEvent.setup();
    renderInSite(<ReceiveGoodsDrawer po={samplePO()} onClose={() => {}} />);
    const cement = screen.getByRole("group", { name: "OPC 53 cement" });
    const qty = within(cement).getByLabelText(/Qty received/);
    expect(qty).toHaveValue("40");

    await user.clear(qty);
    await user.type(qty, "45");
    await user.click(screen.getByRole("button", { name: "Record receipt" }));

    expect(await within(cement).findByText("Only 40 bag pending")).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it("posts only the lines with a quantity, with an idempotency key", async () => {
    const user = userEvent.setup();
    vi.mocked(api.post).mockResolvedValue({ id: "gr2", number: "GR-2026-0004" });
    const onClose = vi.fn();
    renderInSite(<ReceiveGoodsDrawer po={samplePO()} onClose={onClose} />);
    const steel = screen.getByRole("group", { name: "TMT 12mm" });
    await user.clear(within(steel).getByLabelText(/Qty received/));
    await user.click(screen.getByRole("button", { name: "Record receipt" }));

    await waitFor(() => expect(api.post).toHaveBeenCalledTimes(1));
    const [path, body, opts] = vi.mocked(api.post).mock.calls[0]!;
    expect(path).toBe("/sites/s1/goods-receipts");
    expect(body).toMatchObject({ poId: "po1", lines: [{ poLineId: "l1", qty: 40, unitPricePaise: 41250, taxRateBp: 2800 }] });
    expect((body as { lines: unknown[] }).lines).toHaveLength(1);
    expect(opts).toEqual({ idempotencyKey: expect.any(String) });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("shows the receipt total for what is being received", () => {
    renderInSite(<ReceiveGoodsDrawer po={samplePO()} onClose={() => {}} />);
    // 40 bag × ₹412.50 @ 28% + 2.5 t × ₹62,000 @ 18%
    expect(screen.getByText("₹2,04,020.00")).toBeInTheDocument();
  });
});
