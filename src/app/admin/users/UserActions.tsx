'use client'

import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MoreHorizontal, Key, Power, PowerOff, Trash2 } from 'lucide-react'
import {
  toggleUserStatus,
  resetUserPassword,
  deleteUser,
} from './actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function UserActions({ user }: { user: any }) {
  const router = useRouter()

  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isResetOpen, setIsResetOpen] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  /* ===============================
     TOGGLE USER STATUS
  =============================== */
  async function handleToggle() {
    setIsLoading(true)

    const result = await toggleUserStatus(user.id, !user.active)

    setIsLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(
        `User ${user.active ? 'deactivated' : 'activated'} successfully`
      )
      router.refresh()
    }
  }

  /* ===============================
     DELETE USER
  =============================== */
  async function handleDelete() {
    setIsLoading(true)

    const result = await deleteUser(user.id)

    setIsLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('User deleted successfully')
      setIsDeleteOpen(false)
      router.refresh()
    }
  }

  /* ===============================
     RESET PASSWORD
  =============================== */
  async function handleResetPassword() {
    if (!newPassword) {
      toast.error('Password cannot be empty')
      return
    }

    setIsLoading(true)

    const result = await resetUserPassword(user.id, newPassword)

    setIsLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Password reset successfully')
      setIsResetOpen(false)
      setNewPassword('')
    }
  }

  return (
    <>
      {/* DROPDOWN MENU */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-9 w-9 p-0 rounded-lg hover:bg-gray-100 transition-all duration-200"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="rounded-xl shadow-lg border"
        >
          {/* Toggle Status */}
          <DropdownMenuItem
            onClick={handleToggle}
            className="cursor-pointer gap-2"
          >
            {user.active ? (
              <>
                <PowerOff className="h-4 w-4 text-red-500" />
                Deactivate
              </>
            ) : (
              <>
                <Power className="h-4 w-4 text-emerald-500" />
                Activate
              </>
            )}
          </DropdownMenuItem>

          {/* Reset Password */}
          <DropdownMenuItem
            onClick={() => setIsResetOpen(true)}
            className="cursor-pointer gap-2"
          >
            <Key className="h-4 w-4 text-gray-600" />
            Reset Password
          </DropdownMenuItem>

          {/* Delete User */}
          <DropdownMenuItem
            onClick={() => setIsDeleteOpen(true)}
            className="cursor-pointer gap-2 text-red-600 focus:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
            Delete User
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* DELETE DIALOG */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-2xl p-8">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl font-semibold">
              Delete {user.full_name}?
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-8 flex gap-3">
            <Button
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>

            <Button
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDelete}
              disabled={isLoading}
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* RESET PASSWORD DIALOG */}
      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-2xl p-8">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl font-semibold">
              Reset Password
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              Enter a new password for{' '}
              <span className="font-medium">{user.full_name}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                New Password
              </label>
              <Input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-11 rounded-lg"
              />
            </div>
          </div>

          <DialogFooter className="mt-8 flex gap-3">
            <Button
              variant="outline"
              onClick={() => setIsResetOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>

            <Button
              className="flex-1 bg-black text-white hover:bg-gray-800 transition-all"
              onClick={handleResetPassword}
              disabled={isLoading}
            >
              {isLoading ? 'Updating...' : 'Update Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
