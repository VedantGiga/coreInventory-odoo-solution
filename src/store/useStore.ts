import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiFetch } from '../services/api';

// --- MOCK DATA MODELS ---

export interface User {
  id: string;
  name: string;
  role: 'admin' | 'manager' | 'staff';
  email: string;
}

export interface Location {
  id: string;
  name: string;
  type: 'warehouse' | 'rack' | 'customer' | 'vendor' | 'virtual';
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  reorderPoint: number;
}

export interface StockLevel {
  productId: string;
  locationId: string;
  quantity: number;
}

export type MovementType = 'RECEIPT' | 'DELIVERY' | 'TRANSFER' | 'ADJUSTMENT';
export type MovementStatus = 'DRAFT' | 'WAITING' | 'READY' | 'DONE' | 'CANCELED';

export interface MovementLine {
  id: string;
  productId: string;
  quantity: number;
}

export interface Movement {
  id: string;
  reference: string;
  type: MovementType;
  fromLocationId: string;
  toLocationId: string;
  status: MovementStatus;
  date: string;
  lines: MovementLine[];
  notes?: string;
  createdBy: string;
}

// --- INITIAL MOCK DATA ---

const initialLocations: Location[] = [
  { id: 'loc-vendor', name: 'Partner Locations / Vendors', type: 'vendor' },
  { id: 'loc-customer', name: 'Partner Locations / Customers', type: 'customer' },
  { id: 'loc-main', name: 'WH / Main Stock', type: 'warehouse' },
  { id: 'loc-rack-A', name: 'WH / Rack A', type: 'rack' },
  { id: 'loc-rack-B', name: 'WH / Rack B', type: 'rack' },
  { id: 'loc-virtual', name: 'Virtual Locations / Inventory Loss', type: 'virtual' },
];

const initialProducts: Product[] = [];

const initialStockLevels: StockLevel[] = [];

// --- ZUSTAND STORE ---

interface AppState {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string) => Promise<void>;
  logout: () => void;
  initialize: () => Promise<void>;

  // DB Collections
  locations: Location[];
  products: Product[];
  stockLevels: StockLevel[];
  movements: Movement[];

  // Data Fetching
  fetchProducts: () => Promise<void>;
  fetchLocations: () => Promise<void>;
  fetchStockLevels: () => Promise<void>;
  fetchMovements: () => Promise<void>;

  // Mutators
  addProduct: (product: Product) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  addLocation: (location: Omit<Location, 'id'>) => void;
  setStockLevel: (productId: string, locationId: string, quantity: number) => void;

  createMovement: (movement: Omit<Movement, 'id' | 'reference'>) => void;
  updateMovementStatus: (id: string, status: MovementStatus) => void;
  validateMovement: (id: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      login: async (email) => {
        try {
          const { user, token } = await apiFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email })
          });
          localStorage.setItem('core-inventory-token', token);
          set({ user, isAuthenticated: true });
        } catch (error) {
          console.error('Login failed:', error);
          throw error;
        }
      },
      logout: () => {
        localStorage.removeItem('core-inventory-token');
        set({ user: null, isAuthenticated: false });
      },

      initialize: async () => {
        const { fetchProducts, fetchLocations, fetchStockLevels, fetchMovements } = get();
        await Promise.all([
          fetchProducts(),
          fetchLocations(),
          fetchStockLevels(),
          fetchMovements()
        ]);
      },

      locations: initialLocations,
      products: initialProducts,
      stockLevels: initialStockLevels,
      movements: [],

      fetchProducts: async () => {
        const products = await apiFetch('/products');
        set({ products });
      },
      fetchLocations: async () => {
        const locations = await apiFetch('/locations');
        set({ locations });
      },
      fetchStockLevels: async () => {
        const stockLevels = await apiFetch('/stockLevels');
        set({ stockLevels });
      },
      fetchMovements: async () => {
        const movements = await apiFetch('/movements');
        set({ movements });
      },

      addProduct: async (p) => {
        await apiFetch('/products', {
          method: 'POST',
          body: JSON.stringify(p)
        });
        get().fetchProducts();
      },
      
      updateProduct: async (id, p) => {
        await apiFetch(`/products/${id}`, {
          method: 'PUT',
          body: JSON.stringify(p)
        });
        get().fetchProducts();
      },

      deleteProduct: async (id) => {
        await apiFetch(`/products/${id}`, { method: 'DELETE' });
        get().fetchProducts();
        get().fetchStockLevels();
      },

      addLocation: async (l) => {
        await apiFetch('/locations', {
          method: 'POST',
          body: JSON.stringify(l)
        });
        get().fetchLocations();
      },

      setStockLevel: async (_productId, _locationId, _quantity) => {
        // Note: The backend doesn't have a direct setStockLevel endpoint, 
        // typically this would be an ADJUSTMENT movement or a specialized endpoint.
        // For now, we'll implement a simple put if we had one, but the backend schema 
        // implies stock levels are updated via movements.
        // To keep it simple and fix the user's immediate need:
        console.warn('Manual stock update via API not yet implemented in backend. Use movements.');
      },

      createMovement: async (m) => {
        await apiFetch('/movements', {
          method: 'POST',
          body: JSON.stringify(m)
        });
        get().fetchMovements();
      },

      updateMovementStatus: async (id, status) => {
        await apiFetch(`/movements/${id}/status`, {
          method: 'PUT',
          body: JSON.stringify({ status })
        });
        get().fetchMovements();
      },

      validateMovement: async (id) => {
        await apiFetch(`/movements/${id}/validate`, {
          method: 'POST'
        });
        get().initialize(); // Refresh everything after validation
      }
    }),
    {
      name: 'core-inventory-data',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }), // Only persist auth
    }
  )
);
