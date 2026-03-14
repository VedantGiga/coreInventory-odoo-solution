import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  ArrowRightLeft, 
  SlidersHorizontal,
  History,
  Settings,
  User
} from 'lucide-react';
import clsx from 'clsx';
import './Sidebar.css';

export function Sidebar() {
  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/products', icon: Package, label: 'Products' },
    { to: '/receipts', icon: ArrowDownToLine, label: 'Receipts' },
    { to: '/deliveries', icon: ArrowUpFromLine, label: 'Deliveries' },
    { to: '/transfers', icon: ArrowRightLeft, label: 'Internal Transfers' },
    { to: '/adjustments', icon: SlidersHorizontal, label: 'Adjustments' },
    { to: '/history', icon: History, label: 'Move History' },
  ];

  const bottomNavItems = [
    { to: '/settings', icon: Settings, label: 'Settings' },
    { to: '/profile', icon: User, label: 'My Profile' },
  ];

  return (
    <aside className="sidebar flex-col justify-between">
      <div>
        <div className="sidebar-brand flex items-center gap-3">
          <div className="brand-logo glass flex justify-center items-center">
            <Package size={24} className="text-primary" />
          </div>
          <span className="text-xl font-semibold">CoreInventory</span>
        </div>

        <nav className="sidebar-nav flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => 
                clsx('nav-link flex items-center gap-3', isActive && 'active')
              }
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="sidebar-footer">
        <nav className="flex-col gap-1">
          {bottomNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => 
                clsx('nav-link flex items-center gap-3', isActive && 'active')
              }
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
}
