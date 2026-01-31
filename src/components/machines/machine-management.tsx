'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { getKeygenApi } from '@/lib/api'
import { Machine, User } from '@/lib/types/keygen'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  Monitor,
  AlertCircle,
  CheckCircle,
  Trash2,
  Key,
  Copy,
  Cpu,
  Eye,
  Edit,
  Loader2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { handleLoadError, handleCrudError } from '@/lib/utils/error-handling'
import { copyToClipboard } from '@/lib/utils/clipboard'
import { ActivateMachineDialog } from './activate-machine-dialog'
import { MachineDetailsDialog } from './machine-details-dialog'
import { MachineEditDialog } from './machine-edit-dialog'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { MetadataIndicator } from '@/components/shared/metadata-indicator'
import { usePagination } from '@/hooks/use-pagination'
import { useDebounce } from '@/hooks/use-debounce'
import { useSorting } from '@/hooks/use-sorting'
import { PaginationControls } from '@/components/shared/pagination-controls'
import { SortableTableHead } from '@/components/shared/sortable-table-head'

const ALL_USER_ROLES: User['attributes']['role'][] = [
  'admin', 'developer', 'sales-agent', 'support-agent', 'read-only', 'user'
]

export function MachineManagement() {
  const [machines, setMachines] = useState<Machine[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm.trim(), 400)
  const [searchResult, setSearchResult] = useState<Machine | null>(null)
  const [searching, setSearching] = useState(false)
  const searchRequestId = useRef(0)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [licenseFilter, setLicenseFilter] = useState<string>('all')
  const [userFilter, setUserFilter] = useState<string>('all')
  const [groupFilter, setGroupFilter] = useState<string>('all')
  const [filterOptions, setFilterOptions] = useState<{
    licenses: { id: string; name: string }[]
    products: { id: string; name: string }[]
    users: { id: string; email: string }[]
    groups: { id: string; name: string }[]
  }>({ licenses: [], products: [], users: [], groups: [] })
  const api = getKeygenApi()
  const pagination = usePagination()

  const licenseNameMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const l of filterOptions.licenses) map.set(l.id, l.name)
    return map
  }, [filterOptions.licenses])

  const productNameMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of filterOptions.products) map.set(p.id, p.name)
    return map
  }, [filterOptions.products])

  const getLicenseId = useCallback((m: Machine) => {
    const d = m.relationships?.license?.data
    if (!d || Array.isArray(d)) return ''
    return d.id
  }, [])

  const getProductId = useCallback((m: Machine) => {
    const d = m.relationships?.product?.data
    if (!d || Array.isArray(d)) return ''
    return d.id
  }, [])

  const comparators = useMemo(() => ({
    fingerprint: (a: Machine, b: Machine) => (a.attributes.fingerprint || '').localeCompare(b.attributes.fingerprint || ''),
    name: (a: Machine, b: Machine) => (a.attributes.name || '').localeCompare(b.attributes.name || ''),
    license: (a: Machine, b: Machine) => (licenseNameMap.get(getLicenseId(a)) || '').localeCompare(licenseNameMap.get(getLicenseId(b)) || ''),
    product: (a: Machine, b: Machine) => (productNameMap.get(getProductId(a)) || '').localeCompare(productNameMap.get(getProductId(b)) || ''),
    lastHeartbeat: (a: Machine, b: Machine) => {
      const aDate = a.attributes.lastHeartbeat ? new Date(a.attributes.lastHeartbeat).getTime() : 0
      const bDate = b.attributes.lastHeartbeat ? new Date(b.attributes.lastHeartbeat).getTime() : 0
      return aDate - bDate
    },
    created: (a: Machine, b: Machine) => new Date(a.attributes.created).getTime() - new Date(b.attributes.created).getTime(),
    updated: (a: Machine, b: Machine) => new Date(a.attributes.updated).getTime() - new Date(b.attributes.updated).getTime(),
  }), [licenseNameMap, productNameMap, getLicenseId, getProductId])
  const sorting = useSorting<Machine>(comparators)

  const [stats, setStats] = useState({ total: 0, alive: 0, dead: 0, notStarted: 0 })
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [pendingMachine, setPendingMachine] = useState<Machine | null>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const loadStats = useCallback(async () => {
    try {
      const [totalRes, aliveRes, deadRes, notStartedRes] = await Promise.all([
        api.machines.list({ limit: 1 }).catch(() => ({ meta: { count: 0 } })),
        api.machines.list({ limit: 1, status: 'alive' }).catch(() => ({ meta: { count: 0 } })),
        api.machines.list({ limit: 1, status: 'dead' }).catch(() => ({ meta: { count: 0 } })),
        api.machines.list({ limit: 1, status: 'not-started' }).catch(() => ({ meta: { count: 0 } })),
      ])
      setStats({
        total: (typeof totalRes.meta?.count === 'number' ? totalRes.meta.count : 0),
        alive: (typeof aliveRes.meta?.count === 'number' ? aliveRes.meta.count : 0),
        dead: (typeof deadRes.meta?.count === 'number' ? deadRes.meta.count : 0),
        notStarted: (typeof notStartedRes.meta?.count === 'number' ? notStartedRes.meta.count : 0),
      })
    } catch {
      // Stats are non-critical
    }
  }, [api.machines])

  const loadMachines = useCallback(async () => {
    try {
      setLoading(true)
      const statusMap: Record<string, string> = {
        'active': 'alive',
        'inactive': 'dead',
        'not-started': 'not-started',
      }
      const response = await api.machines.list({
        ...pagination.paginationParams,
        ...(statusFilter !== 'all' && { status: statusMap[statusFilter] || statusFilter }),
        ...(licenseFilter !== 'all' && { license: licenseFilter }),
        ...(userFilter !== 'all' && { user: userFilter }),
        ...(groupFilter !== 'all' && { group: groupFilter }),
      })
      setMachines(response.data || [])
      const count = typeof response.meta?.count === 'number' ? response.meta.count : (response.data || []).length
      pagination.setTotalCount(count)
    } catch (error: unknown) {
      handleLoadError(error, 'machines')
    } finally {
      setLoading(false)
    }
  }, [api.machines, statusFilter, licenseFilter, userFilter, groupFilter, pagination.paginationParams])

  useEffect(() => {
    loadMachines()
  }, [loadMachines])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  const loadFilterOptions = useCallback(async () => {
    try {
      const [licensesRes, productsRes, usersRes, groupsRes] = await Promise.all([
        api.licenses.list({ limit: 100 }).catch(() => ({ data: [] })),
        api.products.list({ limit: 100 }).catch(() => ({ data: [] })),
        api.users.list({ limit: 100, roles: ALL_USER_ROLES }).catch(() => ({ data: [] })),
        api.groups.list({ limit: 100 }).catch(() => ({ data: [] })),
      ])
      setFilterOptions({
        licenses: (licensesRes.data || []).map((l: any) => ({ id: l.id, name: l.attributes.name || l.attributes.key?.substring(0, 20) || l.id })),
        products: (productsRes.data || []).map((p: any) => ({ id: p.id, name: p.attributes.name })),
        users: (usersRes.data || []).map((u: any) => ({ id: u.id, email: u.attributes.email })),
        groups: (groupsRes.data || []).map((g: any) => ({ id: g.id, name: g.attributes.name })),
      })
    } catch { /* non-critical */ }
  }, [api.licenses, api.products, api.users, api.groups])

  useEffect(() => {
    loadFilterOptions()
  }, [loadFilterOptions])

  useEffect(() => {
    pagination.resetToFirstPage()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, licenseFilter, userFilter, groupFilter, debouncedSearch])

  // Server-side alias lookup for fingerprint / UUID
  useEffect(() => {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(debouncedSearch)
    const isLongEnough = debouncedSearch.length >= 8

    if (!debouncedSearch || (!isUUID && !isLongEnough)) {
      setSearchResult(null)
      setSearching(false)
      return
    }

    const requestId = ++searchRequestId.current
    setSearching(true)

    // Try alias lookup first (fingerprint or UUID)
    api.machines.get(debouncedSearch)
      .then((response) => {
        if (requestId !== searchRequestId.current) return
        setSearchResult(response.data || null)
        setSearching(false)
      })
      .catch(() => {
        if (requestId !== searchRequestId.current) return
        // Fallback: try fingerprint filter
        api.machines.list({ fingerprint: debouncedSearch, limit: 1 })
          .then((response) => {
            if (requestId !== searchRequestId.current) return
            const results = response.data || []
            setSearchResult(results.length > 0 ? results[0] : null)
          })
          .catch(() => {
            if (requestId !== searchRequestId.current) return
            setSearchResult(null)
          })
          .finally(() => {
            if (requestId !== searchRequestId.current) return
            setSearching(false)
          })
      })
  }, [debouncedSearch, api.machines])

  // Compute display machines: alias result > client-side filter > all loaded
  const displayMachines = useMemo(() => {
    if (searchResult) return [searchResult]
    if (searchTerm.trim() && searchTerm.trim().length < 8) {
      const term = searchTerm.trim().toLowerCase()
      return machines.filter(machine =>
        machine.attributes.fingerprint?.toLowerCase().includes(term) ||
        machine.attributes.name?.toLowerCase().includes(term) ||
        machine.attributes.hostname?.toLowerCase().includes(term)
      )
    }
    if (debouncedSearch.length >= 8 && !searching) return []
    return machines
  }, [searchResult, searchTerm, debouncedSearch, machines, searching])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleDeleteMachine = (machine: Machine) => {
    setPendingMachine(machine)
    setConfirmDeleteOpen(true)
  }

  const confirmDeleteMachine = async () => {
    if (!pendingMachine) return
    setConfirmLoading(true)
    try {
      await api.machines.deactivate(pendingMachine.id)
      await loadMachines()
      loadStats()
      toast.success('Machine deleted successfully')
      setConfirmDeleteOpen(false)
      setPendingMachine(null)
    } catch (error: unknown) {
      handleCrudError(error, 'delete', 'Machine', {
        customMessage: 'Failed to delete machine'
      })
    } finally {
      setConfirmLoading(false)
    }
  }

  const handleViewDetails = (machine: Machine) => {
    setSelectedMachine(machine)
    setDetailsDialogOpen(true)
  }

  const handleEditMachine = (machine: Machine) => {
    setSelectedMachine(machine)
    setEditDialogOpen(true)
  }

  const onMachineChanged = () => {
    loadMachines()
    loadStats()
  }

  const copyFingerprint = (fingerprint: string) => {
    copyToClipboard(fingerprint, 'Fingerprint')
  }

  const copyId = (id: string) => {
    copyToClipboard(id, 'Machine ID')
  }

  const onMachineActivated = () => {
    loadMachines()
    loadStats()
  }

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Machines</h1>
          <p className="text-muted-foreground">
            Monitor and manage licensed machines
          </p>
        </div>
        <ActivateMachineDialog onMachineActivated={onMachineActivated} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Machines</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Registered machines
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.alive}</div>
            <p className="text-xs text-muted-foreground">
              Currently online
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.dead}</div>
            <p className="text-xs text-muted-foreground">
              Offline machines
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Not Started</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.notStarted}</div>
            <p className="text-xs text-muted-foreground">
              Never activated
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
              placeholder="Search by fingerprint, UUID, or name..."
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
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="not-started">Not Started</SelectItem>
          </SelectContent>
        </Select>
        <Select value={licenseFilter} onValueChange={setLicenseFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Licenses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Licenses</SelectItem>
            {filterOptions.licenses.map(l => (
              <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={userFilter} onValueChange={setUserFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Users" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            {filterOptions.users.map(u => (
              <SelectItem key={u.id} value={u.id}>{u.email}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={groupFilter} onValueChange={setGroupFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Groups" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Groups</SelectItem>
            {filterOptions.groups.map(g => (
              <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Machines Table */}
      <Card>
        <CardHeader>
          <CardTitle>Machine List</CardTitle>
          <CardDescription>
            A list of all registered machines
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-sm text-muted-foreground">Loading machines...</div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[85px]">ID</TableHead>
                  <SortableTableHead field="fingerprint" label="Fingerprint" currentField={sorting.sortField} direction={sorting.sortDirection} onToggle={sorting.toggleSort} />
                  <SortableTableHead field="name" label="Name" currentField={sorting.sortField} direction={sorting.sortDirection} onToggle={sorting.toggleSort} />
                  <SortableTableHead field="license" label="License" currentField={sorting.sortField} direction={sorting.sortDirection} onToggle={sorting.toggleSort} />
                  <SortableTableHead field="product" label="Product" currentField={sorting.sortField} direction={sorting.sortDirection} onToggle={sorting.toggleSort} />
                  <SortableTableHead field="lastHeartbeat" label="Last Heartbeat" currentField={sorting.sortField} direction={sorting.sortDirection} onToggle={sorting.toggleSort} />
                  <SortableTableHead field="created" label="Created" currentField={sorting.sortField} direction={sorting.sortDirection} onToggle={sorting.toggleSort} />
                  <SortableTableHead field="updated" label="Updated" currentField={sorting.sortField} direction={sorting.sortDirection} onToggle={sorting.toggleSort} />
                  <TableHead className="w-[36px]" />
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorting.sortData(displayMachines).map((machine) => {
                  const licId = getLicenseId(machine)
                  const prodId = getProductId(machine)
                  return (
                  <TableRow key={machine.id} className="cursor-pointer" onClick={(e) => { if (!(e.target as HTMLElement).closest('button, a, [role="menuitem"]')) handleViewDetails(machine) }}>
                    <TableCell>
                      <button onClick={() => copyToClipboard(machine.id, 'Machine ID')} className="cursor-pointer hover:underline" title={machine.id}>
                        <code className="text-xs font-mono text-muted-foreground">{machine.id.split('-')[0]}</code>
                      </button>
                    </TableCell>
                    <TableCell>
                      <button onClick={() => copyFingerprint(machine.attributes.fingerprint || '')} className="cursor-pointer hover:underline" title="Click to copy full fingerprint">
                        <code className="text-sm bg-muted px-1 rounded">
                          {machine.attributes.fingerprint?.substring(0, 12)}...
                        </code>
                      </button>
                    </TableCell>
                    <TableCell>
                      {machine.attributes.name || 'Unnamed Machine'}
                    </TableCell>
                    <TableCell>
                      {licId ? (
                        <span className="text-sm" title={licId}>
                          {licenseNameMap.get(licId) || licId.split('-')[0]}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {prodId ? (
                        <span className="text-sm" title={prodId}>
                          {productNameMap.get(prodId) || prodId.split('-')[0]}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {machine.attributes.lastHeartbeat
                        ? formatDate(machine.attributes.lastHeartbeat)
                        : 'Never'
                      }
                    </TableCell>
                    <TableCell>
                      {formatDate(machine.attributes.created)}
                    </TableCell>
                    <TableCell>
                      {formatDate(machine.attributes.updated)}
                    </TableCell>
                    <TableCell>
                      <MetadataIndicator metadata={machine.attributes.metadata} />
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
                          <DropdownMenuItem onClick={() => handleViewDetails(machine)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditMachine(machine)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Machine
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => copyId(machine.id)}>
                            <Key className="mr-2 h-4 w-4" />
                            Copy Machine ID
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => copyFingerprint(machine.attributes.fingerprint || '')}>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Fingerprint
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteMachine(machine)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}

          {!loading && displayMachines.length === 0 && (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <Monitor className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <div className="text-sm font-medium">No machines found</div>
                <div className="text-xs text-muted-foreground">
                  {searchTerm || statusFilter !== 'all' || licenseFilter !== 'all' || userFilter !== 'all' || groupFilter !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Machines will appear here when licenses are activated'
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
      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Delete machine?"
        description="Are you sure you want to delete this machine? This action cannot be undone."
        confirmLabel="Delete"
        destructive
        loading={confirmLoading}
        onConfirm={confirmDeleteMachine}
      />

      {/* Details Dialog */}
      {selectedMachine && (
        <MachineDetailsDialog
          machine={selectedMachine}
          open={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
        />
      )}

      {/* Edit Dialog */}
      {selectedMachine && (
        <MachineEditDialog
          machine={selectedMachine}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onMachineUpdated={onMachineChanged}
        />
      )}
    </div>
  )
}
