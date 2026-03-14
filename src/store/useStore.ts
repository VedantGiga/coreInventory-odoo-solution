import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

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
  login: (email: string) => void;
  logout: () => void;

  // DB Collections
  locations: Location[];
  products: Product[];
  stockLevels: StockLevel[];
  movements: Movement[];

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

const generateReference = (type: MovementType, currentCount: number) => {
  const prefix = {
    RECEIPT: 'WH/IN',
    DELIVERY: 'WH/OUT',
    TRANSFER: 'WH/INT',
    ADJUSTMENT: 'WH/ADJ'
  }[type];
  const seq = String(currentCount + 1).padStart(5, '0');
  return `${prefix}/${seq}`;
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      login: (email) => set({
        user: { id: 'u1', name: 'Demo Admin', role: 'admin', email },
        isAuthenticated: true,
      }),
      logout: () => set({ user: null, isAuthenticated: false }),

      locations: initialLocations,
      products: initialProducts,
      stockLevels: initialStockLevels,
      movements: [],

      addProduct: (p) => set((state) => ({ 
        products: [...state.products, p] 
      })),
      
      updateProduct: (id, p) => set((state) => ({
        products: state.products.map((prod) => prod.id === id ? { ...prod, ...p } : prod)
      })),

      deleteProduct: (id) => set((state) => ({
        products: state.products.filter(p => p.id !== id),
        stockLevels: state.stockLevels.filter(s => s.productId !== id)
      })),

      addLocation: (l) => set((state) => ({
        locations: [...state.locations, { ...l, id: uuidv4() }]
      })),

      setStockLevel: (productId, locationId, quantity) => set((state) => {
        const existingIndex = state.stockLevels.findIndex(
          (s) => s.productId === productId && s.locationId === locationId
        );

        if (existingIndex >= 0) {
          const newStockLevels = [...state.stockLevels];
          newStockLevels[existingIndex] = { ...newStockLevels[existingIndex], quantity };
          return { stockLevels: newStockLevels };
        } else {
          return {
            stockLevels: [...state.stockLevels, { productId, locationId, quantity }]
          };
        }
      }),

      createMovement: (m) => set((state) => {
        const typeCount = state.movements.filter(mov => mov.type === m.type).length;
        const newMovement: Movement = {
          ...m,
          id: uuidv4(),
          reference: generateReference(m.type, typeCount),
        };
        return { movements: [...state.movements, newMovement] };
      }),

      updateMovementStatus: (id, status) => set((state) => ({
        movements: state.movements.map(m => m.id === id ? { ...m, status } : m)
      })),

      validateMovement: (id) => {
        const state = get();
        const movement = state.movements.find(m => m.id === id);
        if (!movement || movement.status === 'DONE') return;

        // Process stock levels based on movement lines
        let newStockLevels = [...state.stockLevels];

        movement.lines.forEach(line => {
          // Decrease fromLocation stock (skip if vendor or virtual source where stock is infinite)
          if (movement.fromLocationId !== 'loc-vendor' && movement.fromLocationId !== 'loc-virtual') {
            const existingFrom = newStockLevels.find(s => s.productId === line.productId && s.locationId === movement.fromLocationId);
            if (existingFrom) {
              existingFrom.quantity -= line.quantity;
            } else {
              newStockLevels.push({ productId: line.productId, locationId: movement.fromLocationId, quantity: -line.quantity }); // Allow negative for flexibility in this simple app
            }
          }

          // Increase toLocation stock (skip if customer or virtual destination where stock goes out)
          if (movement.toLocationId !== 'loc-customer' && movement.toLocationId !== 'loc-virtual') {
            const existingTo = newStockLevels.find(s => s.productId === line.productId && s.locationId === movement.toLocationId);
            if (existingTo) {
              existingTo.quantity += line.quantity;
            } else {
              newStockLevels.push({ productId: line.productId, locationId: movement.toLocationId, quantity: line.quantity });
            }
          }
        });

        // Filter out zero stocks to keep it clean (optional, keeping it here for clarity)
        newStockLevels = newStockLevels.filter(s => s.quantity !== 0);

        set({
          stockLevels: newStockLevels,
          movements: state.movements.map(m => m.id === id ? { ...m, status: 'DONE' } : m)
        });
      }
    }),
    {
      name: 'core-inventory-data',
    }
  )
);
