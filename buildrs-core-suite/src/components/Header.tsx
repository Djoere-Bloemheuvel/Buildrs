
import { Bell, Search, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeSelector } from '@/components/ThemeSelector';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';

interface HeaderProps {
  onSidebarOpen?: () => void;
}

export const Header = ({ onSidebarOpen }: HeaderProps) => {

  return (
    <header className="border-b border-border bg-card/50">
      <div className="flex h-16 items-center gap-4 px-4 lg:px-6">
        {/* Mobile menu button */}
        {onSidebarOpen && (
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onSidebarOpen}
          >
            <Menu className="h-4 w-4" />
          </Button>
        )}
        
        <div className="flex flex-1 items-center gap-4">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Zoeken..."
              className="pl-8"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Unify hover across themes */}
          <ThemeAwareIconButton>
            <Bell className="h-4 w-4" />
          </ThemeAwareIconButton>
          
          <ThemeSelector />
          
          {/* Clerk Authentication */}
          <SignedOut>
            <Link to="/sign-in">
              <Button variant="ghost" size="sm">
                Inloggen
              </Button>
            </Link>
            <Link to="/sign-up">
              <Button size="sm">
                Registreren
              </Button>
            </Link>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </div>
    </header>
  );
};

function ThemeAwareIconButton({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme()
  // No hover background in either theme
  const hoverClass = 'hover:bg-transparent'
  return (
    <Button variant="ghost" size="icon" className={hoverClass + ' focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none'}>
      {children}
    </Button>
  )
}
