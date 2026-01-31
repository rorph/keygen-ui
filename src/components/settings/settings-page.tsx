'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth/context'
import { getKeygenApi } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { copyToClipboard } from '@/lib/utils/clipboard'
import {
  Loader2,
  Save,
  Copy,
  KeyRound,
  User,
  Lock,
  Info,
  ShieldCheck,
} from 'lucide-react'

interface AccountAttributes {
  name?: string
  slug?: string
  ed25519PublicKey?: string
  publicKey?: string
  verifyKey?: string
  [key: string]: unknown
}

export function SettingsPage() {
  const { user } = useAuth()
  const api = getKeygenApi()

  // Profile state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileInitialized, setProfileInitialized] = useState(false)

  // Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)

  // Account / public keys state
  const [accountAttributes, setAccountAttributes] = useState<AccountAttributes | null>(null)
  const [keysLoading, setKeysLoading] = useState(true)

  // Initialize profile fields from auth context user
  useEffect(() => {
    if (user && !profileInitialized) {
      setFirstName(user.attributes.firstName || '')
      setLastName(user.attributes.lastName || '')
      setEmail(user.attributes.email || '')
      setProfileInitialized(true)
    }
  }, [user, profileInitialized])

  // Load account info for public keys
  const loadAccountInfo = useCallback(async () => {
    try {
      setKeysLoading(true)
      const accountRes = await api.getClient().request('')
      if (accountRes.data) {
        const data = accountRes.data as { attributes?: AccountAttributes }
        setAccountAttributes(data.attributes || null)
      }
    } catch (error: unknown) {
      console.error('Failed to load account info:', error)
      toast.error('Failed to load account public keys')
    } finally {
      setKeysLoading(false)
    }
  }, [api])

  useEffect(() => {
    loadAccountInfo()
  }, [loadAccountInfo])

  // Save profile
  const handleSaveProfile = async () => {
    if (!user) return

    if (!email.trim()) {
      toast.error('Email address is required')
      return
    }

    try {
      setProfileLoading(true)
      await api.users.update(user.id, {
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        email: email.trim(),
      })
      toast.success('Profile updated successfully')
    } catch (error: unknown) {
      const err = error as { message?: string; detail?: string }
      toast.error(err.detail || err.message || 'Failed to update profile')
    } finally {
      setProfileLoading(false)
    }
  }

  // Change password
  const handleChangePassword = async () => {
    if (!user) return

    if (!currentPassword) {
      toast.error('Please enter your current password')
      return
    }

    if (!newPassword) {
      toast.error('Please enter a new password')
      return
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match')
      return
    }

    try {
      setPasswordLoading(true)
      await api.users.updatePassword(user.id, currentPassword, newPassword)
      toast.success('Password changed successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: unknown) {
      const err = error as { message?: string; detail?: string; status?: number }
      if (err.status === 422) {
        toast.error('Current password is incorrect')
      } else {
        toast.error(err.detail || err.message || 'Failed to change password')
      }
    } finally {
      setPasswordLoading(false)
    }
  }

  const accountId = process.env.NEXT_PUBLIC_KEYGEN_ACCOUNT_ID || 'N/A'

  const getRoleBadgeVariant = (role: string): 'default' | 'secondary' | 'outline' => {
    switch (role) {
      case 'admin':
        return 'default'
      case 'developer':
      case 'sales-agent':
      case 'support-agent':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'banned':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return ''
    }
  }

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your profile, password, and view account information
        </p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter first name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter last name"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveProfile} disabled={profileLoading}>
              {profileLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Change Password Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
          </div>
          {newPassword && confirmPassword && newPassword !== confirmPassword && (
            <p className="text-sm text-destructive">Passwords do not match</p>
          )}
          <div className="flex justify-end">
            <Button onClick={handleChangePassword} disabled={passwordLoading}>
              {passwordLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Lock className="mr-2 h-4 w-4" />
              )}
              Change Password
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Info Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Your account details (read-only)</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Account ID</Label>
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono bg-muted px-2 py-1 rounded break-all">{accountId}</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(accountId, 'Account ID')}
                  className="h-7 w-7 p-0 shrink-0"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">User ID</Label>
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono bg-muted px-2 py-1 rounded break-all">{user?.id || 'N/A'}</code>
                {user?.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(user.id, 'User ID')}
                    className="h-7 w-7 p-0 shrink-0"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Role</Label>
              <div>
                <Badge variant={getRoleBadgeVariant(user?.attributes.role || 'user')}>
                  {user?.attributes.role || 'user'}
                </Badge>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Status</Label>
              <div>
                <Badge variant="outline" className={getStatusBadgeClass(user?.attributes.status || 'active')}>
                  {user?.attributes.status || 'active'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Public Keys & Verification Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>Public Keys & Verification</CardTitle>
              <CardDescription>Account public keys for license verification</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {keysLoading ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-20 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          ) : accountAttributes ? (
            <>
              {accountAttributes.ed25519PublicKey && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                      Ed25519 Public Key
                    </Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(accountAttributes.ed25519PublicKey as string, 'Ed25519 Public Key')}
                    >
                      <Copy className="mr-2 h-3.5 w-3.5" />
                      Copy
                    </Button>
                  </div>
                  <pre className="bg-muted rounded-md p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">
                    {accountAttributes.ed25519PublicKey}
                  </pre>
                </div>
              )}

              {accountAttributes.ed25519PublicKey && accountAttributes.publicKey && (
                <Separator />
              )}

              {accountAttributes.publicKey && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                      RSA Public Key
                    </Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(accountAttributes.publicKey as string, 'RSA Public Key')}
                    >
                      <Copy className="mr-2 h-3.5 w-3.5" />
                      Copy
                    </Button>
                  </div>
                  <pre className="bg-muted rounded-md p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">
                    {accountAttributes.publicKey}
                  </pre>
                </div>
              )}

              {accountAttributes.verifyKey && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                        Verify Key (Hash)
                      </Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(accountAttributes.verifyKey as string, 'Verify Key')}
                      >
                        <Copy className="mr-2 h-3.5 w-3.5" />
                        Copy
                      </Button>
                    </div>
                    <pre className="bg-muted rounded-md p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">
                      {accountAttributes.verifyKey}
                    </pre>
                  </div>
                </>
              )}

              {!accountAttributes.ed25519PublicKey && !accountAttributes.publicKey && !accountAttributes.verifyKey && (
                <div className="text-center py-8 text-muted-foreground">
                  <KeyRound className="mx-auto h-8 w-8 mb-2" />
                  <p className="text-sm">No public keys configured for this account</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <KeyRound className="mx-auto h-8 w-8 mb-2" />
              <p className="text-sm">Failed to load account public keys</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={loadAccountInfo}>
                Retry
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
