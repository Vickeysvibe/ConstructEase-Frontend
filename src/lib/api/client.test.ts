import { api, ApiError, getAccessToken, refreshSession, setSession } from "./client";

const session = (token: string) => ({
  accessToken: token,
  expiresIn: 900,
  user: { id: "u1", name: "Priya", email: "p@x.in", phone: "", orgRole: "owner" as const, status: "active" as const },
  org: { id: "o1", name: "Acme", timezone: "Asia/Kolkata" },
});
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("api client", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    setSession(session("old"));
  });

  it("sends the in-memory bearer token", async () => {
    fetchMock.mockResolvedValueOnce(json(200, { ok: true }));
    await api.get("/me");
    const [, init] = fetchMock.mock.calls[0]!;
    expect(init.headers.Authorization).toBe("Bearer old");
    expect(init.credentials).toBe("include");
  });

  it("refreshes once on 401 and retries with the new token", async () => {
    fetchMock
      .mockResolvedValueOnce(json(401, { code: "UNAUTHENTICATED" }))
      .mockResolvedValueOnce(json(200, session("new")))
      .mockResolvedValueOnce(json(200, { items: [] }));
    const res = await api.get<{ items: unknown[] }>("/sites");
    expect(res.items).toEqual([]);
    expect(fetchMock.mock.calls[1]![0]).toMatch(/\/auth\/refresh$/);
    expect(fetchMock.mock.calls[1]![1].headers["X-CE-CSRF"]).toBe("1");
    expect(fetchMock.mock.calls[2]![1].headers.Authorization).toBe("Bearer new");
    expect(getAccessToken()).toBe("new");
  });

  it("shares one refresh between concurrent 401s", async () => {
    fetchMock.mockImplementation(async (url: string, init: RequestInit) => {
      if (url.endsWith("/auth/refresh")) return json(200, session("new"));
      const auth = (init.headers as Record<string, string>).Authorization;
      return auth === "Bearer new" ? json(200, {}) : json(401, {});
    });
    await Promise.all([api.get("/a"), api.get("/b"), api.get("/c")]);
    expect(fetchMock.mock.calls.filter(([u]) => String(u).endsWith("/auth/refresh"))).toHaveLength(1);
  });

  it("signs out when refresh fails and surfaces problem details", async () => {
    fetchMock
      .mockResolvedValueOnce(json(401, {}))
      .mockResolvedValueOnce(json(401, {}))
      .mockResolvedValueOnce(json(401, {}));
    await expect(api.get("/sites")).rejects.toBeInstanceOf(ApiError);
    expect(getAccessToken()).toBeNull();
  });

  it("maps problem+json into ApiError with field errors", async () => {
    fetchMock.mockResolvedValueOnce(
      json(422, { code: "VALIDATION_FAILED", title: "Validation failed", detail: "Some fields are invalid.", errors: [{ path: "phone", message: "Enter a 10-digit mobile number" }] }),
    );
    const err = (await api.post("/sites/x/parties", {}).catch((e) => e)) as ApiError;
    expect(err.code).toBe("VALIDATION_FAILED");
    expect(err.errors[0]!.path).toBe("phone");
    expect(err.userMessage).toBe("Some fields are invalid.");
  });

  it("refreshSession resolves null without a cookie", async () => {
    fetchMock.mockResolvedValueOnce(json(401, {}));
    expect(await refreshSession()).toBeNull();
  });
});
