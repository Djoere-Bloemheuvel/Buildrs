import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Brain,
  Zap,
  CircleDollarSign,
  BarChart3,
  Settings,
  Database,
  Rocket
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SidebarFlyout } from './SidebarFlyout';
import { ThemeToggle } from './ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  {
    name: 'Action Center',
    icon: Rocket,
    color: 'primary',
    children: [
      { name: 'Dashboard', href: '/' }
    ]
  },
  {
    name: 'Database',
    icon: Database,
    color: 'emerald',
    children: [
      { name: 'Lead Database', href: '/lead-engine/database' }
    ]
  },
  {
    name: 'Lead Engine',
    icon: Zap,
    color: 'blue',
    children: [
      { name: 'Account Based Marketing', href: '/lead-engine/abm' },
      { name: 'LinkedIn', href: '/lead-engine/linkedin' },
      { name: 'E-mail', href: '/lead-engine/email' },
    ]
  },
  {
    name: 'Sales Engine',
    icon: CircleDollarSign,
    color: 'green',
    children: [
      { name: 'Deals', href: '/deals', badge: '12' },
      { name: 'Contacten', href: '/contacts', badge: 'Nieuw' },
      { name: 'Accounts', href: '/companies' },
      { name: 'Offertes', href: '/offertes', badge: 'Nieuw' },
      { name: 'Proposities', href: '/proposities' }
    ]
  },
  {
    name: 'Automations',
    icon: Brain,
    color: 'purple',
    children: [
      { name: 'Workflows', href: '/automations/workflows' },
      { name: 'Triggers', href: '/automations/triggers' },
      { name: 'Templates', href: '/automations/templates' },
      { name: 'Monitoring', href: '/automations/monitoring' }
    ]
  },
  {
    name: 'Analytics',
    icon: BarChart3,
    color: 'indigo',
    children: [
      { name: 'Dashboard', href: '/analytics' },
      { name: 'Rapporten', href: '/analytics/reports' },
      { name: 'Insights', href: '/analytics/insights' },
      { name: 'Performance', href: '/analytics/performance' }
    ]
  }
];

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const location = useLocation();
  const { theme } = useTheme();

  const sidebarClass = theme === 'premium-white' 
    ? 'bg-white border-r border-gray-200' 
    : 'apple-card border-r border-card-border';

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Desktop: Always collapsed to icon-only width, flush against left wall */}
      <div className="hidden lg:flex fixed inset-y-0 left-0 z-50 w-16">
        <div className={`flex h-full flex-col w-full ${sidebarClass} transition-colors duration-300 supports-[backdrop-filter]:backdrop-blur-xl rounded-none`}>
          {/* Header */}
          <div className={`flex items-center justify-center p-3 border-b transition-colors duration-300 rounded-none ${
            theme === 'premium-white' ? 'border-gray-200' : 'border-card-border'
          }`}>
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-2 space-y-2 overflow-y-auto transition-colors duration-300 rounded-none will-change-transform">
            {navigation.map((item) => (
              <div key={item.name} className="relative">
                <SidebarFlyout
                  name={item.name}
                  icon={item.icon}
                  color={item.color}
                  children={item.children}
                  isActive={false}
                />
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className={`p-2 border-t space-y-2 ${
            theme === 'premium-white' ? 'border-gray-200' : 'border-card-border'
          }`}>
            <ThemeToggle />
            <Link
              to="/settings"
              className={cn(
                "flex items-center justify-center w-12 h-12 transition-all duration-300 group relative",
                location.pathname === "/settings"
                  ? (theme === 'premium-white' ? "bg-blue-50" : "bg-[#0E1116]")
                  : ""
              )}
            >
              <Settings 
                className={cn(
                  "w-4 h-4 transition-all duration-300",
                  location.pathname === "/settings"
                    ? (theme === 'premium-white' ? "text-blue-600" : "text-white")
                    : (theme === 'premium-white' 
                        ? "text-gray-400" 
                        : "text-[#9CA3AF]"
                      )
                )}
              />
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile: Full sidebar sheet */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:hidden",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className={`flex h-full flex-col ${sidebarClass}`}>
          {/* Mobile Header */}
          <div className={`flex items-center justify-between p-6 border-b ${
            theme === 'premium-white' ? 'border-gray-200' : 'border-card-border'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className={`font-poppins font-semibold text-lg ${
                theme === 'premium-white' ? 'text-gray-900' : 'text-white'
              }`}>BUILDRS</span>
            </div>
            <button 
              onClick={onClose} 
              className={`lg:hidden hover:scale-110 transition-transform duration-200 p-2 rounded-lg ${
                theme === 'premium-white' ? 'hover:bg-gray-100' : 'hover:bg-glass/30'
              }`}
            >
              <svg className={`w-5 h-5 ${
                theme === 'premium-white' ? 'text-gray-600' : 'text-white'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mobile Navigation - Expanded view */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navigation.map((item) => (
              <div key={item.name}>
                {item.children ? (
                  <div className="space-y-2">
                    <div className={`flex items-center gap-3 p-3 rounded-xl ${
                      theme === 'premium-white' ? 'bg-gray-50' : 'bg-glass/20'
                    }`}>
                      <item.icon className={`w-5 h-5 ${
                        theme === 'premium-white' ? 'text-gray-500' : 'text-[#9CA3AF]'
                      }`} />
                      <span className={`font-medium ${
                        theme === 'premium-white' ? 'text-gray-900' : 'text-white'
                      }`}>{item.name}</span>
                    </div>
                    <div className="ml-4 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          to={child.href}
                          className={cn(
                            "flex items-center justify-between px-4 py-2 rounded-lg text-sm transition-all duration-300",
                            location.pathname === child.href
                              ? (theme === 'premium-white' 
                                  ? "bg-blue-50 text-blue-600 font-medium" 
                                  : "bg-white/5 text-white font-medium"
                                )
                              : (theme === 'premium-white' 
                                  ? "text-gray-600" 
                                  : "text-muted-foreground"
                                )
                          )}
                          onClick={onClose}
                        >
                          <span>{child.name}</span>
                          {child.badge && (
                            <Badge variant="secondary" className="text-xs">
                              {child.badge}
                            </Badge>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Link
                    to={item.href!}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl transition-all duration-300 group",
                      location.pathname === item.href
                        ? (theme === 'premium-white' ? "bg-blue-50" : "bg-white/5")
                        : ""
                    )}
                    onClick={onClose}
                  >
                    <item.icon 
                      className={cn(
                        "w-5 h-5 transition-all duration-300",
                        location.pathname === item.href
                          ? (theme === 'premium-white' ? "text-blue-600" : "text-white")
                          : (theme === 'premium-white' 
                              ? "text-gray-400" 
                              : "text-[#9CA3AF]"
                            )
                      )}
                    />
                    <span className={cn(
                      "font-medium transition-colors duration-300",
                      location.pathname === item.href
                        ? (theme === 'premium-white' ? "text-blue-600" : "text-white")
                        : (theme === 'premium-white' 
                            ? "text-gray-900" 
                            : "text-foreground"
                          )
                    )}>{item.name}</span>
                  </Link>
                )}
              </div>
            ))}
          </nav>

          {/* Mobile Footer */}
          <div className={`p-4 border-t space-y-2 ${
            theme === 'premium-white' ? 'border-gray-200' : 'border-card-border'
          }`}>
            <div className="flex items-center justify-between">
              <Link
                to="/settings"
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl transition-all duration-300 group flex-1",
                  location.pathname === "/settings"
                    ? (theme === 'premium-white' ? "bg-blue-50" : "bg-[#0E1116]")
                    : ""
                )}
                onClick={onClose}
              >
                <Settings 
                  className={cn(
                    "w-5 h-5 transition-all duration-300",
                    location.pathname === "/settings"
                      ? (theme === 'premium-white' ? "text-blue-600" : "text-[#7C84FF]")
                      : (theme === 'premium-white' 
                          ? "text-gray-400" 
                          : "text-[#9CA3AF]"
                        )
                  )}
                />
                <span className={cn(
                  "font-medium transition-colors duration-300",
                  location.pathname === "/settings"
                    ? (theme === 'premium-white' ? "text-blue-600" : "text-[#7C84FF]")
                    : (theme === 'premium-white' 
                        ? "text-gray-900" 
                        : "text-foreground"
                      )
                )}>Instellingen</span>
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
