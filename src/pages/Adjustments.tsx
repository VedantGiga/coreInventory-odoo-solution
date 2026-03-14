import { useState, useMemo } from 'react';
import { useStore, type MovementLine } from '../store/useStore';
import { FileEdit, Plus, Search, CheckCircle2, FileText, Trash2 } from 'lucide-react';
import './Receipts.css'; // Reusing modal and table styles

export function Adjustments() {
  const { movements, locations, products, user, createMovement, validateMovement } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Adjustment State
  const [targetLocationId, setTargetLocationId] = useState('loc-main');
  const [adjDirection, setAdjDirection] = useState<'ADD' | 'REMOVE'>('ADD');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [lines, setLines] = useState<MovementLine[]>([]);
  const [notes, setNotes] = useState('');

  const adjustments = useMemo(() => {
    return movements
      .filter(m => m.type === 'ADJUSTMENT')
      .filter(m => 
        m.reference.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [movements, searchTerm]);

  const internalLocations = locations.filter(l => l.type === 'warehouse' || l.type === 'rack');
  const virtualLocation = locations.find(l => l.type === 'virtual') || { id: 'loc-virtual' };

  const getLocationName = (id: string) => locations.find(l => l.id === id)?.name || id;

  const handleOpenModal = () => {
    setTargetLocationId('loc-main');
    setAdjDirection('ADD');
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
      alert("Please add at least one product to adjust.");
      return;
    }

    // Determine from/to based on direction
    const fromLocationId = adjDirection === 'ADD' ? virtualLocation.id : targetLocationId;
    const toLocationId = adjDirection === 'ADD' ? targetLocationId : virtualLocation.id;

    createMovement({
      type: 'ADJUSTMENT',
      fromLocationId,
      toLocationId,
      status: 'READY',
      date: scheduledDate,
      lines,
      notes: `[${adjDirection}] ` + notes,
      createdBy: user?.id || 'unknown'
    });

    handeCloseModal();
  };

  const handleValidate = (id: string) => {
    if (window.confirm("Are you sure you want to validate this adjustment? Stock levels will be updated immediately.")) {
      validateMovement(id);
    }
  };

  return (
    <div className="page-container flex-col gap-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Stock Adjustments</h1>
          <p className="text-muted mt-1">Record manual inventory corrections and cycle counts</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenModal}>
          <Plus size={18} /> New Adjustment
        </button>
      </div>

      <div className="card flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="search-bar flex items-center" style={{ width: '300px', margin: 0 }}>
            <Search size={18} className="text-muted" />
            <input 
              type="text" 
              placeholder="Search reference..." 
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
                <th>Location Affected</th>
                <th>Direction</th>
                <th>Scheduled Date</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {adjustments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted" style={{ padding: '3rem' }}>
                     No adjustments found. Create a new adjustment to get started.
                  </td>
                </tr>
              ) : (
                adjustments.map(adj => {
                  const isAdd = adj.fromLocationId === virtualLocation.id;
                  const targetLoc = isAdd ? adj.toLocationId : adj.fromLocationId;
                  
                  return (
                    <tr key={adj.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded ${isAdd ? 'bg-success-light text-success' : 'bg-danger-light text-danger'} flex justify-center items-center`}>
                            <FileEdit size={20} />
                          </div>
                          <div className="flex-col">
                            <span className="font-semibold">{adj.reference}</span>
                            <span className="text-xs text-muted">{adj.lines.length} items</span>
                          </div>
                        </div>
                      </td>
                      <td>{getLocationName(targetLoc)}</td>
                      <td>
                        <span className={`badge badge-${isAdd ? 'success' : 'danger'}`}>
                          {isAdd ? 'ADD (Stock In)' : 'REMOVE (Stock Out)'}
                        </span>
                      </td>
                      <td>{new Date(adj.date).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge badge-${adj.status === 'DONE' ? 'success' : 'warning'}`}>
                          {adj.status}
                        </span>
                      </td>
                      <td>
                        <div className="flex justify-end gap-2">
                          <button className="btn btn-secondary text-xs">View</button>
                          {adj.status !== 'DONE' && (
                            <button className="btn btn-primary text-xs" onClick={() => handleValidate(adj.id)}>
                              <CheckCircle2 size={16} /> Validate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay flex justify-center items-center">
          <div className="modal-content card flex-col gap-6 animate-fade-in" style={{ maxWidth: '800px' }}>
            <div className="flex justify-between items-center border-b pb-4" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-xl font-semibold">New Stock Adjustment</h2>
              <button className="icon-btn" onClick={handeCloseModal}>✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-col gap-6">
              <div className="grid gap-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group flex-col">
                  <label className="label">Location Evaluated *</label>
                  <select required className="input-field" value={targetLocationId} onChange={e => setTargetLocationId(e.target.value)}>
                    {internalLocations.map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group flex-col">
                  <label className="label">Adjustment Direction *</label>
                  <select required className="input-field" value={adjDirection} onChange={e => setAdjDirection(e.target.value as 'ADD' | 'REMOVE')}>
                    <option value="ADD">Add Stock (Found / Surplus)</option>
                    <option value="REMOVE">Remove Stock (Lost / Damaged)</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group flex-col">
                  <label className="label">Scheduled Date *</label>
                  <input required type="date" className="input-field" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} />
                </div>
                <div className="form-group flex-col">
                  <label className="label">Reference / Reason</label>
                  <input type="text" className="input-field" placeholder="E.g., Cycle Count Q2 / Water Damage" value={notes} onChange={e => setNotes(e.target.value)} />
                </div>
              </div>

              <div className="lines-section flex-col gap-3 mt-2">
                <div className="flex justify-between items-center border-b pb-2" style={{ borderColor: 'var(--border)' }}>
                  <h3 className="text-sm font-semibold flex items-center gap-2"><FileText size={16}/> Products Adjusted</h3>
                  <button type="button" className="text-primary text-sm font-medium hover:underline" onClick={handleAddLine}>+ Add Line</button>
                </div>

                {lines.length === 0 ? (
                  <div className="text-center p-4 text-muted text-sm border border-dashed rounded" style={{ borderColor: 'var(--border)' }}>
                    Click "+ Add Line" to specify what products you are adjusting.
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
                          placeholder="Qty to adjust"
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
                <button type="submit" className="btn btn-primary">Save Adjustment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
