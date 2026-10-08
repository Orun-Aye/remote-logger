import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { devtools, persist } from "zustand/middleware";

// ============================================
// TYPES
// ============================================

export type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d' | 'custom';

export interface CustomTimeRange {
  start: Date;
  end: Date;
}

export type BetaTier = 'core' | 'full';

export interface CurrentUser {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  betaAccess?: boolean;
  betaTier?: BetaTier;
}

// ============================================
// STATE INTERFACE
// ============================================

interface ApperioState {
  // Auth
  currentUser: CurrentUser | null;

  // Project context
  currentProjectId: string | null;

  // Time & filtering
  selectedTimeRange: TimeRange;
  customTimeRange: CustomTimeRange | null;
  selectedEnvironment: string; // 'all' | specific environment name

  // Auto-refresh
  autoRefreshEnabled: boolean;
  autoRefreshInterval: number; // ms

  // UI state
  sidebarCollapsed: boolean;
  detailPanelOpen: boolean;
  theme: 'dark' | 'light' | 'system';

  // Legacy compatibility
  filterLevel: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'all';
  searchQuery: string;
}

// ============================================
// ACTIONS INTERFACE
// ============================================

interface ApperioActions {
  // Auth
  setCurrentUser: (user: CurrentUser | null) => void;

  // Project context
  setCurrentProjectId: (projectId: string | null) => void;
  /** @deprecated Use setCurrentProjectId instead */
  setCurrentProject: (projectId: string) => void;

  // Time & filtering
  setTimeRange: (range: TimeRange) => void;
  setCustomTimeRange: (range: CustomTimeRange | null) => void;
  setSelectedEnvironment: (env: string) => void;

  // Auto-refresh
  setAutoRefreshEnabled: (enabled: boolean) => void;
  setAutoRefreshInterval: (interval: number) => void;
  toggleAutoRefresh: () => void;

  // UI state
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  setDetailPanelOpen: (open: boolean) => void;
  setTheme: (theme: 'dark' | 'light' | 'system') => void;

  // Legacy
  setFilterLevel: (level: ApperioState['filterLevel']) => void;
  setSearchQuery: (query: string) => void;

  // Reset
  reset: () => void;
}

// ============================================
// INITIAL STATE
// ============================================

const initialState: ApperioState = {
  currentUser: null,
  currentProjectId: null,
  selectedTimeRange: '24h',
  customTimeRange: null,
  selectedEnvironment: 'all',
  autoRefreshEnabled: false,
  autoRefreshInterval: 30000, // 30 seconds
  sidebarCollapsed: false,
  detailPanelOpen: false,
  theme: 'dark',
  filterLevel: 'all',
  searchQuery: '',
};

// ============================================
// STORE
// ============================================

export const useApperioStore = create<ApperioState & ApperioActions>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        // Auth
        setCurrentUser: (user) => set({ currentUser: user }, false, 'setCurrentUser'),

        // Project context
        setCurrentProjectId: (projectId) =>
          set({ currentProjectId: projectId }, false, 'setCurrentProjectId'),
        setCurrentProject: (projectId) =>
          set({ currentProjectId: projectId }, false, 'setCurrentProject'),

        // Time & filtering
        setTimeRange: (range) =>
          set(
            {
              selectedTimeRange: range,
              // Clear custom range when selecting a preset
              customTimeRange: range !== 'custom' ? null : undefined,
            } as Partial<ApperioState>,
            false,
            'setTimeRange'
          ),
        setCustomTimeRange: (range) =>
          set(
            { customTimeRange: range, selectedTimeRange: range ? 'custom' : '24h' },
            false,
            'setCustomTimeRange'
          ),
        setSelectedEnvironment: (env) =>
          set({ selectedEnvironment: env }, false, 'setSelectedEnvironment'),

        // Auto-refresh
        setAutoRefreshEnabled: (enabled) =>
          set({ autoRefreshEnabled: enabled }, false, 'setAutoRefreshEnabled'),
        setAutoRefreshInterval: (interval) =>
          set({ autoRefreshInterval: interval }, false, 'setAutoRefreshInterval'),
        toggleAutoRefresh: () =>
          set(
            (state) => ({ autoRefreshEnabled: !state.autoRefreshEnabled }),
            false,
            'toggleAutoRefresh'
          ),

        // UI state
        setSidebarCollapsed: (collapsed) =>
          set({ sidebarCollapsed: collapsed }, false, 'setSidebarCollapsed'),
        toggleSidebar: () =>
          set(
            (state) => ({ sidebarCollapsed: !state.sidebarCollapsed }),
            false,
            'toggleSidebar'
          ),
        setDetailPanelOpen: (open) =>
          set({ detailPanelOpen: open }, false, 'setDetailPanelOpen'),
        setTheme: (theme) =>
          set({ theme }, false, 'setTheme'),

        // Legacy
        setFilterLevel: (level) =>
          set({ filterLevel: level }, false, 'setFilterLevel'),
        setSearchQuery: (query) =>
          set({ searchQuery: query }, false, 'setSearchQuery'),

        // Reset
        reset: () => set(initialState, false, 'reset'),
      }),
      {
        name: 'apperio-store',
        partialize: (state) => ({
          // Only persist UI preferences, not transient data
          selectedTimeRange: state.selectedTimeRange,
          selectedEnvironment: state.selectedEnvironment,
          autoRefreshEnabled: state.autoRefreshEnabled,
          autoRefreshInterval: state.autoRefreshInterval,
          sidebarCollapsed: state.sidebarCollapsed,
          theme: state.theme,
        }),
      }
    ),
    { name: 'ApperioStore' }
  )
);

// ============================================
// SELECTOR HOOKS (for performance)
// ============================================

export const useCurrentProjectId = () => useApperioStore((s) => s.currentProjectId);
export const useSelectedTimeRange = () => useApperioStore((s) => s.selectedTimeRange);
export const useSelectedEnvironment = () => useApperioStore((s) => s.selectedEnvironment);
export const useAutoRefresh = () =>
  useApperioStore(useShallow((s) => ({
    enabled: s.autoRefreshEnabled,
    interval: s.autoRefreshInterval,
    toggle: s.toggleAutoRefresh,
    setInterval: s.setAutoRefreshInterval,
  })));
export const useTheme = () => useApperioStore((s) => s.theme);
