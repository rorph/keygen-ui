import { ProtectedRoute } from "@/components/auth/protected-route"
import { DashboardMetrics } from "@/components/dashboard/dashboard-metrics"
import { MetricsCharts } from "@/components/dashboard/metrics-charts"
import { LicenseOverview } from "@/components/dashboard/license-overview"
import { RecentItems } from "@/components/dashboard/recent-items"

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div className="flex flex-1 flex-col gap-4">
        <DashboardMetrics />
        <MetricsCharts />
        <LicenseOverview />
        <RecentItems />
      </div>
    </ProtectedRoute>
  )
}
