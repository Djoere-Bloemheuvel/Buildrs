import { type Theme } from '@/constants/theme';

export type ThemeName = Theme

type ThemeTokens = {
  primary: string
  secondary: string
  background: string
  foreground: string
  card: string
  'card-foreground': string
  muted: string
  'muted-foreground': string
  accent: string
  'accent-foreground': string
  border: string
  input: string
  ring: string
  glow: string
}

export const THEME_TOKENS: Record<ThemeName, ThemeTokens> = {
  'premium-white': {
    primary: '210 100% 60%',
    secondary: '220 100% 70%',
    background: '0 0% 100%',
    foreground: '222.2 84% 4.9%',
    card: '0 0% 100%',
    'card-foreground': '222.2 84% 4.9%',
    muted: '210 40% 96%',
    'muted-foreground': '215.4 16.3% 46.9%',
    accent: '210 40% 96%',
    'accent-foreground': '222.2 84% 4.9%',
    border: '214.3 31.8% 91.4%',
    input: '214.3 31.8% 91.4%',
    ring: '210 100% 60%',
    glow: '210 100% 60%'
  },
  'premium-black': {
    primary: '213 100% 58%',              // Gradient blue for primary interactive elements
    secondary: '220 15% 25%',             // Dark secondary for subtle elements
    background: '240 6% 4%',              // Deep premium black (#0B0B0D)
    foreground: '0 0% 100%',              // Pure white text
    card: '240 6% 6% / 0.85',            // Semi-transparent black cards
    'card-foreground': '0 0% 100%',       // White text on cards
    muted: '240 5% 12%',                  // Muted background elements
    'muted-foreground': '0 0% 55%',       // Muted text (55% opacity white)
    accent: '240 5% 8%',                  // Subtle accent for hover states
    'accent-foreground': '0 0% 100%',     // White text on accents
    border: '0 0% 100% / 0.08',          // Very subtle white borders
    input: '0 0% 100% / 0.04',           // Subtle input backgrounds
    ring: '213 100% 58%',                // Blue focus rings
    glow: '213 100% 58%'                 // Blue glow for accent elements
  },
  'premium-jet-black': {
    primary: '220 100% 55%',              // Deep blue for primary elements 
    secondary: '225 15% 20%',             // Dark blue-gray secondary
    background: '225 15% 3%',             // Off-black with subtle blue tint (#080A0F)
    foreground: '0 0% 98%',               // Near-white text
    card: '225 20% 5% / 0.85',           // Semi-transparent off-black cards
    'card-foreground': '0 0% 98%',        // Near-white text on cards
    muted: '225 15% 8%',                  // Muted background with blue tint
    'muted-foreground': '0 0% 60%',       // Muted text
    accent: '225 20% 6%',                 // Subtle accent for hover states
    'accent-foreground': '0 0% 98%',      // Near-white text on accents
    border: '220 50% 35% / 0.15',        // Subtle dark blue borders
    input: '220 50% 35% / 0.08',         // Subtle dark blue input backgrounds
    ring: '220 100% 55%',                // Deep blue focus rings
    glow: '220 100% 55%'                 // Deep blue glow for accent elements
  },
}

export function applyThemeTokens(theme: ThemeName) {
  const root = document.documentElement
  const tokens = THEME_TOKENS[theme]
  if (!tokens) return
  
  // Apply all token values as CSS custom properties
  Object.entries(tokens).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value)
  })
}
