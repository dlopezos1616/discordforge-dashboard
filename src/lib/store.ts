import { create } from 'zustand'

export type Section =
  | 'dashboard'
  | 'bot-status'
  | 'bot-customize'
  | 'tickets'
  | 'welcome'
  | 'embeds'
  | 'reaction-roles'
  | 'verification'
  | 'moderation'
  | 'automod'
  | 'antiraid'
  | 'whitelist'
  | 'polls'
  | 'giveaways'
  | 'logs'
  | 'settings'
  | 'superadmin'

export type AppView = 'landing' | 'server-select' | 'dashboard'

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
  // App view (landing, server-select, dashboard)
  view: AppView
  setView: (view: AppView) => void

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
}

export const useAppStore = create<AppState>((set) => ({
  // App view
  view: 'landing',
  setView: (view) => set({ view }),

  // Auth
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => set({ user: null, isAuthenticated: false, currentServer: null, view: 'landing' }),

  // Navigation
  currentSection: 'dashboard',
  setCurrentSection: (section) => set({ currentSection: section }),

  // Server
  servers: [],
  currentServer: null,
  setServers: (servers) => set({ servers }),
  setCurrentServer: (server) => set({ currentServer: server, view: server ? 'dashboard' : 'server-select' }),

  // UI
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),
}))
