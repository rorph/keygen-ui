'use client'

import { Machine } from '@/lib/types/keygen'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Monitor, Calendar, Info, Cpu, Globe, Server, HardDrive, MemoryStick } from 'lucide-react'
import { copyToClipboard } from '@/lib/utils/clipboard'
import { MetadataViewer } from '@/components/shared/metadata-viewer'

interface MachineDetailsDialogProps {
  machine: Machine
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatBytes(bytes: number | undefined | null): string {
  if (!bytes) return 'Unknown'
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
}

export function MachineDetailsDialog({
  machine,
  open,
  onOpenChange
}: MachineDetailsDialogProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getHeartbeatStatusBadge = (status: string) => {
    const normalized = status.toLowerCase().replace('_', '-')
    switch (normalized) {
      case 'alive':
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            {status.replace(/[_-]/g, ' ').toLowerCase()}
          </Badge>
        )
      case 'dead':
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
            {status.replace(/[_-]/g, ' ').toLowerCase()}
          </Badge>
        )
      case 'not-started':
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
            {status.replace(/[_-]/g, ' ').toLowerCase()}
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
            {status.replace(/[_-]/g, ' ').toLowerCase()}
          </Badge>
        )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Machine Details: {machine.attributes.name || 'Unnamed Machine'}
          </DialogTitle>
          <DialogDescription>
            View detailed information about this machine.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Machine Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Info className="h-4 w-4" />
                Machine Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="text-sm">{machine.attributes.name || 'Unnamed Machine'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    {getHeartbeatStatusBadge(machine.attributes.heartbeatStatus)}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Fingerprint</label>
                <div
                  className="mt-1 bg-muted p-3 rounded-md overflow-auto cursor-pointer hover:bg-muted/80 transition-colors"
                  onClick={() => copyToClipboard(machine.attributes.fingerprint, 'Fingerprint')}
                  title="Click to copy"
                >
                  <code className="text-xs font-mono break-all">{machine.attributes.fingerprint}</code>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">ID</label>
                <p
                  className="text-sm font-mono text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => copyToClipboard(machine.id, 'Machine ID')}
                  title="Click to copy"
                >
                  {machine.id}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Hardware Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Cpu className="h-4 w-4" />
                Hardware Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Platform</label>
                  <p className="text-sm">{machine.attributes.platform || 'Unknown'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Hostname</label>
                  <p className="text-sm flex items-center gap-2">
                    <Server className="h-3.5 w-3.5 text-muted-foreground" />
                    {machine.attributes.hostname || 'Unknown'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">IP Address</label>
                  <p className="text-sm flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                    {machine.attributes.ip || 'Unknown'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Cores</label>
                  <p className="text-sm">{machine.attributes.cores || 'Unknown'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Memory</label>
                  <p className="text-sm flex items-center gap-2">
                    <MemoryStick className="h-3.5 w-3.5 text-muted-foreground" />
                    {formatBytes(machine.attributes.memory)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Disk</label>
                  <p className="text-sm flex items-center gap-2">
                    <HardDrive className="h-3.5 w-3.5 text-muted-foreground" />
                    {formatBytes(machine.attributes.disk)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Heartbeat */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Monitor className="h-4 w-4" />
                Heartbeat
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Require Heartbeat</label>
                  <p className="text-sm">{machine.attributes.requireHeartbeat ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Heartbeat Duration</label>
                  <p className="text-sm">
                    {machine.attributes.heartbeatDuration
                      ? `${machine.attributes.heartbeatDuration}s`
                      : 'N/A'}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Last Heartbeat</label>
                <p className="text-sm">
                  {machine.attributes.lastHeartbeat
                    ? formatDate(machine.attributes.lastHeartbeat)
                    : 'Never'}
                </p>
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
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(machine.attributes.created)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Updated</label>
                  <p className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(machine.attributes.updated)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          <MetadataViewer metadata={machine.attributes.metadata} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
