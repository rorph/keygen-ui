'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'

const PAGE_SIZE_STORAGE_KEY = 'keygen-ui-page-size'
const VALID_PAGE_SIZES = [10, 25, 50, 100]

function getStoredPageSize(defaultSize: number): number {
  if (typeof window === 'undefined') return defaultSize
  try {
    const stored = localStorage.getItem(PAGE_SIZE_STORAGE_KEY)
    if (stored) {
      const parsed = parseInt(stored, 10)
      if (VALID_PAGE_SIZES.includes(parsed)) return parsed
    }
  } catch {
    // localStorage unavailable
  }
  return defaultSize
}

function storePageSize(size: number): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(PAGE_SIZE_STORAGE_KEY, String(size))
  } catch {
    // localStorage unavailable
  }
}

export interface UsePaginationOptions {
  defaultPageSize?: number
}

export interface UsePaginationReturn {
  pageSize: number
  pageNumber: number
  totalCount: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
  startItem: number
  endItem: number
  goToNextPage: () => void
  goToPrevPage: () => void
  goToFirstPage: () => void
  goToLastPage: () => void
  setPageSize: (size: number) => void
  setTotalCount: (count: number) => void
  resetToFirstPage: () => void
  paginationParams: { page: { size: number; number: number } }
}

export function usePagination(options: UsePaginationOptions = {}): UsePaginationReturn {
  const { defaultPageSize = 25 } = options

  const [pageSize, setPageSizeState] = useState(() => getStoredPageSize(defaultPageSize))
  const [pageNumber, setPageNumber] = useState(1)
  const [totalCount, setTotalCountState] = useState(0)

  // Sync page size from localStorage on mount (handles SSR hydration)
  useEffect(() => {
    const stored = getStoredPageSize(defaultPageSize)
    if (stored !== pageSize) {
      setPageSizeState(stored)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalCount / pageSize)),
    [totalCount, pageSize]
  )

  const hasNextPage = pageNumber < totalPages
  const hasPrevPage = pageNumber > 1

  const startItem = totalCount === 0 ? 0 : (pageNumber - 1) * pageSize + 1
  const endItem = Math.min(pageNumber * pageSize, totalCount)

  const goToNextPage = useCallback(() => {
    setPageNumber(prev => Math.min(prev + 1, totalPages))
  }, [totalPages])

  const goToPrevPage = useCallback(() => {
    setPageNumber(prev => Math.max(prev - 1, 1))
  }, [])

  const goToFirstPage = useCallback(() => {
    setPageNumber(1)
  }, [])

  const goToLastPage = useCallback(() => {
    setPageNumber(totalPages)
  }, [totalPages])

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size)
    storePageSize(size)
    setPageNumber(1)
  }, [])

  const setTotalCount = useCallback((count: number) => {
    setTotalCountState(count)
  }, [])

  const resetToFirstPage = useCallback(() => {
    setPageNumber(1)
  }, [])

  const paginationParams = useMemo(
    () => ({ page: { size: pageSize, number: pageNumber } }),
    [pageSize, pageNumber]
  )

  return {
    pageSize,
    pageNumber,
    totalCount,
    totalPages,
    hasNextPage,
    hasPrevPage,
    startItem,
    endItem,
    goToNextPage,
    goToPrevPage,
    goToFirstPage,
    goToLastPage,
    setPageSize,
    setTotalCount,
    resetToFirstPage,
    paginationParams,
  }
}
