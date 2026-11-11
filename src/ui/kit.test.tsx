import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { MemoryRouter } from "react-router-dom";
import { useState } from "react";
import { Field, IconButton, Select } from "@/ui";
import { selectValue } from "@/test/select";
import { Breadcrumbs, CrumbProvider, useCrumbLabel } from "@/app/Breadcrumbs";

vi.mock("@/app/auth", () => ({ useAuth: () => ({ me: { sites: [{ id: "s1", name: "Lakshmi Residency" }] } }) }));

const OPTS = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "bank", label: "Bank transfer" },
];

describe("Select", () => {
  it("works controlled: mouse and keyboard, with a labelled combobox", async () => {
    const user = userEvent.setup();
    function C() {
      const [v, setV] = useState("");
      return (
        <>
          <Field label="Method">
            <Select value={v} onChange={(e) => setV(e.target.value)} options={OPTS} placeholder="Not specified" />
          </Field>
          <output>{v || "none"}</output>
        </>
      );
    }
    render(<C />);
    const box = screen.getByRole("combobox", { name: "Method" });
    expect(box).toHaveTextContent("Not specified");
    await user.click(box);
    await user.click(screen.getByRole("option", { name: "UPI" }));
    expect(screen.getByRole("status")).toHaveTextContent("upi");
    expect(box).toHaveTextContent("UPI");
    // keyboard: open, move down, pick
    box.focus();
    await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");
    expect(screen.getByRole("status")).toHaveTextContent("bank");
    // type-ahead while closed
    await user.keyboard("c");
    expect(screen.getByRole("status")).toHaveTextContent("cash");
  });

  it("works with react-hook-form register, including defaults and reset", async () => {
    const user = userEvent.setup();
    let submitted: unknown;
    function F() {
      const form = useForm({ defaultValues: { method: "bank" } });
      return (
        <form onSubmit={form.handleSubmit((v) => (submitted = v))}>
          <Field label="Method">
            <Select {...form.register("method")} options={OPTS} />
          </Field>
          <button type="button" onClick={() => form.reset({ method: "cash" })}>
            reset
          </button>
          <button type="submit">save</button>
        </form>
      );
    }
    render(<F />);
    const box = screen.getByRole("combobox", { name: "Method" });
    await waitFor(() => expect(box).toHaveTextContent("Bank transfer"));
    await user.click(box);
    await user.click(screen.getByRole("option", { name: "UPI" }));
    await user.click(screen.getByText("save"));
    await waitFor(() => expect(submitted).toEqual({ method: "upi" }));
    await user.click(screen.getByText("reset"));
    await waitFor(() => expect(selectValue(box)).toBe("cash"));
    expect(box).toHaveTextContent("Cash");
  });
});

describe("IconButton", () => {
  it("shows its label as a tooltip on hover and focus", async () => {
    const user = userEvent.setup();
    render(<IconButton label="Reset password for Ravi" icon={<span>k</span>} />);
    await user.hover(screen.getByRole("button", { name: "Reset password for Ravi" }));
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Reset password for Ravi");
  });
});

describe("Breadcrumbs", () => {
  function Detail() {
    useCrumbLabel("PO-2026-0007");
    return null;
  }
  it("builds the trail from the URL, names detail pages, and links back to the parent", async () => {
    render(
      <MemoryRouter initialEntries={["/sites/s1/purchasing/orders/abc"]}>
        <CrumbProvider>
          <Breadcrumbs />
          <Detail />
        </CrumbProvider>
      </MemoryRouter>,
    );
    const nav = screen.getByRole("navigation", { name: "Breadcrumb" });
    await waitFor(() => expect(nav).toHaveTextContent("PO-2026-0007"));
    expect(nav.textContent).toMatch(/Sites.*Lakshmi Residency.*Purchasing.*Purchase orders.*PO-2026-0007/);
    expect(screen.getByRole("link", { name: "Back to Purchase orders" })).toHaveAttribute("href", "/sites/s1/purchasing/orders");
    expect(screen.getByRole("link", { name: "Purchasing" })).toHaveAttribute("href", "/sites/s1/purchasing/orders");
  });
});
