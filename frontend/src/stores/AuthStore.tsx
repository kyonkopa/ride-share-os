import type { AuthToken, User } from "@/codegen/graphql"
import { create } from "zustand"
import { persist } from "zustand/middleware"

interface AuthState {
  user: User | null
  tokens: AuthToken | null
  isAuthenticated: boolean
  loading: boolean
  setUser: (user: User | null) => void
  setTokens: (tokens: AuthToken | null) => void
  setLoading: (loading: boolean) => void
  clearStorage: () => void
  saveAuthData: (user: User, tokens: AuthToken) => void
  updateUserFromQuery: (user: User | null) => void
}

const initialState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  loading: false,
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...initialState,
      setUser: (user: User | null) => set({ user }),
      setTokens: (tokens: AuthToken | null) => set({ tokens }),
      setLoading: (loading: boolean) => set({ loading }),
      saveAuthData: (user: User, tokens: AuthToken) =>
        set({
          user,
          tokens,
          isAuthenticated: true,
        }),
      updateUserFromQuery: (user: User | null) => {
        if (user) {
          set({
            user,
            isAuthenticated: true,
          })
        } else {
          set({
            user: null,
            isAuthenticated: false,
          })
        }
      },
      clearStorage: () => {
        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
          loading: false,
        })
        setTimeout(() => {
          localStorage.removeItem("ked-auth-storage")
        }, 1000)
      },
    }),
    {
      name: "ked-auth-storage",
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.loading = false
          // Check if tokens are still valid
          if (state.tokens?.accessToken) {
            state.isAuthenticated = true
          } else {
            state.isAuthenticated = false
            state.user = null
            state.tokens = null
          }
        }
      },
    }
  )
)
