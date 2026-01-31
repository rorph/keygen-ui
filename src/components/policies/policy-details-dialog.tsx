'use client'

import { useState, useEffect, useCallback } from 'react'
import { Policy, Entitlement } from '@/lib/types/keygen'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Shield,
  Calendar,
  Info,
  Gauge,
  ToggleLeft,
  GitBranch,
  HeartPulse,
  Tag,
  Plus,
  X,
  Check,
  Minus,
} from 'lucide-react'
import { getKeygenApi } from '@/lib/api'
import { toast } from 'sonner'
import { copyToClipboard } from '@/lib/utils/clipboard'
import { MetadataViewer } from '@/components/shared/metadata-viewer'
import { handleCrudError, handleLoadError } from '@/lib/utils/error-handling'

interface PolicyDetailsDialogProps {
  policy: Policy
  open: boolean
  onOpenChange: (open: boolean) => void
  onPolicyUpdated?: () => void
}

function BooleanIndicator({ value }: { value: boolean }) {
  return value ? (
    <span className="inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
      <Check className="h-3.5 w-3.5" />
      Yes
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
      <Minus className="h-3.5 w-3.5" />
      No
    </span>
  )
}

function StrategyBadge({ value }: { value: string | undefined | null }) {
  if (!value) return <span className="text-sm text-muted-foreground">Not set</span>
  const label = value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  return <Badge variant="secondary" className="font-mono text-xs">{label}</Badge>
}

function LimitValue({ value }: { value: number | undefined | null }) {
  if (value == null) return <span className="text-sm text-muted-foreground">Unlimited</span>
  return <span className="text-sm font-medium">{value.toLocaleString()}</span>
}

function DetailField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</label>
      <div>{children}</div>
    </div>
  )
}

export function PolicyDetailsDialog({
  policy,
  open,
  onOpenChange,
  onPolicyUpdated,
}: PolicyDetailsDialogProps) {
  const api = getKeygenApi()
  const [entitlements, setEntitlements] = useState<Entitlement[]>([])
  const [allEntitlements, setAllEntitlements] = useState<Entitlement[]>([])
  const [entitlementsLoading, setEntitlementsLoading] = useState(false)
  const [allEntitlementsLoading, setAllEntitlementsLoading] = useState(false)
  const [attachLoading, setAttachLoading] = useState(false)
  const [detachingId, setDetachingId] = useState<string | null>(null)
  const [selectedEntitlementId, setSelectedEntitlementId] = useState('')
  const [showAddEntitlement, setShowAddEntitlement] = useState(false)

  const attrs = policy.attributes

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const loadEntitlements = useCallback(async () => {
    try {
      setEntitlementsLoading(true)
      const response = await api.policies.getEntitlements(policy.id, { limit: 100 })
      setEntitlements((response.data as Entitlement[]) || [])
    } catch (error: unknown) {
      handleLoadError(error, 'policy entitlements', { silent: true })
    } finally {
      setEntitlementsLoading(false)
    }
  }, [api.policies, policy.id])

  const loadAllEntitlements = useCallback(async () => {
    try {
      setAllEntitlementsLoading(true)
      const response = await api.entitlements.list({ limit: 100 })
      setAllEntitlements(response.data || [])
    } catch (error: unknown) {
      handleLoadError(error, 'entitlements', { silent: true })
    } finally {
      setAllEntitlementsLoading(false)
    }
  }, [api.entitlements])

  useEffect(() => {
    if (open) {
      loadEntitlements()
    }
  }, [open, loadEntitlements])

  useEffect(() => {
    if (showAddEntitlement && allEntitlements.length === 0) {
      loadAllEntitlements()
    }
  }, [showAddEntitlement, allEntitlements.length, loadAllEntitlements])

  const handleAttachEntitlement = async () => {
    if (!selectedEntitlementId) {
      toast.error('Please select an entitlement')
      return
    }

    try {
      setAttachLoading(true)
      await api.policies.attachEntitlements(policy.id, [selectedEntitlementId])
      toast.success('Entitlement attached successfully')
      setSelectedEntitlementId('')
      setShowAddEntitlement(false)
      loadEntitlements()
      onPolicyUpdated?.()
    } catch (error: unknown) {
      handleCrudError(error, 'create', 'entitlement attachment')
    } finally {
      setAttachLoading(false)
    }
  }

  const handleDetachEntitlement = async (entitlementId: string) => {
    try {
      setDetachingId(entitlementId)
      await api.policies.detachEntitlements(policy.id, [entitlementId])
      toast.success('Entitlement detached successfully')
      loadEntitlements()
      onPolicyUpdated?.()
    } catch (error: unknown) {
      handleCrudError(error, 'delete', 'entitlement attachment')
    } finally {
      setDetachingId(null)
    }
  }

  // Available entitlements (not already attached)
  const availableEntitlements = allEntitlements.filter(
    (e) => !entitlements.some((attached) => attached.id === e.id)
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Policy Details: {attrs.name}
          </DialogTitle>
          <DialogDescription>
            View detailed information about this policy and manage its entitlements.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Policy Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Info className="h-4 w-4" />
                Policy Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <DetailField label="Name">
                  <p className="text-sm font-medium">{attrs.name}</p>
                </DetailField>
                <DetailField label="ID">
                  <p
                    className="text-sm font-mono text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => copyToClipboard(policy.id, 'Policy ID')}
                    title="Click to copy"
                  >
                    {policy.id}
                  </p>
                </DetailField>
                <DetailField label="Scheme">
                  <StrategyBadge value={attrs.scheme} />
                </DetailField>
                <DetailField label="Duration">
                  <p className="text-sm">
                    {attrs.duration != null
                      ? `${attrs.duration.toLocaleString()} seconds`
                      : 'No duration (permanent)'}
                  </p>
                </DetailField>
              </div>
            </CardContent>
          </Card>

          {/* Limits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Gauge className="h-4 w-4" />
                Limits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <DetailField label="Max Machines">
                  <LimitValue value={attrs.maxMachines} />
                </DetailField>
                <DetailField label="Max Processes">
                  <LimitValue value={attrs.maxProcesses} />
                </DetailField>
                <DetailField label="Max Cores">
                  <LimitValue value={attrs.maxCores} />
                </DetailField>
                <DetailField label="Max Uses">
                  <LimitValue value={attrs.maxUses} />
                </DetailField>
                <DetailField label="Max Users">
                  <LimitValue value={attrs.maxUsers} />
                </DetailField>
                <DetailField label="Max Memory">
                  <LimitValue value={attrs.maxMemory} />
                </DetailField>
                <DetailField label="Max Disk">
                  <LimitValue value={attrs.maxDisk} />
                </DetailField>
              </div>
            </CardContent>
          </Card>

          {/* Boolean Flags */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ToggleLeft className="h-4 w-4" />
                Flags
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <DetailField label="Floating">
                  <BooleanIndicator value={attrs.floating} />
                </DetailField>
                <DetailField label="Strict">
                  <BooleanIndicator value={attrs.strict} />
                </DetailField>
                <DetailField label="Protected">
                  <BooleanIndicator value={attrs.protected} />
                </DetailField>
                <DetailField label="Use Pool">
                  <BooleanIndicator value={attrs.usePool} />
                </DetailField>
                <DetailField label="Require Product Scope">
                  <BooleanIndicator value={attrs.requireProductScope} />
                </DetailField>
                <DetailField label="Require Policy Scope">
                  <BooleanIndicator value={attrs.requirePolicyScope} />
                </DetailField>
                <DetailField label="Require Machine Scope">
                  <BooleanIndicator value={attrs.requireMachineScope} />
                </DetailField>
                <DetailField label="Require Fingerprint Scope">
                  <BooleanIndicator value={attrs.requireFingerprintScope} />
                </DetailField>
                <DetailField label="Require Components Scope">
                  <BooleanIndicator value={attrs.requireComponentsScope} />
                </DetailField>
                <DetailField label="Require User Scope">
                  <BooleanIndicator value={attrs.requireUserScope} />
                </DetailField>
                <DetailField label="Require Checksum Scope">
                  <BooleanIndicator value={attrs.requireChecksumScope} />
                </DetailField>
                <DetailField label="Require Version Scope">
                  <BooleanIndicator value={attrs.requireVersionScope} />
                </DetailField>
                <DetailField label="Require Check-In">
                  <BooleanIndicator value={attrs.requireCheckIn} />
                </DetailField>
                <DetailField label="Require Heartbeat">
                  <BooleanIndicator value={attrs.requireHeartbeat} />
                </DetailField>
              </div>
            </CardContent>
          </Card>

          {/* Strategies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <GitBranch className="h-4 w-4" />
                Strategies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <DetailField label="Machine Uniqueness">
                  <StrategyBadge value={attrs.machineUniquenessStrategy} />
                </DetailField>
                <DetailField label="Machine Matching">
                  <StrategyBadge value={attrs.machineMatchingStrategy} />
                </DetailField>
                <DetailField label="Component Uniqueness">
                  <StrategyBadge value={attrs.componentUniquenessStrategy} />
                </DetailField>
                <DetailField label="Component Matching">
                  <StrategyBadge value={attrs.componentMatchingStrategy} />
                </DetailField>
                <DetailField label="Expiration Strategy">
                  <StrategyBadge value={attrs.expirationStrategy} />
                </DetailField>
                <DetailField label="Expiration Basis">
                  <StrategyBadge value={attrs.expirationBasis} />
                </DetailField>
                <DetailField label="Renewal Basis">
                  <StrategyBadge value={attrs.renewalBasis} />
                </DetailField>
                <DetailField label="Transfer Strategy">
                  <StrategyBadge value={attrs.transferStrategy} />
                </DetailField>
                <DetailField label="Authentication Strategy">
                  <StrategyBadge value={attrs.authenticationStrategy} />
                </DetailField>
                <DetailField label="Machine Leasing">
                  <StrategyBadge value={attrs.machineLeasingStrategy} />
                </DetailField>
                <DetailField label="Process Leasing">
                  <StrategyBadge value={attrs.processLeasingStrategy} />
                </DetailField>
                <DetailField label="Overage Strategy">
                  <StrategyBadge value={attrs.overageStrategy} />
                </DetailField>
              </div>
            </CardContent>
          </Card>

          {/* Heartbeat */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <HeartPulse className="h-4 w-4" />
                Heartbeat Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <DetailField label="Require Heartbeat">
                  <BooleanIndicator value={attrs.requireHeartbeat} />
                </DetailField>
                <DetailField label="Heartbeat Duration">
                  {attrs.heartbeatDuration != null ? (
                    <span className="text-sm font-medium">{attrs.heartbeatDuration.toLocaleString()} seconds</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">Not set</span>
                  )}
                </DetailField>
                <DetailField label="Cull Strategy">
                  <StrategyBadge value={attrs.heartbeatCullStrategy} />
                </DetailField>
                <DetailField label="Resurrection Strategy">
                  <StrategyBadge value={attrs.heartbeatResurrectionStrategy} />
                </DetailField>
                <DetailField label="Heartbeat Basis">
                  <StrategyBadge value={attrs.heartbeatBasis} />
                </DetailField>
              </div>
              {attrs.checkInInterval && (
                <>
                  <Separator className="my-4" />
                  <div className="grid grid-cols-3 gap-4">
                    <DetailField label="Check-In Interval">
                      <span className="text-sm font-medium">{attrs.checkInInterval}</span>
                    </DetailField>
                    <DetailField label="Check-In Interval Count">
                      <span className="text-sm font-medium">{attrs.checkInIntervalCount ?? 'N/A'}</span>
                    </DetailField>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Entitlements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Entitlements
                  {!entitlementsLoading && (
                    <Badge variant="outline" className="text-xs ml-1">{entitlements.length}</Badge>
                  )}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddEntitlement(!showAddEntitlement)}
                  className="gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Entitlement
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add entitlement form */}
              {showAddEntitlement && (
                <div className="flex items-end gap-2 p-3 bg-muted/50 rounded-md">
                  <div className="flex-1 space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Select Entitlement</label>
                    <Select
                      value={selectedEntitlementId}
                      onValueChange={setSelectedEntitlementId}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            allEntitlementsLoading
                              ? 'Loading entitlements...'
                              : availableEntitlements.length === 0
                                ? 'No entitlements available'
                                : 'Select an entitlement'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {availableEntitlements.map((ent) => (
                          <SelectItem key={ent.id} value={ent.id}>
                            {ent.attributes.name} ({ent.attributes.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleAttachEntitlement}
                    disabled={attachLoading || !selectedEntitlementId}
                  >
                    {attachLoading ? 'Attaching...' : 'Attach'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowAddEntitlement(false)
                      setSelectedEntitlementId('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}

              {/* Entitlements list */}
              {entitlementsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-3/4" />
                </div>
              ) : entitlements.length === 0 ? (
                <p className="text-sm text-muted-foreground">No entitlements attached to this policy.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {entitlements.map((ent) => (
                    <Badge
                      key={ent.id}
                      variant="secondary"
                      className="flex items-center gap-1.5 py-1 px-2.5"
                    >
                      <span className="text-sm">{ent.attributes.name}</span>
                      <span className="text-xs text-muted-foreground">({ent.attributes.code})</span>
                      <button
                        type="button"
                        onClick={() => handleDetachEntitlement(ent.id)}
                        disabled={detachingId === ent.id}
                        className="ml-1 rounded-full p-0.5 hover:bg-destructive/20 hover:text-destructive transition-colors disabled:opacity-50"
                        title="Remove entitlement"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
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
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <DetailField label="Created">
                  <p className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {formatDate(attrs.created)}
                  </p>
                </DetailField>
                <DetailField label="Updated">
                  <p className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {formatDate(attrs.updated)}
                  </p>
                </DetailField>
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          <MetadataViewer metadata={attrs.metadata} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
