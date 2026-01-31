'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { getKeygenApi } from '@/lib/api'
import { Group } from '@/lib/types/keygen'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Plus, Search, MoreHorizontal, Users, Trash2, Edit, Eye, X } from 'lucide-react'
import { toast } from 'sonner'
import { handleLoadError } from '@/lib/utils/error-handling'
import { copyToClipboard } from '@/lib/utils/clipboard'
import { CreateGroupDialog } from './create-group-dialog'
import { EditGroupDialog } from './edit-group-dialog'
import { DeleteGroupDialog } from './delete-group-dialog'
import { GroupDetailsDialog } from './group-details-dialog'
import { usePagination } from '@/hooks/use-pagination'
import { useSorting } from '@/hooks/use-sorting'
import { PaginationControls } from '@/components/shared/pagination-controls'
import { SortableTableHead } from '@/components/shared/sortable-table-head'
import { MetadataIndicator } from '@/components/shared/metadata-indicator'

export function GroupManagement() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)

  const api = getKeygenApi()
  const pagination = usePagination()

  const comparators = useMemo(() => ({
    name: (a: Group, b: Group) => a.attributes.name.localeCompare(b.attributes.name),
    maxLicenses: (a: Group, b: Group) => (a.attributes.maxLicenses || Infinity) - (b.attributes.maxLicenses || Infinity),
    maxMachines: (a: Group, b: Group) => (a.attributes.maxMachines || Infinity) - (b.attributes.maxMachines || Infinity),
    maxUsers: (a: Group, b: Group) => (a.attributes.maxUsers || Infinity) - (b.attributes.maxUsers || Infinity),
    created: (a: Group, b: Group) => new Date(a.attributes.created).getTime() - new Date(b.attributes.created).getTime(),
  }), [])
  const sorting = useSorting<Group>(comparators)

  const loadGroups = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.groups.list(pagination.paginationParams)
      setGroups(response.data || [])
      const count = typeof response.meta?.count === 'number' ? response.meta.count : (response.data || []).length
      pagination.setTotalCount(count)
    } catch (error: unknown) {
      handleLoadError(error, 'groups')
    } finally {
      setLoading(false)
    }
  }, [api.groups, pagination.paginationParams])

  useEffect(() => {
    loadGroups()
  }, [loadGroups])

  const handleEdit = (group: Group) => {
    setSelectedGroup(group)
    setEditDialogOpen(true)
  }

  const handleDelete = (group: Group) => {
    setSelectedGroup(group)
    setDeleteDialogOpen(true)
  }

  const handleViewDetails = (group: Group) => {
    setSelectedGroup(group)
    setDetailsDialogOpen(true)
  }

  const handleGroupCreated = () => {
    setCreateDialogOpen(false)
    loadGroups()
    toast.success('Group created successfully')
  }

  const handleGroupUpdated = () => {
    setEditDialogOpen(false)
    setSelectedGroup(null)
    loadGroups()
    toast.success('Group updated successfully')
  }

  const handleGroupDeleted = () => {
    setDeleteDialogOpen(false)
    setSelectedGroup(null)
    loadGroups()
    toast.success('Group deleted successfully')
  }

  useEffect(() => {
    pagination.resetToFirstPage()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm])

  const filteredGroups = groups.filter(group =>
    group.attributes.name.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-3xl font-bold tracking-tight">Groups</h1>
          <p className="text-muted-foreground">
            Organize users and licenses into groups for easier management
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Group
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search Groups</CardTitle>
          <CardDescription>Find groups by name</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="relative flex-1">
              <Input
                placeholder="Search groups..."
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

      {/* Groups Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Groups ({pagination.totalCount})
          </CardTitle>
          <CardDescription>
            Manage your groups and their configurations
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
                  <SortableTableHead field="maxLicenses" label="Max Licenses" currentField={sorting.sortField} direction={sorting.sortDirection} onToggle={sorting.toggleSort} />
                  <SortableTableHead field="maxMachines" label="Max Machines" currentField={sorting.sortField} direction={sorting.sortDirection} onToggle={sorting.toggleSort} />
                  <SortableTableHead field="maxUsers" label="Max Users" currentField={sorting.sortField} direction={sorting.sortDirection} onToggle={sorting.toggleSort} />
                  <SortableTableHead field="created" label="Created" currentField={sorting.sortField} direction={sorting.sortDirection} onToggle={sorting.toggleSort} />
                  <TableHead className="w-[36px]" />
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGroups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? 'No groups match your search.' : 'No groups found.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  sorting.sortData(filteredGroups).map((group) => (
                    <TableRow key={group.id} className="cursor-pointer" onClick={(e) => { if (!(e.target as HTMLElement).closest('button, a, [role="menuitem"]')) handleViewDetails(group) }}>
                      <TableCell>
                        <button onClick={() => copyToClipboard(group.id, 'Group ID')} className="cursor-pointer hover:underline" title={group.id}>
                          <code className="text-xs font-mono text-muted-foreground">{group.id.split('-')[0]}</code>
                        </button>
                      </TableCell>
                      <TableCell className="font-medium">{group.attributes.name}</TableCell>
                      <TableCell>
                        {group.attributes.maxLicenses ? (
                          <Badge variant="secondary">{group.attributes.maxLicenses}</Badge>
                        ) : (
                          <Badge variant="outline">Unlimited</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {group.attributes.maxMachines ? (
                          <Badge variant="secondary">{group.attributes.maxMachines}</Badge>
                        ) : (
                          <Badge variant="outline">Unlimited</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {group.attributes.maxUsers ? (
                          <Badge variant="secondary">{group.attributes.maxUsers}</Badge>
                        ) : (
                          <Badge variant="outline">Unlimited</Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(group.attributes.created)}</TableCell>
                      <TableCell>
                        <MetadataIndicator metadata={group.attributes.metadata} />
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(group)} className="gap-2">
                              <Eye className="h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(group)} className="gap-2">
                              <Edit className="h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(group)}
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
      <CreateGroupDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onGroupCreated={handleGroupCreated}
      />

      {selectedGroup && (
        <>
          <EditGroupDialog
            group={selectedGroup}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            onGroupUpdated={handleGroupUpdated}
          />
          <DeleteGroupDialog
            group={selectedGroup}
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            onGroupDeleted={handleGroupDeleted}
          />
          <GroupDetailsDialog
            group={selectedGroup}
            open={detailsDialogOpen}
            onOpenChange={setDetailsDialogOpen}
          />
        </>
      )}
    </div>
  )
}
