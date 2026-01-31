import { KeygenClient } from '../client';
import { Policy, Entitlement, KeygenResponse, PaginationOptions, KeygenListResponse } from '../../types/keygen';

export interface PolicyAttributes {
  name?: string;
  duration?: number;
  scheme?: string;
  strict?: boolean;
  floating?: boolean;
  protected?: boolean;
  usePool?: boolean;
  maxMachines?: number | null;
  maxProcesses?: number | null;
  maxCores?: number | null;
  maxUses?: number | null;
  maxUsers?: number | null;
  maxMemory?: number | null;
  maxDisk?: number | null;
  requireProductScope?: boolean;
  requirePolicyScope?: boolean;
  requireMachineScope?: boolean;
  requireFingerprintScope?: boolean;
  requireUserScope?: boolean;
  requireChecksumScope?: boolean;
  requireVersionScope?: boolean;
  requireCheckIn?: boolean;
  checkInInterval?: string;
  checkInIntervalCount?: number;
  requireHeartbeat?: boolean;
  heartbeatDuration?: number;
  heartbeatCullStrategy?: string;
  heartbeatResurrectionStrategy?: string;
  heartbeatBasis?: string;
  machineUniquenessStrategy?: string;
  machineMatchingStrategy?: string;
  componentUniquenessStrategy?: string;
  componentMatchingStrategy?: string;
  expirationStrategy?: string;
  expirationBasis?: string;
  renewalBasis?: string;
  transferStrategy?: string;
  authenticationStrategy?: string;
  machineLeasingStrategy?: string;
  processLeasingStrategy?: string;
  overageStrategy?: string;
  metadata?: Record<string, unknown>;
}

export class PolicyResource {
  constructor(private client: KeygenClient) {}

  /**
   * List all policies
   */
  async list(options?: PaginationOptions): Promise<KeygenListResponse<Policy>> {
    const params: Record<string, unknown> = {
      ...this.client.buildPaginationParams(options || {}),
    };

    return this.client.request<Policy[]>('policies', { params });
  }

  /**
   * Get a specific policy by ID
   */
  async get(policyId: string): Promise<KeygenResponse<Policy>> {
    return this.client.request<Policy>(`policies/${policyId}`);
  }

  /**
   * Create a new policy
   */
  async create(data: PolicyAttributes & {
    productId: string;
  }): Promise<KeygenResponse<Policy>> {
    const { productId, ...attributes } = data;

    return this.client.request<Policy>('policies', {
      method: 'POST',
      body: {
        data: {
          type: 'policies',
          attributes,
          relationships: {
            product: {
              data: {
                type: 'products',
                id: productId
              }
            }
          }
        }
      }
    });
  }

  /**
   * Update a policy
   */
  async update(policyId: string, data: PolicyAttributes): Promise<KeygenResponse<Policy>> {
    return this.client.request<Policy>(`policies/${policyId}`, {
      method: 'PATCH',
      body: {
        data: {
          type: 'policies',
          id: policyId,
          attributes: data
        }
      }
    });
  }

  /**
   * Delete a policy
   */
  async delete(policyId: string): Promise<void> {
    await this.client.request<void>(`policies/${policyId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Get policy entitlements
   */
  async getEntitlements(policyId: string, options: PaginationOptions = {}): Promise<KeygenResponse<Entitlement[]>> {
    const params: Record<string, unknown> = {
      ...this.client.buildPaginationParams(options),
    };
    return this.client.request<Entitlement[]>(`policies/${policyId}/entitlements`, { params });
  }

  /**
   * Attach entitlements to policy
   */
  async attachEntitlements(policyId: string, entitlementIds: string[]): Promise<void> {
    const body = {
      data: entitlementIds.map(id => ({ type: 'entitlements', id })),
    };
    await this.client.request(`policies/${policyId}/entitlements`, {
      method: 'POST',
      body,
    });
  }

  /**
   * Detach entitlements from policy
   */
  async detachEntitlements(policyId: string, entitlementIds: string[]): Promise<void> {
    const body = {
      data: entitlementIds.map(id => ({ type: 'entitlements', id })),
    };
    await this.client.request(`policies/${policyId}/entitlements`, {
      method: 'DELETE',
      body,
    });
  }
}
