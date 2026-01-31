'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Plus, ChevronDown, ChevronRight } from 'lucide-react'
import { getKeygenApi } from '@/lib/api'
import { toast } from 'sonner'
import { Product } from '@/lib/types/keygen'
import { handleFormError, handleLoadError } from '@/lib/utils/error-handling'

interface CreatePolicyDialogProps {
  onPolicyCreated?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const INITIAL_FORM_DATA = {
  // Basic
  name: '',
  productId: '',
  duration: '',
  // Scheme
  scheme: '',
  // Limits
  maxMachines: '',
  maxProcesses: '',
  maxCores: '',
  maxMemory: '',
  maxDisk: '',
  maxUsers: '',
  maxUses: '',
  // Flags
  floating: false,
  strict: false,
  protected: false,
  usePool: false,
  requireProductScope: false,
  requirePolicyScope: false,
  requireMachineScope: false,
  requireFingerprintScope: false,
  requireUserScope: false,
  requireChecksumScope: false,
  requireVersionScope: false,
  requireCheckIn: false,
  // Strategies
  machineUniquenessStrategy: '',
  machineMatchingStrategy: '',
  componentUniquenessStrategy: '',
  componentMatchingStrategy: '',
  expirationStrategy: '',
  expirationBasis: '',
  renewalBasis: '',
  transferStrategy: '',
  authenticationStrategy: '',
  machineLeasingStrategy: '',
  processLeasingStrategy: '',
  overageStrategy: '',
  // Heartbeat
  requireHeartbeat: false,
  heartbeatDuration: '',
  heartbeatCullStrategy: '',
  heartbeatResurrectionStrategy: '',
  heartbeatBasis: '',
  // Metadata
  metadata: '',
}

function CollapsibleSection({
  title,
  open,
  onToggle,
  children,
}: {
  title: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="space-y-3">
      <button
        type="button"
        className="flex items-center gap-2 text-sm font-medium hover:text-foreground text-muted-foreground transition-colors w-full"
        onClick={onToggle}
      >
        {open ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        {title}
      </button>
      {open && <div className="ml-6">{children}</div>}
    </div>
  )
}

export function CreatePolicyDialog({ onPolicyCreated, open: controlledOpen, onOpenChange }: CreatePolicyDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? (onOpenChange || (() => {})) : setInternalOpen
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [formData, setFormData] = useState({ ...INITIAL_FORM_DATA })

  // Section toggles
  const [showScheme, setShowScheme] = useState(false)
  const [showLimits, setShowLimits] = useState(false)
  const [showFlags, setShowFlags] = useState(false)
  const [showStrategies, setShowStrategies] = useState(false)
  const [showHeartbeat, setShowHeartbeat] = useState(false)
  const [showMetadata, setShowMetadata] = useState(false)

  const api = getKeygenApi()

  const loadProducts = useCallback(async () => {
    try {
      setProductsLoading(true)
      const response = await api.products.list({ limit: 50 })
      setProducts(response.data || [])
    } catch (error: unknown) {
      handleLoadError(error, 'products')
    } finally {
      setProductsLoading(false)
    }
  }, [api.products])

  useEffect(() => {
    if (open && products.length === 0) {
      loadProducts()
    }
  }, [open, products.length, loadProducts])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Policy name is required')
      return
    }

    if (!formData.productId) {
      toast.error('Please select a product')
      return
    }

    try {
      setLoading(true)

      const policyData: Record<string, unknown> = {
        name: formData.name.trim(),
        productId: formData.productId,
      }

      // Duration
      if (formData.duration && formData.duration.trim()) {
        policyData.duration = parseInt(formData.duration)
      }

      // Scheme
      if (formData.scheme) {
        policyData.scheme = formData.scheme
      }

      // Limits - only send if user entered a value
      if (formData.maxMachines) policyData.maxMachines = parseInt(formData.maxMachines)
      if (formData.maxProcesses) policyData.maxProcesses = parseInt(formData.maxProcesses)
      if (formData.maxCores) policyData.maxCores = parseInt(formData.maxCores)
      if (formData.maxMemory) policyData.maxMemory = parseInt(formData.maxMemory)
      if (formData.maxDisk) policyData.maxDisk = parseInt(formData.maxDisk)
      if (formData.maxUsers) policyData.maxUsers = parseInt(formData.maxUsers)
      if (formData.maxUses) policyData.maxUses = parseInt(formData.maxUses)

      // Boolean flags - only send if enabled
      if (formData.floating) policyData.floating = true
      if (formData.strict) policyData.strict = true
      if (formData.protected) policyData.protected = true
      if (formData.usePool) policyData.usePool = true
      if (formData.requireProductScope) policyData.requireProductScope = true
      if (formData.requirePolicyScope) policyData.requirePolicyScope = true
      if (formData.requireMachineScope) policyData.requireMachineScope = true
      if (formData.requireFingerprintScope) policyData.requireFingerprintScope = true
      if (formData.requireUserScope) policyData.requireUserScope = true
      if (formData.requireChecksumScope) policyData.requireChecksumScope = true
      if (formData.requireVersionScope) policyData.requireVersionScope = true
      if (formData.requireCheckIn) policyData.requireCheckIn = true

      // Strategy fields - only send if user selected a value
      if (formData.machineUniquenessStrategy) policyData.machineUniquenessStrategy = formData.machineUniquenessStrategy
      if (formData.machineMatchingStrategy) policyData.machineMatchingStrategy = formData.machineMatchingStrategy
      if (formData.componentUniquenessStrategy) policyData.componentUniquenessStrategy = formData.componentUniquenessStrategy
      if (formData.componentMatchingStrategy) policyData.componentMatchingStrategy = formData.componentMatchingStrategy
      if (formData.expirationStrategy) policyData.expirationStrategy = formData.expirationStrategy
      if (formData.expirationBasis) policyData.expirationBasis = formData.expirationBasis
      if (formData.renewalBasis) policyData.renewalBasis = formData.renewalBasis
      if (formData.transferStrategy) policyData.transferStrategy = formData.transferStrategy
      if (formData.authenticationStrategy) policyData.authenticationStrategy = formData.authenticationStrategy
      if (formData.machineLeasingStrategy) policyData.machineLeasingStrategy = formData.machineLeasingStrategy
      if (formData.processLeasingStrategy) policyData.processLeasingStrategy = formData.processLeasingStrategy
      if (formData.overageStrategy) policyData.overageStrategy = formData.overageStrategy

      // Heartbeat
      if (formData.requireHeartbeat) {
        policyData.requireHeartbeat = true
        if (formData.heartbeatDuration) {
          policyData.heartbeatDuration = parseInt(formData.heartbeatDuration)
        }
        if (formData.heartbeatCullStrategy) policyData.heartbeatCullStrategy = formData.heartbeatCullStrategy
        if (formData.heartbeatResurrectionStrategy) policyData.heartbeatResurrectionStrategy = formData.heartbeatResurrectionStrategy
        if (formData.heartbeatBasis) policyData.heartbeatBasis = formData.heartbeatBasis
      }

      // Metadata
      if (formData.metadata && formData.metadata.trim()) {
        try {
          policyData.metadata = JSON.parse(formData.metadata)
        } catch {
          policyData.metadata = { notes: formData.metadata }
        }
      }

      await api.policies.create(policyData as { name: string; productId: string; duration?: number })

      toast.success('Policy created successfully')
      setOpen(false)
      setFormData({ ...INITIAL_FORM_DATA })
      // Reset section toggles
      setShowScheme(false)
      setShowLimits(false)
      setShowFlags(false)
      setShowStrategies(false)
      setShowHeartbeat(false)
      setShowMetadata(false)
      onPolicyCreated?.()
    } catch (error: unknown) {
      handleFormError(error, 'Policy')
    } finally {
      setLoading(false)
    }
  }

  const updateField = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Policy
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Policy</DialogTitle>
          <DialogDescription>
            Create a new licensing policy with specific rules and constraints for your products.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information - always visible */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Basic Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Policy Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Standard License Policy"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product">Product *</Label>
                <Select
                  value={formData.productId}
                  onValueChange={(value) => updateField('productId', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder={productsLoading ? 'Loading products...' : 'Select a product'} />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.attributes.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Choose which product this policy applies to</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (seconds)</Label>
                <Input
                  id="duration"
                  type="number"
                  placeholder="e.g., 86400 (1 day)"
                  value={formData.duration}
                  onChange={(e) => updateField('duration', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Leave empty for no expiration</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* --- Advanced Settings (collapsible sections) --- */}
          <div className="space-y-1">
            <h4 className="text-sm font-medium mb-3">Advanced Settings</h4>

            {/* Scheme Section */}
            <CollapsibleSection
              title="Scheme"
              open={showScheme}
              onToggle={() => setShowScheme(!showScheme)}
            >
              <div className="space-y-2">
                <Label htmlFor="scheme">License Scheme</Label>
                <Select
                  value={formData.scheme}
                  onValueChange={(value) => updateField('scheme', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a scheme (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ED25519_SIGN">ED25519_SIGN</SelectItem>
                    <SelectItem value="RSA_2048_PKCS1_PSS_SIGN_V2">RSA_2048_PKCS1_PSS_SIGN_V2</SelectItem>
                    <SelectItem value="RSA_2048_PKCS1_SIGN_V2">RSA_2048_PKCS1_SIGN_V2</SelectItem>
                    <SelectItem value="RSA_2048_PKCS1_PSS_SIGN">RSA_2048_PKCS1_PSS_SIGN</SelectItem>
                    <SelectItem value="RSA_2048_PKCS1_SIGN">RSA_2048_PKCS1_SIGN</SelectItem>
                    <SelectItem value="RSA_2048_JWT_RS256">RSA_2048_JWT_RS256</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  The cryptographic scheme used for license key generation and validation.
                </p>
              </div>
            </CollapsibleSection>

            <Separator className="my-2" />

            {/* Limits Section */}
            <CollapsibleSection
              title="Limits"
              open={showLimits}
              onToggle={() => setShowLimits(!showLimits)}
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxMachines">Max Machines</Label>
                  <Input
                    id="maxMachines"
                    type="number"
                    min="0"
                    placeholder="Unlimited"
                    value={formData.maxMachines}
                    onChange={(e) => updateField('maxMachines', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxProcesses">Max Processes</Label>
                  <Input
                    id="maxProcesses"
                    type="number"
                    min="0"
                    placeholder="Unlimited"
                    value={formData.maxProcesses}
                    onChange={(e) => updateField('maxProcesses', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxCores">Max Cores</Label>
                  <Input
                    id="maxCores"
                    type="number"
                    min="0"
                    placeholder="Unlimited"
                    value={formData.maxCores}
                    onChange={(e) => updateField('maxCores', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxMemory">Max Memory (bytes)</Label>
                  <Input
                    id="maxMemory"
                    type="number"
                    min="0"
                    placeholder="Unlimited"
                    value={formData.maxMemory}
                    onChange={(e) => updateField('maxMemory', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxDisk">Max Disk (bytes)</Label>
                  <Input
                    id="maxDisk"
                    type="number"
                    min="0"
                    placeholder="Unlimited"
                    value={formData.maxDisk}
                    onChange={(e) => updateField('maxDisk', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxUsers">Max Users</Label>
                  <Input
                    id="maxUsers"
                    type="number"
                    min="0"
                    placeholder="Unlimited"
                    value={formData.maxUsers}
                    onChange={(e) => updateField('maxUsers', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxUses">Max Uses</Label>
                  <Input
                    id="maxUses"
                    type="number"
                    min="0"
                    placeholder="Unlimited"
                    value={formData.maxUses}
                    onChange={(e) => updateField('maxUses', e.target.value)}
                  />
                </div>
              </div>
            </CollapsibleSection>

            <Separator className="my-2" />

            {/* Flags Section */}
            <CollapsibleSection
              title="Flags"
              open={showFlags}
              onToggle={() => setShowFlags(!showFlags)}
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="floating"
                    checked={formData.floating}
                    onCheckedChange={(checked) => updateField('floating', !!checked)}
                  />
                  <Label htmlFor="floating" className="text-sm">Floating</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="strict"
                    checked={formData.strict}
                    onCheckedChange={(checked) => updateField('strict', !!checked)}
                  />
                  <Label htmlFor="strict" className="text-sm">Strict</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="protected"
                    checked={formData.protected}
                    onCheckedChange={(checked) => updateField('protected', !!checked)}
                  />
                  <Label htmlFor="protected" className="text-sm">Protected</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="usePool"
                    checked={formData.usePool}
                    onCheckedChange={(checked) => updateField('usePool', !!checked)}
                  />
                  <Label htmlFor="usePool" className="text-sm">Use Pool</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="requireProductScope"
                    checked={formData.requireProductScope}
                    onCheckedChange={(checked) => updateField('requireProductScope', !!checked)}
                  />
                  <Label htmlFor="requireProductScope" className="text-sm">Require Product Scope</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="requirePolicyScope"
                    checked={formData.requirePolicyScope}
                    onCheckedChange={(checked) => updateField('requirePolicyScope', !!checked)}
                  />
                  <Label htmlFor="requirePolicyScope" className="text-sm">Require Policy Scope</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="requireMachineScope"
                    checked={formData.requireMachineScope}
                    onCheckedChange={(checked) => updateField('requireMachineScope', !!checked)}
                  />
                  <Label htmlFor="requireMachineScope" className="text-sm">Require Machine Scope</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="requireFingerprintScope"
                    checked={formData.requireFingerprintScope}
                    onCheckedChange={(checked) => updateField('requireFingerprintScope', !!checked)}
                  />
                  <Label htmlFor="requireFingerprintScope" className="text-sm">Require Fingerprint Scope</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="requireUserScope"
                    checked={formData.requireUserScope}
                    onCheckedChange={(checked) => updateField('requireUserScope', !!checked)}
                  />
                  <Label htmlFor="requireUserScope" className="text-sm">Require User Scope</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="requireChecksumScope"
                    checked={formData.requireChecksumScope}
                    onCheckedChange={(checked) => updateField('requireChecksumScope', !!checked)}
                  />
                  <Label htmlFor="requireChecksumScope" className="text-sm">Require Checksum Scope</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="requireVersionScope"
                    checked={formData.requireVersionScope}
                    onCheckedChange={(checked) => updateField('requireVersionScope', !!checked)}
                  />
                  <Label htmlFor="requireVersionScope" className="text-sm">Require Version Scope</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="requireCheckIn"
                    checked={formData.requireCheckIn}
                    onCheckedChange={(checked) => updateField('requireCheckIn', !!checked)}
                  />
                  <Label htmlFor="requireCheckIn" className="text-sm">Require Check-In</Label>
                </div>
              </div>
            </CollapsibleSection>

            <Separator className="my-2" />

            {/* Strategies Section */}
            <CollapsibleSection
              title="Strategies"
              open={showStrategies}
              onToggle={() => setShowStrategies(!showStrategies)}
            >
              <div className="grid grid-cols-2 gap-4">
                {/* Machine Uniqueness Strategy */}
                <div className="space-y-2">
                  <Label>Machine Uniqueness Strategy</Label>
                  <Select
                    value={formData.machineUniquenessStrategy}
                    onValueChange={(value) => updateField('machineUniquenessStrategy', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Default" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UNIQUE_PER_LICENSE">Unique Per License</SelectItem>
                      <SelectItem value="UNIQUE_PER_POLICY">Unique Per Policy</SelectItem>
                      <SelectItem value="UNIQUE_PER_ACCOUNT">Unique Per Account</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Machine Matching Strategy */}
                <div className="space-y-2">
                  <Label>Machine Matching Strategy</Label>
                  <Select
                    value={formData.machineMatchingStrategy}
                    onValueChange={(value) => updateField('machineMatchingStrategy', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Default" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MATCH_ANY">Match Any</SelectItem>
                      <SelectItem value="MATCH_TWO">Match Two</SelectItem>
                      <SelectItem value="MATCH_MOST">Match Most</SelectItem>
                      <SelectItem value="MATCH_ALL">Match All</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Component Uniqueness Strategy */}
                <div className="space-y-2">
                  <Label>Component Uniqueness Strategy</Label>
                  <Select
                    value={formData.componentUniquenessStrategy}
                    onValueChange={(value) => updateField('componentUniquenessStrategy', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Default" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UNIQUE_PER_MACHINE">Unique Per Machine</SelectItem>
                      <SelectItem value="UNIQUE_PER_LICENSE">Unique Per License</SelectItem>
                      <SelectItem value="UNIQUE_PER_POLICY">Unique Per Policy</SelectItem>
                      <SelectItem value="UNIQUE_PER_ACCOUNT">Unique Per Account</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Component Matching Strategy */}
                <div className="space-y-2">
                  <Label>Component Matching Strategy</Label>
                  <Select
                    value={formData.componentMatchingStrategy}
                    onValueChange={(value) => updateField('componentMatchingStrategy', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Default" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MATCH_ANY">Match Any</SelectItem>
                      <SelectItem value="MATCH_TWO">Match Two</SelectItem>
                      <SelectItem value="MATCH_MOST">Match Most</SelectItem>
                      <SelectItem value="MATCH_ALL">Match All</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Expiration Strategy */}
                <div className="space-y-2">
                  <Label>Expiration Strategy</Label>
                  <Select
                    value={formData.expirationStrategy}
                    onValueChange={(value) => updateField('expirationStrategy', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Default" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RESTRICT_ACCESS">Restrict Access</SelectItem>
                      <SelectItem value="REVOKE_ACCESS">Revoke Access</SelectItem>
                      <SelectItem value="MAINTAIN_ACCESS">Maintain Access</SelectItem>
                      <SelectItem value="ALLOW_ACCESS">Allow Access</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Expiration Basis */}
                <div className="space-y-2">
                  <Label>Expiration Basis</Label>
                  <Select
                    value={formData.expirationBasis}
                    onValueChange={(value) => updateField('expirationBasis', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Default" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FROM_CREATION">From Creation</SelectItem>
                      <SelectItem value="FROM_FIRST_VALIDATION">From First Validation</SelectItem>
                      <SelectItem value="FROM_FIRST_ACTIVATION">From First Activation</SelectItem>
                      <SelectItem value="FROM_FIRST_DOWNLOAD">From First Download</SelectItem>
                      <SelectItem value="FROM_FIRST_USE">From First Use</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Renewal Basis */}
                <div className="space-y-2">
                  <Label>Renewal Basis</Label>
                  <Select
                    value={formData.renewalBasis}
                    onValueChange={(value) => updateField('renewalBasis', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Default" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FROM_EXPIRY">From Expiry</SelectItem>
                      <SelectItem value="FROM_NOW">From Now</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Transfer Strategy */}
                <div className="space-y-2">
                  <Label>Transfer Strategy</Label>
                  <Select
                    value={formData.transferStrategy}
                    onValueChange={(value) => updateField('transferStrategy', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Default" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KEEP_EXPIRY">Keep Expiry</SelectItem>
                      <SelectItem value="RESET_EXPIRY">Reset Expiry</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Authentication Strategy */}
                <div className="space-y-2">
                  <Label>Authentication Strategy</Label>
                  <Select
                    value={formData.authenticationStrategy}
                    onValueChange={(value) => updateField('authenticationStrategy', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Default" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TOKEN">Token</SelectItem>
                      <SelectItem value="LICENSE">License</SelectItem>
                      <SelectItem value="MIXED">Mixed</SelectItem>
                      <SelectItem value="NONE">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Machine Leasing Strategy */}
                <div className="space-y-2">
                  <Label>Machine Leasing Strategy</Label>
                  <Select
                    value={formData.machineLeasingStrategy}
                    onValueChange={(value) => updateField('machineLeasingStrategy', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Default" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PER_LICENSE">Per License</SelectItem>
                      <SelectItem value="PER_USER">Per User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Process Leasing Strategy */}
                <div className="space-y-2">
                  <Label>Process Leasing Strategy</Label>
                  <Select
                    value={formData.processLeasingStrategy}
                    onValueChange={(value) => updateField('processLeasingStrategy', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Default" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PER_MACHINE">Per Machine</SelectItem>
                      <SelectItem value="PER_LICENSE">Per License</SelectItem>
                      <SelectItem value="PER_USER">Per User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Overage Strategy */}
                <div className="space-y-2">
                  <Label>Overage Strategy</Label>
                  <Select
                    value={formData.overageStrategy}
                    onValueChange={(value) => updateField('overageStrategy', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Default" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALWAYS_ALLOW_OVERAGE">Always Allow Overage</SelectItem>
                      <SelectItem value="REQUEST_LIMIT">Request Limit</SelectItem>
                      <SelectItem value="NO_OVERAGE">No Overage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CollapsibleSection>

            <Separator className="my-2" />

            {/* Heartbeat Section */}
            <CollapsibleSection
              title="Heartbeat"
              open={showHeartbeat}
              onToggle={() => setShowHeartbeat(!showHeartbeat)}
            >
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="requireHeartbeat"
                    checked={formData.requireHeartbeat}
                    onCheckedChange={(checked) => updateField('requireHeartbeat', !!checked)}
                  />
                  <Label htmlFor="requireHeartbeat" className="text-sm">Require Heartbeat</Label>
                </div>

                {formData.requireHeartbeat && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="heartbeatDuration">Heartbeat Duration (seconds)</Label>
                      <Input
                        id="heartbeatDuration"
                        type="number"
                        min="0"
                        placeholder="e.g., 3600"
                        value={formData.heartbeatDuration}
                        onChange={(e) => updateField('heartbeatDuration', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Cull Strategy</Label>
                      <Select
                        value={formData.heartbeatCullStrategy}
                        onValueChange={(value) => updateField('heartbeatCullStrategy', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select strategy" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DEACTIVATE_DEAD">Deactivate Dead</SelectItem>
                          <SelectItem value="KEEP_DEAD">Keep Dead</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Resurrection Strategy</Label>
                      <Select
                        value={formData.heartbeatResurrectionStrategy}
                        onValueChange={(value) => updateField('heartbeatResurrectionStrategy', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select strategy" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALWAYS_REVIVE">Always Revive</SelectItem>
                          <SelectItem value="NO_REVIVE">No Revive</SelectItem>
                          <SelectItem value="1_MINUTE_REVIVE">1 Minute Revive</SelectItem>
                          <SelectItem value="2_MINUTE_REVIVE">2 Minute Revive</SelectItem>
                          <SelectItem value="5_MINUTE_REVIVE">5 Minute Revive</SelectItem>
                          <SelectItem value="10_MINUTE_REVIVE">10 Minute Revive</SelectItem>
                          <SelectItem value="15_MINUTE_REVIVE">15 Minute Revive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Heartbeat Basis</Label>
                      <Select
                        value={formData.heartbeatBasis}
                        onValueChange={(value) => updateField('heartbeatBasis', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select basis" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FROM_CREATION">From Creation</SelectItem>
                          <SelectItem value="FROM_FIRST_PING">From First Ping</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleSection>

            <Separator className="my-2" />

            {/* Metadata Section */}
            <CollapsibleSection
              title="Metadata"
              open={showMetadata}
              onToggle={() => setShowMetadata(!showMetadata)}
            >
              <div className="space-y-2">
                <Label htmlFor="metadata">Metadata (JSON)</Label>
                <Textarea
                  id="metadata"
                  placeholder='{"description": "Policy description", "tags": ["enterprise"]}'
                  value={formData.metadata}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateField('metadata', e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Optional JSON metadata for the policy
                </p>
              </div>
            </CollapsibleSection>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Policy'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
