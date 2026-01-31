'use client'

import { useState, useEffect, useCallback } from "react"
import {
  Key,
  Package,
  Users,
  Shield,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getKeygenApi } from "@/lib/api"

interface LicenseStatusData {
  active: number
  expired: number
  suspended: number
  inactive: number
}

interface ResourceData {
  products: number
  groups: number
  entitlements: number
}

const STATUS_CONFIG = [
  {
    key: 'active' as const,
    label: 'Active',
    color: 'bg-green-500',
    dotColor: 'bg-green-500',
  },
  {
    key: 'expired' as const,
    label: 'Expired',
    color: 'bg-red-500',
    dotColor: 'bg-red-500',
  },
  {
    key: 'suspended' as const,
    label: 'Suspended',
    color: 'bg-orange-500',
    dotColor: 'bg-orange-500',
  },
  {
    key: 'inactive' as const,
    label: 'Inactive',
    color: 'bg-gray-400',
    dotColor: 'bg-gray-400',
  },
]

export function LicenseOverview() {
  const [loading, setLoading] = useState(true)
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatusData>({
    active: 0,
    expired: 0,
    suspended: 0,
    inactive: 0,
  })
  const [resources, setResources] = useState<ResourceData>({
    products: 0,
    groups: 0,
    entitlements: 0,
  })

  const api = getKeygenApi()

  const getCount = (res: { data?: unknown[]; meta?: { count?: number } }) =>
    typeof res.meta?.count === 'number' ? res.meta.count : 0

  const loadData = useCallback(async () => {
    try {
      setLoading(true)

      const [
        activeRes,
        expiredRes,
        suspendedRes,
        inactiveRes,
        productsRes,
        groupsRes,
        entitlementsRes,
      ] = await Promise.all([
        api.licenses.list({ limit: 1, status: 'active' }).catch(() => ({ data: [], meta: { count: 0 } })),
        api.licenses.list({ limit: 1, status: 'expired' }).catch(() => ({ data: [], meta: { count: 0 } })),
        api.licenses.list({ limit: 1, status: 'suspended' }).catch(() => ({ data: [], meta: { count: 0 } })),
        api.licenses.list({ limit: 1, status: 'inactive' }).catch(() => ({ data: [], meta: { count: 0 } })),
        api.products.list({ limit: 1 }).catch(() => ({ data: [], meta: { count: 0 } })),
        api.groups.list({ limit: 1 }).catch(() => ({ data: [], meta: { count: 0 } })),
        api.entitlements.list({ limit: 1 }).catch(() => ({ data: [], meta: { count: 0 } })),
      ])

      setLicenseStatus({
        active: getCount(activeRes),
        expired: getCount(expiredRes),
        suspended: getCount(suspendedRes),
        inactive: getCount(inactiveRes),
      })

      setResources({
        products: getCount(productsRes),
        groups: getCount(groupsRes),
        entitlements: getCount(entitlementsRes),
      })
    } catch (error) {
      console.error('Failed to load license overview data:', error)
    } finally {
      setLoading(false)
    }
  }, [api.licenses, api.products, api.groups, api.entitlements])

  useEffect(() => {
    loadData()
  }, [loadData])

  const totalLicenses =
    licenseStatus.active +
    licenseStatus.expired +
    licenseStatus.suspended +
    licenseStatus.inactive

  const getPercentage = (count: number) =>
    totalLicenses > 0 ? (count / totalLicenses) * 100 : 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-4 lg:px-6">
      {/* License Status Breakdown */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="size-5 text-muted-foreground" />
            <CardTitle>License Status</CardTitle>
          </div>
          <CardDescription>Distribution of licenses by status</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-10" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {STATUS_CONFIG.map((status) => {
                const count = licenseStatus[status.key]
                const percentage = getPercentage(count)

                return (
                  <div key={status.key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`size-2.5 rounded-full ${status.dotColor}`} />
                        <span className="text-sm">{status.label}</span>
                      </div>
                      <span className="text-sm font-bold tabular-nums">
                        {count.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className={`h-2 rounded-full ${status.color} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}

              {totalLicenses > 0 && (
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Total</span>
                    <span className="font-bold tabular-nums text-foreground">
                      {totalLicenses.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats - Resources */}
      <Card>
        <CardHeader>
          <CardTitle>Resources</CardTitle>
          <CardDescription>Overview of all resources</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-8 rounded-md" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-5 w-12 rounded-md" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-md bg-muted">
                    <Package className="size-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-medium">Products</span>
                </div>
                <Badge variant="secondary">
                  {resources.products.toLocaleString()}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-md bg-muted">
                    <Users className="size-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-medium">Groups</span>
                </div>
                <Badge variant="secondary">
                  {resources.groups.toLocaleString()}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-md bg-muted">
                    <Shield className="size-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-medium">Entitlements</span>
                </div>
                <Badge variant="secondary">
                  {resources.entitlements.toLocaleString()}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
