'use client'

import { useState, useEffect, useCallback, useRef } from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { getKeygenApi } from "@/lib/api"

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

interface TabDef {
  id: string
  label: string
  metrics: string[]
  chartConfig: ChartConfig
  colors: Record<string, { stroke: string; fill: string }>
}

const TABS: TabDef[] = [
  {
    id: "licenses",
    label: "Licenses",
    metrics: [
      "license.created",
      "license.expired",
      "license.renewed",
      "license.deleted",
    ],
    chartConfig: {
      "license.created": { label: "Created", color: "oklch(0.72 0.19 142)" },
      "license.expired": { label: "Expired", color: "oklch(0.64 0.21 25)" },
      "license.renewed": { label: "Renewed", color: "oklch(0.62 0.19 250)" },
      "license.deleted": { label: "Deleted", color: "oklch(0.55 0.02 265)" },
    },
    colors: {
      "license.created": { stroke: "oklch(0.72 0.19 142)", fill: "oklch(0.72 0.19 142)" },
      "license.expired": { stroke: "oklch(0.64 0.21 25)", fill: "oklch(0.64 0.21 25)" },
      "license.renewed": { stroke: "oklch(0.62 0.19 250)", fill: "oklch(0.62 0.19 250)" },
      "license.deleted": { stroke: "oklch(0.55 0.02 265)", fill: "oklch(0.55 0.02 265)" },
    },
  },
  {
    id: "validations",
    label: "Validations",
    metrics: [
      "license.validation.succeeded",
      "license.validation.failed",
    ],
    chartConfig: {
      "license.validation.succeeded": { label: "Succeeded", color: "oklch(0.72 0.19 142)" },
      "license.validation.failed": { label: "Failed", color: "oklch(0.64 0.21 25)" },
    },
    colors: {
      "license.validation.succeeded": { stroke: "oklch(0.72 0.19 142)", fill: "oklch(0.72 0.19 142)" },
      "license.validation.failed": { stroke: "oklch(0.64 0.21 25)", fill: "oklch(0.64 0.21 25)" },
    },
  },
  {
    id: "machines",
    label: "Machines",
    metrics: [
      "machine.created",
      "machine.deleted",
      "machine.heartbeat.dead",
    ],
    chartConfig: {
      "machine.created": { label: "Created", color: "oklch(0.72 0.19 142)" },
      "machine.deleted": { label: "Deleted", color: "oklch(0.64 0.21 25)" },
      "machine.heartbeat.dead": { label: "Heartbeat Dead", color: "oklch(0.70 0.15 55)" },
    },
    colors: {
      "machine.created": { stroke: "oklch(0.72 0.19 142)", fill: "oklch(0.72 0.19 142)" },
      "machine.deleted": { stroke: "oklch(0.64 0.21 25)", fill: "oklch(0.64 0.21 25)" },
      "machine.heartbeat.dead": { stroke: "oklch(0.70 0.15 55)", fill: "oklch(0.70 0.15 55)" },
    },
  },
  {
    id: "users",
    label: "Users",
    metrics: [
      "user.created",
      "user.deleted",
    ],
    chartConfig: {
      "user.created": { label: "Created", color: "oklch(0.72 0.19 142)" },
      "user.deleted": { label: "Deleted", color: "oklch(0.64 0.21 25)" },
    },
    colors: {
      "user.created": { stroke: "oklch(0.72 0.19 142)", fill: "oklch(0.72 0.19 142)" },
      "user.deleted": { stroke: "oklch(0.64 0.21 25)", fill: "oklch(0.64 0.21 25)" },
    },
  },
]

// ---------------------------------------------------------------------------
// Data helpers
// ---------------------------------------------------------------------------

type ChartDataPoint = Record<string, string | number>

/**
 * Merge multiple metric date-maps into a single Recharts-compatible array.
 * Fills in any missing dates within the 14-day window with 0.
 */
function buildChartData(
  metricData: Record<string, Record<string, number>>,
  metricKeys: string[]
): ChartDataPoint[] {
  // Collect all unique dates across all metrics
  const dateSet = new Set<string>()
  for (const data of Object.values(metricData)) {
    for (const date of Object.keys(data)) {
      dateSet.add(date)
    }
  }

  // If no data at all, generate last 14 days
  if (dateSet.size === 0) {
    const now = new Date()
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      dateSet.add(d.toISOString().split("T")[0])
    }
  }

  const dates = Array.from(dateSet).sort()

  return dates.map((date) => {
    const point: ChartDataPoint = { date }
    for (const key of metricKeys) {
      point[key] = metricData[key]?.[date] ?? 0
    }
    return point
  })
}

// ---------------------------------------------------------------------------
// TabChart — a single chart tab that lazy-loads its data
// ---------------------------------------------------------------------------

interface TabChartProps {
  tab: TabDef
  active: boolean
}

function TabChart({ tab, active }: TabChartProps) {
  const [data, setData] = useState<ChartDataPoint[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const fetched = useRef(false)

  const api = getKeygenApi()

  const loadData = useCallback(async () => {
    if (fetched.current) return
    fetched.current = true
    setLoading(true)
    setError(false)

    try {
      const metricData = await api.metrics.countByName(tab.metrics)
      setData(buildChartData(metricData, tab.metrics))
    } catch (err) {
      console.error(`Failed to load ${tab.id} metrics:`, err)
      setError(true)
      // Build empty fallback data
      const emptyMetrics: Record<string, Record<string, number>> = {}
      for (const k of tab.metrics) {
        emptyMetrics[k] = {}
      }
      setData(buildChartData(emptyMetrics, tab.metrics))
    } finally {
      setLoading(false)
    }
  }, [api.metrics, tab])

  // Lazy-load when tab becomes active
  useEffect(() => {
    if (active && !fetched.current) {
      loadData()
    }
  }, [active, loadData])

  const metricKeys = tab.metrics

  if (loading || !data) {
    return (
      <div className="flex flex-col gap-3 pt-4">
        <Skeleton className="h-[250px] w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-[250px] items-center justify-center text-muted-foreground text-sm">
        Data unavailable for this metrics category
      </div>
    )
  }

  return (
    <ChartContainer config={tab.chartConfig} className="aspect-auto h-[250px] w-full">
      <AreaChart data={data}>
        <defs>
          {metricKeys.map((key) => (
            <linearGradient key={key} id={`fill-${key.replace(/\./g, "-")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={tab.colors[key]?.fill} stopOpacity={0.4} />
              <stop offset="95%" stopColor={tab.colors[key]?.fill} stopOpacity={0.05} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={32}
          tickFormatter={(value) => {
            const date = new Date(value + "T00:00:00")
            return date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })
          }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={40}
          allowDecimals={false}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              labelFormatter={(value) => {
                const date = new Date((value as string) + "T00:00:00")
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              }}
              indicator="dot"
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        {metricKeys.map((key) => (
          <Area
            key={key}
            dataKey={key}
            type="monotone"
            fill={`url(#fill-${key.replace(/\./g, "-")})`}
            stroke={tab.colors[key]?.stroke}
            strokeWidth={2}
            stackId="a"
          />
        ))}
      </AreaChart>
    </ChartContainer>
  )
}

// ---------------------------------------------------------------------------
// MetricsCharts — main export
// ---------------------------------------------------------------------------

export function MetricsCharts() {
  const [activeTab, setActiveTab] = useState(TABS[0].id)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historical Metrics</CardTitle>
        <CardDescription>14-day trend data across key metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            {TABS.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {TABS.map((tab) => (
            <TabsContent key={tab.id} value={tab.id}>
              <TabChart tab={tab} active={activeTab === tab.id} />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
