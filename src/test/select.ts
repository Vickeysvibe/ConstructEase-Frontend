import { screen, within } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";

/** The hidden native <select> behind a kit Select (found from its visible combobox button). */
export function nativeSelectOf(combobox: HTMLElement): HTMLSelectElement {
  const el = combobox.closest(".ce-select")?.querySelector("select");
  if (!el) throw new Error("not a kit Select");
  return el;
}

/** Current value of a kit Select. */
export const selectValue = (combobox: HTMLElement) => nativeSelectOf(combobox).value;

/** Opens a kit Select and clicks the option with this value, like a user would. */
export async function chooseOption(user: UserEvent, combobox: HTMLElement, value: string) {
  const option = Array.from(nativeSelectOf(combobox).options).find((o) => o.value === value);
  if (!option) throw new Error(`Value "${value}" not found in options`);
  await user.click(combobox);
  const listbox = await screen.findByRole("listbox");
  await user.click(within(listbox).getByRole("option", { name: option.textContent ?? "" }));
}
