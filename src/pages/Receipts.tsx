import { useState, useMemo } from 'react';
import { useStore, type MovementLine } from '../store/useStore';
import { ArrowDownToLine, Plus, Search, CheckCircle2, FileText, Trash2 } from 'lucide-react';
import './Receipts.css';

export function Receipts() {
  const { movements, locations, products, user, createMovement, validateMovement } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Receipt State
  const [fromLocationId, setFromLocationId] = useState('loc-vendor');
  const [toLocationId, setToLocationId] = useState('loc-main');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [lines, setLines] = useState<MovementLine[]>([]);
  const [notes, setNotes] = useState('');

  const receipts = useMemo(() => {
    return movements
      .filter(m => m.type === 'RECEIPT')
      .filter(m => 
        m.reference.toLowerCase().includes(searchTerm.toLowerCase()) || 
        locations.find(l => l.id === m.fromLocationId)?.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [movements, searchTerm, locations]);

  const vendorLocations = locations.filter(l => l.type === 'vendor');
  const internalLocations = locations.filter(l => l.type === 'warehouse' || l.type === 'rack');

  const getLocationName = (id: string) => locations.find(l => l.id === id)?.name || id;

  const handleOpenModal = () => {
    setFromLocationId('loc-vendor');
    setToLocationId('loc-main');
    setScheduledDate(new Date().toISOString().split('T')[0]);
    setLines([]);
    setNotes('');
    setIsModalOpen(true);
  };

  const handeCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleAddLine = () => {
    if (products.length === 0) return;
    setLines([...lines, { id: crypto.randomUUID(), productId: products[0].id, quantity: 1 }]);
  };

  const handleLineChange = (id: string, field: keyof MovementLine, value: any) => {
    setLines(lines.map(line => line.id === id ? { ...line, [field]: value } : line));
  };

  const handleRemoveLine = (id: string) => {
    setLines(lines.filter(line => line.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lines.length === 0) {
      alert("Please add at least one product to receive.");
      return;
    }

    createMovement({
      type: 'RECEIPT',
      fromLocationId,
      toLocationId,
      status: 'READY', // Straight to ready for simplicity
      date: scheduledDate,
      lines,
      notes,
      createdBy: user?.id || 'unknown'
    });

    handeCloseModal();
  };

  const handleValidate = (id: string) => {
    if (window.confirm("Are you sure you want to validate this receipt? This will update stock levels immediately.")) {
      validateMovement(id);
    }
  };

  return (
    <div className="page-container flex-col gap-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Receipts</h1>
          <p className="text-muted mt-1">Manage incoming shipments from vendors</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenModal}>
          <Plus size={18} /> New Receipt
        </button>
      </div>

      <div className="card flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="search-bar flex items-center" style={{ width: '300px', margin: 0 }}>
            <Search size={18} className="text-muted" />
            <input 
              type="text" 
              placeholder="Search reference or vendor..." 
              className="search-input"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>From (Vendor)</th>
                <th>To (Destination)</th>
                <th>Scheduled Date</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {receipts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted" style={{ padding: '3rem' }}>
                     No receipts found. Create a new receipt to get started.
                  </td>
                </tr>
              ) : (
                receipts.map(receipt => (
                  <tr key={receipt.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-success-light flex justify-center items-center text-success">
                          <ArrowDownToLine size={20} />
                        </div>
                        <div className="flex-col">
                          <span className="font-semibold">{receipt.reference}</span>
                          <span className="text-xs text-muted">{receipt.lines.length} items</span>
                        </div>
                      </div>
                    </td>
                    <td>{getLocationName(receipt.fromLocationId)}</td>
                    <td>{getLocationName(receipt.toLocationId)}</td>
                    <td>{new Date(receipt.date).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge badge-${receipt.status === 'DONE' ? 'success' : 'warning'}`}>
                        {receipt.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <button className="btn btn-secondary text-xs">View</button>
                        {receipt.status !== 'DONE' && (
                          <button className="btn btn-primary text-xs" onClick={() => handleValidate(receipt.id)}>
                            <CheckCircle2 size={16} /> Validate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay flex justify-center items-center">
          <div className="modal-content card flex-col gap-6 animate-fade-in" style={{ maxWidth: '800px' }}>
            <div className="flex justify-between items-center border-b pb-4" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-xl font-semibold">New Receipt</h2>
              <button className="icon-btn" onClick={handeCloseModal}>✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-col gap-6">
              <div className="grid gap-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group flex-col">
                  <label className="label">Receive From (Vendor) *</label>
                  <select required className="input-field" value={fromLocationId} onChange={e => setFromLocationId(e.target.value)}>
                    {vendorLocations.map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group flex-col">
                  <label className="label">Destination Location *</label>
                  <select required className="input-field" value={toLocationId} onChange={e => setToLocationId(e.target.value)}>
                    {internalLocations.map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group flex-col">
                  <label className="label">Scheduled Date *</label>
                  <input required type="date" className="input-field" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} />
                </div>
                <div className="form-group flex-col">
                  <label className="label">Reference / Notes</label>
                  <input type="text" className="input-field" placeholder="PO-2023-001" value={notes} onChange={e => setNotes(e.target.value)} />
                </div>
              </div>

              <div className="lines-section flex-col gap-3 mt-2">
                <div className="flex justify-between items-center border-b pb-2" style={{ borderColor: 'var(--border)' }}>
                  <h3 className="text-sm font-semibold flex items-center gap-2"><FileText size={16}/> Products</h3>
                  <button type="button" className="text-primary text-sm font-medium hover:underline" onClick={handleAddLine}>+ Add Line</button>
                </div>

                {lines.length === 0 ? (
                  <div className="text-center p-4 text-muted text-sm border border-dashed rounded" style={{ borderColor: 'var(--border)' }}>
                    Click "+ Add Line" to add products to this receipt.
                  </div>
                ) : (
                  <div className="flex-col gap-2">
                    {lines.map((line, index) => (
                      <div key={line.id} className="flex gap-3 items-center">
                        <span className="text-xs text-muted w-6">{index + 1}.</span>
                        <select 
                          className="input-field flex-1" 
                          value={line.productId}
                          onChange={e => handleLineChange(line.id, 'productId', e.target.value)}
                        >
                          {products.map(p => (
                            <option key={p.id} value={p.id}>[{p.sku}] {p.name}</option>
                          ))}
                        </select>
                        <input 
                          type="number" 
                          min="1" 
                          className="input-field w-32" 
                          value={line.quantity}
                          onChange={e => handleLineChange(line.id, 'quantity', parseInt(e.target.value))}
                          placeholder="Qty"
                        />
                        <button type="button" className="icon-btn text-danger" onClick={() => handleRemoveLine(line.id)}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t mt-4" style={{ borderColor: 'var(--border)' }}>
                <button type="button" className="btn btn-secondary" onClick={handeCloseModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Receipt</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
