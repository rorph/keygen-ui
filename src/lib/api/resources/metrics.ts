import { KeygenClient } from '../client';

interface MetricsCountResponse {
  meta: Record<string, number>;
}

export class MetricsResource {
  constructor(private client: KeygenClient) {}

  /**
   * Get daily action counts over a 14-day period.
   * Returns a date-to-count map, e.g. { "2025-01-15": 42, ... }
   * Optionally filter by specific metric names.
   */
  async count(metrics?: string[]): Promise<MetricsCountResponse> {
    const params: Record<string, unknown> = {};
    if (metrics && metrics.length > 0) {
      params.metrics = metrics;
    }
    const res = await this.client.request('metrics/actions/count', { params });
    return res as unknown as MetricsCountResponse;
  }

  /**
   * Fetch multiple individual metrics in parallel and return structured data.
   * Each metric name gets its own API call so results aren't aggregated together.
   * Returns { [metricName]: { "YYYY-MM-DD": count, ... } }
   */
  async countByName(metricNames: string[]): Promise<Record<string, Record<string, number>>> {
    const results = await Promise.all(
      metricNames.map(async (name) => {
        try {
          const res = await this.count([name]);
          return [name, res.meta] as const;
        } catch {
          return [name, {} as Record<string, number>] as const;
        }
      })
    );
    return Object.fromEntries(results);
  }

}
