import { useState, useMemo } from 'react';
import { Package, Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { useStore, type Product } from '../store/useStore';
import './Products.css';

export function Products() {
  const { products, stockLevels, addProduct, updateProduct, deleteProduct } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [reorderPoint, setReorderPoint] = useState<number>(0);

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const getProductStock = (productId: string) => {
    return stockLevels
      .filter(s => s.productId === productId)
      .reduce((acc, curr) => acc + curr.quantity, 0);
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setName(product.name);
      setSku(product.sku);
      setCategory(product.category);
      setUnit(product.unit);
      setReorderPoint(product.reorderPoint);
    } else {
      setEditingProduct(null);
      setName('');
      setSku('');
      setCategory('');
      setUnit('pcs');
      setReorderPoint(0);
    }
    setIsModalOpen(true);
  };

  const handeCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      updateProduct(editingProduct.id, { name, sku, category, unit, reorderPoint });
    } else {
      addProduct({ name, sku, category, unit, reorderPoint });
    }
    handeCloseModal();
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}? This will also delete its stock history.`)) {
      deleteProduct(id);
    }
  };

  return (
    <div className="page-container flex-col gap-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Products</h1>
          <p className="text-muted mt-1">Manage your inventory catalog</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={18} /> New Product
        </button>
      </div>

      <div className="card flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="search-bar flex items-center" style={{ width: '300px', margin: 0 }}>
            <Search size={18} className="text-muted" />
            <input 
              type="text" 
              placeholder="Search products..." 
              className="search-input"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button className="btn btn-secondary text-sm">Filter</button>
            <button className="btn btn-secondary text-sm">Export</button>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Total Stock</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted" style={{ padding: '3rem' }}>
                     No products found. Add a new product to get started.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => {
                  const stock = getProductStock(product.id);
                  const isLowStock = stock <= product.reorderPoint;
                  
                  return (
                    <tr key={product.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded bg-bg-surface-hover flex justify-center items-center text-primary">
                            <Package size={20} />
                          </div>
                          <span className="font-medium">{product.name}</span>
                        </div>
                      </td>
                      <td>{product.sku}</td>
                      <td>
                        <span className="badge badge-neutral">{product.category}</span>
                      </td>
                      <td>
                        <span className="font-semibold">{stock}</span> <span className="text-muted text-xs">{product.unit}</span>
                      </td>
                      <td>
                        {stock <= 0 ? (
                          <span className="badge badge-danger">Out of Stock</span>
                        ) : isLowStock ? (
                          <span className="badge badge-warning">Low Stock</span>
                        ) : (
                          <span className="badge badge-success">In Stock</span>
                        )}
                      </td>
                      <td>
                        <div className="flex justify-end gap-2">
                          <button className="icon-btn" onClick={() => handleOpenModal(product)}>
                            <Edit2 size={16} />
                          </button>
                          <button className="icon-btn text-danger" onClick={() => handleDelete(product.id, product.name)}>
                            <Trash2 size={16} />
                          </button>
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
          <div className="modal-content card flex-col gap-6 animate-fade-in">
            <div className="flex justify-between items-center border-b pb-4" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-xl font-semibold">{editingProduct ? 'Edit Product' : 'New Product'}</h2>
              <button className="icon-btn" onClick={handeCloseModal}>✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-col gap-4">
              <div className="grid gap-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group flex-col">
                  <label className="label">Product Name *</label>
                  <input required type="text" className="input-field" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Steel Rods" />
                </div>
                <div className="form-group flex-col">
                  <label className="label">SKU / Internal Code *</label>
                  <input required type="text" className="input-field" value={sku} onChange={e => setSku(e.target.value)} placeholder="e.g. SR-10-M" />
                </div>
              </div>

              <div className="grid gap-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group flex-col">
                  <label className="label">Category</label>
                  <input required type="text" className="input-field" value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Raw Material" />
                </div>
                <div className="form-group flex-col">
                  <label className="label">Unit of Measure</label>
                  <select className="input-field" value={unit} onChange={e => setUnit(e.target.value)}>
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="m">Meters (m)</option>
                    <option value="sqm">Square Meters (sqm)</option>
                    <option value="liters">Liters (L)</option>
                    <option value="box">Box</option>
                  </select>
                </div>
              </div>

              <div className="form-group flex-col">
                <label className="label">Reorder Point (Low Stock Alert Level)</label>
                <input required type="number" min="0" className="input-field" value={reorderPoint} onChange={e => setReorderPoint(parseInt(e.target.value))} />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t mt-2" style={{ borderColor: 'var(--border)' }}>
                <button type="button" className="btn btn-secondary" onClick={handeCloseModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
