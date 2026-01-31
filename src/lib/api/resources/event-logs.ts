import { KeygenClient } from '../client';
import { EventLog, EventLogFilters, KeygenResponse, KeygenListResponse } from '../../types/keygen';

export class EventLogResource {
  constructor(private client: KeygenClient) {}

  /**
   * List event logs with filtering
   */
  async list(filters: EventLogFilters = {}): Promise<KeygenListResponse<EventLog>> {
    const params: Record<string, unknown> = {
      ...this.client.buildPaginationParams(filters),
    };

    // Add filter parameters
    if (filters.event) params.event = filters.event;

    // Date range filtering
    if (filters.date) {
      const dateObj: Record<string, string> = {};
      if (filters.date.start) dateObj.start = filters.date.start;
      if (filters.date.end) dateObj.end = filters.date.end;
      if (Object.keys(dateObj).length > 0) params.date = dateObj;
    }

    return this.client.request<EventLog[]>('event-logs', { params });
  }

  /**
   * Get a specific event log by ID
   */
  async get(id: string): Promise<KeygenResponse<EventLog>> {
    return this.client.request<EventLog>(`event-logs/${id}`);
  }
}
