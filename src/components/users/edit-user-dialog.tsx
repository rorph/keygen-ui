'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Shield, User as UserIcon } from 'lucide-react'
import { getKeygenApi } from '@/lib/api'
import { User } from '@/lib/types/keygen'
import { toast } from 'sonner'
import { handleFormError } from '@/lib/utils/error-handling'

interface EditUserDialogProps {
  user: User
  open: boolean
  onOpenChange: (open: boolean) => void
  onUserUpdated: () => void
}

export function EditUserDialog({ user, open, onOpenChange, onUserUpdated }: EditUserDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'user' as User['attributes']['role'],
  })

  const api = getKeygenApi()

  useEffect(() => {
    if (open && user) {
      setFormData({
        email: user.attributes.email || '',
        firstName: user.attributes.firstName || '',
        lastName: user.attributes.lastName || '',
        role: user.attributes.role || 'user',
      })
    }
  }, [open, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.email.trim()) {
      toast.error('Email is required')
      return
    }

    try {
      setLoading(true)

      const updates: Record<string, unknown> = {}

      if (formData.email !== user.attributes.email) {
        updates.email = formData.email.trim()
      }
      if (formData.firstName !== (user.attributes.firstName || '')) {
        updates.firstName = formData.firstName || null
      }
      if (formData.lastName !== (user.attributes.lastName || '')) {
        updates.lastName = formData.lastName || null
      }
      if (formData.role !== user.attributes.role) {
        updates.role = formData.role
      }

      if (Object.keys(updates).length === 0) {
        toast.info('No changes to save')
        onOpenChange(false)
        return
      }

      await api.users.update(user.id, updates)
      toast.success('User updated successfully')
      onOpenChange(false)
      onUserUpdated()
    } catch (error: unknown) {
      handleFormError(error, 'User')
    } finally {
      setLoading(false)
    }
  }

  const getRoleIcon = (role: string) => {
    return role === 'admin' ? <Shield className="h-4 w-4" /> : <UserIcon className="h-4 w-4" />
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user account details for {user.attributes.email}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value: User['attributes']['role']) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  {getRoleIcon(formData.role)}
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4" />
                      User
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Admin
                    </div>
                  </SelectItem>
                  <SelectItem value="developer">
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4" />
                      Developer
                    </div>
                  </SelectItem>
                  <SelectItem value="sales-agent">
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4" />
                      Sales Agent
                    </div>
                  </SelectItem>
                  <SelectItem value="support-agent">
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4" />
                      Support Agent
                    </div>
                  </SelectItem>
                  <SelectItem value="read-only">
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4" />
                      Read Only
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-firstName">First Name</Label>
              <Input
                id="edit-firstName"
                placeholder="John"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-lastName">Last Name</Label>
              <Input
                id="edit-lastName"
                placeholder="Doe"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
