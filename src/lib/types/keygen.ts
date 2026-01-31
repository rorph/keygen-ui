// Keygen API Types

export interface KeygenResource {
  id: string;
  type: string;
  attributes: Record<string, unknown>;
  relationships?: Record<string, KeygenRelationship>;
  links?: Record<string, string>;
}

export interface KeygenRelationship {
  data?: KeygenResourceIdentifier | KeygenResourceIdentifier[];
  links?: Record<string, string>;
}

export interface KeygenResourceIdentifier {
  id: string;
  type: string;
}

export interface KeygenResponse<T = unknown> {
  data?: T;
  included?: KeygenResource[];
  meta?: Record<string, unknown>;
  links?: Record<string, string>;
  errors?: KeygenError[];
}

export interface KeygenError {
  id?: string;
  status?: string;
  code?: string;
  title: string;
  detail: string;
  source?: {
    pointer?: string;
    parameter?: string;
  };
  links?: Record<string, string>;
}

// API Error type for catch blocks
export interface ApiError {
  status?: number;
  message?: string;
  code?: string;
}

// Authentication
export interface AuthTokenResponse {
  data: {
    id: string;
    type: 'tokens';
    attributes: {
      kind: string;
      token: string;
      expiry: string | null;
      name?: string;
      created: string;
      updated: string;
    };
    relationships: {
      account: KeygenRelationship;
      bearer: KeygenRelationship;
    };
  };
}

// User
export interface User extends KeygenResource {
  type: 'users';
  attributes: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    email: string;
    role: 'admin' | 'developer' | 'sales-agent' | 'support-agent' | 'read-only' | 'user';
    status: 'active' | 'inactive' | 'banned';
    created: string;
    updated: string;
  };
}

// License
export interface License extends KeygenResource {
  type: 'licenses';
  attributes: {
    name?: string;
    key: string;
    status: 'active' | 'inactive' | 'expired' | 'suspended' | 'banned';
    uses: number;
    maxUses?: number;
    protected: boolean;
    floating: boolean;
    strict: boolean;
    scheme: string;
    encrypted: boolean;
    expiry?: string;
    permissions?: string[];
    metadata?: Record<string, unknown>;
    created: string;
    updated: string;
  };
}

// Machine
export interface Machine extends KeygenResource {
  type: 'machines';
  attributes: {
    name?: string;
    fingerprint: string;
    platform?: string;
    hostname?: string;
    cores?: number;
    ip?: string;
    memory?: number;
    disk?: number;
    requireHeartbeat: boolean;
    heartbeatStatus: 'alive' | 'dead' | 'not-started';
    heartbeatDuration?: number;
    lastHeartbeat?: string;
    metadata?: Record<string, unknown>;
    created: string;
    updated: string;
  };
}

// Product
export interface Product extends KeygenResource {
  type: 'products';
  attributes: {
    name: string;
    code?: string;
    url?: string;
    distributionStrategy: 'LICENSED' | 'OPEN' | 'CLOSED';
    platforms?: string[];
    permissions?: string[];
    metadata?: Record<string, unknown>;
    created: string;
    updated: string;
  };
}

// Policy
export interface Policy extends KeygenResource {
  type: 'policies';
  attributes: {
    name: string;
    duration?: number;
    scheme?: string;
    strict: boolean;
    floating: boolean;
    protected: boolean;
    usePool: boolean;
    maxMachines?: number;
    maxProcesses?: number;
    maxCores?: number;
    maxUses?: number;
    maxUsers?: number;
    maxMemory?: number;
    maxDisk?: number;
    requireProductScope: boolean;
    requirePolicyScope: boolean;
    requireMachineScope: boolean;
    requireFingerprintScope: boolean;
    requireComponentsScope: boolean;
    requireUserScope: boolean;
    requireChecksumScope: boolean;
    requireVersionScope: boolean;
    requireCheckIn: boolean;
    checkInInterval?: 'day' | 'week' | 'month' | 'year';
    checkInIntervalCount?: number;
    requireHeartbeat: boolean;
    heartbeatDuration?: number;
    heartbeatCullStrategy: string;
    heartbeatResurrectionStrategy: string;
    heartbeatBasis: string;
    machineUniquenessStrategy: string;
    machineMatchingStrategy: string;
    componentUniquenessStrategy?: string;
    componentMatchingStrategy?: string;
    expirationStrategy: string;
    expirationBasis: string;
    renewalBasis: string;
    transferStrategy: string;
    authenticationStrategy: string;
    machineLeasingStrategy: string;
    processLeasingStrategy: string;
    overageStrategy: string;
    permissions?: string[];
    metadata: Record<string, unknown>;
    created: string;
    updated: string;
  };
}

// Group
export interface Group extends KeygenResource {
  type: 'groups';
  attributes: {
    name: string;
    maxLicenses?: number;
    maxMachines?: number;
    maxUsers?: number;
    metadata?: Record<string, unknown>;
    created: string;
    updated: string;
  };
}

// Entitlement
export interface Entitlement extends KeygenResource {
  type: 'entitlements';
  attributes: {
    name: string;
    code: string;
    metadata?: Record<string, unknown>;
    created: string;
    updated: string;
  };
}

// Process
export interface Process extends KeygenResource {
  type: 'processes';
  attributes: {
    pid: number;
    name?: string;
    platform?: string;
    created: string;
    updated: string;
  };
}

// Component
export interface Component extends KeygenResource {
  type: 'components';
  attributes: {
    name: string;
    fingerprint: string;
    created: string;
    updated: string;
  };
}

// Request Log
export interface RequestLog extends KeygenResource {
  type: 'request-logs';
  attributes: {
    method: string;
    url: string;
    ip?: string;
    status: number;
    requestHeaders?: Record<string, string>;
    responseHeaders?: Record<string, string>;
    requestBody?: unknown;
    responseBody?: unknown;
    created: string;
  };
}

// Webhook
export interface Webhook extends KeygenResource {
  type: 'webhook-endpoints';
  attributes: {
    url: string;
    subscriptions: string[];
    signingKey?: string;
    enabled: boolean;
    created: string;
    updated: string;
  };
}

// API Request options
export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  params?: Record<string, unknown>;
}

// Pagination
export interface PaginationOptions {
  page?: {
    size?: number;
    number?: number;
  };
  limit?: number;
}

// List options interface
export interface ListOptions {
  limit?: number;
  page?: number;
}

// List response interface
export interface KeygenListResponse<T = unknown> extends KeygenResponse<T[]> {
  meta?: {
    count?: number;
    pages?: {
      first?: string;
      last?: string;
      next?: string;
      prev?: string;
    };
  };
}

// Filter options for different resources
export interface LicenseFilters extends PaginationOptions {
  user?: string;
  policy?: string;
  group?: string;
  product?: string;
  machine?: string;
  status?: License['attributes']['status'];
  metadata?: Record<string, string>;
}

export interface MachineFilters extends PaginationOptions {
  license?: string;
  user?: string;
  group?: string;
  product?: string;
  policy?: string;
  key?: string;
  fingerprint?: string;
  hostname?: string;
  ip?: string;
  status?: string;
  metadata?: Record<string, string>;
}

export interface UserFilters extends PaginationOptions {
  email?: string;
  role?: User['attributes']['role'];
  roles?: User['attributes']['role'][];
  status?: User['attributes']['status'];
}

export interface RequestLogFilters extends PaginationOptions {
  date?: {
    start?: string;
    end?: string;
  };
  requestor?: {
    type?: 'user' | 'environment' | 'product' | 'license';
    id?: string;
  };
  url?: string;
  ip?: string;
  method?: string;
  status?: string;
}

export interface WebhookFilters extends PaginationOptions {
  url?: string;
  subscriptions?: string[];
}

// Event Log
export interface EventLog extends KeygenResource {
  type: 'event-logs';
  attributes: {
    event: string;
    created: string;
    updated: string;
  };
  relationships?: {
    resource?: KeygenRelationship;
    requestor?: KeygenRelationship;
  };
}

export interface EventLogFilters extends PaginationOptions {
  date?: { start?: string; end?: string };
  event?: string;
}