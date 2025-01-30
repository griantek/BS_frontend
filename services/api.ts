import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const TOKEN_KEY = process.env.NEXT_PUBLIC_TOKEN_KEY;
const USER_KEY = process.env.NEXT_PUBLIC_USER_KEY;
const LOGIN_STATUS_KEY = process.env.NEXT_PUBLIC_LOGIN_STATUS_KEY;

// Types
interface LoginCredentials {
    username: string;
    password: string;
}

interface ExecutiveLoginResponse {
    token: string;
    executive: {
        id: string;
        name: string;
        email: string;
    };
}

interface SupAdminLoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
    role: string;
  };
}

interface Prospectus {
    id: number;
    executive_id: string;
    date: string;
    email: string;
    reg_id: string;
    client_name: string;
    phone: string;
    department: string;
    state: string;
    tech_person: string;
    requirement: string;
    proposed_service_period: string;
    created_at: string;
    services: string;
}

export interface ProspectusCreateRequest {
    clientId: string;
    date: string;
    regId: string;
    clientName: string;
    phone: string;
    clientEmail: string;
    department: string;
    otherDepartment?: string;
    state: string;
    techPerson?: string;
    requirement: string;
    proposedService: string;
    period: string;
}

interface CreateExecutiveRequest {
    username: string;
    password: string;
    email: string;
    role?: string;
}

interface ApiResponse<T> {
    success: boolean;
    data: T;
    timestamp: string;
}

// Add new interfaces for services
interface Service {
  id: number;
  service_name: string;
  service_type: string | null;
  description: string | null;
  fee: number;
  min_duration: string | null;
  max_duration: string | null;
}

interface CreateServiceRequest {
  service_name: string;
  service_type?: string;
  description?: string;
  fee: number;
  min_duration?: string;
  max_duration?: string;
}

// Add new interface for Executive
interface Executive {
    id: string;
    name: string;
    email: string;
    status: string;
}

const PUBLIC_ENDPOINTS = [
    '/executive/create',
    '/executive/login',
    '/superadmin/login'
];

// API service
const api = {
    axiosInstance: axios.create({
        baseURL: API_URL,
        headers: {
            'Content-Type': 'application/json',
        },
    }),

    init() {
        // Add request interceptor
        this.axiosInstance.interceptors.request.use(
            (config) => {
                // Check if the endpoint is public
                const isPublicEndpoint = PUBLIC_ENDPOINTS.some(
                    endpoint => config.url?.includes(endpoint)
                );

                if (!isPublicEndpoint) {
                    const token = this.getStoredToken();
                    if (token) {
                        config.headers.Authorization = `Bearer ${token}`;
                    }
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Add response interceptor to handle auth errors
        this.axiosInstance.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    this.clearStoredAuth();
                    window.location.href = '/supAdmin/login';
                }
                return Promise.reject(error);
            }
        );
    },

    // Remove setAuthToken as it's no longer needed for individual calls
    // setAuthToken(token: string) {
    //     this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    // },

    async loginExecutive(credentials: LoginCredentials): Promise<ExecutiveLoginResponse> {
        try {
            const response = await this.axiosInstance.post('/executive/login', credentials);
            return response.data;
        } catch (error: any) {
            console.error('API createProspectus error:', {
                status: error.response?.status,
                data: error.response?.data,
                error: error
            });
            throw error;
        }
    },

    async loginSupAdmin(credentials: LoginCredentials): Promise<SupAdminLoginResponse> {
        try {
            const response = await this.axiosInstance.post('/superadmin/login', credentials);
            return response.data;
        } catch (error: any) {
            throw this.handleError(error);
        }
    },

    async createProspectus(data: ProspectusCreateRequest): Promise<Prospectus> {
        try {
            const response = await this.axiosInstance.post('/prospectus/create', data);
            return response.data;
        } catch (error: any) {
            console.error('API createProspectus error:', {
                status: error.response?.status,
                data: error.response?.data,
                error: error
            });
            throw error;
        }
    },

    async getAllProspectus(): Promise<Prospectus[]> {
        const response = await this.axiosInstance.get('/prospectus/all');
        return response.data;
    },

    async createExecutive(data: CreateExecutiveRequest) {
        try {
            const response = await this.axiosInstance.post('/executive/create', data);
            return response.data;
        } catch (error: any) {
            console.error('API Error:', error.response || error);
            throw error;
        }
    },

    // Get prospects by executive's clientId
    async getProspectusByClientId(clientId: string): Promise<ApiResponse<Prospectus[]>> {
        try {
            const response = await this.axiosInstance.get(`/prospectus/executive/${clientId}`);
            return response.data;
        } catch (error: any) {
            throw this.handleError(error);
        }
    },

    // Get single prospect by registration ID
    async getProspectusByRegId(regId: string): Promise<ApiResponse<Prospectus>> {
        try {
            const response = await this.axiosInstance.get(`/prospectus/register/${regId}`);
            return response.data;
        } catch (error: any) {
            throw this.handleError(error);
        }
    },

    async deleteProspectus(regIds: string[]): Promise<{ success: boolean }> {
        try {
            const response = await this.axiosInstance.delete('/prospectus/delete', {
                data: { reg_ids: regIds }
            });
            return response.data;
        } catch (error: any) {
            throw this.handleError(error);
        }
    },

    // Create a new service
    async createService(data: CreateServiceRequest): Promise<ApiResponse<Service>> {
        try {
            const response = await this.axiosInstance.post('/services/create', data);
            return response.data;
        } catch (error: any) {
            console.error('API createService error:', {
                status: error.response?.status,
                data: error.response?.data,
                error: error
            });
            throw this.handleError(error);
        }
    },

    // Get all services
    async getAllServices(): Promise<ApiResponse<Service[]>> {
        try {
            const response = await this.axiosInstance.get('/services/all');
            return response.data;
        } catch (error: any) {
            console.error('API getAllServices error:', {
                status: error.response?.status,
                data: error.response?.data,
                error: error
            });
            throw this.handleError(error);
        }
    },

    // Add new method for getting executives
    async getAllExecutives(): Promise<ApiResponse<Executive[]>> {
        try {
            const response = await this.axiosInstance.get('/executives/all');
            return response.data;
        } catch (error: any) {
            console.error('API getAllExecutives error:', error);
            throw this.handleError(error);
        }
    },

    getStoredToken() {
        return localStorage.getItem(TOKEN_KEY);
    },

    getStoredUser() {
        const userStr = localStorage.getItem(USER_KEY);
        return userStr ? JSON.parse(userStr) : null;
    },

    setStoredAuth(token: string, user: any) {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        localStorage.setItem(LOGIN_STATUS_KEY, 'true');
    },

    clearStoredAuth() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(LOGIN_STATUS_KEY);
        localStorage.removeItem('userRole');
    },

    handleError(error: any) {
        console.error('Full error details:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });

        if (error.response) {
            return {
                error: error.response.data.message ||
                    error.response.data.error ||
                    `Server error: ${error.response.status}`
            };
        } else if (error.request) {
            return {
                error: 'No response from server. Please check if the server is running.'
            };
        } else {
            return {
                error: error.message || 'An unexpected error occurred'
            };
        }
    }
};

// Initialize the interceptors
api.init();

export type { Service, CreateServiceRequest, Executive };
export default api;
