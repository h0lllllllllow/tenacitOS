export const THEMES = [
  { id: "nightshift", label: "Nightshift" },
  { id: "midnight", label: "Midnight Blue" },
  { id: "neon", label: "Neon Night" },
  { id: "shadow", label: "Shadow" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

export const DEFAULT_THEME: ThemeId = "shadow";
export const THEME_STORAGE_KEY = "nightshift-theme";

export function isThemeId(value: string | null | undefined): value is ThemeId {
  return !!value && THEMES.some((theme) => theme.id === value);
}
