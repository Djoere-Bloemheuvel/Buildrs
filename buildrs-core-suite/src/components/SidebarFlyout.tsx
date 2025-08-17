
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  ChevronRight, 
  Database, 
  Target, 
  Linkedin, 
  Mail, 
  HandCoins, 
  Users, 
  Building2, 
  FileText, 
  Lightbulb,
  Megaphone,
  Hash,
  Share2,
  Search,
  LayoutDashboard,
  Inbox,
  FolderOpen,
  CheckSquare,
  Calendar,
  PlayCircle,
  BarChart,
  FileBarChart,
  Eye,
  Zap
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/contexts/ThemeContext';

interface SubMenuItem {
  name: string;
  href: string;
  badge?: string;
}

interface FlyoutProps {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  children: SubMenuItem[];
  isActive: boolean;
}

// Icon mapping for submenu items
const getSubmenuIcon = (name: string) => {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    'Database': Database,
    'Account Based Marketing': Target,
    'LinkedIn': Linkedin,
    'E-mail': Mail,
    'Deals': HandCoins,
    'Contacten': Users,
    'Accounts': Building2,
    'Offertes': FileText,
    'Proposities': Lightbulb,
    'Campagnes': Megaphone,
    'Content': Hash,
    'Social Media': Share2,
    'SEO': Search,
    'Dashboard': LayoutDashboard,
    'Inbox': Inbox,
    'Projecten': FolderOpen,
    'Taken': CheckSquare,
    'Kalender': Calendar,
    'Sessies': PlayCircle,
    'Rapporten': FileBarChart,
    'Insights': Eye,
    'Performance': Zap
  };
  
  return iconMap[name] || BarChart;
};

export const SidebarFlyout = ({ name, icon: Icon, color, children, isActive }: FlyoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const { theme } = useTheme();
  const openTimer = useRef<number | null>(null);
  const closeTimer = useRef<number | null>(null);

  const cancelTimers = () => {
    if (openTimer.current) {
      window.clearTimeout(openTimer.current);
      openTimer.current = null;
    }
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const openWithDelay = () => {
    cancelTimers();
    openTimer.current = window.setTimeout(() => setIsOpen(true), 90);
  };
  const closeWithDelay = () => {
    cancelTimers();
    closeTimer.current = window.setTimeout(() => setIsOpen(false), 180);
  };

  useEffect(() => () => cancelTimers(), []);

  const hasActiveChild = children.some(child => location.pathname === child.href);
  const activeBg = theme === 'premium-white' ? 'bg-blue-50' : 'bg-white/5';

  const handleIconClick = () => {
    // Navigate to first child when clicking on icon
    if (children.length > 0) {
      navigate(children[0].href);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div
          className={cn(
            "flex items-center justify-center w-12 h-12 transition-all duration-300 group cursor-pointer relative rounded-none",
            hasActiveChild || isActive ? activeBg : "hover:bg-transparent"
          )}
          onMouseEnter={openWithDelay}
          onMouseLeave={closeWithDelay}
          onClick={handleIconClick}
        >
          <span className={cn(
            "icon-glow-wrap",
            (hasActiveChild || isActive) ? "icon-glow-active" : ""
          )}>
          <Icon 
            className={cn(
              "w-4 h-4 transition-all duration-300 icon-glow",
              hasActiveChild || isActive
                ? (theme === 'premium-white'
                    ? "text-blue-600 [--icon-glow-color:rgba(59,130,246,0.35)] [--icon-glow-blur:8px]"
                    : "text-[#7C84FF] [--icon-glow-color:rgba(124,132,255,0.45)] [--icon-glow-blur:8px]")
                : (theme === 'premium-white'
                    ? "text-gray-400 group-hover:text-blue-500 [--icon-glow-color:rgba(59,130,246,0.35)] [--icon-glow-blur:0px] group-hover:[--icon-glow-blur:8px]"
                    : "text-[#9CA3AF] group-hover:text-[#E0E7FF] [--icon-glow-color:rgba(224,231,255,0.4)] [--icon-glow-blur:0px] group-hover:[--icon-glow-blur:8px]")
            )}
          />
          </span>
        </div>
      </PopoverTrigger>
      
      <PopoverContent
        side="right"
        align="start"
        sideOffset={10}
        className="w-72 max-h-[70vh] overflow-y-auto p-0 rounded-xl will-change-transform bg-white/95 supports-[backdrop-filter]:backdrop-blur-xl border border-gray-200 shadow-2xl animate-in fade-in-0 slide-in-from-left-1 duration-150 ease-in-out"
        onMouseEnter={openWithDelay}
        onMouseLeave={closeWithDelay}
        onWheelCapture={() => setIsOpen(true)}
      >
        {/* Header - only show if more than 1 item */}
        {children.length > 1 && (
          <div className="sticky top-0 z-10 p-4 border-b border-gray-200 bg-gray-50/90 supports-[backdrop-filter]:backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <Icon className="w-4 h-4 text-gray-500" />
              <h3 className="font-poppins font-semibold text-lg text-gray-900">{name}</h3>
            </div>
          </div>
        )}

        {/* Menu Items */}
        <div className="p-2 space-y-1">
          {children.map((item) => {
            const ItemIcon = getSubmenuIcon(item.name);
            const isItemActive = location.pathname === item.href;
            
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-300 hover:bg-gray-50 hover:scale-[1.02] group",
                  isItemActive
                    ? "bg-blue-50 text-blue-600 font-medium"
                    : "text-gray-600 hover:text-blue-600"
                )}
                onMouseEnter={() => {
                  // Prefetch route chunk by creating a prefetch link element
                  const l = document.createElement('link');
                  l.rel = 'prefetch';
                  l.as = 'document';
                  l.href = item.href;
                  document.head.appendChild(l);
                }}
                onClick={() => setIsOpen(false)}
              >
                <ItemIcon 
                  className={cn(
                    "w-4 h-4 transition-all duration-300",
                    isItemActive
                      ? "text-blue-600"
                      : "text-gray-400 group-hover:text-blue-500"
                  )}
                />
                <span className="flex-1">{item.name}</span>
                <div className="flex items-center gap-2">
                  {item.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {item.badge}
                    </Badge>
                  )}
                  <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};
