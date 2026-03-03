import { Product, Sale, User } from '@/types/schema';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface DataState {
  products: Product[]; 
  users: User[];
  lastSync: string | null;
  
  setProducts: (products: Product[]) => void;
  setUsers: (users: User[]) => void;
  setLastSync: (date: string) => void;
}

export const useDataStore = create<DataState>()(
  persist(
    (set) => ({
      products: [],
      users: [],
      lastSync: null,
      
      setProducts: (products) => set({ products: Array.isArray(products) ? products : [] }),
      setUsers: (users) => set({ users: Array.isArray(users) ? users : [] }),
      setLastSync: (lastSync) => set({ lastSync }),
    }),
    {
      name: 'offline-data-storage',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
      })),
    }
  )
)

interface SyncState {
  pendingSales: Sale[]; 
  isOnline: boolean;
  
  addPendingSale: (sale: Sale) => void;
  removePendingSale: (tempId: string) => void; 
  setOnlineStatus: (status: boolean) => void;
  clearPendingSales: () => void;
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set) => ({
      pendingSales: [],
      isOnline: true,
      
      addPendingSale: (sale) => set((state) => ({ 
        pendingSales: [...state.pendingSales, sale] 
      })),
      
      removePendingSale: (uuid) => set((state) => ({
        pendingSales: state.pendingSales.filter(s => s.uuid !== uuid)
      })),
      
      setOnlineStatus: (isOnline) => set({ isOnline }),
      
      clearPendingSales: () => set({ pendingSales: [] }),
    }),
    {
      name: 'sync-queue-storage',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
      })),
    }
  )
)
