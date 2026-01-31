'use client'

import { useState, useEffect, useCallback } from "react"
import { formatDistanceToNow } from "date-fns"
import { Activity } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getKeygenApi } from "@/lib/api"
import { EventLog } from "@/lib/types/keygen"

type BadgeVariant = "default" | "secondary" | "destructive" | "outline"

interface EventBadgeConfig {
  label: string;
  variant: BadgeVariant;
  className: string;
}

function getEventBadgeConfig(eventType: string): EventBadgeConfig {
  // Green - creation events
  if (eventType.endsWith('.created')) {
    return {
      label: 'Created',
      variant: 'default' as BadgeVariant,
      className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-100 dark:hover:bg-green-900',
    }
  }

  // Red - delete events and failures
  if (eventType.endsWith('.deleted') || eventType.endsWith('.failed')) {
    return {
      label: eventType.endsWith('.deleted') ? 'Deleted' : 'Failed',
      variant: 'destructive' as BadgeVariant,
      className: '',
    }
  }

  // Blue - validation events
  if (eventType.includes('validation')) {
    return {
      label: 'Validation',
      variant: 'default' as BadgeVariant,
      className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900',
    }
  }

  // Yellow/amber - suspension events
  if (eventType.includes('suspended') || eventType.includes('banned')) {
    return {
      label: 'Suspended',
      variant: 'default' as BadgeVariant,
      className: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900',
    }
  }

  // Default - other events
  return {
    label: 'Event',
    variant: 'secondary' as BadgeVariant,
    className: '',
  }
}

function formatEventDescription(eventType: string): string {
  // Convert event type like "license.created" to "License created"
  const parts = eventType.split('.')
  if (parts.length === 0) return eventType

  const resource = parts[0].charAt(0).toUpperCase() + parts[0].slice(1)
  const action = parts.slice(1).join(' ').replace(/-/g, ' ')

  return `${resource} ${action}`
}

export function RecentActivity() {
  const [events, setEvents] = useState<EventLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const api = getKeygenApi()

  const loadRecentActivity = useCallback(async () => {
    try {
      setLoading(true)
      setError(false)

      const response = await api.eventLogs.list({ limit: 20 })
      const data = (response.data || []) as EventLog[]
      setEvents(data)
    } catch (err) {
      console.error('Failed to load recent activity:', err)
      setError(true)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [api.eventLogs])

  useEffect(() => {
    loadRecentActivity()
  }, [loadRecentActivity])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Activity className="size-5" />
          <CardTitle>Recent Activity</CardTitle>
        </div>
        <CardDescription>
          {error
            ? 'Event log data is unavailable'
            : loading
              ? 'Loading recent events...'
              : `Latest ${events.length} events from the event log`
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-muted-foreground py-8 text-center text-sm">
            Event log API is not available. This feature requires event log access.
          </div>
        ) : loading ? (
          <div className="text-muted-foreground py-8 text-center text-sm">
            Loading recent activity...
          </div>
        ) : events.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center text-sm">
            No recent events found.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => {
                const badgeConfig = getEventBadgeConfig(event.attributes.event)
                return (
                  <TableRow key={event.id}>
                    <TableCell>
                      <Badge
                        variant={badgeConfig.variant}
                        className={badgeConfig.className}
                      >
                        {badgeConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatEventDescription(event.attributes.event)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-right text-sm">
                      {event.attributes.created
                        ? formatDistanceToNow(new Date(event.attributes.created), { addSuffix: true })
                        : 'N/A'
                      }
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
