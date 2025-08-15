
export const THEME_KEY = "theme";
export const DEFAULT_THEME = "premium-jet-black";

export const VALID_THEMES = [
  'premium-white',
  'premium-black', 
  'premium-jet-black'
] as const;

export type Theme = typeof VALID_THEMES[number];
