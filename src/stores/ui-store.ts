import { create } from 'zustand'

type VisibilityFilter = 'all' | 'public' | 'private' | 'internal'
type ScopeFilter = 'all' | 'in-scope' | 'out-of-scope'

interface UIState {
  searchQuery: string
  visibilityFilter: VisibilityFilter
  scopeFilter: ScopeFilter
  showArchived: boolean

  selectedRepoName: string | null
  sidebarOpen: boolean
  sidebarSearchQuery: string

  setSearchQuery: (query: string) => void
  setVisibilityFilter: (filter: VisibilityFilter) => void
  setScopeFilter: (filter: ScopeFilter) => void
  setShowArchived: (show: boolean) => void
  selectRepo: (repoName: string | null) => void
  setSidebarOpen: (open: boolean) => void
  setSidebarSearchQuery: (query: string) => void
  reset: () => void
}

export const useUIStore = create<UIState>((set) => ({
  searchQuery: '',
  visibilityFilter: 'all',
  scopeFilter: 'all',
  showArchived: false,

  selectedRepoName: null,
  sidebarOpen: false,
  sidebarSearchQuery: '',

  setSearchQuery: (query) => set({ searchQuery: query }),
  setVisibilityFilter: (filter) => set({ visibilityFilter: filter }),
  setScopeFilter: (filter) => set({ scopeFilter: filter }),
  setShowArchived: (show) => set({ showArchived: show }),
  selectRepo: (repoName) => set({ selectedRepoName: repoName, sidebarOpen: false }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSidebarSearchQuery: (query) => set({ sidebarSearchQuery: query }),
  reset: () =>
    set({
      searchQuery: '',
      visibilityFilter: 'all',
      scopeFilter: 'all',
      showArchived: false,
      selectedRepoName: null,
      sidebarOpen: false,
      sidebarSearchQuery: '',
    }),
}))
