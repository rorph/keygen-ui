import { KeygenClient } from '../client';
import { Machine, MachineFilters, KeygenResponse } from '@/lib/types/keygen';

export class MachineResource {
  constructor(private client: KeygenClient) {}

  /**
   * List all machines
   */
  async list(filters: MachineFilters = {}): Promise<KeygenResponse<Machine[]>> {
    const params = {
      ...this.client.buildPaginationParams(filters),
    };

    // Add filter parameters
    if (filters.license) params.license = filters.license;
    if (filters.user) params.user = filters.user;
    if (filters.group) params.group = filters.group;
    if (filters.product) params.product = filters.product;
    if (filters.policy) params.policy = filters.policy;
    if (filters.key) params.key = filters.key;
    if (filters.fingerprint) params.fingerprint = filters.fingerprint;
    if (filters.hostname) params.hostname = filters.hostname;
    if (filters.ip) params.ip = filters.ip;
    if (filters.status) params.status = filters.status;
    if (filters.metadata) {
      for (const [key, value] of Object.entries(filters.metadata)) {
        params[`metadata[${key}]`] = value;
      }
    }

    return this.client.request<Machine[]>('machines', { params });
  }

  /**
   * Get a specific machine by ID
   */
  async get(id: string): Promise<KeygenResponse<Machine>> {
    return this.client.request<Machine>(`machines/${id}`);
  }

  /**
   * Activate a machine (create)
   */
  async activate(machineData: {
    fingerprint: string;
    licenseId: string;
    name?: string;
    platform?: string;
    hostname?: string;
    cores?: number;
    ip?: string;
    memory?: number;
    disk?: number;
  }): Promise<KeygenResponse<Machine>> {
    const body = {
      data: {
        type: 'machines',
        attributes: {
          fingerprint: machineData.fingerprint,
          name: machineData.name,
          platform: machineData.platform,
          hostname: machineData.hostname,
          cores: machineData.cores,
          ip: machineData.ip,
          memory: machineData.memory,
          disk: machineData.disk,
        },
        relationships: {
          license: {
            data: { type: 'licenses', id: machineData.licenseId },
          },
        },
      },
    };

    return this.client.request<Machine>('machines', {
      method: 'POST',
      body,
    });
  }

  /**
   * Update a machine
   */
  async update(id: string, updates: {
    name?: string;
    platform?: string;
    hostname?: string;
    cores?: number;
    ip?: string;
    memory?: number;
    disk?: number;
    requireHeartbeat?: boolean;
    heartbeatDuration?: number;
    metadata?: Record<string, unknown>;
  }): Promise<KeygenResponse<Machine>> {
    const body = {
      data: {
        type: 'machines',
        id,
        attributes: updates,
      },
    };

    return this.client.request<Machine>(`machines/${id}`, {
      method: 'PATCH',
      body,
    });
  }

  /**
   * Deactivate a machine (delete)
   */
  async deactivate(id: string): Promise<void> {
    await this.client.request(`machines/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Check out a machine
   */
  async checkOut(id: string): Promise<KeygenResponse<Machine>> {
    return this.client.request<Machine>(`machines/${id}/actions/check-out`, {
      method: 'POST',
    });
  }

  /**
   * Ping machine heartbeat
   */
  async ping(id: string): Promise<KeygenResponse<Machine>> {
    return this.client.request<Machine>(`machines/${id}/actions/ping`, {
      method: 'POST',
    });
  }

  /**
   * Reset machine heartbeat
   */
  async resetHeartbeat(id: string): Promise<KeygenResponse<Machine>> {
    return this.client.request<Machine>(`machines/${id}/actions/reset`, {
      method: 'POST',
    });
  }

  /**
   * Get machine processes
   */
  async getProcesses(id: string): Promise<KeygenResponse<unknown[]>> {
    return this.client.request(`machines/${id}/processes`);
  }

  /**
   * Get machine components
   */
  async getComponents(id: string): Promise<KeygenResponse<unknown[]>> {
    return this.client.request(`machines/${id}/components`);
  }

  /**
   * Change machine owner
   */
  async changeOwner(id: string, userId: string): Promise<KeygenResponse<Machine>> {
    const body = {
      data: { type: 'users', id: userId },
    };

    return this.client.request<Machine>(`machines/${id}/relationships/user`, {
      method: 'PATCH',
      body,
    });
  }

  /**
   * Change machine group
   */
  async changeGroup(id: string, groupId: string): Promise<KeygenResponse<Machine>> {
    const body = {
      data: { type: 'groups', id: groupId },
    };

    return this.client.request<Machine>(`machines/${id}/relationships/group`, {
      method: 'PATCH',
      body,
    });
  }
}