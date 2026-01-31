'use client'

import { User } from '@/lib/types/keygen'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UserCircle, Calendar, Info } from 'lucide-react'
import { copyToClipboard } from '@/lib/utils/clipboard'
import { MetadataViewer } from '@/components/shared/metadata-viewer'

interface UserDetailsDialogProps {
  user: User
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserDetailsDialog({
  user,
  open,
  onOpenChange
}: UserDetailsDialogProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'developer':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'sales-agent':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300'
      case 'support-agent':
        return 'bg-teal-100 text-teal-800 border-teal-300'
      case 'read-only':
        return 'bg-gray-100 text-gray-800 border-gray-300'
      case 'user':
        return 'bg-sky-100 text-sky-800 border-sky-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-300'
      case 'banned':
        return 'bg-red-200 text-red-900 border-red-400'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCircle className="h-5 w-5" />
            User Details: {user.attributes.fullName || user.attributes.email}
          </DialogTitle>
          <DialogDescription>
            View detailed information about this user.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* User Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Info className="h-4 w-4" />
                User Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="text-sm">{user.attributes.fullName || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-sm">{user.attributes.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Role</label>
                  <div className="mt-1">
                    <Badge variant="outline" className={getRoleColor(user.attributes.role)}>
                      {user.attributes.role}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    <Badge variant="outline" className={getStatusColor(user.attributes.status)}>
                      {user.attributes.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">ID</label>
                <p
                  className="text-sm font-mono text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => copyToClipboard(user.id, 'User ID')}
                  title="Click to copy"
                >
                  {user.id}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4" />
                Dates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(user.attributes.created)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Updated</label>
                  <p className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(user.attributes.updated)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          <MetadataViewer metadata={(user.attributes as Record<string, unknown>).metadata as Record<string, unknown> | undefined} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
