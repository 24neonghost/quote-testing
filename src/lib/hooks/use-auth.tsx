'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

interface Profile {
  id: string
  full_name: string | null
  email: string | null
  role: 'admin' | 'sales'
  active: boolean
  phone: string | null
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)

        if (user) {
          // Check if profile is in session storage to avoid unnecessary queries
          const cachedProfile = sessionStorage.getItem(`profile_${user.id}`)
          if (cachedProfile) {
            setProfile(JSON.parse(cachedProfile))
          } else {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('id, full_name, email, role, active, phone')
              .eq('id', user.id)
              .single()
            
            if (profileData) {
              setProfile(profileData as Profile)
              sessionStorage.setItem(`profile_${user.id}`, JSON.stringify(profileData))
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserAndProfile()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const newUser = session?.user ?? null
      setUser(newUser)
      
      if (newUser) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, full_name, email, role, active, phone')
          .eq('id', newUser.id)
          .single()
        
        if (profileData) {
          setProfile(profileData as Profile)
          sessionStorage.setItem(`profile_${newUser.id}`, JSON.stringify(profileData))
        }
      } else {
        setProfile(null)
        sessionStorage.clear()
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    sessionStorage.clear()
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
