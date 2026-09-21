import { StorageUtil, STORAGE_KEYS } from '../utils/storage';
import { refreshToken, stopAutoRefresh } from '../utils/tokenRefresh';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class ApiService {
  /**
   * Central HTTP client with 401 interceptor & automatic single-retry token refresh
   */
  private async request(url: string, options: RequestInit = {}, isRetry = false): Promise<Response> {
    const token = StorageUtil.get(STORAGE_KEYS.SESSION_TOKEN);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
      ...options,
      headers,
    });

    // 401 Interceptor: If unauthorized and not an auth endpoint, attempt ONE token refresh retry before forcing logout
    if (
      res.status === 401 &&
      !url.includes('/api/auth/login') &&
      !url.includes('/api/auth/refresh')
    ) {
      if (!isRetry) {
        console.warn(`[API Client] Received 401 for ${url}. Attempting ONE token refresh retry...`);
        const refreshed = await refreshToken();
        if (refreshed) {
          // Retry original request exactly once with new token
          return this.request(url, options, true);
        } else {
          console.warn('[API Client] Refresh failed on 401. Forcing logout.');
          this.forceLogout();
        }
      } else {
        console.warn(`[API Client] Request to ${url} still returned 401 after token refresh retry. Forcing logout.`);
        this.forceLogout();
      }
    }

    return res;
  }

  private forceLogout(): void {
    stopAutoRefresh();
    StorageUtil.remove(STORAGE_KEYS.AUTH_ROLE);
    StorageUtil.remove(STORAGE_KEYS.SESSION_TOKEN);
    StorageUtil.remove(STORAGE_KEYS.USER_PROFILE);
    StorageUtil.remove(STORAGE_KEYS.SELECTED_AGENT_ID);
    StorageUtil.remove(STORAGE_KEYS.ACTIVE_PORTAL);
    StorageUtil.remove(STORAGE_KEYS.ACTIVE_SECTION);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('uzx:auth-failure'));
    }
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
        message: 'Network error communicating with authentication server.',
      };
    }
  }

  public async logout(): Promise<void> {
    try {
      const token = StorageUtil.get(STORAGE_KEYS.SESSION_TOKEN);
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
    } catch {
      // ignore network errors on logout
    }
  }

  public async checkSession(): Promise<{ authenticated: boolean; role?: string; user?: any }> {
    try {
      const res = await this.request('/api/session-check', {
        method: 'POST',
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
      const res = await this.request('/api/sync', {
        method: 'GET',
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data;
    } catch (err) {
      console.warn('[API Client] Sync failed, keeping local state:', err);
      return null;
    }
  }

  public async resetSystemDataOnServer(): Promise<boolean> {
    try {
      const res = await this.request('/api/admin/reset-system-data', {
        method: 'POST',
      });
      return res.ok;
    } catch (err) {
      console.error('[API Client] Reset system data failed:', err);
      return false;
    }
  }

  public async createTransaction(tx: any): Promise<any> {
    try {
      const res = await this.request('/api/transactions', {
        method: 'POST',
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
    rejectionReason?: string,
    extraData?: {
      amount?: number;
      processingDurationSeconds?: number;
      processingDurationFormatted?: string;
      processedAt?: string;
    }
  ): Promise<any> {
    try {
      const res = await this.request(`/api/transactions/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          processedBy,
          rejectionReason,
          ...extraData,
        }),
      });
      const json = await res.json();
      return json.transaction;
    } catch (err) {
      console.error('[API Client] Update transaction status failed:', err);
      return null;
    }
  }

  public async createAgent(agent: any): Promise<any> {
    try {
      const res = await this.request('/api/agents', {
        method: 'POST',
        body: JSON.stringify(agent),
      });
      const json = await res.json();
      return json.agent;
    } catch (err) {
      console.error('[API Client] Create agent failed:', err);
      return null;
    }
  }

  public async updateAgent(id: string, updates: any): Promise<any> {
    try {
      const res = await this.request(`/api/agents/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      const json = await res.json();
      return json.agent;
    } catch (err) {
      console.error('[API Client] Update agent failed:', err);
      return null;
    }
  }

  public async createWallet(wallet: any): Promise<any> {
    try {
      const res = await this.request('/api/wallets', {
        method: 'POST',
        body: JSON.stringify(wallet),
      });
      const json = await res.json();
      return json.wallet;
    } catch (err) {
      console.error('[API Client] Create wallet failed:', err);
      return null;
    }
  }

  public async updateWallet(id: string, updates: any): Promise<any> {
    try {
      const res = await this.request(`/api/wallets/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      const json = await res.json();
      return json.wallet;
    } catch (err) {
      console.error('[API Client] Update wallet failed:', err);
      return null;
    }
  }

  public async createNotification(notification: any): Promise<any> {
    try {
      const res = await this.request('/api/notifications', {
        method: 'POST',
        body: JSON.stringify(notification),
      });
      const json = await res.json();
      return json.notification;
    } catch (err) {
      console.error('[API Client] Create notification failed:', err);
      return null;
    }
  }

  public async resetSystemData(): Promise<boolean> {
    try {
      const res = await this.request('/api/admin/reset-system-data', {
        method: 'POST',
      });
      return res.ok;
    } catch (err) {
      console.error('[API Client] Reset system data failed:', err);
      return false;
    }
  }
}

export const apiService = new ApiService();
