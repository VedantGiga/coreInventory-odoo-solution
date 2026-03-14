import { Bell, Search, LogOut } from 'lucide-react';
import { useStore } from '../store/useStore';
import './Header.css';

export function Header() {
  const { user, logout } = useStore();

  return (
    <header className="header flex items-center justify-between">
      <div className="search-bar flex items-center">
        <Search size={20} className="text-muted" />
        <input 
          type="text" 
          placeholder="Search products, SKUs, or orders..." 
          className="search-input"
        />
      </div>

      <div className="header-actions flex items-center gap-6">
        <button className="icon-btn relative">
          <Bell size={20} className="text-secondary" />
          <span className="notification-dot"></span>
        </button>

        <div className="user-profile flex items-center gap-3">
          <div className="avatar">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="user-info flex-col">
            <span className="user-name text-sm font-semibold">{user?.name}</span>
            <span className="user-role text-xs text-muted capitalize">{user?.role}</span>
          </div>
          <button onClick={logout} className="ml-2 text-muted hover:text-danger transition-colors">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
