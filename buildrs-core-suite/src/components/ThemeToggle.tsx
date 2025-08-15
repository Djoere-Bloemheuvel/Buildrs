
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="relative w-12 h-12 rounded-full apple-card hover:apple-card-hover transition-all duration-300 hover:scale-105 group"
    >
      {theme === 'premium-black' ? (
        <Sun className="w-5 h-5 text-accent-orange transition-all duration-300 group-hover:rotate-180 group-hover:scale-110" />
      ) : (
        <Moon className="w-5 h-5 text-primary transition-all duration-300 group-hover:-rotate-12 group-hover:scale-110" />
      )}
    </Button>
  );
};
