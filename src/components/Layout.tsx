import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useStore } from '../store/useStore';
import './Layout.css';

export function Layout() {
  const { isAuthenticated } = useStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="layout-wrapper flex">
      <Sidebar />
      <div className="main-content flex-col">
        <Header />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
