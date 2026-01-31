'use client'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'

interface PaginationControlsProps {
  startItem: number
  endItem: number
  totalCount: number
  pageNumber: number
  totalPages: number
  pageSize: number
  hasNextPage: boolean
  hasPrevPage: boolean
  onNextPage: () => void
  onPrevPage: () => void
  onFirstPage: () => void
  onLastPage: () => void
  onPageSizeChange: (size: number) => void
  loading?: boolean
}

export function PaginationControls({
  startItem,
  endItem,
  totalCount,
  pageNumber,
  totalPages,
  pageSize,
  hasNextPage,
  hasPrevPage,
  onNextPage,
  onPrevPage,
  onFirstPage,
  onLastPage,
  onPageSizeChange,
  loading = false,
}: PaginationControlsProps) {
  if (totalCount === 0) return null

  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="text-sm text-muted-foreground">
        Showing {startItem}-{endItem} of {totalCount}
      </div>
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          <p className="text-sm text-muted-foreground">Rows per page</p>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
            disabled={loading}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={String(pageSize)} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 25, 50, 100].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <p className="text-sm text-muted-foreground">
            Page {pageNumber} of {totalPages}
          </p>
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={onFirstPage}
              disabled={!hasPrevPage || loading}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={onPrevPage}
              disabled={!hasPrevPage || loading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={onNextPage}
              disabled={!hasNextPage || loading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={onLastPage}
              disabled={!hasNextPage || loading}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
