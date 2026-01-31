'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { getKeygenApi } from '@/lib/api'
import { Entitlement } from '@/lib/types/keygen'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Plus, Search, MoreHorizontal, Shield, Trash2, Edit, Eye, Code, X } from 'lucide-react'
import { toast } from 'sonner'
import { handleLoadError } from '@/lib/utils/error-handling'
import { copyToClipboard } from '@/lib/utils/clipboard'
import { CreateEntitlementDialog } from './create-entitlement-dialog'
import { EditEntitlementDialog } from './edit-entitlement-dialog'
import { DeleteEntitlementDialog } from './delete-entitlement-dialog'
import { EntitlementDetailsDialog } from './entitlement-details-dialog'
import { usePagination } from '@/hooks/use-pagination'
import { useSorting } from '@/hooks/use-sorting'
import { PaginationControls } from '@/components/shared/pagination-controls'
import { SortableTableHead } from '@/components/shared/sortable-table-head'
import { MetadataIndicator } from '@/components/shared/metadata-indicator'

export function EntitlementManagement() {
  const [entitlements, setEntitlements] = useState<Entitlement[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [selectedEntitlement, setSelectedEntitlement] = useState<Entitlement | null>(null)

  const api = getKeygenApi()
  const pagination = usePagination()

  const comparators = useMemo(() => ({
    name: (a: Entitlement, b: Entitlement) => a.attributes.name.localeCompare(b.attributes.name),
    code: (a: Entitlement, b: Entitlement) => a.attributes.code.localeCompare(b.attributes.code),
    created: (a: Entitlement, b: Entitlement) => new Date(a.attributes.created).getTime() - new Date(b.attributes.created).getTime(),
    updated: (a: Entitlement, b: Entitlement) => new Date(a.attributes.updated).getTime() - new Date(b.attributes.updated).getTime(),
  }), [])
  const sorting = useSorting<Entitlement>(comparators)

  const loadEntitlements = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.entitlements.list(pagination.paginationParams)
      setEntitlements(response.data || [])
      const count = typeof response.meta?.count === 'number' ? response.meta.count : (response.data || []).length
      pagination.setTotalCount(count)
    } catch (error: unknown) {
      handleLoadError(error, 'entitlements')
    } finally {
      setLoading(false)
    }
  }, [api.entitlements, pagination.paginationParams])

  useEffect(() => {
    loadEntitlements()
  }, [loadEntitlements])

  const handleEdit = (entitlement: Entitlement) => {
    setSelectedEntitlement(entitlement)
    setEditDialogOpen(true)
  }

  const handleDelete = (entitlement: Entitlement) => {
    setSelectedEntitlement(entitlement)
    setDeleteDialogOpen(true)
  }

  const handleViewDetails = (entitlement: Entitlement) => {
    setSelectedEntitlement(entitlement)
    setDetailsDialogOpen(true)
  }

  const handleEntitlementCreated = () => {
    setCreateDialogOpen(false)
    loadEntitlements()
    toast.success('Entitlement created successfully')
  }

  const handleEntitlementUpdated = () => {
    setEditDialogOpen(false)
    setSelectedEntitlement(null)
    loadEntitlements()
    toast.success('Entitlement updated successfully')
  }

  const handleEntitlementDeleted = () => {
    setDeleteDialogOpen(false)
    setSelectedEntitlement(null)
    loadEntitlements()
    toast.success('Entitlement deleted successfully')
  }

  useEffect(() => {
    pagination.resetToFirstPage()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm])

  const filteredEntitlements = entitlements.filter(entitlement =>
    entitlement.attributes.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entitlement.attributes.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Entitlements</h1>
          <p className="text-muted-foreground">
            Manage feature entitlements and permissions for your products
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Entitlement
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search Entitlements</CardTitle>
          <CardDescription>Find entitlements by name or code</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="relative flex-1">
              <Input
                placeholder="Search entitlements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-8"
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
        </CardContent>
      </Card>

      {/* Entitlements Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Entitlements ({pagination.totalCount})
          </CardTitle>
          <CardDescription>
            Manage feature toggles and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[85px]">ID</TableHead>
                  <SortableTableHead field="name" label="Name" currentField={sorting.sortField} direction={sorting.sortDirection} onToggle={sorting.toggleSort} />
                  <SortableTableHead field="code" label="Code" currentField={sorting.sortField} direction={sorting.sortDirection} onToggle={sorting.toggleSort} />
                  <SortableTableHead field="created" label="Created" currentField={sorting.sortField} direction={sorting.sortDirection} onToggle={sorting.toggleSort} />
                  <SortableTableHead field="updated" label="Updated" currentField={sorting.sortField} direction={sorting.sortDirection} onToggle={sorting.toggleSort} />
                  <TableHead className="w-[36px]" />
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntitlements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? 'No entitlements match your search.' : 'No entitlements found.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  sorting.sortData(filteredEntitlements).map((entitlement) => (
                    <TableRow key={entitlement.id} className="cursor-pointer" onClick={(e) => { if (!(e.target as HTMLElement).closest('button, a, [role="menuitem"]')) handleViewDetails(entitlement) }}>
                      <TableCell>
                        <button onClick={() => copyToClipboard(entitlement.id, 'Entitlement ID')} className="cursor-pointer hover:underline" title={entitlement.id}>
                          <code className="text-xs font-mono text-muted-foreground">{entitlement.id.split('-')[0]}</code>
                        </button>
                      </TableCell>
                      <TableCell className="font-medium">{entitlement.attributes.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono text-xs">
                          <Code className="h-3 w-3 mr-1" />
                          {entitlement.attributes.code}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(entitlement.attributes.created)}</TableCell>
                      <TableCell>{formatDate(entitlement.attributes.updated)}</TableCell>
                      <TableCell>
                        <MetadataIndicator metadata={entitlement.attributes.metadata} />
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(entitlement)} className="gap-2">
                              <Eye className="h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(entitlement)} className="gap-2">
                              <Edit className="h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(entitlement)}
                              className="gap-2 text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
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

      {/* Dialogs */}
      <CreateEntitlementDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onEntitlementCreated={handleEntitlementCreated}
      />

      {selectedEntitlement && (
        <>
          <EditEntitlementDialog
            entitlement={selectedEntitlement}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            onEntitlementUpdated={handleEntitlementUpdated}
          />
          <DeleteEntitlementDialog
            entitlement={selectedEntitlement}
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            onEntitlementDeleted={handleEntitlementDeleted}
          />
          <EntitlementDetailsDialog
            entitlement={selectedEntitlement}
            open={detailsDialogOpen}
            onOpenChange={setDetailsDialogOpen}
          />
        </>
      )}
    </div>
  )
}
