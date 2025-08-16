
import { Bell, Search, Menu, User, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeSelector } from '@/components/ThemeSelector';
import { SignedIn, SignedOut, useUser, useClerk, UserProfile } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { useConvexAuth } from '@/hooks/useConvexAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useState } from 'react';

interface HeaderProps {
  onSidebarOpen?: () => void;
}

export const Header = ({ onSidebarOpen }: HeaderProps) => {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { getClientId, client } = useConvexAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);

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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                >
                  {user?.imageUrl ? (
                    <img
                      src={user.imageUrl}
                      alt={user.firstName || 'User'}
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.fullName || user?.firstName || 'User'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.primaryEmailAddress?.emailAddress}
                    </p>
                    <p className="text-xs leading-none text-orange-500 font-mono">
                      Client: {getClientId() || 'geen client'}
                    </p>
                    {client && (
                      <p className="text-xs leading-none text-blue-500">
                        {client.name} ({client.domain})
                      </p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowProfileModal(true)}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Account Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SignedIn>
        </div>
      </div>
      
      {/* Account Settings Modal */}
      <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <UserProfile 
            appearance={{
              elements: {
                rootBox: "w-full h-full",
                card: "shadow-none border-0 bg-white",
                navbar: "bg-white border-b",
                navbarMobileMenuButton: "text-gray-600",
                pageScrollBox: "bg-white",
                page: "bg-white",
                profileSectionPrimaryButton: "bg-blue-600 hover:bg-blue-700"
              }
            }}
          />
        </DialogContent>
      </Dialog>
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
