import { useMemo } from 'react';
import { Package, ArrowDownToLine, ArrowUpFromLine, AlertCircle, Clock } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';

export function Dashboard() {
  const { products, stockLevels, movements } = useStore();
  const navigate = useNavigate();

  // KPIs
  const totalProducts = products.length;

  const lowStockItems = useMemo(() => {
    return products.filter(p => {
      const stock = stockLevels
        .filter(s => s.productId === p.id)
        .reduce((acc, curr) => acc + curr.quantity, 0);
      return stock <= p.reorderPoint;
    });
  }, [products, stockLevels]);

  const pendingReceipts = movements.filter(m => m.type === 'RECEIPT' && m.status !== 'DONE' && m.status !== 'CANCELED').length;
  const pendingDeliveries = movements.filter(m => m.type === 'DELIVERY' && m.status !== 'DONE' && m.status !== 'CANCELED').length;

  const getProductStock = (productId: string) => {
    return stockLevels
      .filter(s => s.productId === productId)
      .reduce((acc, curr) => acc + curr.quantity, 0);
  };

  const getLocationName = (id: string) => {
    const locations = useStore.getState().locations;
    return locations.find(l => l.id === id)?.name || id;
  };

  // Recent Activity
  const recentMovements = [...movements].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  return (
    <div className="dashboard-container flex-col gap-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Inventory Dashboard</h1>
          <p className="text-muted mt-1">Overview of your current stock and operations</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary">Download Report</button>
          <button className="btn btn-primary" onClick={() => navigate('/receipts')}>+ New Operation</button>
        </div>
      </div>

      <div className="kpi-grid grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
        <div className="card flex-col gap-2 cursor-pointer" onClick={() => navigate('/products')}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-secondary">Total Products</h3>
            <div className="p-2 rounded bg-primary-light text-primary">
              <Package size={20} />
            </div>
          </div>
          <span className="text-2xl font-semibold">{totalProducts}</span>
          <span className="text-xs text-muted">Active in catalog</span>
        </div>

        <div className="card flex-col gap-2 cursor-pointer" onClick={() => navigate('/products')}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-secondary">Low Stock Items</h3>
            <div className="p-2 rounded bg-warning-light text-warning">
              <AlertCircle size={20} />
            </div>
          </div>
          <span className="text-2xl font-semibold text-warning">{lowStockItems.length}</span>
          <span className="text-xs text-muted">Requires attention</span>
        </div>

        <div className="card flex-col gap-2 cursor-pointer" onClick={() => navigate('/receipts')}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-secondary">Pending Receipts</h3>
            <div className="p-2 rounded bg-success-light text-success">
              <ArrowDownToLine size={20} />
            </div>
          </div>
          <span className="text-2xl font-semibold">{pendingReceipts}</span>
          <span className="text-xs text-muted">Awaiting in receiving bay</span>
        </div>

        <div className="card flex-col gap-2 cursor-pointer" onClick={() => navigate('/deliveries')}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-secondary">Pending Deliveries</h3>
            <div className="p-2 rounded bg-danger-light text-danger">
              <ArrowUpFromLine size={20} />
            </div>
          </div>
          <span className="text-2xl font-semibold text-danger">{pendingDeliveries}</span>
          <span className="text-xs text-muted">To be shipped out</span>
        </div>
      </div>

      <div className="grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginTop: '1rem' }}>
        <div className="card flex-col gap-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Recent Activity</h2>
            <button className="text-primary text-sm font-medium" onClick={() => navigate('/history')}>View All</button>
          </div>
          
          <div className="flex-col gap-0 border rounded-md overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            {recentMovements.length === 0 ? (
              <div className="flex items-center justify-center p-8 text-muted">
                No recent movements found.
              </div>
            ) : (
              recentMovements.map((mov, idx) => (
                <div key={mov.id} className="flex justify-between items-center p-4" style={{ borderBottom: idx !== recentMovements.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full flex justify-center items-center" style={{ backgroundColor: 'var(--bg-surface-hover)' }}>
                      {mov.type === 'RECEIPT' ? <ArrowDownToLine size={18} className="text-success" /> : 
                       mov.type === 'DELIVERY' ? <ArrowUpFromLine size={18} className="text-danger" /> : 
                       <Clock size={18} className="text-primary" />}
                    </div>
                    <div className="flex-col">
                      <span className="font-medium text-sm">{mov.reference}</span>
                      <span className="text-xs text-muted">{getLocationName(mov.fromLocationId)} → {getLocationName(mov.toLocationId)}</span>
                    </div>
                  </div>
                  <div className="flex-col items-end">
                    <span className={`badge badge-${mov.status === 'DONE' ? 'success' : mov.status === 'CANCELED' ? 'danger' : 'warning'} mb-1`}>{mov.status}</span>
                    <span className="text-xs text-muted">{new Date(mov.date).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card flex-col gap-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Low Stock Alert</h2>
            <button className="text-primary text-sm font-medium" onClick={() => navigate('/products')}>Manage</button>
          </div>
          
          <div className="flex-col gap-3">
            {lowStockItems.length === 0 ? (
              <div className="p-4 border rounded-md text-center text-muted text-sm" style={{ borderColor: 'var(--border)' }}>
                All clear! No low stock items.
              </div>
            ) : (
              lowStockItems.slice(0, 5).map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-md hover:bg-bg-surface-hover transition-colors" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-warning-light flex justify-center items-center text-warning">
                      <Package size={16} />
                    </div>
                    <div className="flex-col">
                      <span className="text-sm font-medium">{item.name}</span>
                      <span className="text-xs text-muted">SKU: {item.sku}</span>
                    </div>
                  </div>
                  <div className="flex-col items-end">
                    <span className="text-sm font-semibold text-danger">{getProductStock(item.id)} {item.unit}</span>
                    <span className="text-xs text-muted text-right">Min: {item.reorderPoint}</span>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {lowStockItems.length > 5 && (
            <button className="btn btn-secondary w-full" onClick={() => navigate('/products')}>
              View All {lowStockItems.length} Items
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
