'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { getKeygenApi } from '@/lib/api'
import { User } from '@/lib/types/keygen'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  Filter,
  MoreVertical,
  Users,
  UserCheck,
  UserX,
  Shield,
  Edit,
  Trash2,
  Mail,
  Calendar,
  Ban,
  CheckCircle,
  Eye,
  Loader2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { handleLoadError, handleCrudError } from '@/lib/utils/error-handling'
import { copyToClipboard } from '@/lib/utils/clipboard'
import { CreateUserDialog } from './create-user-dialog'
import { EditUserDialog } from './edit-user-dialog'
import { UserDetailsDialog } from './user-details-dialog'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { usePagination } from '@/hooks/use-pagination'
import { useDebounce } from '@/hooks/use-debounce'
import { PaginationControls } from '@/components/shared/pagination-controls'

const ALL_USER_ROLES: User['attributes']['role'][] = [
  'admin', 'developer', 'sales-agent', 'support-agent', 'read-only', 'user'
]

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm.trim(), 400)
  const isEmailSearch = debouncedSearch.includes('@')
  const [searching, setSearching] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const api = getKeygenApi()
  const pagination = usePagination()
  const [confirmBanOpen, setConfirmBanOpen] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [pendingUser, setPendingUser] = useState<User | null>(null)
  const [pendingAction, setPendingAction] = useState<'ban' | 'unban' | 'delete' | null>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [stats, setStats] = useState({ total: 0, active: 0, banned: 0, admins: 0 })

  const loadStats = useCallback(async () => {
    try {
      const [totalRes, bannedRes, adminRes] = await Promise.all([
        api.users.list({ limit: 1, roles: ALL_USER_ROLES }).catch(() => ({ meta: { count: 0 } })),
        api.users.list({ limit: 1, status: 'banned' as User['attributes']['status'] }).catch(() => ({ meta: { count: 0 } })),
        api.users.list({ limit: 1, role: 'admin' }).catch(() => ({ meta: { count: 0 } })),
      ])
      const total = typeof totalRes.meta?.count === 'number' ? totalRes.meta.count : 0
      const banned = typeof bannedRes.meta?.count === 'number' ? bannedRes.meta.count : 0
      const admins = typeof adminRes.meta?.count === 'number' ? adminRes.meta.count : 0
      setStats({
        total,
        active: total - banned,
        banned,
        admins,
      })
    } catch {
      // Stats are non-critical
    }
  }, [api.users])

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true)
      if (isEmailSearch) setSearching(true)
      const response = await api.users.list({
        ...pagination.paginationParams,
        ...(roleFilter === 'all'
          ? { roles: ALL_USER_ROLES }
          : { role: roleFilter as User['attributes']['role'] }),
        ...(isEmailSearch && debouncedSearch ? { email: debouncedSearch } : {}),
      })
      setUsers(response.data || [])
      const count = typeof response.meta?.count === 'number' ? response.meta.count : (response.data || []).length
      pagination.setTotalCount(count)
    } catch (error: unknown) {
      handleLoadError(error, 'users')
    } finally {
      setLoading(false)
      setSearching(false)
    }
  }, [api.users, roleFilter, pagination.paginationParams, isEmailSearch, debouncedSearch])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  useEffect(() => {
    pagination.resetToFirstPage()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, roleFilter, debouncedSearch])

  // Compute display users: server-side email filter is already applied in loadUsers;
  // client-side filter for non-email search terms + status
  const displayUsers = useMemo(() => {
    return users.filter(user => {
      // If email search, server already filtered — skip client-side name filter
      const matchesSearch = isEmailSearch || !searchTerm.trim() ||
        user.attributes.email?.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
        user.attributes.firstName?.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
        user.attributes.lastName?.toLowerCase().includes(searchTerm.trim().toLowerCase())

      const userStatus = (user.attributes.status || 'active').toLowerCase()
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && userStatus !== 'banned') ||
        (statusFilter === 'banned' && userStatus === 'banned')

      return matchesSearch && matchesStatus
    })
  }, [users, isEmailSearch, searchTerm, statusFilter])

  const isBanned = (user: User): boolean => {
    return (user.attributes.status || '').toLowerCase() === 'banned'
  }

  const getStatusColor = (user: User) => {
    return isBanned(user)
      ? 'bg-red-100 text-red-800 border-red-200'
      : 'bg-green-100 text-green-800 border-green-200'
  }

  const getStatusIcon = (user: User) => {
    return isBanned(user)
      ? <Ban className="h-3 w-3" />
      : <CheckCircle className="h-3 w-3" />
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleViewDetails = (user: User) => {
    setSelectedUser(user)
    setDetailsDialogOpen(true)
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setEditDialogOpen(true)
  }

  const handleBanUser = (user: User) => {
    setPendingUser(user)
    setPendingAction(isBanned(user) ? 'unban' : 'ban')
    setConfirmBanOpen(true)
  }

  const handleDeleteUser = (user: User) => {
    setPendingUser(user)
    setPendingAction('delete')
    setConfirmDeleteOpen(true)
  }

  const executePendingAction = async () => {
    if (!pendingUser || !pendingAction) return
    setConfirmLoading(true)
    try {
      if (pendingAction === 'ban') {
        await api.users.ban(pendingUser.id)
        toast.success('User banned successfully')
      } else if (pendingAction === 'unban') {
        await api.users.unban(pendingUser.id)
        toast.success('User unbanned successfully')
      } else if (pendingAction === 'delete') {
        await api.users.delete(pendingUser.id)
        toast.success('User deleted successfully')
      }
      await loadUsers()
      loadStats()
      setConfirmBanOpen(false)
      setConfirmDeleteOpen(false)
      setPendingUser(null)
      setPendingAction(null)
    } catch (error: unknown) {
      const action = pendingAction === 'delete' ? 'delete' : 'update'
      const custom = pendingAction === 'delete' ? 'Failed to delete user' : `Failed to ${pendingAction} user`
      handleCrudError(error, action as 'delete' | 'update', 'User', { customMessage: custom })
    } finally {
      setConfirmLoading(false)
    }
  }

  const getInitials = (user: User) => {
    const { firstName, lastName, email } = user.attributes
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
    }
    if (email) {
      return email.charAt(0).toUpperCase()
    }
    return 'U'
  }

  const getDisplayName = (user: User) => {
    const { firstName, lastName, email } = user.attributes
    if (firstName && lastName) return `${firstName} ${lastName}`
    if (firstName) return firstName
    if (lastName) return lastName
    return email
  }

  const onUserChanged = () => {
    loadUsers()
    loadStats()
  }

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">
            Manage user accounts and permissions
          </p>
        </div>
        <CreateUserDialog onUserCreated={onUserChanged} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Registered users
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              Active users
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Banned</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.banned}</div>
            <p className="text-xs text-muted-foreground">
              Banned users
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.admins}</div>
            <p className="text-xs text-muted-foreground">
              Administrator users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px] max-w-sm">
          <div className="relative">
            {searching ? (
              <Loader2 className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground animate-spin" />
            ) : (
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            )}
            <Input
              placeholder="Search by email or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-8"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="banned">Banned</SelectItem>
          </SelectContent>
        </Select>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="developer">Developer</SelectItem>
            <SelectItem value="sales-agent">Sales Agent</SelectItem>
            <SelectItem value="support-agent">Support Agent</SelectItem>
            <SelectItem value="read-only">Read Only</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>User List</CardTitle>
          <CardDescription>
            A list of all users in your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-sm text-muted-foreground">Loading users...</div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[85px]">ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayUsers.map((user) => (
                  <TableRow key={user.id} className="cursor-pointer" onClick={(e) => { if (!(e.target as HTMLElement).closest('button, a, [role="menuitem"]')) handleViewDetails(user) }}>
                    <TableCell>
                      <button onClick={() => copyToClipboard(user.id, 'User ID')} className="cursor-pointer hover:underline" title={user.id}>
                        <code className="text-xs font-mono text-muted-foreground">{user.id.split('-')[0]}</code>
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src="" />
                          <AvatarFallback className="bg-muted text-xs">
                            {getInitials(user)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {getDisplayName(user)}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        {user.attributes.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.attributes.role === 'admin' ? 'default' : 'secondary'}>
                        {user.attributes.role || 'user'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${getStatusColor(user)} flex items-center gap-1 w-fit`}
                      >
                        {getStatusIcon(user)}
                        {isBanned(user) ? 'Banned' : 'Active'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {formatDate(user.attributes.created)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleViewDetails(user)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditUser(user)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleBanUser(user)}>
                            {isBanned(user) ? (
                              <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Unban User
                              </>
                            ) : (
                              <>
                                <Ban className="mr-2 h-4 w-4" />
                                Ban User
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteUser(user)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!loading && displayUsers.length === 0 && (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <Users className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <div className="text-sm font-medium">No users found</div>
                <div className="text-xs text-muted-foreground">
                  {searchTerm || statusFilter !== 'all' || roleFilter !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Get started by creating your first user'
                  }
                </div>
              </div>
            </div>
          )}

          <PaginationControls
            startItem={pagination.startItem}
            endItem={pagination.endItem}
            totalCount={pagination.totalCount}
            pageNumber={pagination.pageNumber}
            totalPages={pagination.totalPages}
            pageSize={pagination.pageSize}
            hasNextPage={pagination.hasNextPage}
            hasPrevPage={pagination.hasPrevPage}
            onNextPage={pagination.goToNextPage}
            onPrevPage={pagination.goToPrevPage}
            onFirstPage={pagination.goToFirstPage}
            onLastPage={pagination.goToLastPage}
            onPageSizeChange={pagination.setPageSize}
            loading={loading}
          />
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      {selectedUser && (
        <EditUserDialog
          user={selectedUser}
          open={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open)
            if (!open) setSelectedUser(null)
          }}
          onUserUpdated={onUserChanged}
        />
      )}

      {/* User Details Dialog */}
      {selectedUser && (
        <UserDetailsDialog
          user={selectedUser}
          open={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
        />
      )}

      {/* Confirm dialogs */}
      <ConfirmDialog
        open={confirmBanOpen}
        onOpenChange={setConfirmBanOpen}
        title={pendingAction === 'unban' ? 'Unban user?' : 'Ban user?'}
        description={pendingUser ? `Are you sure you want to ${pendingAction} ${pendingUser.attributes.email}?` : ''}
        confirmLabel={pendingAction === 'unban' ? 'Unban' : 'Ban'}
        destructive={pendingAction === 'ban'}
        loading={confirmLoading}
        onConfirm={executePendingAction}
      />
      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Delete user?"
        description={pendingUser ? `Are you sure you want to delete ${pendingUser.attributes.email}? This action cannot be undone.` : ''}
        confirmLabel="Delete"
        destructive
        loading={confirmLoading}
        onConfirm={executePendingAction}
      />
    </div>
  )
}
