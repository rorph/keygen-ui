'use client'

import { useState, useEffect, useCallback } from 'react'
import { getKeygenApi } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { License, Machine } from '@/lib/types/keygen'
import { Key, Monitor, Clock } from 'lucide-react'
import { copyToClipboard } from '@/lib/utils/clipboard'

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const getLicenseStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'expired':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'suspended':
      return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'inactive':
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

const getMachineStatusColor = (heartbeatStatus: string) => {
  const normalized = heartbeatStatus.toLowerCase().replace('_', '-')
  switch (normalized) {
    case 'alive':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'dead':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'not-started':
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export function RecentItems() {
  const [licenses, setLicenses] = useState<License[]>([])
  const [machines, setMachines] = useState<Machine[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const api = getKeygenApi()

      const [licensesResponse, machinesResponse] = await Promise.all([
        api.licenses.list({ limit: 10 }).catch(() => ({ data: [] })),
        api.machines.list({ limit: 10 }).catch(() => ({ data: [] })),
      ])

      setLicenses((licensesResponse.data as License[]) || [])
      setMachines((machinesResponse.data as Machine[]) || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-4 lg:px-6">
      {/* Recent Licenses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Recent Licenses
          </CardTitle>
          <CardDescription>Latest created licenses</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : licenses.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No licenses found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Created
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {licenses.map((license) => (
                  <TableRow key={license.id}>
                    <TableCell>
                      <button
                        onClick={() => copyToClipboard(license.id, 'License ID')}
                        className="cursor-pointer hover:underline"
                        title={license.id}
                      >
                        <code className="text-xs font-mono text-muted-foreground">
                          {license.id.split('-')[0]}
                        </code>
                      </button>
                    </TableCell>
                    <TableCell className="text-sm">
                      {license.attributes.name || 'Unnamed'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getLicenseStatusColor(license.attributes.status)}
                      >
                        {license.attributes.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatRelativeTime(license.attributes.created)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Machines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Recent Machines
          </CardTitle>
          <CardDescription>Latest registered machines</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : machines.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No machines found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Created
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {machines.map((machine) => (
                  <TableRow key={machine.id}>
                    <TableCell>
                      <button
                        onClick={() => copyToClipboard(machine.id, 'Machine ID')}
                        className="cursor-pointer hover:underline"
                        title={machine.id}
                      >
                        <code className="text-xs font-mono text-muted-foreground">
                          {machine.id.split('-')[0]}
                        </code>
                      </button>
                    </TableCell>
                    <TableCell className="text-sm">
                      {machine.attributes.name || machine.attributes.hostname || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getMachineStatusColor(machine.attributes.heartbeatStatus)}
                      >
                        {machine.attributes.heartbeatStatus.replace(/[_-]/g, ' ').toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatRelativeTime(machine.attributes.created)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
