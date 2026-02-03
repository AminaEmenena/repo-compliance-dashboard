import { create } from 'zustand'

type VisibilityFilter = 'all' | 'public' | 'private' | 'internal'

interface UIState {
  searchQuery: string
  visibilityFilter: VisibilityFilter
  showArchived: boolean

  setSearchQuery: (query: string) => void
  setVisibilityFilter: (filter: VisibilityFilter) => void
  setShowArchived: (show: boolean) => void
  reset: () => void
}

export const useUIStore = create<UIState>((set) => ({
  searchQuery: '',
  visibilityFilter: 'all',
  showArchived: false,

  setSearchQuery: (query) => set({ searchQuery: query }),
  setVisibilityFilter: (filter) => set({ visibilityFilter: filter }),
  setShowArchived: (show) => set({ showArchived: show }),
  reset: () =>
    set({
      searchQuery: '',
      visibilityFilter: 'all',
      showArchived: false,
    }),
}))
