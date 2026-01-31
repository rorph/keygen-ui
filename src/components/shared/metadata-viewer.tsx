'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Database } from 'lucide-react'

interface MetadataViewerProps {
  metadata?: Record<string, unknown> | null
  title?: string
}

export function MetadataViewer({ metadata, title = 'Metadata' }: MetadataViewerProps) {
  // If no metadata or empty object, show "No metadata" message
  if (!metadata || Object.keys(metadata).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-4 w-4" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No metadata</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Database className="h-4 w-4" />
          {title}
          <Badge variant="secondary" className="text-xs">{Object.keys(metadata).length} keys</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="text-sm bg-muted p-3 rounded-md overflow-auto max-h-64 font-mono">
          {JSON.stringify(metadata, null, 2)}
        </pre>
      </CardContent>
    </Card>
  )
}
