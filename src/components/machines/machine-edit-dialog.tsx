'use client'

import { useState, useEffect, useCallback } from 'react'
import { Machine, User, Group } from '@/lib/types/keygen'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Edit, Users, FolderTree, Loader2 } from 'lucide-react'
import { getKeygenApi } from '@/lib/api'
import { toast } from 'sonner'
import { handleCrudError } from '@/lib/utils/error-handling'
import { MetadataEditor } from '@/components/shared/metadata-editor'

const ALL_USER_ROLES: User['attributes']['role'][] = [
  'admin', 'developer', 'sales-agent', 'support-agent', 'read-only', 'user'
]

interface MachineEditDialogProps {
  machine: Machine
  open: boolean
  onOpenChange: (open: boolean) => void
  onMachineUpdated: () => void
}

export function MachineEditDialog({
  machine,
  open,
  onOpenChange,
  onMachineUpdated
}: MachineEditDialogProps) {
  const [loading, setLoading] = useState(false)
  const [savingOwner, setSavingOwner] = useState(false)
  const [savingGroup, setSavingGroup] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loadingGroups, setLoadingGroups] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>('')
  const [selectedGroupId, setSelectedGroupId] = useState<string>('')
  const [formData, setFormData] = useState({
    name: '',
    hostname: '',
    ip: '',
    platform: '',
    cores: '',
    memory: '',
    disk: '',
    metadata: {} as Record<string, string>
  })

  const api = getKeygenApi()

  // Initialize form data when dialog opens
  useEffect(() => {
    if (open && machine) {
      // Convert metadata values to strings for the editor
      const metadataAsStrings: Record<string, string> = {}
      if (machine.attributes.metadata) {
        for (const [key, value] of Object.entries(machine.attributes.metadata)) {
          metadataAsStrings[key] = typeof value === 'string' ? value : JSON.stringify(value)
        }
      }

      setFormData({
        name: machine.attributes.name || '',
        hostname: machine.attributes.hostname || '',
        ip: machine.attributes.ip || '',
        platform: machine.attributes.platform || '',
        cores: machine.attributes.cores != null ? String(machine.attributes.cores) : '',
        memory: machine.attributes.memory != null ? String(machine.attributes.memory) : '',
        disk: machine.attributes.disk != null ? String(machine.attributes.disk) : '',
        metadata: metadataAsStrings
      })

      // Initialize relationship selections from current machine data
      const currentOwnerId = (machine.relationships?.user?.data as { id: string; type: string } | undefined)?.id || ''
      const currentGroupId = (machine.relationships?.group?.data as { id: string; type: string } | undefined)?.id || ''
      setSelectedOwnerId(currentOwnerId)
      setSelectedGroupId(currentGroupId)
    }
  }, [open, machine])

  // Load users and groups when dialog opens
  const loadRelationshipData = useCallback(async () => {
    if (!open) return

    setLoadingUsers(true)
    setLoadingGroups(true)

    try {
      const usersResponse = await api.users.list({ roles: ALL_USER_ROLES, page: { size: 100 } })
      setUsers(usersResponse.data || [])
    } catch {
      // Silently fail - users select will just be empty
    } finally {
      setLoadingUsers(false)
    }

    try {
      const groupsResponse = await api.groups.list({ page: { size: 100 } })
      setGroups(groupsResponse.data || [])
    } catch {
      // Silently fail - groups select will just be empty
    } finally {
      setLoadingGroups(false)
    }
  }, [open, api.users, api.groups])

  useEffect(() => {
    loadRelationshipData()
  }, [loadRelationshipData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setLoading(true)

      const updates: Record<string, unknown> = {}

      // Check if name changed
      if (formData.name.trim() !== (machine.attributes.name || '')) {
        updates.name = formData.name.trim() || null
      }

      // Check if hostname changed
      if (formData.hostname.trim() !== (machine.attributes.hostname || '')) {
        updates.hostname = formData.hostname.trim() || null
      }

      // Check if IP changed
      if (formData.ip.trim() !== (machine.attributes.ip || '')) {
        updates.ip = formData.ip.trim() || null
      }

      // Check if platform changed
      if (formData.platform.trim() !== (machine.attributes.platform || '')) {
        updates.platform = formData.platform.trim() || null
      }

      // Check if cores changed
      const currentCores = machine.attributes.cores != null ? String(machine.attributes.cores) : ''
      if (formData.cores.trim() !== currentCores) {
        updates.cores = formData.cores.trim() ? parseInt(formData.cores.trim(), 10) : null
      }

      // Check if memory changed
      const currentMemory = machine.attributes.memory != null ? String(machine.attributes.memory) : ''
      if (formData.memory.trim() !== currentMemory) {
        updates.memory = formData.memory.trim() ? parseInt(formData.memory.trim(), 10) : null
      }

      // Check if disk changed
      const currentDisk = machine.attributes.disk != null ? String(machine.attributes.disk) : ''
      if (formData.disk.trim() !== currentDisk) {
        updates.disk = formData.disk.trim() ? parseInt(formData.disk.trim(), 10) : null
      }

      // Check if metadata changed
      const metadataObj: Record<string, string> = { ...formData.metadata }
      if (JSON.stringify(metadataObj) !== JSON.stringify(machine.attributes.metadata || {})) {
        updates.metadata = metadataObj
      }

      if (Object.keys(updates).length > 0) {
        await api.machines.update(machine.id, updates)
        toast.success('Machine updated successfully')
      } else {
        toast.info('No changes to save')
      }

      onMachineUpdated()
      onOpenChange(false)
    } catch (error: unknown) {
      handleCrudError(error, 'update', 'Machine')
    } finally {
      setLoading(false)
    }
  }

  const handleChangeOwner = async (userId: string) => {
    const resolvedUserId = userId === '__none__' ? '' : userId
    setSelectedOwnerId(resolvedUserId)

    if (!resolvedUserId) return

    try {
      setSavingOwner(true)
      await api.machines.changeOwner(machine.id, resolvedUserId)
      toast.success('Machine owner updated successfully')
      onMachineUpdated()
    } catch (error: unknown) {
      handleCrudError(error, 'update', 'Machine owner')
      // Revert selection on error
      const currentOwnerId = (machine.relationships?.user?.data as { id: string; type: string } | undefined)?.id || ''
      setSelectedOwnerId(currentOwnerId)
    } finally {
      setSavingOwner(false)
    }
  }

  const handleChangeGroup = async (groupId: string) => {
    const resolvedGroupId = groupId === '__none__' ? '' : groupId
    setSelectedGroupId(resolvedGroupId)

    if (!resolvedGroupId) return

    try {
      setSavingGroup(true)
      await api.machines.changeGroup(machine.id, resolvedGroupId)
      toast.success('Machine group updated successfully')
      onMachineUpdated()
    } catch (error: unknown) {
      handleCrudError(error, 'update', 'Machine group')
      // Revert selection on error
      const currentGroupId = (machine.relationships?.group?.data as { id: string; type: string } | undefined)?.id || ''
      setSelectedGroupId(currentGroupId)
    } finally {
      setSavingGroup(false)
    }
  }

  const getUserDisplayName = (user: User): string => {
    const name = user.attributes.fullName || [user.attributes.firstName, user.attributes.lastName].filter(Boolean).join(' ')
    return name ? `${name} (${user.attributes.email})` : user.attributes.email
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Machine
          </DialogTitle>
          <DialogDescription>
            Update machine details, relationships, and metadata.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Fingerprint (Read-only) */}
          <div className="space-y-2">
            <Label>Fingerprint</Label>
            <div className="p-2 bg-muted rounded-md font-mono text-sm">
              {machine.attributes.fingerprint}
            </div>
            <p className="text-xs text-muted-foreground">
              Machine fingerprints cannot be changed after activation
            </p>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="machine-name">Name</Label>
            <Input
              id="machine-name"
              placeholder="Enter machine name (optional)"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={loading}
            />
          </div>

          {/* Hostname & IP Address */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="machine-hostname">Hostname</Label>
              <Input
                id="machine-hostname"
                placeholder="e.g. server-01.local"
                value={formData.hostname}
                onChange={(e) => setFormData({ ...formData, hostname: e.target.value })}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="machine-ip">IP Address</Label>
              <Input
                id="machine-ip"
                placeholder="e.g. 192.168.1.100"
                value={formData.ip}
                onChange={(e) => setFormData({ ...formData, ip: e.target.value })}
                disabled={loading}
              />
            </div>
          </div>

          {/* Platform */}
          <div className="space-y-2">
            <Label htmlFor="machine-platform">Platform</Label>
            <Input
              id="machine-platform"
              placeholder="e.g. linux, windows, macos"
              value={formData.platform}
              onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
              disabled={loading}
            />
          </div>

          {/* Hardware: Cores, Memory, Disk */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="machine-cores">CPU Cores</Label>
              <Input
                id="machine-cores"
                type="number"
                min="0"
                placeholder="e.g. 8"
                value={formData.cores}
                onChange={(e) => setFormData({ ...formData, cores: e.target.value })}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="machine-memory">Memory (bytes)</Label>
              <Input
                id="machine-memory"
                type="number"
                min="0"
                placeholder="e.g. 17179869184"
                value={formData.memory}
                onChange={(e) => setFormData({ ...formData, memory: e.target.value })}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="machine-disk">Disk (bytes)</Label>
              <Input
                id="machine-disk"
                type="number"
                min="0"
                placeholder="e.g. 536870912000"
                value={formData.disk}
                onChange={(e) => setFormData({ ...formData, disk: e.target.value })}
                disabled={loading}
              />
            </div>
          </div>

          <Separator />

          {/* Relationship Management: Owner */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Owner</Label>
              {savingOwner && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
            </div>
            <Select
              value={selectedOwnerId || '__none__'}
              onValueChange={handleChangeOwner}
              disabled={loadingUsers || savingOwner}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={loadingUsers ? 'Loading users...' : 'Select an owner'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">
                  <span className="text-muted-foreground">No owner</span>
                </SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {getUserDisplayName(user)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedOwnerId && (
              <p className="text-xs text-muted-foreground">
                Current owner ID: {selectedOwnerId}
              </p>
            )}
          </div>

          {/* Relationship Management: Group */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FolderTree className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Group</Label>
              {savingGroup && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
            </div>
            <Select
              value={selectedGroupId || '__none__'}
              onValueChange={handleChangeGroup}
              disabled={loadingGroups || savingGroup}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={loadingGroups ? 'Loading groups...' : 'Select a group'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">
                  <span className="text-muted-foreground">No group</span>
                </SelectItem>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.attributes.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedGroupId && (
              <p className="text-xs text-muted-foreground">
                Current group ID: {selectedGroupId}
              </p>
            )}
          </div>

          <Separator />

          {/* Metadata */}
          <MetadataEditor
            value={formData.metadata}
            onChange={(metadata) => setFormData({ ...formData, metadata })}
            disabled={loading}
          />

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Updating...
                </>
              ) : (
                <>
                  <Edit className="mr-2 h-4 w-4" />
                  Update Machine
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
