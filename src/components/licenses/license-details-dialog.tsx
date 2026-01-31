'use client'

import { useState, useEffect, useCallback } from 'react'
import { License, Policy, Group, User, Entitlement, KeygenResourceIdentifier } from '@/lib/types/keygen'
import { getKeygenApi } from '@/lib/api'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Key,
  Calendar,
  Info,
  Shield,
  Users,
  Link,
  Tag,
  Pause,
  Play,
  X,
  Plus,
  Save,
  Loader2,
  UserPlus,
  ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import { copyToClipboard } from '@/lib/utils/clipboard'
import { handleCrudError, handleLoadError } from '@/lib/utils/error-handling'
import { MetadataViewer } from '@/components/shared/metadata-viewer'

interface LicenseDetailsDialogProps {
  license: License
  open: boolean
  onOpenChange: (open: boolean) => void
  onLicenseUpdated?: () => void
}

interface RelationshipData {
  policy: Policy | null
  group: Group | null
  owner: User | null
  users: User[]
  entitlements: Entitlement[]
}

export function LicenseDetailsDialog({
  license,
  open,
  onOpenChange,
  onLicenseUpdated,
}: LicenseDetailsDialogProps) {
  const api = getKeygenApi()

  // Relationship data state
  const [relData, setRelData] = useState<RelationshipData>({
    policy: null,
    group: null,
    owner: null,
    users: [],
    entitlements: [],
  })
  const [loadingRelationships, setLoadingRelationships] = useState(true)

  // Dropdown option lists
  const [allPolicies, setAllPolicies] = useState<Policy[]>([])
  const [allGroups, setAllGroups] = useState<Group[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [allEntitlements, setAllEntitlements] = useState<Entitlement[]>([])

  // Change states for relationship selects
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>('')
  const [selectedGroupId, setSelectedGroupId] = useState<string>('')
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>('')
  const [selectedAddUserId, setSelectedAddUserId] = useState<string>('')
  const [selectedAddEntitlementId, setSelectedAddEntitlementId] = useState<string>('')

  // Editing mode toggles
  const [editingPolicy, setEditingPolicy] = useState(false)
  const [editingGroup, setEditingGroup] = useState(false)
  const [editingOwner, setEditingOwner] = useState(false)
  const [showAddUser, setShowAddUser] = useState(false)
  const [showAddEntitlement, setShowAddEntitlement] = useState(false)

  // Action loading states
  const [suspendLoading, setSuspendLoading] = useState(false)
  const [reinstateLoading, setReinstateLoading] = useState(false)
  const [changePolicyLoading, setChangePolicyLoading] = useState(false)
  const [changeGroupLoading, setChangeGroupLoading] = useState(false)
  const [changeOwnerLoading, setChangeOwnerLoading] = useState(false)
  const [addUserLoading, setAddUserLoading] = useState(false)
  const [removeUserLoading, setRemoveUserLoading] = useState<string | null>(null)
  const [addEntitlementLoading, setAddEntitlementLoading] = useState(false)
  const [removeEntitlementLoading, setRemoveEntitlementLoading] = useState<string | null>(null)

  // Loading dropdown options
  const [loadingPolicies, setLoadingPolicies] = useState(false)
  const [loadingGroups, setLoadingGroups] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loadingEntitlements, setLoadingEntitlements] = useState(false)

  // Helper to extract relationship ID
  const getRelId = useCallback(
    (relName: string): string | null => {
      const rel = license.relationships?.[relName]
      if (!rel?.data) return null
      if (Array.isArray(rel.data)) return null
      return (rel.data as KeygenResourceIdentifier).id || null
    },
    [license.relationships]
  )

  // Load relationship data when dialog opens
  const loadRelationships = useCallback(async () => {
    setLoadingRelationships(true)
    try {
      const policyId = getRelId('policy')
      const groupId = getRelId('group')
      const ownerId = getRelId('user')

      const [policyRes, groupRes, ownerRes, entitlementsRes] = await Promise.allSettled([
        policyId ? api.policies.get(policyId) : Promise.resolve(null),
        groupId ? api.groups.get(groupId) : Promise.resolve(null),
        ownerId ? api.users.get(ownerId) : Promise.resolve(null),
        api.licenses.getEntitlements(license.id),
      ])

      // Also fetch the license users via the relationship endpoint
      let usersData: User[] = []
      try {
        const usersRes = await api.getClient().request<User[]>(`licenses/${license.id}/users`)
        usersData = (usersRes.data || []) as User[]
      } catch {
        // Users endpoint may not be available, ignore
      }

      setRelData({
        policy:
          policyRes.status === 'fulfilled' && policyRes.value
            ? ((policyRes.value as { data?: Policy }).data ?? null)
            : null,
        group:
          groupRes.status === 'fulfilled' && groupRes.value
            ? ((groupRes.value as { data?: Group }).data ?? null)
            : null,
        owner:
          ownerRes.status === 'fulfilled' && ownerRes.value
            ? ((ownerRes.value as { data?: User }).data ?? null)
            : null,
        users: usersData,
        entitlements:
          entitlementsRes.status === 'fulfilled' && entitlementsRes.value
            ? ((entitlementsRes.value as { data?: Entitlement[] }).data || [])
            : [],
      })
    } catch (error) {
      handleLoadError(error, 'license relationships')
    } finally {
      setLoadingRelationships(false)
    }
  }, [api, license.id, getRelId])

  useEffect(() => {
    if (open) {
      loadRelationships()
      // Reset editing states
      setEditingPolicy(false)
      setEditingGroup(false)
      setEditingOwner(false)
      setShowAddUser(false)
      setShowAddEntitlement(false)
    }
  }, [open, loadRelationships])

  // Load dropdown options on demand
  const loadPolicies = useCallback(async () => {
    if (allPolicies.length > 0) return
    setLoadingPolicies(true)
    try {
      const res = await api.policies.list({ limit: 100 })
      setAllPolicies((res.data || []) as Policy[])
    } catch (error) {
      handleLoadError(error, 'policies', { silent: true })
    } finally {
      setLoadingPolicies(false)
    }
  }, [api, allPolicies.length])

  const loadGroups = useCallback(async () => {
    if (allGroups.length > 0) return
    setLoadingGroups(true)
    try {
      const res = await api.groups.list({ limit: 100 })
      setAllGroups((res.data || []) as Group[])
    } catch (error) {
      handleLoadError(error, 'groups', { silent: true })
    } finally {
      setLoadingGroups(false)
    }
  }, [api, allGroups.length])

  const loadAllUsers = useCallback(async () => {
    if (allUsers.length > 0) return
    setLoadingUsers(true)
    try {
      const ALL_USER_ROLES: User['attributes']['role'][] = [
        'admin', 'developer', 'sales-agent', 'support-agent', 'read-only', 'user'
      ]
      const res = await api.users.list({ limit: 100, roles: ALL_USER_ROLES })
      setAllUsers((res.data || []) as User[])
    } catch (error) {
      handleLoadError(error, 'users', { silent: true })
    } finally {
      setLoadingUsers(false)
    }
  }, [api, allUsers.length])

  const loadAllEntitlements = useCallback(async () => {
    if (allEntitlements.length > 0) return
    setLoadingEntitlements(true)
    try {
      const res = await api.entitlements.list({ limit: 100 })
      setAllEntitlements((res.data || []) as Entitlement[])
    } catch (error) {
      handleLoadError(error, 'entitlements', { silent: true })
    } finally {
      setLoadingEntitlements(false)
    }
  }, [api, allEntitlements.length])

  // Action handlers
  const handleSuspend = async () => {
    setSuspendLoading(true)
    try {
      await api.licenses.suspend(license.id)
      toast.success('License suspended successfully')
      onLicenseUpdated?.()
      onOpenChange(false)
    } catch (error) {
      handleCrudError(error, 'update', 'License', {
        customMessage: 'Failed to suspend license',
      })
    } finally {
      setSuspendLoading(false)
    }
  }

  const handleReinstate = async () => {
    setReinstateLoading(true)
    try {
      await api.licenses.reinstate(license.id)
      toast.success('License reinstated successfully')
      onLicenseUpdated?.()
      onOpenChange(false)
    } catch (error) {
      handleCrudError(error, 'update', 'License', {
        customMessage: 'Failed to reinstate license',
      })
    } finally {
      setReinstateLoading(false)
    }
  }

  const handleChangePolicy = async () => {
    if (!selectedPolicyId) return
    setChangePolicyLoading(true)
    try {
      await api.licenses.changePolicy(license.id, selectedPolicyId)
      toast.success('Policy changed successfully')
      setEditingPolicy(false)
      await loadRelationships()
      onLicenseUpdated?.()
    } catch (error) {
      handleCrudError(error, 'update', 'License policy')
    } finally {
      setChangePolicyLoading(false)
    }
  }

  const handleChangeGroup = async () => {
    if (!selectedGroupId) return
    setChangeGroupLoading(true)
    try {
      await api.licenses.changeGroup(license.id, selectedGroupId)
      toast.success('Group changed successfully')
      setEditingGroup(false)
      await loadRelationships()
      onLicenseUpdated?.()
    } catch (error) {
      handleCrudError(error, 'update', 'License group')
    } finally {
      setChangeGroupLoading(false)
    }
  }

  const handleChangeOwner = async () => {
    if (!selectedOwnerId) return
    setChangeOwnerLoading(true)
    try {
      await api.licenses.changeOwner(license.id, selectedOwnerId)
      toast.success('Owner changed successfully')
      setEditingOwner(false)
      await loadRelationships()
      onLicenseUpdated?.()
    } catch (error) {
      handleCrudError(error, 'update', 'License owner')
    } finally {
      setChangeOwnerLoading(false)
    }
  }

  const handleAddUser = async () => {
    if (!selectedAddUserId) return
    setAddUserLoading(true)
    try {
      await api.licenses.attachUsers(license.id, [selectedAddUserId])
      toast.success('User attached to license')
      setSelectedAddUserId('')
      setShowAddUser(false)
      await loadRelationships()
      onLicenseUpdated?.()
    } catch (error) {
      handleCrudError(error, 'update', 'License users')
    } finally {
      setAddUserLoading(false)
    }
  }

  const handleRemoveUser = async (userId: string) => {
    setRemoveUserLoading(userId)
    try {
      await api.licenses.detachUsers(license.id, [userId])
      toast.success('User detached from license')
      await loadRelationships()
      onLicenseUpdated?.()
    } catch (error) {
      handleCrudError(error, 'delete', 'License user')
    } finally {
      setRemoveUserLoading(null)
    }
  }

  const handleAddEntitlement = async () => {
    if (!selectedAddEntitlementId) return
    setAddEntitlementLoading(true)
    try {
      await api.licenses.attachEntitlements(license.id, [selectedAddEntitlementId])
      toast.success('Entitlement attached to license')
      setSelectedAddEntitlementId('')
      setShowAddEntitlement(false)
      await loadRelationships()
      onLicenseUpdated?.()
    } catch (error) {
      handleCrudError(error, 'update', 'License entitlements')
    } finally {
      setAddEntitlementLoading(false)
    }
  }

  const handleRemoveEntitlement = async (entitlementId: string) => {
    setRemoveEntitlementLoading(entitlementId)
    try {
      await api.licenses.detachEntitlements(license.id, [entitlementId])
      toast.success('Entitlement detached from license')
      await loadRelationships()
      onLicenseUpdated?.()
    } catch (error) {
      handleCrudError(error, 'delete', 'License entitlement')
    } finally {
      setRemoveEntitlementLoading(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'suspended':
        return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-300'
      case 'banned':
        return 'bg-red-200 text-red-900 border-red-400'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  // Filter out users already attached when showing "Add User" dropdown
  const availableUsersToAdd = allUsers.filter(
    (u) => !relData.users.some((attached) => attached.id === u.id) && u.id !== relData.owner?.id
  )

  // Filter out entitlements already attached
  const availableEntitlementsToAdd = allEntitlements.filter(
    (e) => !relData.entitlements.some((attached) => attached.id === e.id)
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            License Details: {license.attributes.name || 'Unnamed License'}
          </DialogTitle>
          <DialogDescription>
            View detailed information about this license and manage its relationships.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Actions Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            {license.attributes.status === 'active' && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleSuspend}
                disabled={suspendLoading}
              >
                {suspendLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Pause className="h-4 w-4 mr-1" />
                )}
                Suspend License
              </Button>
            )}
            {license.attributes.status === 'suspended' && (
              <Button
                variant="default"
                size="sm"
                onClick={handleReinstate}
                disabled={reinstateLoading}
              >
                {reinstateLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Play className="h-4 w-4 mr-1" />
                )}
                Reinstate License
              </Button>
            )}
          </div>

          {/* License Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                License Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="text-sm">{license.attributes.name || 'Unnamed License'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    <Badge variant="outline" className={getStatusColor(license.attributes.status)}>
                      {license.attributes.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Key</label>
                <div className="mt-1 bg-muted p-3 rounded-md overflow-auto">
                  <code className="text-xs font-mono break-all">{license.attributes.key}</code>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">ID</label>
                <p
                  className="text-sm font-mono text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => copyToClipboard(license.id, 'License ID')}
                  title="Click to copy"
                >
                  {license.id}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* License Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                License Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Uses</label>
                  <p className="text-sm">
                    {license.attributes.uses || 0}
                    {license.attributes.maxUses ? ` / ${license.attributes.maxUses}` : ' / Unlimited'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Protected</label>
                  <p className="text-sm">{license.attributes.protected ? 'Yes' : 'No'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Floating</label>
                  <p className="text-sm">{license.attributes.floating ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Scheme</label>
                  <p className="text-sm">{license.attributes.scheme || 'N/A'}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Expiry</label>
                <p className="text-sm">
                  {license.attributes.expiry
                    ? formatDate(license.attributes.expiry)
                    : 'Never expires'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(license.attributes.created)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Updated</label>
                  <p className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(license.attributes.updated)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Permissions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Permissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {license.attributes.permissions && license.attributes.permissions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {license.attributes.permissions.map((perm) => (
                    <Badge key={perm} variant="secondary" className="text-xs">
                      {perm}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No permissions set</p>
              )}
            </CardContent>
          </Card>

          {/* Relationships */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                Relationships
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Policy */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-muted-foreground">Policy</label>
                  {!editingPolicy && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        loadPolicies()
                        setSelectedPolicyId(getRelId('policy') || '')
                        setEditingPolicy(true)
                      }}
                    >
                      Change Policy
                    </Button>
                  )}
                </div>
                {loadingRelationships ? (
                  <Skeleton className="h-6 w-48" />
                ) : editingPolicy ? (
                  <div className="flex items-center gap-2">
                    <Select value={selectedPolicyId} onValueChange={setSelectedPolicyId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={loadingPolicies ? 'Loading policies...' : 'Select a policy'} />
                      </SelectTrigger>
                      <SelectContent>
                        {allPolicies.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.attributes.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      onClick={handleChangePolicy}
                      disabled={changePolicyLoading || !selectedPolicyId}
                    >
                      {changePolicyLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingPolicy(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : relData.policy ? (
                  <Badge variant="outline">{relData.policy.attributes.name}</Badge>
                ) : (
                  <p className="text-sm text-muted-foreground">No policy assigned</p>
                )}
              </div>

              <Separator />

              {/* Group */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-muted-foreground">Group</label>
                  {!editingGroup && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        loadGroups()
                        setSelectedGroupId(getRelId('group') || '')
                        setEditingGroup(true)
                      }}
                    >
                      Change Group
                    </Button>
                  )}
                </div>
                {loadingRelationships ? (
                  <Skeleton className="h-6 w-48" />
                ) : editingGroup ? (
                  <div className="flex items-center gap-2">
                    <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={loadingGroups ? 'Loading groups...' : 'Select a group'} />
                      </SelectTrigger>
                      <SelectContent>
                        {allGroups.map((g) => (
                          <SelectItem key={g.id} value={g.id}>
                            {g.attributes.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      onClick={handleChangeGroup}
                      disabled={changeGroupLoading || !selectedGroupId}
                    >
                      {changeGroupLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingGroup(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : relData.group ? (
                  <Badge variant="outline">{relData.group.attributes.name}</Badge>
                ) : (
                  <p className="text-sm text-muted-foreground">No group assigned</p>
                )}
              </div>

              <Separator />

              {/* Owner */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-muted-foreground">Owner</label>
                  {!editingOwner && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        loadAllUsers()
                        setSelectedOwnerId(getRelId('user') || '')
                        setEditingOwner(true)
                      }}
                    >
                      Change Owner
                    </Button>
                  )}
                </div>
                {loadingRelationships ? (
                  <Skeleton className="h-6 w-48" />
                ) : editingOwner ? (
                  <div className="flex items-center gap-2">
                    <Select value={selectedOwnerId} onValueChange={setSelectedOwnerId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={loadingUsers ? 'Loading users...' : 'Select an owner'} />
                      </SelectTrigger>
                      <SelectContent>
                        {allUsers.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.attributes.fullName || u.attributes.email} ({u.attributes.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      onClick={handleChangeOwner}
                      disabled={changeOwnerLoading || !selectedOwnerId}
                    >
                      {changeOwnerLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingOwner(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : relData.owner ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {relData.owner.attributes.fullName || relData.owner.attributes.email}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {relData.owner.attributes.email}
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No owner assigned</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Users Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Licensed Users
                  {!loadingRelationships && (
                    <Badge variant="secondary" className="text-xs">
                      {relData.users.length}
                    </Badge>
                  )}
                </span>
                {!showAddUser && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      loadAllUsers()
                      setShowAddUser(true)
                    }}
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Add User
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingRelationships ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Add User inline */}
                  {showAddUser && (
                    <div className="flex items-center gap-2 pb-2">
                      <Select value={selectedAddUserId} onValueChange={setSelectedAddUserId}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={loadingUsers ? 'Loading users...' : 'Select a user to add'} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableUsersToAdd.map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.attributes.fullName || u.attributes.email} ({u.attributes.role})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        onClick={handleAddUser}
                        disabled={addUserLoading || !selectedAddUserId}
                      >
                        {addUserLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowAddUser(false)
                          setSelectedAddUserId('')
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {relData.users.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No users attached to this license</p>
                  ) : (
                    <div className="space-y-2">
                      {relData.users.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-md"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm font-medium truncate">
                              {user.attributes.fullName || user.attributes.email}
                            </span>
                            <span className="text-xs text-muted-foreground truncate">
                              {user.attributes.email}
                            </span>
                            <Badge variant="secondary" className="text-xs shrink-0">
                              {user.attributes.role}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive shrink-0"
                            onClick={() => handleRemoveUser(user.id)}
                            disabled={removeUserLoading === user.id}
                          >
                            {removeUserLoading === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Entitlements Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Entitlements
                  {!loadingRelationships && (
                    <Badge variant="secondary" className="text-xs">
                      {relData.entitlements.length}
                    </Badge>
                  )}
                </span>
                {!showAddEntitlement && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      loadAllEntitlements()
                      setShowAddEntitlement(true)
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Entitlement
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingRelationships ? (
                <div className="space-y-2">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-6 w-40" />
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Add Entitlement inline */}
                  {showAddEntitlement && (
                    <div className="flex items-center gap-2 pb-2">
                      <Select value={selectedAddEntitlementId} onValueChange={setSelectedAddEntitlementId}>
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={
                              loadingEntitlements
                                ? 'Loading entitlements...'
                                : 'Select an entitlement to add'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {availableEntitlementsToAdd.map((e) => (
                            <SelectItem key={e.id} value={e.id}>
                              {e.attributes.name} ({e.attributes.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        onClick={handleAddEntitlement}
                        disabled={addEntitlementLoading || !selectedAddEntitlementId}
                      >
                        {addEntitlementLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowAddEntitlement(false)
                          setSelectedAddEntitlementId('')
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {relData.entitlements.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No entitlements attached to this license</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {relData.entitlements.map((ent) => (
                        <Badge
                          key={ent.id}
                          variant="secondary"
                          className="flex items-center gap-1 pr-1"
                        >
                          <span className="text-xs">
                            {ent.attributes.name}
                            <span className="text-muted-foreground ml-1">({ent.attributes.code})</span>
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 hover:bg-destructive/20 rounded-full"
                            onClick={() => handleRemoveEntitlement(ent.id)}
                            disabled={removeEntitlementLoading === ent.id}
                          >
                            {removeEntitlementLoading === ent.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <X className="h-3 w-3" />
                            )}
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Metadata */}
          <MetadataViewer metadata={license.attributes.metadata} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
