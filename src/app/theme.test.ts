import { act, renderHook } from "@testing-library/react";
import { applyTheme, readThemePref, useTheme } from "./theme";

describe("theme", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it("defaults to system (no data-theme, the OS decides)", () => {
    expect(readThemePref()).toBe("system");
    applyTheme("system");
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
  });

  it("applies and remembers light/dark, and system clears it", () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current[1]("light"));
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(localStorage.getItem("ce-theme")).toBe("light");
    act(() => result.current[1]("dark"));
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    act(() => result.current[1]("system"));
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
    expect(localStorage.getItem("ce-theme")).toBeNull();
  });
});
