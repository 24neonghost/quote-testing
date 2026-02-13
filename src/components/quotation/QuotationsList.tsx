"use client"

import { useEffect, useState } from "react"
import { ArrowLeft, Search, Download, RefreshCw } from "lucide-react"
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

interface Quotation {
  id: string
  quotation_number: string
  customer_name: string
  grand_total: number
  created_at: string
  pdf_url: string | null
  profiles: {
    full_name: string
  }
}

export default function QuotationsList({ user }: { user: any }) {
  const supabase = createClient()

  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetchQuotations()
  }, [])

  const fetchQuotations = async () => {
    setLoading(true)

    try {
      let profileId: string | null = null

      if (user?.role !== "admin") {
        // 🔥 Step 1: Get profile ID using full name
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id")
          .eq("full_name", user.full_name)
          .single()

        if (profileError || !profile) {
          throw new Error("Profile not found")
        }

        profileId = profile.id
      }

      // 🔥 Step 2: Fetch quotations
      let query = supabase
        .from("quotations")
        .select(`
          id,
          quotation_number,
          customer_name,
          grand_total,
          created_at,
          pdf_url,
          profiles!created_by (full_name)
        `)
        .order("created_at", { ascending: false })

      if (profileId) {
        query = query.eq("created_by", profileId)
      }

      const { data, error } = await query

      if (error) throw error

      setQuotations(data || [])
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchQuotations()
  }

  const filteredQuotations = quotations.filter(
    (q) =>
      q.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      q.quotation_number?.toLowerCase().includes(search.toLowerCase()) ||
      q.profiles?.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={user?.role === "admin" ? "/admin/quotations" : "/"}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-100 bg-white text-gray-400 hover:text-black hover:shadow-sm transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-black">
              {user?.role === "admin"
                ? "All Quotations"
                : "My Quotations"}
            </h1>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="rounded-xl gap-2 font-bold"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Number</TableHead>
            <TableHead>Customer</TableHead>
            {user?.role === "admin" && <TableHead>Salesperson</TableHead>}
            <TableHead>Amount</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={6}>Loading...</TableCell>
            </TableRow>
          ) : filteredQuotations.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6}>No quotations found.</TableCell>
            </TableRow>
          ) : (
            filteredQuotations.map((q) => (
              <TableRow key={q.id}>
                <TableCell>{q.quotation_number}</TableCell>
                <TableCell>{q.customer_name}</TableCell>
                {user?.role === "admin" && (
                  <TableCell>{q.profiles?.full_name}</TableCell>
                )}
                <TableCell>₹{q.grand_total?.toLocaleString()}</TableCell>
                <TableCell>
                  {new Date(q.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {q.pdf_url && (
                    <a href={q.pdf_url} target="_blank">
                      <Download className="h-4 w-4" />
                    </a>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
