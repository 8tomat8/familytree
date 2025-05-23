import { logger } from './logger';

interface ApiRequestOptions extends RequestInit {
    timeout?: number;
}

interface ApiResponse<T = any> {
    data?: T;
    error?: string;
    status: number;
    ok: boolean;
}

class ApiClient {
    private async fetchWithLogging(
        url: string,
        options: ApiRequestOptions = {}
    ): Promise<Response> {
        const { timeout = 30000, ...fetchOptions } = options;
        const method = options.method || 'GET';

        // Log API request
        logger.logApiRequest(method, url, {
            userAgent: navigator.userAgent
        });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                ...fetchOptions,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            // Log API response
            logger.logApiResponse(method, url, response.status, {
                userAgent: navigator.userAgent
            });

            return response;
        } catch (error) {
            clearTimeout(timeoutId);

            if (error instanceof Error) {
                logger.logClientError(
                    `API request failed: ${method} ${url}`,
                    error,
                    {
                        method,
                        url,
                        userAgent: navigator.userAgent
                    }
                );
            }

            throw error;
        }
    }

    async get<T = any>(url: string, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> {
        try {
            const response = await this.fetchWithLogging(url, {
                ...options,
                method: 'GET'
            });

            if (!response.ok) {
                const errorText = await response.text();
                return {
                    error: errorText || `HTTP ${response.status}`,
                    status: response.status,
                    ok: false
                };
            }

            const data = await response.json();
            return {
                data,
                status: response.status,
                ok: true
            };
        } catch (error) {
            return {
                error: error instanceof Error ? error.message : 'Network error',
                status: 0,
                ok: false
            };
        }
    }

    async post<T = any>(
        url: string,
        body?: any,
        options: ApiRequestOptions = {}
    ): Promise<ApiResponse<T>> {
        try {
            const response = await this.fetchWithLogging(url, {
                ...options,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                body: body ? JSON.stringify(body) : undefined
            });

            if (!response.ok) {
                const errorText = await response.text();
                return {
                    error: errorText || `HTTP ${response.status}`,
                    status: response.status,
                    ok: false
                };
            }

            const data = await response.json();
            return {
                data,
                status: response.status,
                ok: true
            };
        } catch (error) {
            return {
                error: error instanceof Error ? error.message : 'Network error',
                status: 0,
                ok: false
            };
        }
    }

    async put<T = any>(
        url: string,
        body?: any,
        options: ApiRequestOptions = {}
    ): Promise<ApiResponse<T>> {
        try {
            const response = await this.fetchWithLogging(url, {
                ...options,
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                body: body ? JSON.stringify(body) : undefined
            });

            if (!response.ok) {
                const errorText = await response.text();
                return {
                    error: errorText || `HTTP ${response.status}`,
                    status: response.status,
                    ok: false
                };
            }

            const data = await response.json();
            return {
                data,
                status: response.status,
                ok: true
            };
        } catch (error) {
            return {
                error: error instanceof Error ? error.message : 'Network error',
                status: 0,
                ok: false
            };
        }
    }

    async delete<T = any>(url: string, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> {
        try {
            const response = await this.fetchWithLogging(url, {
                ...options,
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorText = await response.text();
                return {
                    error: errorText || `HTTP ${response.status}`,
                    status: response.status,
                    ok: false
                };
            }

            const data = await response.json();
            return {
                data,
                status: response.status,
                ok: true
            };
        } catch (error) {
            return {
                error: error instanceof Error ? error.message : 'Network error',
                status: 0,
                ok: false
            };
        }
    }
}

export const apiClient = new ApiClient(); 