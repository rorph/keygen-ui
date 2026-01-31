'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { getKeygenApi } from '@/lib/api'
import { License, User } from '@/lib/types/keygen'
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
  Key,
  Calendar,
  Activity,
  Pause,
  Play,
  Trash2,
  Edit,
  Download,
  Eye,
  Loader2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { handleLoadError, handleCrudError } from '@/lib/utils/error-handling'
import { copyToClipboard } from '@/lib/utils/clipboard'
import { CreateLicenseDialog } from './create-license-dialog'
import { DeleteLicenseDialog } from './delete-license-dialog'
import { EditLicenseDialog } from './edit-license-dialog'
import { LicenseDetailsDialog } from './license-details-dialog'
import { usePagination } from '@/hooks/use-pagination'
import { useDebounce } from '@/hooks/use-debounce'
import { useSorting } from '@/hooks/use-sorting'
import { PaginationControls } from '@/components/shared/pagination-controls'
import { SortableTableHead } from '@/components/shared/sortable-table-head'
import { MetadataIndicator } from '@/components/shared/metadata-indicator'

const ALL_USER_ROLES: User['attributes']['role'][] = [
  'admin', 'developer', 'sales-agent', 'support-agent', 'read-only', 'user'
]

export function LicenseManagement() {
  const [licenses, setLicenses] = useState<License[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm.trim(), 400)
  const [searchResult, setSearchResult] = useState<License | null>(null)
  const [searching, setSearching] = useState(false)
  const searchRequestId = useRef(0)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [policyFilter, setPolicyFilter] = useState<string>('all')
  const [productFilter, setProductFilter] = useState<string>('all')
  const [userFilter, setUserFilter] = useState<string>('all')
  const [groupFilter, setGroupFilter] = useState<string>('all')
  const [filterOptions, setFilterOptions] = useState<{
    policies: { id: string; name: string }[]
    products: { id: string; name: string }[]
    users: { id: string; email: string }[]
    groups: { id: string; name: string }[]
  }>({ policies: [], products: [], users: [], groups: [] })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null)
  const [stats, setStats] = useState({ total: 0, active: 0, expired: 0 })
  const api = getKeygenApi()
  const pagination = usePagination()

  const groupNameMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const g of filterOptions.groups) {
      map.set(g.id, g.name)
    }
    return map
  }, [filterOptions.groups])

  const getGroupName = useCallback((license: License) => {
    const groupData = license.relationships?.group?.data
    if (!groupData || Array.isArray(groupData)) return ''
    return groupNameMap.get(groupData.id) || ''
  }, [groupNameMap])

  const comparators = useMemo(() => ({
    key: (a: License, b: License) => (a.attributes.key || '').localeCompare(b.attributes.key || ''),
    name: (a: License, b: License) => (a.attributes.name || '').localeCompare(b.attributes.name || ''),
    status: (a: License, b: License) => a.attributes.status.localeCompare(b.attributes.status),
    group: (a: License, b: License) => getGroupName(a).localeCompare(getGroupName(b)),
    usage: (a: License, b: License) => (a.attributes.uses || 0) - (b.attributes.uses || 0),
    expiry: (a: License, b: License) => {
      const aDate = a.attributes.expiry ? new Date(a.attributes.expiry).getTime() : Infinity
      const bDate = b.attributes.expiry ? new Date(b.attributes.expiry).getTime() : Infinity
      return aDate - bDate
    },
    created: (a: License, b: License) => new Date(a.attributes.created).getTime() - new Date(b.attributes.created).getTime(),
  }), [getGroupName])
  const sorting = useSorting<License>(comparators)

  const loadStats = useCallback(async () => {
    try {
      // Try analytics endpoint first (single call for total + active)
      const [analyticsRes, expiredRes] = await Promise.all([
        api.analytics.count(),
        api.licenses.list({ limit: 1, status: 'expired' }).catch(() => ({ meta: { count: 0 } })),
      ])
      setStats({
        total: analyticsRes.meta.totalLicenses,
        active: analyticsRes.meta.activeLicenses,
        expired: (typeof expiredRes.meta?.count === 'number' ? expiredRes.meta.count : 0),
      })
    } catch {
      // Fallback to individual list calls if analytics endpoint unavailable
      try {
        const [totalRes, activeRes, expiredRes] = await Promise.all([
          api.licenses.list({ limit: 1 }).catch(() => ({ meta: { count: 0 } })),
          api.licenses.list({ limit: 1, status: 'active' }).catch(() => ({ meta: { count: 0 } })),
          api.licenses.list({ limit: 1, status: 'expired' }).catch(() => ({ meta: { count: 0 } })),
        ])
        setStats({
          total: (typeof totalRes.meta?.count === 'number' ? totalRes.meta.count : 0),
          active: (typeof activeRes.meta?.count === 'number' ? activeRes.meta.count : 0),
          expired: (typeof expiredRes.meta?.count === 'number' ? expiredRes.meta.count : 0),
        })
      } catch {
        // Stats are non-critical
      }
    }
  }, [api.analytics, api.licenses])

  const loadLicenses = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.licenses.list({
        ...pagination.paginationParams,
        ...(statusFilter !== 'all' && { status: statusFilter as License['attributes']['status'] }),
        ...(policyFilter !== 'all' && { policy: policyFilter }),
        ...(productFilter !== 'all' && { product: productFilter }),
        ...(userFilter !== 'all' && { user: userFilter }),
        ...(groupFilter !== 'all' && { group: groupFilter }),
      })
      setLicenses(response.data || [])
      const count = typeof response.meta?.count === 'number' ? response.meta.count : (response.data || []).length
      pagination.setTotalCount(count)
    } catch (error: unknown) {
      handleLoadError(error, 'licenses')
    } finally {
      setLoading(false)
    }
  }, [api.licenses, statusFilter, policyFilter, productFilter, userFilter, groupFilter, pagination.paginationParams])

  useEffect(() => {
    loadLicenses()
  }, [loadLicenses])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  const loadFilterOptions = useCallback(async () => {
    try {
      const [policiesRes, productsRes, usersRes, groupsRes] = await Promise.all([
        api.policies.list({ limit: 100 }).catch(() => ({ data: [] })),
        api.products.list({ limit: 100 }).catch(() => ({ data: [] })),
        api.users.list({ limit: 100, roles: ALL_USER_ROLES }).catch(() => ({ data: [] })),
        api.groups.list({ limit: 100 }).catch(() => ({ data: [] })),
      ])
      setFilterOptions({
        policies: (policiesRes.data || []).map((p: any) => ({ id: p.id, name: p.attributes.name })),
        products: (productsRes.data || []).map((p: any) => ({ id: p.id, name: p.attributes.name })),
        users: (usersRes.data || []).map((u: any) => ({ id: u.id, email: u.attributes.email })),
        groups: (groupsRes.data || []).map((g: any) => ({ id: g.id, name: g.attributes.name })),
      })
    } catch { /* non-critical */ }
  }, [api.policies, api.products, api.users, api.groups])

  useEffect(() => {
    loadFilterOptions()
  }, [loadFilterOptions])

  useEffect(() => {
    pagination.resetToFirstPage()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, policyFilter, productFilter, userFilter, groupFilter, debouncedSearch])

  // Server-side alias lookup for license key / UUID
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

    api.licenses.get(debouncedSearch)
      .then((response) => {
        if (requestId !== searchRequestId.current) return
        setSearchResult(response.data || null)
      })
      .catch(() => {
        if (requestId !== searchRequestId.current) return
        setSearchResult(null)
      })
      .finally(() => {
        if (requestId !== searchRequestId.current) return
        setSearching(false)
      })
  }, [debouncedSearch, api.licenses])

  // Compute display licenses: alias result > client-side filter > all loaded
  const displayLicenses = useMemo(() => {
    if (searchResult) return [searchResult]
    if (searchTerm.trim() && searchTerm.trim().length < 8) {
      const term = searchTerm.trim().toLowerCase()
      return licenses.filter(license =>
        license.attributes.key?.toLowerCase().includes(term) ||
        license.attributes.name?.toLowerCase().includes(term)
      )
    }
    // When debouncedSearch >= 8 chars but no searchResult, show empty (not found)
    if (debouncedSearch.length >= 8 && !searching) return []
    return licenses
  }, [searchResult, searchTerm, debouncedSearch, licenses, searching])

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'suspended': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'expired': return 'bg-red-100 text-red-800 border-red-200'
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleSuspendLicense = async (license: License) => {
    try {
      await api.licenses.suspend(license.id)
      await loadLicenses()
      loadStats()
      toast.success('License suspended successfully')
    } catch (error: unknown) {
      handleCrudError(error, 'update', 'License', { customMessage: 'Failed to suspend license' })
    }
  }

  const handleReinstateLicense = async (license: License) => {
    try {
      await api.licenses.reinstate(license.id)
      await loadLicenses()
      loadStats()
      toast.success('License reinstated successfully')
    } catch (error: unknown) {
      handleCrudError(error, 'update', 'License', { customMessage: 'Failed to reinstate license' })
    }
  }

  const handleRenewLicense = async (license: License) => {
    try {
      await api.licenses.renew(license.id)
      await loadLicenses()
      loadStats()
      toast.success('License renewed successfully')
    } catch (error: unknown) {
      handleCrudError(error, 'update', 'License', { customMessage: 'Failed to renew license' })
    }
  }

  const copyLicenseKey = (key: string) => {
    copyToClipboard(key, 'License key')
  }

  const handleDeleteLicense = (license: License) => {
    setSelectedLicense(license)
    setDeleteDialogOpen(true)
  }

  const handleEditLicense = (license: License) => {
    setSelectedLicense(license)
    setEditDialogOpen(true)
  }

  const handleViewDetails = (license: License) => {
    setSelectedLicense(license)
    setDetailsDialogOpen(true)
  }

  const handleGenerateToken = async (license: License) => {
    try {
      const response = await api.licenses.generateActivationToken(license.id)
      const tokenData = response.data as { attributes?: { token?: string } }
      if (tokenData?.attributes?.token) {
        copyToClipboard(tokenData.attributes.token, 'Activation token')
      } else {
        toast.error('Failed to generate activation token')
      }
    } catch (error: unknown) {
      handleCrudError(error, 'create', 'Activation token', { customMessage: 'Failed to generate activation token' })
    }
  }

  const onLicenseChanged = () => {
    loadLicenses()
    loadStats()
  }

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Licenses</h1>
          <p className="text-muted-foreground">
            Manage and monitor your software licenses
          </p>
        </div>
        <CreateLicenseDialog onLicenseCreated={onLicenseChanged} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Licenses</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              All licenses
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              Currently active licenses
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.expired}</div>
            <p className="text-xs text-muted-foreground">
              Need renewal
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
              placeholder="Search by key, UUID, or name..."
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
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={policyFilter} onValueChange={setPolicyFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Policies" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Policies</SelectItem>
            {filterOptions.policies.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={productFilter} onValueChange={setProductFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Products" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            {filterOptions.products.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
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

      {/* Licenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>License List</CardTitle>
          <CardDescription>
            A list of all licenses in your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-sm text-muted-foreground">Loading licenses...</div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[85px]">ID</TableHead>
                  <SortableTableHead field="key" label="License Key" currentField={sorting.sortField} direction={sorting.sortDirection} onToggle={sorting.toggleSort} />
                  <SortableTableHead field="name" label="Name" currentField={sorting.sortField} direction={sorting.sortDirection} onToggle={sorting.toggleSort} />
                  <SortableTableHead field="status" label="Status" currentField={sorting.sortField} direction={sorting.sortDirection} onToggle={sorting.toggleSort} />
                  <SortableTableHead field="group" label="Group" currentField={sorting.sortField} direction={sorting.sortDirection} onToggle={sorting.toggleSort} />
                  <SortableTableHead field="usage" label="Usage" currentField={sorting.sortField} direction={sorting.sortDirection} onToggle={sorting.toggleSort} />
                  <SortableTableHead field="expiry" label="Expiry" currentField={sorting.sortField} direction={sorting.sortDirection} onToggle={sorting.toggleSort} />
                  <SortableTableHead field="created" label="Created" currentField={sorting.sortField} direction={sorting.sortDirection} onToggle={sorting.toggleSort} />
                  <TableHead className="w-[36px]" />
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorting.sortData(displayLicenses).map((license) => (
                  <TableRow key={license.id} className="cursor-pointer" onClick={(e) => { if (!(e.target as HTMLElement).closest('button, a, [role="menuitem"]')) handleViewDetails(license) }}>
                    <TableCell>
                      <button onClick={() => copyToClipboard(license.id, 'License ID')} className="cursor-pointer hover:underline" title={license.id}>
                        <code className="text-xs font-mono text-muted-foreground">{license.id.split('-')[0]}</code>
                      </button>
                    </TableCell>
                    <TableCell>
                      <button onClick={() => copyLicenseKey(license.attributes.key)} className="cursor-pointer hover:underline" title="Click to copy full key">
                        <code className="text-sm bg-muted px-1 rounded">
                          {license.attributes.key.substring(0, 20)}...
                        </code>
                      </button>
                    </TableCell>
                    <TableCell>
                      {license.attributes.name || 'Unnamed License'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getStatusColor(license.attributes.status)}
                      >
                        {license.attributes.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getGroupName(license) ? (
                        <Badge variant="secondary" className="text-xs">
                          {getGroupName(license)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {license.attributes.uses || 0}
                      {license.attributes.maxUses ? ` / ${license.attributes.maxUses}` : ''}
                    </TableCell>
                    <TableCell>
                      {license.attributes.expiry
                        ? formatDate(license.attributes.expiry)
                        : 'Never expires'
                      }
                    </TableCell>
                    <TableCell>
                      {formatDate(license.attributes.created)}
                    </TableCell>
                    <TableCell>
                      <MetadataIndicator metadata={license.attributes.metadata} />
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
                          <DropdownMenuItem onClick={() => handleViewDetails(license)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditLicense(license)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit License
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleGenerateToken(license)}>
                            <Download className="mr-2 h-4 w-4" />
                            Generate Token
                          </DropdownMenuItem>
                          {license.attributes.status === 'active' ? (
                            <DropdownMenuItem
                              onClick={() => handleSuspendLicense(license)}
                            >
                              <Pause className="mr-2 h-4 w-4" />
                              Suspend
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => handleReinstateLicense(license)}
                            >
                              <Play className="mr-2 h-4 w-4" />
                              Reinstate
                            </DropdownMenuItem>
                          )}
                          {license.attributes.status === 'expired' && (
                            <DropdownMenuItem
                              onClick={() => handleRenewLicense(license)}
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              Renew
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteLicense(license)}
                            className="text-destructive"
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

          {!loading && displayLicenses.length === 0 && (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <Key className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <div className="text-sm font-medium">No licenses found</div>
                <div className="text-xs text-muted-foreground">
                  {searchTerm || statusFilter !== 'all' || policyFilter !== 'all' || productFilter !== 'all' || userFilter !== 'all' || groupFilter !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Get started by creating your first license'
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

      {/* Delete Dialog */}
      {selectedLicense && (
        <DeleteLicenseDialog
          license={selectedLicense}
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onLicenseDeleted={onLicenseChanged}
        />
      )}

      {/* Edit Dialog */}
      {selectedLicense && (
        <EditLicenseDialog
          license={selectedLicense}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onLicenseUpdated={onLicenseChanged}
        />
      )}

      {/* Details Dialog */}
      {selectedLicense && (
        <LicenseDetailsDialog
          license={selectedLicense}
          open={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
          onLicenseUpdated={onLicenseChanged}
        />
      )}
    </div>
  )
}
