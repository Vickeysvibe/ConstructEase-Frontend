import { screen } from "@testing-library/react";
import { api } from "@/lib/api/client";
import type { StockItem } from "@/lib/api/types";
import { renderInSite } from "@/features/purchasing/testUtils";
import StockPage from "./StockPage";

vi.mock("@/app/auth", () => ({ useAuth: () => ({ session: { org: { timezone: "Asia/Kolkata" } } }) }));
vi.mock("@/lib/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/client")>();
  return { ...actual, api: { get: vi.fn(), post: vi.fn() } };
});

const items: StockItem[] = [
  { productId: "p1", productName: "OPC 53 cement", unit: "bag", category: "Cement", receivedQty: 60, returnedQty: 0, consumedQty: 20, adjustedQty: 0, onHandQty: 40, avgCostPaise: 41250, valuePaise: 1650000 },
  { productId: "p3", productName: "M-sand", unit: "cu.m", category: "Aggregates", receivedQty: 10, returnedQty: 0, consumedQty: 10, adjustedQty: 0, onHandQty: 0, avgCostPaise: 150000, valuePaise: 0 },
];

describe("stock on hand", () => {
  beforeEach(() => vi.mocked(api.get).mockResolvedValue({ items }));

  it("engineers see value, totals and both actions", async () => {
    renderInSite(<StockPage />, { role: "engineer", path: "stock" });
    expect(await screen.findByText("OPC 53 cement")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Value" })).toBeInTheDocument();
    expect(screen.getAllByText("₹16,500.00").length).toBe(2); // row + footer total
    expect(screen.getByRole("button", { name: "Record usage" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Adjust stock" })).toBeInTheDocument();
    expect(screen.getByText("(out of stock)")).toBeInTheDocument();
  });

  it("supervisors can record usage but not adjust stock or see cost", async () => {
    renderInSite(<StockPage />, { role: "supervisor", path: "stock" });
    expect(await screen.findByText("OPC 53 cement")).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Value" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Record usage" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Adjust stock" })).not.toBeInTheDocument();
  });
});
