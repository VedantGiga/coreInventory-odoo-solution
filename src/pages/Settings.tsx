import { useState } from 'react';
import { useStore, type Location } from '../store/useStore';
import { MapPin, Plus, Trash2, User as UserIcon } from 'lucide-react';

export function Settings() {
  const { user, locations, addLocation } = useStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'locations'>('locations');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Location State
  const [locName, setLocName] = useState('');
  const [locType, setLocType] = useState<Location['type']>('warehouse');

  const handleLocationsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!locName.trim()) return;
    addLocation({ name: locName, type: locType });
    setIsModalOpen(false);
    setLocName('');
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'warehouse': return 'badge-primary';
      case 'rack': return 'badge-secondary';
      case 'customer': return 'badge-success';
      case 'vendor': return 'badge-warning';
      case 'virtual': return 'badge-danger';
      default: return 'badge-secondary';
    }
  };

  return (
    <div className="page-container flex-col gap-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-muted mt-1">Manage application configurations and your profile</p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Settings Sidebar */}
        <div className="card flex-col gap-2 w-64 h-fit">
          <button 
            className={`flex items-center gap-3 p-3 rounded-md text-sm font-medium transition-colors ${activeTab === 'locations' ? 'bg-primary-light text-primary' : 'hover:bg-bg-surface-hover text-secondary'}`}
            onClick={() => setActiveTab('locations')}
          >
            <MapPin size={18} /> Locations & Warehouses
          </button>
          <button 
            className={`flex items-center gap-3 p-3 rounded-md text-sm font-medium transition-colors ${activeTab === 'profile' ? 'bg-primary-light text-primary' : 'hover:bg-bg-surface-hover text-secondary'}`}
            onClick={() => setActiveTab('profile')}
          >
            <UserIcon size={18} /> User Profile
          </button>
        </div>

        {/* Settings Content */}
        <div className="flex-1 right-pane flex-col gap-6">
          
          {activeTab === 'profile' && (
            <div className="card flex-col gap-6 animate-fade-in">
              <h2 className="text-xl font-semibold border-b pb-4" style={{ borderColor: 'var(--border)' }}>Profile Information</h2>
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-primary flex justify-center items-center text-white text-3xl font-bold">
                  {user?.name.charAt(0)}
                </div>
                <div className="flex-col gap-1">
                  <h3 className="text-2xl font-semibold">{user?.name}</h3>
                  <span className="text-muted">{user?.email}</span>
                  <span className="badge badge-primary w-fit mt-2 uppercase">{user?.role}</span>
                </div>
              </div>
              <p className="text-sm text-muted mt-4">Profile editing is disabled in this demo version.</p>
            </div>
          )}

          {activeTab === 'locations' && (
            <div className="card flex-col gap-6 animate-fade-in">
              <div className="flex justify-between items-center border-b pb-4" style={{ borderColor: 'var(--border)' }}>
                <h2 className="text-xl font-semibold">Manage Locations</h2>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                  <Plus size={18} /> Add Location
                </button>
              </div>

              <div className="table-container pt-2">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Location Name</th>
                      <th>Type</th>
                      <th>System ID</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {locations.map(loc => (
                      <tr key={loc.id}>
                        <td className="font-medium">{loc.name}</td>
                        <td>
                          <span className={`badge ${getBadgeColor(loc.type)} uppercase`}>{loc.type}</span>
                        </td>
                        <td className="text-xs text-muted font-mono">{loc.id}</td>
                        <td className="text-right">
                          <button className="icon-btn text-muted hover:text-danger" title="Delete">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay flex justify-center items-center">
          <div className="modal-content card flex-col gap-6 animate-fade-in" style={{ maxWidth: '500px' }}>
            <div className="flex justify-between items-center border-b pb-4" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-xl font-semibold">Add New Location</h2>
              <button className="icon-btn" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>
            
            <form onSubmit={handleLocationsSubmit} className="flex-col gap-4">
              <div className="form-group flex-col">
                <label className="label">Location Name</label>
                <input required type="text" className="input-field" value={locName} onChange={e => setLocName(e.target.value)} placeholder="e.g. Rack C" />
              </div>
              <div className="form-group flex-col">
                <label className="label">Location Type</label>
                <select required className="input-field" value={locType} onChange={e => setLocType(e.target.value as Location['type'])}>
                  <option value="warehouse">Warehouse (Main building)</option>
                  <option value="rack">Rack / Shelf (Internal section)</option>
                  <option value="vendor">Vendor (External supplier)</option>
                  <option value="customer">Customer (External buyer)</option>
                  <option value="virtual">Virtual (Inventory Loss/Scrap)</option>
                </select>
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t mt-2" style={{ borderColor: 'var(--border)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Location</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
