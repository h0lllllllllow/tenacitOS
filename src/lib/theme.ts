export const THEMES = [
  { id: "nightshift", label: "Nightshift" },
  { id: "midnight", label: "Midnight Blue" },
  { id: "neon", label: "Neon Night" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

export const DEFAULT_THEME: ThemeId = "nightshift";
export const THEME_STORAGE_KEY = "nightshift-theme";

export function isThemeId(value: string | null | undefined): value is ThemeId {
  return !!value && THEMES.some((theme) => theme.id === value);
}
