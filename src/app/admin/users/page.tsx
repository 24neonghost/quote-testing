"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { Plus, Search, Power, PowerOff, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface Profile {
  id: string
  full_name: string
  email: string
  role: string
  active: boolean
  created_at: string
  phone: string | null
}

export default function UsersPage() {
  const supabase = createClient()

  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "sales",
    phone: "",
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    setLoading(true)
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) toast.error(error.message)
    else setUsers(data || [])

    setLoading(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()

    const { data: authData, error: authError } =
      await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { name: formData.name },
        },
      })

    if (authError) return toast.error(authError.message)

    if (!authData.user) {
      return toast.error("Failed to create user")
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id,
      full_name: formData.name,
      email: formData.email,
      phone: formData.phone,
      role: formData.role,
      active: true,
    })

    if (profileError) return toast.error(profileError.message)

    toast.success("User created successfully")
    setIsCreateOpen(false)
    fetchUsers()
  }

  async function handleToggle(user: Profile) {
    const { error } = await supabase
      .from("profiles")
      .update({ active: !user.active })
      .eq("id", user.id)

    if (error) toast.error(error.message)
    else {
      toast.success("User status updated")
      fetchUsers()
    }
  }

  async function handleDelete(user: Profile) {
    if (!confirm("Are you sure you want to delete this user?")) return

    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", user.id)

    if (error) toast.error(error.message)
    else {
      toast.success("User deleted")
      fetchUsers()
    }
  }

  const filtered = users.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Users</h1>
          <p className="text-sm text-gray-400">
            Manage your sales team and administrators.
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 rounded-xl bg-black px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-black/90 active:scale-95">
              <Plus className="h-4 w-4" />
              Add User
            </button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[520px] rounded-2xl p-8">
            <form onSubmit={handleCreate} className="space-y-6">

              <DialogHeader>
                <DialogTitle className="text-xl font-black">
                  Create New User
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input required onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                } />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" required onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                } />
              </div>

              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input required onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                } />
              </div>

              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" required onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                } />
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Select defaultValue="sales"
                  onValueChange={(v) =>
                    setFormData({ ...formData, role: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-black py-3 text-sm font-bold text-white shadow-lg hover:bg-black/90 active:scale-95 transition-all"
                >
                  Create User
                </button>
              </DialogFooter>

            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search users..."
          className="pl-9 h-12 rounded-xl"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filtered.map((user) => (
              <TableRow key={user.id} className="hover:bg-gray-50 transition-colors">
                <TableCell>
                  <div className="font-bold">{user.full_name}</div>
                  <div className="text-xs text-gray-400">{user.email}</div>
                </TableCell>

                <TableCell>
                  <Badge className={
                    user.role === "admin"
                      ? "bg-black text-white"
                      : "bg-gray-100 text-gray-600"
                  }>
                    {user.role}
                  </Badge>
                </TableCell>

                <TableCell>
                  <Badge variant={user.active ? "default" : "destructive"}>
                    {user.active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>

                <TableCell className="text-right space-x-2">
                  <button
                    onClick={() => handleToggle(user)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition"
                  >
                    {user.active
                      ? <PowerOff className="h-4 w-4 text-red-500" />
                      : <Power className="h-4 w-4 text-green-500" />}
                  </button>

                  <button
                    onClick={() => handleDelete(user)}
                    className="p-2 rounded-lg hover:bg-red-50 transition"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

    </div>
  )
}
