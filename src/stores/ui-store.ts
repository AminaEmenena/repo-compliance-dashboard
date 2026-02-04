import { create } from 'zustand'

export type AppView = 'dashboard' | 'docs'
type VisibilityFilter = 'all' | 'public' | 'private' | 'internal'
type ScopeFilter = 'all' | 'in-scope' | 'out-of-scope'

interface UIState {
  currentView: AppView
  searchQuery: string
  visibilityFilter: VisibilityFilter
  scopeFilter: ScopeFilter
  showArchived: boolean

  selectedRepoName: string | null
  sidebarOpen: boolean
  sidebarSearchQuery: string

  setCurrentView: (view: AppView) => void
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
  currentView: 'dashboard',
  searchQuery: '',
  visibilityFilter: 'all',
  scopeFilter: 'all',
  showArchived: false,

  selectedRepoName: null,
  sidebarOpen: false,
  sidebarSearchQuery: '',

  setCurrentView: (view) =>
    set((state) => ({
      currentView: view,
      selectedRepoName: view !== 'dashboard' ? null : state.selectedRepoName,
    })),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setVisibilityFilter: (filter) => set({ visibilityFilter: filter }),
  setScopeFilter: (filter) => set({ scopeFilter: filter }),
  setShowArchived: (show) => set({ showArchived: show }),
  selectRepo: (repoName) => set({ selectedRepoName: repoName, sidebarOpen: false, currentView: 'dashboard' }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSidebarSearchQuery: (query) => set({ sidebarSearchQuery: query }),
  reset: () =>
    set({
      currentView: 'dashboard',
      searchQuery: '',
      visibilityFilter: 'all',
      scopeFilter: 'all',
      showArchived: false,
      selectedRepoName: null,
      sidebarOpen: false,
      sidebarSearchQuery: '',
    }),
}))
