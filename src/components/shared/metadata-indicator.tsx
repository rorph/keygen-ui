'use client'

import { Braces } from 'lucide-react'

interface MetadataIndicatorProps {
  metadata?: Record<string, unknown> | null
}

/**
 * Shows a small `{}` icon when the resource has non-empty metadata.
 * Returns null when metadata is absent, null, or an empty object.
 */
export function MetadataIndicator({ metadata }: MetadataIndicatorProps) {
  if (!metadata || Object.keys(metadata).length === 0) return null

  const keyCount = Object.keys(metadata).length

  return (
    <span title={`Metadata: ${keyCount} key${keyCount !== 1 ? 's' : ''}`}>
      <Braces className="h-3.5 w-3.5 text-muted-foreground inline-block" />
    </span>
  )
}
