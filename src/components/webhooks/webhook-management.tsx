'use client'

import { useState, useEffect, useCallback } from 'react'
import { getKeygenApi } from '@/lib/api'
import { Webhook } from '@/lib/types/keygen'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Plus, Search, MoreHorizontal, Webhook as WebhookIcon, Trash2, Edit, Eye, TestTube, X } from 'lucide-react'
import { toast } from 'sonner'
import { handleLoadError, handleCrudError } from '@/lib/utils/error-handling'
import { copyToClipboard } from '@/lib/utils/clipboard'
import { CreateWebhookDialog } from './create-webhook-dialog'
import { EditWebhookDialog } from './edit-webhook-dialog'
import { DeleteWebhookDialog } from './delete-webhook-dialog'
import { WebhookDetailsDialog } from './webhook-details-dialog'
import { usePagination } from '@/hooks/use-pagination'
import { PaginationControls } from '@/components/shared/pagination-controls'

export function WebhookManagement() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null)

  const api = getKeygenApi()
  const pagination = usePagination()

  const loadWebhooks = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.webhooks.list(pagination.paginationParams)
      setWebhooks(response.data || [])
      const count = typeof response.meta?.count === 'number' ? response.meta.count : (response.data || []).length
      pagination.setTotalCount(count)
    } catch (error: unknown) {
      handleLoadError(error, 'webhooks')
    } finally {
      setLoading(false)
    }
  }, [api.webhooks, pagination.paginationParams])

  useEffect(() => {
    loadWebhooks()
  }, [loadWebhooks])

  const handleTestWebhook = async (webhook: Webhook) => {
    try {
      await api.webhooks.test(webhook.id)
      toast.success('Test webhook sent successfully')
    } catch (error: unknown) {
      handleCrudError(error, 'update', 'Webhook', {
        customMessage: 'Failed to send test webhook'
      })
    }
  }

  const handleEdit = (webhook: Webhook) => {
    setSelectedWebhook(webhook)
    setEditDialogOpen(true)
  }

  const handleDelete = (webhook: Webhook) => {
    setSelectedWebhook(webhook)
    setDeleteDialogOpen(true)
  }

  const handleViewDetails = (webhook: Webhook) => {
    setSelectedWebhook(webhook)
    setDetailsDialogOpen(true)
  }

  const handleWebhookCreated = () => {
    setCreateDialogOpen(false)
    loadWebhooks()
    toast.success('Webhook created successfully')
  }

  const handleWebhookUpdated = () => {
    setEditDialogOpen(false)
    setSelectedWebhook(null)
    loadWebhooks()
    toast.success('Webhook updated successfully')
  }

  const handleWebhookDeleted = () => {
    setDeleteDialogOpen(false)
    setSelectedWebhook(null)
    loadWebhooks()
    toast.success('Webhook deleted successfully')
  }

  useEffect(() => {
    pagination.resetToFirstPage()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm])

  const filteredWebhooks = webhooks.filter(webhook =>
    webhook.attributes.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
    webhook.attributes.subscriptions.some(event => event.toLowerCase().includes(searchTerm.toLowerCase()))
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
          <h1 className="text-3xl font-bold tracking-tight">Webhooks</h1>
          <p className="text-muted-foreground">
            Configure webhook endpoints to receive real-time event notifications
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Webhook
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search Webhooks</CardTitle>
          <CardDescription>Find webhooks by URL or events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="relative flex-1">
              <Input
                placeholder="Search webhooks..."
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

      {/* Webhooks Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WebhookIcon className="h-5 w-5" />
            Webhooks ({pagination.totalCount})
          </CardTitle>
          <CardDescription>
            Manage webhook endpoints and event subscriptions
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
                  <TableHead>URL</TableHead>
                  <TableHead>Events</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWebhooks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? 'No webhooks match your search.' : 'No webhooks found.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredWebhooks.map((webhook) => (
                    <TableRow key={webhook.id} className="cursor-pointer" onClick={(e) => { if (!(e.target as HTMLElement).closest('button, a, [role="menuitem"]')) handleViewDetails(webhook) }}>
                      <TableCell>
                        <button onClick={() => copyToClipboard(webhook.id, 'Webhook ID')} className="cursor-pointer hover:underline" title={webhook.id}>
                          <code className="text-xs font-mono text-muted-foreground">{webhook.id.split('-')[0]}</code>
                        </button>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <WebhookIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono text-sm">{webhook.attributes.url}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {webhook.attributes.subscriptions.slice(0, 3).map((event) => (
                            <Badge key={event} variant="outline" className="text-xs">
                              {event}
                            </Badge>
                          ))}
                          {webhook.attributes.subscriptions.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{webhook.attributes.subscriptions.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(webhook.attributes.created)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(webhook)} className="gap-2">
                              <Eye className="h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleTestWebhook(webhook)} className="gap-2">
                              <TestTube className="h-4 w-4" />
                              Send Test
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(webhook)} className="gap-2">
                              <Edit className="h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(webhook)}
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
      <CreateWebhookDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onWebhookCreated={handleWebhookCreated}
      />

      {selectedWebhook && (
        <>
          <EditWebhookDialog
            webhook={selectedWebhook}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            onWebhookUpdated={handleWebhookUpdated}
          />
          <DeleteWebhookDialog
            webhook={selectedWebhook}
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            onWebhookDeleted={handleWebhookDeleted}
          />
          <WebhookDetailsDialog
            webhook={selectedWebhook}
            open={detailsDialogOpen}
            onOpenChange={setDetailsDialogOpen}
          />
        </>
      )}
    </div>
  )
}
