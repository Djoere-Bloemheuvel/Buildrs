
import { Sparkles, ChevronDown, Zap, Flame } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { type Theme } from '@/constants/theme';

const themeOptions = [
  { value: 'premium-white' as const, label: 'Premium White', icon: Sparkles },
  { value: 'premium-black' as const, label: 'Premium Black', icon: Zap },
  { value: 'premium-jet-black' as const, label: 'Premium Jet Black', icon: Flame },
];

export const ThemeSelector = () => {
  const { theme, setTheme } = useTheme();
  
  const currentTheme = themeOptions.find(option => option.value === theme);
  const CurrentIcon = currentTheme?.icon || Sparkles;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-10 px-3 rounded-full border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] transition-all duration-300 group"
        >
          <CurrentIcon className="w-4 h-4 mr-2 text-primary transition-all duration-300" />
          <span className="text-sm">{currentTheme?.label}</span>
          <ChevronDown className="w-4 h-4 ml-2 transition-all duration-300 group-hover:rotate-180" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-48 bg-card/95 backdrop-blur-xl border-card-border/60 rounded-2xl shadow-2xl z-50"
        sideOffset={8}
      >
        {themeOptions.map((option) => {
          const Icon = option.icon;
          const isActive = theme === option.value;
          
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => setTheme(option.value)}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200
                ${isActive 
                  ? 'bg-primary/20 text-primary font-medium' 
                  : 'hover:bg-accent/30 hover:text-foreground'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span>{option.label}</span>
              {isActive && (
                <div className="ml-auto w-2 h-2 bg-primary rounded-full animate-pulse" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
