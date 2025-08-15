import React, { createContext, useContext, useEffect, useState } from 'react';
import { applyThemeTokens } from '@/theme/tokens';
import { THEME_KEY, DEFAULT_THEME, VALID_THEMES, type Theme } from '@/constants/theme';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check localStorage first, default to premium-jet-black
    const saved = localStorage.getItem(THEME_KEY);
    // If saved theme is not one of our valid themes, default to premium-jet-black
    if (saved && VALID_THEMES.includes(saved as Theme)) {
      return saved as Theme;
    }
    return DEFAULT_THEME;
  });

  const toggleTheme = () => {
    setTheme(theme === 'premium-white' ? 'premium-black' : 'premium-white');
  };

  useEffect(() => {
    // Always save theme preference to localStorage
    localStorage.setItem(THEME_KEY, theme);

    // Check if we're on an auth route - if so, don't apply any theme styling
    const isAuthRoute = document.body.classList.contains('auth-route');
    
    if (isAuthRoute) {
      // Don't apply any theme classes or tokens on auth routes
      // The auth pages have their own dedicated CSS styling
      return;
    }

    const root = document.documentElement;
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    // Remove all theme classes first
    root.classList.remove('light', 'dark', 'premium-white', 'premium-black', 'premium-jet-black', 'theme-premium-black', 'theme-premium-jet-black');
    
    // Add the current theme class
    root.classList.add(theme);
    
    // Add theme-specific override classes
    if (theme === 'premium-black') {
      root.classList.add('theme-premium-black');
    } else if (theme === 'premium-jet-black') {
      root.classList.add('theme-premium-jet-black');
    }
    
    // Also add 'light' class for premium-white to ensure compatibility
    if (theme === 'premium-white') {
      root.classList.add('light');
    } else {
      // Add 'dark' class for dark themes
      root.classList.add('dark');
    }
    
    // Smooth theme transition: temporarily add a class that enables color/background transitions
    if (!prefersReducedMotion) {
      root.classList.add('theme-transition');
      window.setTimeout(() => {
        root.classList.remove('theme-transition');
      }, 300);
    }

    // Apply theme tokens only for non-auth routes
    applyThemeTokens(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
