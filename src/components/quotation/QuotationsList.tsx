"use client"

import { useEffect, useState, useCallback } from "react"
import { ArrowLeft, Search, Download, RefreshCw, Loader2 } from "lucide-react" // Added Loader2
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

interface Quotation {
  id: string
  quotation_number: string
  customer_name: string
  grand_total: number
  created_at: string
  pdf_url: string | null
}

export default function QuotationsList() {
  const supabase = createClient()

  const [user, setUser] = useState<User | null>(null)
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState("")

  // FIX 1: Wrap fetch in useCallback to prevent infinite loops and dependency issues
  const fetchQuotations = useCallback(async (userId: string) => {
    try {
      // Note: We don't set loading(true) here to avoid UI flashing during background refreshes
      const { data, error } = await supabase
        .from("quotations")
        .select(`
          id,
          quotation_number,
          customer_name,
          grand_total,
          created_at,
          pdf_url
        `)
        .eq("created_by", userId) // Safety filter
        .order("created_at", { ascending: false })
        .limit(100) // FIX 2: Always limit rows in production to prevent crashes

      if (error) throw error

      setQuotations(data || [])
    } catch (error: any) {
      console.error("Error fetching quotations:", error)
      toast.error("Failed to load quotations. Please try again.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [supabase])

  // FIX 3: Unified Authentication Effect
  useEffect(() => {
    let mounted = true // Prevents "state update on unmounted component" errors

    const initialize = async () => {
      // 1. Get initial session
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!mounted) return

      if (session?.user) {
        setUser(session.user)
        await fetchQuotations(session.user.id)
      } else {
        setLoading(false)
      }

      // 2. Set up listener for changes (sign out, token refresh, etc.)
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (!mounted) return

          const currentUser = session?.user ?? null
          setUser(currentUser)

          if (currentUser) {
            // Only fetch if we switched users or just signed in
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
               await fetchQuotations(currentUser.id)
            }
          } else {
            setQuotations([])
            setLoading(false)
          }
        }
      )

      return subscription
    }

    const setup = initialize()

    return () => {
      mounted = false
      setup.then((subscription) => subscription?.unsubscribe())
    }
  }, [supabase, fetchQuotations])

  const handleRefresh = async () => {
    if (!user) return
    setRefreshing(true)
    await fetchQuotations(user.id)
  }

  // FIX 4: Safety check for search inputs to prevent regex errors
  const filteredQuotations = quotations.filter((q) => {
    const term = search.toLowerCase()
    return (
      (q.customer_name || "").toLowerCase().includes(term) ||
      (q.quotation_number || "").toLowerCase().includes(term)
    )
  })

  // Render logic remains mostly the same, but clearer loading states
  if (loading && !quotations.length) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!user) {
    return (
       <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
         <h2 className="text-xl font-semibold">Please Log In</h2>
         <Button asChild><Link href="/login">Go to Login</Link></Button>
       </div>
    )
  }

  return (
    <div className="space-y-6 p-6"> {/* Added padding container */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              My Quotations
            </h1>
            <p className="text-sm text-gray-500">
              Manage and download your past quotations.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search customer or quotation #..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Number</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">PDF</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredQuotations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                  {search ? "No results found." : "No quotations created yet."}
                </TableCell>
              </TableRow>
            ) : (
              filteredQuotations.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="font-medium">{q.quotation_number}</TableCell>
                  <TableCell>{q.customer_name}</TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('en-IN', {
                        style: 'currency',
                        currency: 'INR'
                    }).format(q.grand_total)}
                  </TableCell>
                  <TableCell>
                    {new Date(q.created_at).toLocaleDateString("en-IN", {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    {q.pdf_url && (
                      <Button variant="ghost" size="icon" asChild>
                        <a href={q.pdf_url} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4" />
                          <span className="sr-only">Download</span>
                        </a>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
