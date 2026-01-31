'use client'

import { useState, useCallback } from 'react'

export type SortDirection = 'asc' | 'desc'

export interface UseSortingReturn<T> {
  sortField: string | null
  sortDirection: SortDirection
  toggleSort: (field: string) => void
  sortData: (data: T[]) => T[]
}

export function useSorting<T>(
  comparators: Record<string, (a: T, b: T) => number>
): UseSortingReturn<T> {
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  const toggleSort = useCallback((field: string) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else {
        // Clear sort
        setSortField(null)
        setSortDirection('asc')
      }
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }, [sortField, sortDirection])

  const sortData = useCallback((data: T[]): T[] => {
    if (!sortField || !comparators[sortField]) return data
    const comparator = comparators[sortField]
    const sorted = [...data].sort(comparator)
    return sortDirection === 'desc' ? sorted.reverse() : sorted
  }, [sortField, sortDirection, comparators])

  return { sortField, sortDirection, toggleSort, sortData }
}
