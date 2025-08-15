
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { TopCards } from '@/components/dashboard/TopCards';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { RecentSales } from '@/components/dashboard/RecentSales';
import { BottomCards } from '@/components/dashboard/BottomCards';
import { useTheme } from '@/contexts/ThemeContext';

const Dashboard = () => {
  const { theme } = useTheme();

  const bgClass = theme === 'premium-white' 
    ? 'bg-gray-50' 
    : 'min-h-screen bg-gradient-to-br from-[#0B0D12] to-[#1A1D29]';

  const containerClass = theme === 'premium-white'
    ? 'space-y-8'
    : 'space-y-8 relative z-10';

  return (
    <div className={bgClass}>
      <div className={containerClass}>
        <div className="space-y-8">
          <StatsGrid />
          <TopCards />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <QuickActions />
            </div>
            <div>
              <RecentActivity />
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecentSales />
            <BottomCards />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
