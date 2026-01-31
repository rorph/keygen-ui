'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { getKeygenApi } from '@/lib/api'
import { Policy } from '@/lib/types/keygen'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Shield,
  Users,
  Settings,
  Trash2,
  Edit,
  Clock,
  Eye,
  X,
} from 'lucide-react'
import { handleLoadError } from '@/lib/utils/error-handling'
import { copyToClipboard } from '@/lib/utils/clipboard'
import { CreatePolicyDialog } from './create-policy-dialog'
import { DeletePolicyDialog } from './delete-policy-dialog'
import { PolicyDetailsDialog } from './policy-details-dialog'
import { usePagination } from '@/hooks/use-pagination'
import { useSorting } from '@/hooks/use-sorting'
import { PaginationControls } from '@/components/shared/pagination-controls'
import { SortableTableHead } from '@/components/shared/sortable-table-head'
import { MetadataIndicator } from '@/components/shared/metadata-indicator'

export function PolicyManagement() {
  const [policies, setPolicies] = useState<Policy[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [policyToDelete, setPolicyToDelete] = useState<Policy | null>(null)
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const api = getKeygenApi()
  const pagination = usePagination()

  const comparators = useMemo(() => ({
    name: (a: Policy, b: Policy) => a.attributes.name.localeCompare(b.attributes.name),
    expiration: (a: Policy, b: Policy) => (a.attributes.duration || 0) - (b.attributes.duration || 0),
    created: (a: Policy, b: Policy) => new Date(a.attributes.created).getTime() - new Date(b.attributes.created).getTime(),
  }), [])
  const sorting = useSorting<Policy>(comparators)

  const loadPolicies = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.policies.list(pagination.paginationParams)
      setPolicies(response.data || [])
      const count = typeof response.meta?.count === 'number' ? response.meta.count : (response.data || []).length
      pagination.setTotalCount(count)
    } catch (error: unknown) {
      handleLoadError(error, 'policies')
    } finally {
      setLoading(false)
    }
  }, [api.policies, pagination.paginationParams])

  useEffect(() => {
    loadPolicies()
  }, [loadPolicies])

  useEffect(() => {
    pagination.resetToFirstPage()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, searchTerm])

  const filteredPolicies = policies.filter(policy => {
    const matchesSearch = !searchTerm ||
      policy.attributes.name?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = typeFilter === 'all' ||
      (typeFilter === 'floating' && policy.attributes.floating) ||
      (typeFilter === 'node-locked' && !policy.attributes.floating) ||
      (typeFilter === 'protected' && policy.attributes.protected) ||
      (typeFilter === 'strict' && policy.attributes.strict)

    return matchesSearch && matchesType
  })

  const getExpirationText = (duration?: number) => {
    if (!duration) return 'Never expires'

    const days = Math.floor(duration / (24 * 60 * 60))
    const hours = Math.floor((duration % (24 * 60 * 60)) / (60 * 60))

    if (days > 0) {
      return `${days} day${days !== 1 ? 's' : ''}`
    } else if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`
    } else {
      return `${duration} seconds`
    }
  }

  const handleViewDetails = (policy: Policy) => {
    setSelectedPolicy(policy)
    setDetailsDialogOpen(true)
  }

  const handleDeletePolicy = (policy: Policy) => {
    setPolicyToDelete(policy)
    setDeleteDialogOpen(true)
  }

  const copyId = (id: string) => {
    copyToClipboard(id, 'Policy ID')
  }

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Policies</h1>
          <p className="text-muted-foreground">
            Manage licensing policies and rules for your products
          </p>
        </div>
        <CreatePolicyDialog onPolicyCreated={loadPolicies} />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Policies</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.totalCount}</div>
            <p className="text-xs text-muted-foreground">
              All licensing policies
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Floating Policies</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {policies.filter(p => p.attributes.floating).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Multi-device licenses
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Protected</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {policies.filter(p => p.attributes.protected).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Write-protected policies
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Timed Policies</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {policies.filter(p => p.attributes.duration).length}
            </div>
            <p className="text-xs text-muted-foreground">
              With expiration
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search policies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-8"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Policies</SelectItem>
            <SelectItem value="floating">Floating</SelectItem>
            <SelectItem value="node-locked">Node-Locked</SelectItem>
            <SelectItem value="protected">Protected</SelectItem>
            <SelectItem value="strict">Strict</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Policies Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[85px]">ID</TableHead>
              <SortableTableHead field="name" label="Policy" currentField={sorting.sortField} direction={sorting.sortDirection} onToggle={sorting.toggleSort} />
              <TableHead>Type</TableHead>
              <SortableTableHead field="expiration" label="Expiration" currentField={sorting.sortField} direction={sorting.sortDirection} onToggle={sorting.toggleSort} />
              <TableHead>Limits</TableHead>
              <SortableTableHead field="created" label="Created" currentField={sorting.sortField} direction={sorting.sortDirection} onToggle={sorting.toggleSort} />
              <TableHead className="w-[36px]" />
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  Loading policies...
                </TableCell>
              </TableRow>
            ) : filteredPolicies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No policies found.
                </TableCell>
              </TableRow>
            ) : (
              sorting.sortData(filteredPolicies).map((policy) => (
                <TableRow key={policy.id} className="cursor-pointer" onClick={(e) => { if (!(e.target as HTMLElement).closest('button, a, [role="menuitem"]')) handleViewDetails(policy) }}>
                  <TableCell>
                    <button onClick={() => copyToClipboard(policy.id, 'Policy ID')} className="cursor-pointer hover:underline" title={policy.id}>
                      <code className="text-xs font-mono text-muted-foreground">{policy.id.split('-')[0]}</code>
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{policy.attributes.name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {policy.attributes.floating && (
                        <Badge variant="outline" className="text-xs">
                          Floating
                        </Badge>
                      )}
                      {policy.attributes.strict && (
                        <Badge variant="outline" className="text-xs">
                          Strict
                        </Badge>
                      )}
                      {policy.attributes.protected && (
                        <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800 border-orange-200">
                          Protected
                        </Badge>
                      )}
                      {policy.attributes.requireHeartbeat && (
                        <Badge variant="outline" className="text-xs">
                          Heartbeat
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`text-sm ${policy.attributes.duration ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {getExpirationText(policy.attributes.duration)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm space-y-1">
                      {policy.attributes.maxMachines && (
                        <div>Machines: {policy.attributes.maxMachines}</div>
                      )}
                      {policy.attributes.maxProcesses && (
                        <div>Processes: {policy.attributes.maxProcesses}</div>
                      )}
                      {policy.attributes.maxUses && (
                        <div>Uses: {policy.attributes.maxUses}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {new Date(policy.attributes.created).toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <MetadataIndicator metadata={policy.attributes.metadata} />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => copyId(policy.id)}>
                          Copy ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleViewDetails(policy)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Policy
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeletePolicy(policy)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
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
      </div>

      {/* Delete Dialog */}
      {policyToDelete && (
        <DeletePolicyDialog
          policy={policyToDelete}
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onPolicyDeleted={loadPolicies}
        />
      )}

      {/* Policy Details Dialog */}
      {selectedPolicy && (
        <PolicyDetailsDialog
          policy={selectedPolicy}
          open={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
          onPolicyUpdated={loadPolicies}
        />
      )}
    </div>
  )
}
