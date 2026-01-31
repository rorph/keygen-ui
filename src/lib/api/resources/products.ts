import { KeygenClient } from '../client';
import { Product, KeygenResponse, PaginationOptions, KeygenListResponse } from '../../types/keygen';

export class ProductResource {
  constructor(private client: KeygenClient) {}

  /**
   * List all products
   */
  async list(options?: PaginationOptions): Promise<KeygenListResponse<Product>> {
    const params: Record<string, unknown> = {
      ...this.client.buildPaginationParams(options || {}),
    };

    return this.client.request<Product[]>('products', { params });
  }

  /**
   * Get a specific product by ID
   */
  async get(productId: string): Promise<KeygenResponse<Product>> {
    return this.client.request<Product>(`products/${productId}`);
  }

  /**
   * Create a new product
   */
  async create(data: {
    name: string;
    url?: string;
    distributionStrategy?: 'LICENSED' | 'OPEN' | 'CLOSED';
    platforms?: string[];
    permissions?: string[];
    metadata?: Record<string, unknown>;
  }): Promise<KeygenResponse<Product>> {
    return this.client.request<Product>('products', {
      method: 'POST',
      body: {
        data: {
          type: 'products',
          attributes: data
        }
      }
    });
  }

  /**
   * Update a product
   */
  async update(productId: string, data: {
    name?: string;
    url?: string;
    distributionStrategy?: 'LICENSED' | 'OPEN' | 'CLOSED';
    platforms?: string[];
    permissions?: string[];
    metadata?: Record<string, unknown>;
  }): Promise<KeygenResponse<Product>> {
    return this.client.request<Product>(`products/${productId}`, {
      method: 'PATCH',
      body: {
        data: {
          type: 'products',
          id: productId,
          attributes: data
        }
      }
    });
  }

  /**
   * Delete a product
   */
  async delete(productId: string): Promise<void> {
    await this.client.request<void>(`products/${productId}`, {
      method: 'DELETE'
    });
  }
}