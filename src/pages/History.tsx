import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Search, Filter, History as HistoryIcon, ArrowDownToLine, ArrowUpFromLine, ArrowRightLeft, FileEdit } from 'lucide-react';

export function History() {
  const { movements, locations, products } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  const getLocationName = (id: string) => locations.find(l => l.id === id)?.name || id;
  
  const getProductLineStr = (lines: { productId: string, quantity: number }[]) => {
    if (lines.length === 0) return 'No items';
    if (lines.length === 1) {
      const p = products.find(p => p.id === lines[0].productId);
      return `${lines[0].quantity}x ${p?.name || 'Unknown'}`;
    }
    return `${lines.length} items (Total Qty: ${lines.reduce((acc, curr) => acc + curr.quantity, 0)})`;
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'RECEIPT': return <ArrowDownToLine size={18} className="text-success" />;
      case 'DELIVERY': return <ArrowUpFromLine size={18} className="text-danger" />;
      case 'TRANSFER': return <ArrowRightLeft size={18} className="text-primary" />;
      case 'ADJUSTMENT': return <FileEdit size={18} className="text-warning" />;
      default: return <HistoryIcon size={18} />;
    }
  };

  const getMovementBadgeColor = (type: string) => {
    switch (type) {
      case 'RECEIPT': return 'bg-success-light';
      case 'DELIVERY': return 'bg-danger-light';
      case 'TRANSFER': return 'bg-primary-light';
      case 'ADJUSTMENT': return 'bg-warning-light text-warning';
      default: return 'bg-secondary-light';
    }
  };

  const filteredHistory = useMemo(() => {
    return movements
      .filter(m => filterType === 'ALL' || m.type === filterType)
      .filter(m => 
        m.reference.toLowerCase().includes(searchTerm.toLowerCase()) || 
        getLocationName(m.fromLocationId).toLowerCase().includes(searchTerm.toLowerCase()) ||
        getLocationName(m.toLocationId).toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [movements, searchTerm, filterType, locations]);

  return (
    <div className="page-container flex-col gap-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Move History</h1>
          <p className="text-muted mt-1">Audit log of all inventory transactions and stock movements</p>
        </div>
      </div>

      <div className="card flex-col gap-4">
        <div className="flex justify-between items-center bg-bg-surface-hover p-2 rounded-md">
          <div className="search-bar flex items-center bg-bg-surface border-none shadow-sm" style={{ width: '350px', margin: 0 }}>
            <Search size={18} className="text-muted" />
            <input 
              type="text" 
              placeholder="Search reference, source, or destination..." 
              className="search-input"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-muted" />
            <span className="text-sm font-medium text-secondary">Filter Type:</span>
            <select 
              className="input-field py-1 h-auto cursor-pointer" 
              value={filterType} 
              onChange={e => setFilterType(e.target.value)}
            >
              <option value="ALL">All Movements</option>
              <option value="RECEIPT">Receipts (In)</option>
              <option value="DELIVERY">Deliveries (Out)</option>
              <option value="TRANSFER">Transfers (Internal)</option>
              <option value="ADJUSTMENT">Adjustments</option>
            </select>
          </div>
        </div>

        <div className="table-container shadow-sm border rounded-md" style={{ borderColor: 'var(--border)' }}>
          <table className="data-table">
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-surface-hover)' }}>
                <th>Reference</th>
                <th>Type</th>
                <th>Date</th>
                <th>From</th>
                <th>To</th>
                <th>Products Summary</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted" style={{ padding: '4rem' }}>
                     <div className="flex-col items-center gap-2">
                       <HistoryIcon size={32} className="opacity-50" />
                       <p>No inventory movements found matching your criteria.</p>
                     </div>
                  </td>
                </tr>
              ) : (
                filteredHistory.map(mov => (
                  <tr key={mov.id}>
                    <td className="font-semibold text-primary">{mov.reference}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex justify-center items-center ${getMovementBadgeColor(mov.type)}`}>
                          {getMovementIcon(mov.type)}
                        </div>
                        <span className="text-sm font-medium">{mov.type}</span>
                      </div>
                    </td>
                    <td className="text-sm text-secondary">{new Date(mov.date).toLocaleString()}</td>
                    <td className="text-sm">{getLocationName(mov.fromLocationId)}</td>
                    <td className="text-sm">{getLocationName(mov.toLocationId)}</td>
                    <td className="text-sm">
                      <div className="flex items-center gap-2 bg-bg-surface-hover px-2 py-1 rounded w-fit border" style={{ borderColor: 'var(--border)' }}>
                        <span className="truncate max-w-[200px]" title={getProductLineStr(mov.lines)}>
                          {getProductLineStr(mov.lines)}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${mov.status === 'DONE' ? 'success' : mov.status === 'CANCELED' ? 'danger' : 'warning'}`}>
                        {mov.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
