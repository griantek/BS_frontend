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
  success: boolean;
  token: string;
  admin: {
    id: number;
    username: string;
    created_at: string;
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
    username: string;
    email: string;
    role: string;
    created_at: string;
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
        this.axiosInstance.interceptors.request.use(
            (config) => {
                const isPublicEndpoint = PUBLIC_ENDPOINTS.some(
                    endpoint => config.url?.includes(endpoint)
                );

                if (!isPublicEndpoint) {
                    const token = this.getStoredToken();
                    const isLoggedIn = localStorage.getItem(LOGIN_STATUS_KEY);
                    
                    // console.log('Request Config:', {
                    //     url: config.url,
                    //     token: token,
                    //     isLoggedIn: isLoggedIn
                    // });

                    if (!token || isLoggedIn !== 'true') {
                        // Reject the request if not authenticated
                        return Promise.reject(new Error('Not authenticated'));
                    }

                    // Ensure token has Bearer prefix
                    const finalToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
                    config.headers.Authorization = finalToken;
                    // console.log('Final headers:', config.headers);
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        this.axiosInstance.interceptors.response.use(
            (response) => response,
            (error) => {
                // Handle 401 and other auth errors
                if (error?.response?.status === 401 || error?.message === 'Not authenticated') {
                    this.clearStoredAuth();
                    const currentPath = window.location.pathname;
                    window.location.href = currentPath.startsWith('/supAdmin') 
                        ? '/supAdmin/login' 
                        : '/admin';
                }
                return Promise.reject(error);
            }
        );
    },

    async loginExecutive(credentials: LoginCredentials): Promise<ExecutiveLoginResponse> {
        try {
            const response = await this.axiosInstance.post('/executive/login', credentials);
            return response.data;
        } catch (error: any) {
            // console.error('API createProspectus error:', {
            //     status: error.response?.status,
            //     data: error.response?.data,
            //     error: error
            // });
            throw error;
        }
    },

    async loginSupAdmin(credentials: LoginCredentials): Promise<SupAdminLoginResponse> {
        try {
            const response = await this.axiosInstance.post('/superadmin/login', {
                username: credentials.username,
                password: credentials.password
            });

            // console.log('Login response:', {
            //     success: response.data.success,
            //     hasToken: !!response.data.token,
            //     hasAdmin: !!response.data.admin
            // });

            return response.data;
        } catch (error: any) {
            console.error('Login error:', {
                status: error.response?.status,
                data: error.response?.data
            });
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
            // console.error('API createService error:', {
            //     status: error.response?.status,
            //     data: error.response?.data,
            //     error: error
            // });
            throw this.handleError(error);
        }
    },

    // Get all services
    async getAllServices(): Promise<ApiResponse<Service[]>> {
        try {
            // console.log('Token before request:', this.getStoredToken());
            const response = await this.axiosInstance.get('superadmin/services/all');
            return response.data;
        } catch (error: any) {
            // console.error('API getAllServices error:', {
            //     status: error.response?.status,
            //     data: error.response?.data,
            //     error: error,
            //     token: this.getStoredToken()
            // });
            throw this.handleError(error);
        }
    },

    // Add new method for getting executives
    async getAllExecutives(): Promise<ApiResponse<Executive[]>> {
        try {
            // Try one of these endpoints based on your backend structure:
            const response = await this.axiosInstance.get('/executive/all');
            // OR
            // const response = await this.axiosInstance.get('/superadmin/executives');
            // OR
            // const response = await this.axiosInstance.get('/executives');
            
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
        const finalToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
        localStorage.setItem(TOKEN_KEY, finalToken);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        localStorage.setItem(LOGIN_STATUS_KEY, 'true');
        localStorage.setItem('isLoggedIn', 'true'); // Add this for consistency
    },

    clearStoredAuth() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(LOGIN_STATUS_KEY);
        localStorage.removeItem('userRole');
        localStorage.removeItem('isLoggedIn');
    },

    handleError(error: any) {
        // console.error('Full error details:', {
        //     status: error.response?.status,
        //     data: error.response?.data,
        //     message: error.message
        // });

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
