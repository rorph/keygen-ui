'use client'

import { useState, useEffect } from 'react'
import { getKeygenApi } from '@/lib/api'
import { Group } from '@/lib/types/keygen'
import { handleCrudError } from '@/lib/utils/error-handling'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { MetadataEditor } from '@/components/shared/metadata-editor'

interface EditGroupDialogProps {
  group: Group
  open: boolean
  onOpenChange: (open: boolean) => void
  onGroupUpdated: () => void
}

/**
 * Convert API metadata (Record<string, unknown>) to editor format (Record<string, string>).
 * Non-string values are JSON-stringified so they round-trip safely.
 */
function metadataToStrings(metadata?: Record<string, unknown> | null): Record<string, string> {
  if (!metadata) return {}
  return Object.fromEntries(
    Object.entries(metadata).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)])
  )
}

export function EditGroupDialog({
  group,
  open,
  onOpenChange,
  onGroupUpdated
}: EditGroupDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    maxLicenses: '',
    maxMachines: '',
    maxUsers: '',
    metadata: {} as Record<string, string>
  })

  const api = getKeygenApi()

  // Initialize form data when group changes
  useEffect(() => {
    if (group) {
      setFormData({
        name: group.attributes.name,
        maxLicenses: group.attributes.maxLicenses?.toString() || '',
        maxMachines: group.attributes.maxMachines?.toString() || '',
        maxUsers: group.attributes.maxUsers?.toString() || '',
        metadata: metadataToStrings(group.attributes.metadata)
      })
    }
  }, [group])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Group name is required')
      return
    }

    setLoading(true)

    try {
      const updates: {
        name: string;
        maxLicenses?: number;
        maxMachines?: number;
        maxUsers?: number;
        metadata?: Record<string, unknown>;
      } = {
        name: formData.name.trim()
      }

      // Add optional limits - use undefined for unlimited (empty string)
      updates.maxLicenses = formData.maxLicenses && parseInt(formData.maxLicenses) > 0
        ? parseInt(formData.maxLicenses)
        : undefined
      updates.maxMachines = formData.maxMachines && parseInt(formData.maxMachines) > 0
        ? parseInt(formData.maxMachines)
        : undefined
      updates.maxUsers = formData.maxUsers && parseInt(formData.maxUsers) > 0
        ? parseInt(formData.maxUsers)
        : undefined

      // Always send metadata so cleared keys are actually removed
      updates.metadata = formData.metadata

      await api.groups.update(group.id, updates)
      onGroupUpdated()
    } catch (error: unknown) {
      handleCrudError(error, 'update', 'Group', {
        onNotFound: () => onGroupUpdated()
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
            <DialogDescription>
              Update the group configuration and limits.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Group Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter group name"
                disabled={loading}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="maxLicenses">Max Licenses</Label>
              <Input
                id="maxLicenses"
                type="number"
                min="0"
                value={formData.maxLicenses}
                onChange={(e) => handleInputChange('maxLicenses', e.target.value)}
                placeholder="Leave empty for unlimited"
                disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="maxMachines">Max Machines</Label>
              <Input
                id="maxMachines"
                type="number"
                min="0"
                value={formData.maxMachines}
                onChange={(e) => handleInputChange('maxMachines', e.target.value)}
                placeholder="Leave empty for unlimited"
                disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="maxUsers">Max Users</Label>
              <Input
                id="maxUsers"
                type="number"
                min="0"
                value={formData.maxUsers}
                onChange={(e) => handleInputChange('maxUsers', e.target.value)}
                placeholder="Leave empty for unlimited"
                disabled={loading}
              />
            </div>

            <MetadataEditor
              value={formData.metadata}
              onChange={(metadata) => setFormData(prev => ({ ...prev, metadata }))}
              disabled={loading}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Group'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
