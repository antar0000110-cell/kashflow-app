import { StorageUtil, STORAGE_KEYS } from '../utils/storage';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class ApiService {
  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const token = StorageUtil.get(STORAGE_KEYS.SESSION_TOKEN);
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  public async login(username: string, password: string): Promise<{
    success: boolean;
    token?: string;
    user?: any;
    message?: string;
  }> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return {
        success: false,
        message: 'Network error communicating with authentication server.'
      };
    }
  }

  public async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: this.getHeaders(),
      });
    } catch {
      // ignore network errors on logout
    }
  }

  public async checkSession(): Promise<{ authenticated: boolean; role?: string; user?: any }> {
    try {
      const res = await fetch('/api/session-check', {
        method: 'POST',
        headers: this.getHeaders(),
      });
      if (!res.ok) {
        return { authenticated: false };
      }
      const data = await res.json();
      return data;
    } catch {
      return { authenticated: false };
    }
  }

  public async syncData(): Promise<any> {
    try {
      const res = await fetch('/api/sync', {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data;
    } catch (err) {
      console.warn('[API Client] Sync failed, keeping local state:', err);
      return null;
    }
  }

  public async createTransaction(tx: any): Promise<any> {
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(tx),
      });
      const json = await res.json();
      return json.transaction;
    } catch (err) {
      console.error('[API Client] Create transaction failed:', err);
      return null;
    }
  }

  public async updateTransactionStatus(
    id: string,
    status: string,
    processedBy?: string,
    rejectionReason?: string
  ): Promise<any> {
    try {
      const res = await fetch(`/api/transactions/${id}/status`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify({ status, processedBy, rejectionReason }),
      });
      const json = await res.json();
      return json.transaction;
    } catch (err) {
      console.error('[API Client] Update transaction status failed:', err);
      return null;
    }
  }
}

export const apiService = new ApiService();
