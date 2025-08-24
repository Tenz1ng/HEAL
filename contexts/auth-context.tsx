"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { userStorageService } from "@/lib/user-storage"

interface User {
  id: string
  name: string
  email: string
  picture: string
}

interface AuthContextType {
  user: User | null
  login: () => Promise<void>
  logout: () => void
  setUser: (user: User | null) => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in from storage
    const currentUser = userStorageService.getCurrentUser()
    if (currentUser) {
      setUserState({
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        picture: currentUser.picture
      })
    }
    setLoading(false)
  }, [])

  const login = async () => {
    // This is now handled by the GoogleSignInButton component
    // The actual login happens in the login page
    console.log('Login method called - handled by GoogleSignInButton')
  }

  const logout = () => {
    userStorageService.setCurrentUserId(null)
    setUserState(null)
  }

  const setUser = (user: User | null) => {
    setUserState(user)
  }

  return <AuthContext.Provider value={{ user, login, logout, setUser, loading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
      throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
