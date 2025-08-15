import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export default function SalesLayout() {
  const location = useLocation()
  const items = [
    { name: 'Deals', href: '/sales/deals' },
    { name: 'Contacten', href: '/sales/contacts' },
    { name: 'Accounts', href: '/sales/accounts' },
    { name: 'Offertes', href: '/sales/proposals' },
  ] as const

  return (
    <div className="space-y-6">
      <Card className="p-4 md:p-6">
        <div className="flex flex-wrap items-center gap-2">
          {items.map((i) => (
            <NavLink
              key={i.href}
              to={i.href}
              className={({ isActive }) =>
                cn(
                  'px-3 py-2 rounded-xl text-sm transition-colors',
                  isActive ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50'
                )
              }
            >
              {i.name}
            </NavLink>
          ))}
        </div>
      </Card>

      <Outlet />
    </div>
  )
}

