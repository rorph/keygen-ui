'use client'

import { useState, useEffect, useCallback } from "react"
import {
  Key,
  Users,
  Monitor,
  Shield,
  KeyRound,
  UserCheck,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getKeygenApi } from "@/lib/api"
import { User } from "@/lib/types/keygen"

const ALL_USER_ROLES: User['attributes']['role'][] = [
  'admin', 'developer', 'sales-agent', 'support-agent', 'read-only', 'user'
]

export function DashboardMetrics() {
  const [stats, setStats] = useState({
    activeLicenses: 0,
    totalLicenses: 0,
    totalUsers: 0,
    totalMachines: 0,
    totalPolicies: 0,
    activeLicensedUsers: 0,
    loading: true,
  })

  const api = getKeygenApi()

  const loadStats = useCallback(async () => {
    try {
      // Try analytics endpoint first (single call for 5 metrics)
      const [analyticsRes, policiesRes] = await Promise.all([
        api.analytics.count(),
        api.policies.list({ limit: 1 }).catch(() => ({ data: [], meta: { count: 0 } })),
      ])

      const policyCount = typeof policiesRes.meta?.count === 'number'
        ? policiesRes.meta.count
        : (Array.isArray(policiesRes.data) ? policiesRes.data.length : 0)

      setStats({
        activeLicenses: analyticsRes.meta.activeLicenses,
        totalLicenses: analyticsRes.meta.totalLicenses,
        totalUsers: analyticsRes.meta.totalUsers,
        totalMachines: analyticsRes.meta.totalMachines,
        activeLicensedUsers: analyticsRes.meta.activeLicensedUsers,
        totalPolicies: policyCount,
        loading: false,
      })
    } catch {
      // Fallback to individual list calls if analytics endpoint unavailable
      try {
        const [
          activeLicensesRes,
          totalLicensesRes,
          usersRes,
          machinesRes,
          policiesRes,
        ] = await Promise.all([
          api.licenses.list({ limit: 1, status: 'active' }).catch(() => ({ data: [], meta: { count: 0 } })),
          api.licenses.list({ limit: 1 }).catch(() => ({ data: [], meta: { count: 0 } })),
          api.users.list({ limit: 1, roles: ALL_USER_ROLES }).catch(() => ({ data: [], meta: { count: 0 } })),
          api.machines.list({ limit: 1 }).catch(() => ({ data: [], meta: { count: 0 } })),
          api.policies.list({ limit: 1 }).catch(() => ({ data: [], meta: { count: 0 } })),
        ])

        const getCount = (res: { data?: unknown[]; meta?: { count?: number } }) =>
          (typeof res.meta?.count === 'number' ? res.meta.count : 0) || (Array.isArray(res.data) ? res.data.length : 0)

        setStats({
          activeLicenses: getCount(activeLicensesRes),
          totalLicenses: getCount(totalLicensesRes),
          totalUsers: getCount(usersRes),
          totalMachines: getCount(machinesRes),
          totalPolicies: getCount(policiesRes),
          activeLicensedUsers: 0,
          loading: false,
        })
      } catch (error) {
        console.error('Failed to load dashboard stats:', error)
        setStats(prev => ({ ...prev, loading: false }))
      }
    }
  }, [api.analytics, api.licenses, api.users, api.machines, api.policies])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-6">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Active Licenses</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.loading ? '...' : stats.activeLicenses.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <Key className="size-4" />
              Active
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Active status licenses <Key className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Licenses currently in active state
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Licenses</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.loading ? '...' : stats.totalLicenses.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <KeyRound className="size-4" />
              All
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            All license count <KeyRound className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Manage licenses from the licenses page
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Users</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.loading ? '...' : stats.totalUsers.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <Users className="size-4" />
              Users
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Total user accounts <Users className="size-4" />
          </div>
          <div className="text-muted-foreground">
            User management and permissions
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Active Licensed Users</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.loading ? '...' : stats.activeLicensedUsers.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <UserCheck className="size-4" />
              Licensed
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Users with active licenses <UserCheck className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Users currently holding active licenses
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Machines</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.loading ? '...' : stats.totalMachines.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <Monitor className="size-4" />
              Machines
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Licensed machines <Monitor className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Monitor device activations
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Policies</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.loading ? '...' : stats.totalPolicies.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <Shield className="size-4" />
              Policies
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Defined policies <Shield className="size-4" />
          </div>
          <div className="text-muted-foreground">
            License policy configurations
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
