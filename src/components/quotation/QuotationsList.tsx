"use client"

import { useEffect, useState, useCallback } from "react"
import { ArrowLeft, Search, Download, RefreshCw, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

// ... types stay the same

export default function QuotationsList() {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState("")

  // Use useCallback so fetchQuotations can be used in useEffect safely
  const fetchQuotations = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("quotations")
        .select(`id, quotation_number, customer_name, grand_total, created_at, pdf_url`)
        .eq("created_by", userId)
        .order("created_at", { ascending: false })
        .limit(100) // Safety limit for production

      if (error) throw error
      setQuotations(data || [])
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch quotations")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [supabase])

  useEffect(() => {
    let mounted = true

    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!mounted) return

      if (session?.user) {
        setUser(session.user)
        await fetchQuotations(session.user.id)
      } else {
        setLoading(false)
      }
    }

    checkUser()

    // Listen for auth changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      
      const currentUser = session?.user ?? null
      setUser(currentUser)
      
      if (currentUser) {
        fetchQuotations(currentUser.id)
      } else {
        setQuotations([])
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase, fetchQuotations])

  const handleRefresh = async () => {
    if (!user) return
    setRefreshing(true)
    await fetchQuotations(user.id)
  }

  // Filter logic remains the same...
