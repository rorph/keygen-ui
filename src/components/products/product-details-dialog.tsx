'use client'

import { Product } from '@/lib/types/keygen'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, Calendar, Info, Globe, ShieldCheck } from 'lucide-react'
import { copyToClipboard } from '@/lib/utils/clipboard'
import { MetadataViewer } from '@/components/shared/metadata-viewer'

interface ProductDetailsDialogProps {
  product: Product
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProductDetailsDialog({
  product,
  open,
  onOpenChange
}: ProductDetailsDialogProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getDistributionStrategyColor = (strategy: string) => {
    switch (strategy) {
      case 'LICENSED':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'OPEN':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'CLOSED':
        return 'bg-red-100 text-red-800 border-red-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Details: {product.attributes.name}
          </DialogTitle>
          <DialogDescription>
            View detailed information about this product.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Product Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Info className="h-4 w-4" />
                Product Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="text-sm">{product.attributes.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Code</label>
                  <p className="text-sm">{product.attributes.code || 'N/A'}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Distribution Strategy</label>
                <div className="mt-1">
                  <Badge variant="outline" className={getDistributionStrategyColor(product.attributes.distributionStrategy)}>
                    {product.attributes.distributionStrategy}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">ID</label>
                <p
                  className="text-sm font-mono text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => copyToClipboard(product.id, 'Product ID')}
                  title="Click to copy"
                >
                  {product.id}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Product Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Globe className="h-4 w-4" />
                Product Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">URL</label>
                <p className="text-sm">
                  {product.attributes.url ? (
                    <a
                      href={product.attributes.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      {product.attributes.url}
                    </a>
                  ) : (
                    'N/A'
                  )}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Platforms</label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {product.attributes.platforms && product.attributes.platforms.length > 0 ? (
                    product.attributes.platforms.map((platform) => (
                      <Badge key={platform} variant="secondary">
                        {platform}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No platforms specified</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Permissions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4" />
                Permissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {product.attributes.permissions && product.attributes.permissions.length > 0 ? (
                  product.attributes.permissions.map((permission) => (
                    <Badge key={permission} variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                      {permission}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No permissions configured</p>
                )}
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
                    {formatDate(product.attributes.created)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Updated</label>
                  <p className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(product.attributes.updated)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          <MetadataViewer metadata={product.attributes.metadata} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
