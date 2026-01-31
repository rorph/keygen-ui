import { KeygenClient } from '../client';

export interface AnalyticsCount {
  activeLicensedUsers: number;
  activeLicenses: number;
  totalLicenses: number;
  totalMachines: number;
  totalUsers: number;
}

export interface TopLicenseByVolume {
  licenseId: string;
  count: number;
}

export interface TopUrlByVolume {
  method: string;
  url: string;
  count: number;
}

export interface TopIpByVolume {
  ip: string;
  count: number;
}

interface AnalyticsCountResponse {
  meta: AnalyticsCount;
}

interface TopLicensesByVolumeResponse {
  meta: TopLicenseByVolume[];
}

interface TopUrlsByVolumeResponse {
  meta: TopUrlByVolume[];
}

interface TopIpsByVolumeResponse {
  meta: TopIpByVolume[];
}

export class AnalyticsResource {
  constructor(private client: KeygenClient) {}

  /**
   * Get aggregate counts (active licenses, total licenses, users, machines, active licensed users).
   * Server-side cached with 10min TTL.
   */
  async count(): Promise<AnalyticsCountResponse> {
    const res = await this.client.request('analytics/actions/count');
    return res as unknown as AnalyticsCountResponse;
  }

  /**
   * Get top 10 licenses by validation/activation volume over the past 13 days.
   */
  async topLicensesByVolume(): Promise<TopLicensesByVolumeResponse> {
    const res = await this.client.request('analytics/actions/top-licenses-by-volume');
    return res as unknown as TopLicensesByVolumeResponse;
  }

  /**
   * Get top 10 URLs by request volume over the past 13 days.
   */
  async topUrlsByVolume(): Promise<TopUrlsByVolumeResponse> {
    const res = await this.client.request('analytics/actions/top-urls-by-volume');
    return res as unknown as TopUrlsByVolumeResponse;
  }

  /**
   * Get top 10 IPs by request volume over the past 13 days.
   */
  async topIpsByVolume(): Promise<TopIpsByVolumeResponse> {
    const res = await this.client.request('analytics/actions/top-ips-by-volume');
    return res as unknown as TopIpsByVolumeResponse;
  }
}
