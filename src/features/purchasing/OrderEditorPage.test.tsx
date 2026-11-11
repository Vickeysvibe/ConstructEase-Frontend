import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { api, ApiError } from "@/lib/api/client";
import OrderEditorPage from "./OrderEditorPage";
import { renderInSite } from "./testUtils";

vi.mock("@/app/auth", () => ({ useAuth: () => ({ session: { org: { timezone: "Asia/Kolkata" } } }) }));
vi.mock("@/lib/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/client")>();
  return { ...actual, api: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } };
});

const list = <T,>(items: T[]) => ({ items, page: 1, pageSize: 50, total: items.length });

describe("order editor", () => {
  beforeEach(() => {
    vi.mocked(api.post).mockReset();
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path.endsWith("/parties")) return list([{ id: "v1", kind: "vendor", name: "Sri Balaji Traders", phone: "9840123456", siteIds: ["s1"], status: "active" }]);
      if (path === "/products") return list([{ id: "p1", name: "OPC 53 cement", unit: "bag", defaultTaxRateBp: 2800, status: "active" }]);
      throw new Error(`unexpected GET ${path}`);
    });
  });

  it("previews line maths and puts API line errors on the right cell", async () => {
    const user = userEvent.setup();
    vi.mocked(api.post).mockRejectedValue(
      new ApiError(422, "VALIDATION_FAILED", "Validation failed", undefined, [{ path: "lines.0.qty", message: "At most 3 decimal places" }]),
    );
    renderInSite(<OrderEditorPage />, { path: "purchasing/orders/new", route: "purchasing/orders/new" });

    await user.selectOptions(await screen.findByLabelText(/Vendor/), "v1");
    const line = screen.getByRole("group", { name: "Line 1" });
    await user.type(within(line).getByLabelText(/Product/), "OPC");
    await user.click(await screen.findByRole("option", { name: /OPC 53 cement/ }));
    await waitFor(() => expect(within(line).getByLabelText("GST")).toHaveValue("2800")); // product default
    await user.type(within(line).getByLabelText(/Qty/), "12.5");
    await user.type(within(line).getByLabelText(/Rate/), "412.50");

    expect(within(line).getByText("₹6,600.00")).toBeInTheDocument();
    expect(within(line).getByText("₹5,156.25 + ₹1,443.75 GST")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Save as draft" }));
    await waitFor(() => expect(api.post).toHaveBeenCalledTimes(1));
    const [path, body, opts] = vi.mocked(api.post).mock.calls[0]!;
    expect(path).toBe("/sites/s1/purchase-orders");
    expect(body).toMatchObject({ vendorId: "v1", lines: [{ productId: "p1", qty: 12.5, unitPricePaise: 41250, taxRateBp: 2800 }] });
    expect(opts).toEqual({ idempotencyKey: expect.any(String) });
    expect(await within(line).findByText("At most 3 decimal places")).toBeInTheDocument();
  });

  it("points to Masters when the site has no vendors", async () => {
    vi.mocked(api.get).mockResolvedValue(list([]));
    renderInSite(<OrderEditorPage />, { path: "purchasing/orders/new", route: "purchasing/orders/new" });
    expect(await screen.findByText("Add a vendor first")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to vendors" })).toHaveAttribute("href", "/sites/s1/masters/vendors");
  });
});
