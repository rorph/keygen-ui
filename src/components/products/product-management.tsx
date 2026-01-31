'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { getKeygenApi } from '@/lib/api'
import { Product } from '@/lib/types/keygen'
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
  Package,
  Shield,
  Unlock,
  Lock,
  Edit,
  Trash2,
  ExternalLink,
  Eye,
  X,
} from 'lucide-react'
import { handleLoadError } from '@/lib/utils/error-handling'
import { copyToClipboard } from '@/lib/utils/clipboard'
import { CreateProductDialog } from './create-product-dialog'
import { EditProductDialog } from './edit-product-dialog'
import { DeleteProductDialog } from './delete-product-dialog'
import { ProductDetailsDialog } from './product-details-dialog'
import { usePagination } from '@/hooks/use-pagination'
import { useSorting } from '@/hooks/use-sorting'
import { PaginationControls } from '@/components/shared/pagination-controls'
import { SortableTableHead } from '@/components/shared/sortable-table-head'
import { MetadataIndicator } from '@/components/shared/metadata-indicator'

export function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [strategyFilter, setStrategyFilter] = useState<string>('all')
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const api = getKeygenApi()
  const pagination = usePagination()

  const comparators = useMemo(() => ({
    name: (a: Product, b: Product) => a.attributes.name.localeCompare(b.attributes.name),
    code: (a: Product, b: Product) => (a.attributes.code || '').localeCompare(b.attributes.code || ''),
    strategy: (a: Product, b: Product) => a.attributes.distributionStrategy.localeCompare(b.attributes.distributionStrategy),
    created: (a: Product, b: Product) => new Date(a.attributes.created).getTime() - new Date(b.attributes.created).getTime(),
  }), [])
  const sorting = useSorting<Product>(comparators)

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.products.list(pagination.paginationParams)
      setProducts(response.data || [])
      const count = typeof response.meta?.count === 'number' ? response.meta.count : (response.data || []).length
      pagination.setTotalCount(count)
    } catch (error: unknown) {
      handleLoadError(error, 'products')
    } finally {
      setLoading(false)
    }
  }, [api.products, pagination.paginationParams])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  useEffect(() => {
    pagination.resetToFirstPage()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strategyFilter, searchTerm])

  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchTerm ||
      product.attributes.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.attributes.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.attributes.url?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStrategy = strategyFilter === 'all' || product.attributes.distributionStrategy === strategyFilter

    return matchesSearch && matchesStrategy
  })

  const getStrategyColor = (strategy: string) => {
    switch (strategy) {
      case 'LICENSED': return 'bg-green-100 text-green-800 border-green-200'
      case 'OPEN': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'CLOSED': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStrategyIcon = (strategy: string) => {
    switch (strategy) {
      case 'LICENSED': return <Shield className="h-3 w-3" />
      case 'OPEN': return <Unlock className="h-3 w-3" />
      case 'CLOSED': return <Lock className="h-3 w-3" />
      default: return <Package className="h-3 w-3" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleDeleteProduct = (product: Product) => {
    setDeleteProduct(product)
    setDeleteDialogOpen(true)
  }

  const openUrl = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product)
    setDetailsDialogOpen(true)
  }

  const handleEditProduct = (product: Product) => {
    setEditProduct(product)
    setEditDialogOpen(true)
  }

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Manage your software products and distribution strategies
          </p>
        </div>
        <CreateProductDialog onProductCreated={loadProducts} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.totalCount}</div>
            <p className="text-xs text-muted-foreground">
              Registered products
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Licensed</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {products.filter(p => p.attributes.distributionStrategy === 'LICENSED').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Licensed products
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open</CardTitle>
            <Unlock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {products.filter(p => p.attributes.distributionStrategy === 'OPEN').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Open products
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closed</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {products.filter(p => p.attributes.distributionStrategy === 'CLOSED').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Private products
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
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
        <Select value={strategyFilter} onValueChange={setStrategyFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by strategy" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Strategies</SelectItem>
            <SelectItem value="LICENSED">Licensed</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Product List</CardTitle>
          <CardDescription>
            A list of all products in your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-sm text-muted-foreground">Loading products...</div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[85px]">ID</TableHead>
                  <SortableTableHead field="name" label="Name" currentField={sorting.sortField} direction={sorting.sortDirection} onToggle={sorting.toggleSort} />
                  <SortableTableHead field="code" label="Code" currentField={sorting.sortField} direction={sorting.sortDirection} onToggle={sorting.toggleSort} />
                  <SortableTableHead field="strategy" label="Strategy" currentField={sorting.sortField} direction={sorting.sortDirection} onToggle={sorting.toggleSort} />
                  <TableHead>URL</TableHead>
                  <TableHead>Platforms</TableHead>
                  <SortableTableHead field="created" label="Created" currentField={sorting.sortField} direction={sorting.sortDirection} onToggle={sorting.toggleSort} />
                  <TableHead className="w-[36px]" />
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorting.sortData(filteredProducts).map((product) => (
                  <TableRow key={product.id} className="cursor-pointer" onClick={(e) => { if (!(e.target as HTMLElement).closest('button, a, [role="menuitem"]')) handleViewDetails(product) }}>
                    <TableCell>
                      <button onClick={() => copyToClipboard(product.id, 'Product ID')} className="cursor-pointer hover:underline" title={product.id}>
                        <code className="text-xs font-mono text-muted-foreground">{product.id.split('-')[0]}</code>
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{product.attributes.name}</div>
                    </TableCell>
                    <TableCell>
                      {product.attributes.code ? (
                        <code className="px-2 py-1 bg-muted rounded text-xs font-mono">
                          {product.attributes.code}
                        </code>
                      ) : (
                        <span className="text-muted-foreground">No code</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${getStrategyColor(product.attributes.distributionStrategy)} flex items-center gap-1 w-fit`}
                      >
                        {getStrategyIcon(product.attributes.distributionStrategy)}
                        {product.attributes.distributionStrategy?.toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {product.attributes.url ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openUrl(product.attributes.url!)}
                          className="p-0 h-auto font-normal text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          {product.attributes.url}
                        </Button>
                      ) : (
                        <span className="text-muted-foreground">No URL</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {product.attributes.platforms && product.attributes.platforms.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {product.attributes.platforms.slice(0, 2).map((platform, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {platform}
                            </Badge>
                          ))}
                          {product.attributes.platforms.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{product.attributes.platforms.length - 2}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No platforms</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {formatDate(product.attributes.created)}
                    </TableCell>
                    <TableCell>
                      <MetadataIndicator metadata={product.attributes.metadata} />
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
                          <DropdownMenuItem onClick={() => handleViewDetails(product)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditProduct(product)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Product
                          </DropdownMenuItem>
                          {product.attributes.url && (
                            <DropdownMenuItem onClick={() => openUrl(product.attributes.url!)}>
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Visit URL
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteProduct(product)}
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

          {!loading && filteredProducts.length === 0 && (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <Package className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <div className="text-sm font-medium">No products found</div>
                <div className="text-xs text-muted-foreground">
                  {searchTerm || strategyFilter !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Get started by creating your first product'
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

      {/* Edit Product Dialog */}
      <EditProductDialog
        product={editProduct}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onProductUpdated={loadProducts}
      />

      {/* Delete Product Dialog */}
      <DeleteProductDialog
        product={deleteProduct}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onProductDeleted={loadProducts}
      />

      {/* Product Details Dialog */}
      {selectedProduct && (
        <ProductDetailsDialog
          product={selectedProduct}
          open={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
        />
      )}
    </div>
  )
}
