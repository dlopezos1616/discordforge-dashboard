import { create } from 'zustand'

export type Section =
  | 'dashboard'
  | 'bot-status'
  | 'tickets'
  | 'welcome'
  | 'embeds'
  | 'reaction-roles'
  | 'verification'
  | 'moderation'
  | 'automod'
  | 'whitelist'
  | 'polls'
  | 'giveaways'
  | 'logs'
  | 'settings'
  | 'superadmin'

export interface DiscordServer {
  id: string
  discordId: string
  name: string
  icon: string | null
  memberCount: number
  isActive: boolean
}

export interface DiscordUser {
  id: string
  discordId: string
  username: string
  avatar: string | null
  isAdmin: boolean
  email?: string
}

interface AppState {
  // Auth
  user: DiscordUser | null
  isAuthenticated: boolean
  setUser: (user: DiscordUser | null) => void
  logout: () => void

  // Navigation
  currentSection: Section
  setCurrentSection: (section: Section) => void

  // Server
  servers: DiscordServer[]
  currentServer: DiscordServer | null
  setServers: (servers: DiscordServer[]) => void
  setCurrentServer: (server: DiscordServer | null) => void

  // UI
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  isLoading: boolean
  setLoading: (loading: boolean) => void

  // Login modal
  showLoginModal: boolean
  setShowLoginModal: (show: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  // Auth
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => set({ user: null, isAuthenticated: false, currentServer: null }),

  // Navigation
  currentSection: 'dashboard',
  setCurrentSection: (section) => set({ currentSection: section }),

  // Server
  servers: [],
  currentServer: null,
  setServers: (servers) => set({ servers }),
  setCurrentServer: (server) => set({ currentServer: server }),

  // UI
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),

  // Login modal
  showLoginModal: false,
  setShowLoginModal: (show) => set({ showLoginModal: show }),
}))
