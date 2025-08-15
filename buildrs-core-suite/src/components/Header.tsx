
import { Bell, Search, User, LogOut, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ThemeSelector } from '@/components/ThemeSelector';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useTheme } from '@/contexts/ThemeContext';

interface HeaderProps {
  onSidebarOpen?: () => void;
}

export const Header = ({ onSidebarOpen }: HeaderProps) => {
  const {
    user,
    profile,
    signOut
  } = useAuth();
  
  const handleSignOut = async () => {
    const {
      error
    } = await signOut();
    if (error) {
      toast.error('Fout bij uitloggen');
    } else {
      toast.success('Succesvol uitgelogd');
    }
  };

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
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <ThemeAwareIconButton>
                <User className="h-4 w-4" />
              </ThemeAwareIconButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                {profile?.full_name || user?.email}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Uitloggen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
