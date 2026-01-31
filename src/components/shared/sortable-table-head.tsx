'use client'

import { TableHead } from '@/components/ui/table'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { type SortDirection } from '@/hooks/use-sorting'

interface SortableTableHeadProps {
  field: string
  label: string
  currentField: string | null
  direction: SortDirection
  onToggle: (field: string) => void
  className?: string
}

export function SortableTableHead({
  field,
  label,
  currentField,
  direction,
  onToggle,
  className,
}: SortableTableHeadProps) {
  const isActive = currentField === field

  return (
    <TableHead
      className={`cursor-pointer select-none hover:bg-muted/50 ${className || ''}`}
      onClick={() => onToggle(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {isActive ? (
          direction === 'asc' ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )
        ) : (
          <ChevronsUpDown className="h-4 w-4 text-muted-foreground/50" />
        )}
      </div>
    </TableHead>
  )
}
