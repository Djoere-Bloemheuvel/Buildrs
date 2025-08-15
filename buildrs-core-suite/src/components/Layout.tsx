
import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useTheme } from '@/contexts/ThemeContext';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme } = useTheme();

  const mainClass = theme === 'premium-white'
    ? 'bg-gray-50'
    : 'bg-background';

  return (
    <div className="min-h-screen">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-16">
        <Header onSidebarOpen={() => setSidebarOpen(true)} />
        <main className={`p-6 ${mainClass}`}>
          {children}
        </main>
      </div>
    </div>
  );
};
