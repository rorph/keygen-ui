'use client'

import * as React from "react"
import { useState, useEffect, useCallback } from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
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
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { getKeygenApi } from "@/lib/api"
import { EventLog } from "@/lib/types/keygen"

const chartConfig = {
  events: {
    label: "Events",
  },
  newLicenses: {
    label: "New Licenses",
    color: "var(--primary)",
  },
  expiredLicenses: {
    label: "Expired Licenses",
    color: "var(--destructive, #ef4444)",
  },
} satisfies ChartConfig

interface ChartDataPoint {
  date: string;
  newLicenses: number;
  expiredLicenses: number;
}

function groupEventsByDay(events: EventLog[], daysBack: number): ChartDataPoint[] {
  const now = new Date()
  const dataMap = new Map<string, ChartDataPoint>()

  // Pre-fill all days with zero values
  for (let i = daysBack - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    dataMap.set(dateStr, { date: dateStr, newLicenses: 0, expiredLicenses: 0 })
  }

  // Count events per day
  for (const event of events) {
    const eventDate = event.attributes.created?.split('T')[0]
    if (!eventDate) continue

    const point = dataMap.get(eventDate)
    if (!point) continue

    const eventType = event.attributes.event
    if (eventType === 'license.created') {
      point.newLicenses++
    } else if (eventType === 'license.expired') {
      point.expiredLicenses++
    }
  }

  // Return sorted array
  return Array.from(dataMap.values()).sort((a, b) => a.date.localeCompare(b.date))
}

function getDaysForRange(range: string): number {
  if (range === '7d') return 7
  if (range === '30d') return 30
  return 90
}

function getRangeLabel(range: string): string {
  if (range === '7d') return 'Last 7 days'
  if (range === '30d') return 'Last 30 days'
  return 'Last 3 months'
}

export function ActivityChart() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = useState("90d")
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const api = getKeygenApi()

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  const loadChartData = useCallback(async () => {
    try {
      setLoading(true)
      setError(false)

      const days = getDaysForRange(timeRange)
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const response = await api.eventLogs.list({
        limit: 100,
        date: { start: startDate.toISOString() },
      })

      const events = (response.data || []) as EventLog[]
      const grouped = groupEventsByDay(events, days)
      setChartData(grouped)
    } catch (err) {
      console.error('Failed to load chart data:', err)
      setError(true)
      // Generate empty data points as fallback
      const days = getDaysForRange(timeRange)
      const fallback: ChartDataPoint[] = []
      const now = new Date()
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(d.getDate() - i)
        fallback.push({
          date: d.toISOString().split('T')[0],
          newLicenses: 0,
          expiredLicenses: 0,
        })
      }
      setChartData(fallback)
    } finally {
      setLoading(false)
    }
  }, [api.eventLogs, timeRange])

  useEffect(() => {
    loadChartData()
  }, [loadChartData])

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>License Activity</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            {error
              ? 'Event log data unavailable - showing empty chart'
              : loading
                ? 'Loading activity data...'
                : `License events for the ${getRangeLabel(timeRange).toLowerCase()}`
            }
          </span>
          <span className="@[540px]/card:hidden">
            {error ? 'Data unavailable' : getRangeLabel(timeRange)}
          </span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={(value) => { if (value) setTimeRange(value) }}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="fillNewLicenses" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-newLicenses)"
                  stopOpacity={1.0}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-newLicenses)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillExpiredLicenses" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-expiredLicenses)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-expiredLicenses)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value as string | number).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="expiredLicenses"
              type="natural"
              fill="url(#fillExpiredLicenses)"
              stroke="var(--color-expiredLicenses)"
              stackId="a"
            />
            <Area
              dataKey="newLicenses"
              type="natural"
              fill="url(#fillNewLicenses)"
              stroke="var(--color-newLicenses)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
