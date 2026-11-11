import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./auth";
import { RequireAuth } from "./guards";

function Where() {
  const l = useLocation();
  return <p>at {l.pathname + l.search}</p>;
}

describe("RequireAuth", () => {
  it("sends a visitor without a session to /login with a return path", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 401 })));
    render(
      <QueryClientProvider client={new QueryClient()}>
        <AuthProvider>
          <MemoryRouter initialEntries={["/sites/abc/stock"]}>
            <Routes>
              <Route element={<RequireAuth />}>
                <Route path="/sites/:id/stock" element={<p>secret stock</p>} />
              </Route>
              <Route path="/login" element={<Where />} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>,
    );
    expect(await screen.findByText(/at \/login\?next=%2Fsites%2Fabc%2Fstock/)).toBeInTheDocument();
    expect(screen.queryByText("secret stock")).not.toBeInTheDocument();
  });
});
