import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const TOKEN_KEY = process.env.NEXT_PUBLIC_TOKEN_KEY ;
const USER_KEY = process.env.NEXT_PUBLIC_USER_KEY ;
const LOGIN_STATUS_KEY = process.env.NEXT_PUBLIC_LOGIN_STATUS_KEY ;
const USER_ROLE_KEY = process.env.NEXT_PUBLIC_USER_ROLE_KEY ;

// Types
interface LoginCredentials {
    username: string;
    password: string;
}

interface ExecutiveLoginResponse {
    success: boolean;
    token: string;
    executive: {
        id: string;
        username: string;
        email: string;
        entity_type: 'Editor' | 'Executive';
        role: {
            id: number;
            name: string;
            description: string;
            permissions: any[];
        };
        created_at: string;
        updated_at: string;
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
    notes:string;
    next_follow_up:string;
    executive?: {
        id: string;
        username: string;
        email: string;
    };
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
    notes?: string;           // Add this field
    nextFollowUp?: string;    // Add this field
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

// Add interface for update request
interface UpdateServiceRequest {
  service_name: string;
  service_type?: string;
  description?: string;
  fee: number;
  min_duration?: string;
  max_duration?: string;
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
    password?: string; // Add optional password field
}

interface ExecutiveWithRoleName {
    id: string;
    username: string;
    email: string;
    role_details: {
        id:string;
        name: string;
        description: string;
    };
    created_at: string;
    password?: string; // Add optional password field
}

// Add new interface for BankAccount
interface BankAccount {
  id: string;
  account_name: string;
  account_holder_name: string;
  account_number: string;
  ifsc_code: string;
  account_type: string;
  bank: string;
  upi_id: string;
  branch:string;
  created_at: string;
}

// Add new interface for Department
interface Department {
    id: number;
    name: string;
    created_at: string;
    exec_id:string;
}

interface CreateDepartmentRequest {
    name: string;
    exec_id?:string;
}

// Update Registration interface
interface Registration {
  id: number;
  prospectus_id: number;
  date: string;  // Added
  services: string;
  init_amount: number;
  accept_amount: number;
  discount: number;
  total_amount: number;
  assigned_to: string;
  accept_period: string;
  pub_period: string;
  bank_id: string;  // Added
  status: 'pending' | 'registered';
  month: number;
  year: number;
  created_at: string;
  transaction_id: number;  // Added
  notes?: string;  // Make notes optional in the base interface
  prospectus: {
    id: number;
    date: string;
    email: string;
    notes: string;
    phone: string;
    state: string;
    reg_id: string;
    services: string;
    created_at: string;
    department: string;
    client_name: string;
    requirement: string;
    tech_person: string;
    executive_id: string;
    isregistered: boolean;
    next_follow_up: string;
    proposed_service_period: string;
  };
  bank_accounts: {  // Changed from bank_account to bank_accounts
    id: string;
    bank: string;
    branch: string;
    upi_id: string;
    ifsc_code: string;
    created_at: string;
    account_name: string;
    account_type: string;
    account_number: string;
    account_holder_name: string;
  };
  transactions: {  // Changed from transaction to transactions
    id: number;
    amount: number;
    exec_id: string;
    executive: object;
    transaction_id: string;
    additional_info: object;
    transaction_date: string;
    transaction_type: string;
  };
}

// Add interface for registration creation
interface TransactionInfo {
  transaction_type: 'UPI' | 'Bank Transfer' | 'Card' | 'Cash' | 'Cheque' | 'Wallet' | 'Online Payment' | 'Crypto';
  transaction_id: string;
  amount: number;
  transaction_date: string;
  additional_info: Record<string, any>;
}

interface CreateRegistrationRequest {
  // Transaction details
  transaction_type: TransactionInfo['transaction_type'];
  transaction_id: string;
  amount: number;
  transaction_date: string;
  additional_info: Record<string, any>;
  
  // Executive and prospect details
  exec_id: string;
  client_id: string;
  prospectus_id: number;
  services: string;
  init_amount: number;
  accept_amount: number;
  discount: number;
  total_amount: number;
  accept_period: string;
  pub_period: string;
  bank_id: string;
  status: 'registered' | 'pending';  // Explicitly define literal types
  month: number;
  year: number;
  assigned_to?: string;  // Add this field
}

// Add new interface for database registration
interface RegistrationRecord {
  id: number;
  prospectus_id: number;
  services: string;
  init_amount: number;
  accept_amount: number;
  discount: number;
  total_amount: number;
  accept_period: string;
  pub_period: string;
  status: 'pending' | 'registered';
  month: number;
  year: number;
  created_at: string;
  prospectus: {
    id: number;
    client_name: string;
    [key: string]: any;
  };
  bank_account: {
    id: string;
    bank_name: string;
    account_number: string;
    [key: string]: any;
  };
  transaction: {
    id: number;
    transaction_type: 'UPI' | 'Bank Transfer' | 'Card' | 'Cash' | 'Cheque' | 'Wallet' | 'Online Payment' | 'Crypto';
    amount: number;
    executive: {
      id: string;
      username: string;
    };
  };
}

// Add new interface for paginated response
interface PaginatedResponse<T> {
  total: number;
  filtered: number;
  items: T[];
}

// Add new Role interface
interface Role {
    id: number;
    name: string;
    description: string;
    permissions: {
        read: boolean;
        create: boolean;
        delete: boolean;
        update: boolean;
    };
    created_at: string;
    updated_at: string;
}

interface CreateRoleRequest {
    name: string;
    description: string;
    permissions: {
        create: boolean;
        read: boolean;
        update: boolean;
        delete: boolean;
    };
}

interface ServerRegistration {
  id: number;
  prospectus_id: number;
  services: string;
  init_amount: number;
  accept_amount: number;
  discount: number;
  total_amount: number;
  accept_period: string;
  pub_period: string;
  status: 'pending' | 'registered';
  month: number;
  year: number;
  created_at: string;
  prospectus: {
    id: number;
    reg_id: string;
    client_name: string;
    executive:{
        id:string;
        username:string;
        email:string;
    };
  };
  bank_account: {
    bank: string;
    account_number: string;
  };
  transaction: {
    id: number;
    amount: number;
    exec_id: string;
    transaction_id: string;
    transaction_type: string;
  };
}

// Add Transaction interface near other interfaces
interface Transaction {
  id: number;
  transaction_type: string;
  transaction_id: string;
  amount: number;
  transaction_date: string;
  additional_info: Record<string, any>;
  exec_id: string;
  executive: {
    id: string;
    username: string;
  };
  registration: Array<{
    id: number;
    prospectus: {
      id: number;
      reg_id: string;
      client_name: string;
    };
  }>;
  executive_name: string;
}

// Add new interface for bank account creation/update
interface BankAccountRequest {
    account_name: string;
    account_holder_name: string;
    account_number: string;
    ifsc_code: string;
    account_type: string;
    bank: string;
    upi_id: string;
    branch: string;
}

// First add the interface for Journal Data
interface JournalData {
  id: number;
  prospectus_id: number;
  client_name: string;
  requirement: string;
  personal_email: string;
  assigned_to: string;
  journal_name: string;
  status: 'pending' | 'under review' | 'approved' | 'rejected' | 'submitted';
  journal_link: string;
  username: string;
  password: string;
  orcid_username1: string;
  password1: string;
  paper_title: string;
  created_at: string;
  updated_at: string;
  executive: {
    id: string;
    email: string;
    username: string;
  };
  prospectus: {
    id: number;
    reg_id: string;
  };
  status_link: string | null; // Add this new field
}

// Update the UpdateJournalRequest interface to make all fields required
interface UpdateJournalRequest {
    status: 'pending' | 'under review' | 'approved' | 'rejected' | 'submitted';
    journal_name: string;
    journal_link: string;
    paper_title: string;
    username: string;
    password: string;
    orcid_username1: string;
    password1: string;
    status_link?: string; // Add this new optional field
}

interface TriggerStatusUploadResponse {
    success: boolean;
    journalId: number;
    searchQuery: string;
    count: number;
}

// Add new interface for Editor
interface Editor {
    id: string;
    username: string;
}

interface AssignedRegistration {
  id: number;
  prospectus_id: number;
  date: string;
  services: string;
  init_amount: number;
  accept_amount: number;
  discount: number;
  total_amount: number;
  accept_period: string;
  pub_period: string;
  bank_id: string;
  status: 'registered' | 'pending';
  month: number;
  year: number;
  created_at: string;
  transaction_id: number;
  notes: string | null;
  updated_at: string;
  assigned_to: string;
  prospectus: {
    id: number;
    email: string;
    reg_id: string;
    executive: {
      id: string;
      email: string;
      username: string;
    };
    client_name: string;
    requirement: string;
  };
}

const PUBLIC_ENDPOINTS = [
    '/executive/create',
    '/executive/login',
    '/superadmin/login'
];

// API service
const api = {
    axiosInstance: axios.create({
        baseURL: '/api',  // Changed from API_URL to use the proxy
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
                // Only redirect on auth errors if not on login pages
                if (error?.response?.status === 401 || error?.message === 'Not authenticated') {
                    const userRole = localStorage.getItem(USER_ROLE_KEY);
                    const path = window.location.pathname;
                    
                    // Don't redirect if already on a login page
                    if (!path.includes('/login')) {
                        this.clearStoredAuth();
                        window.location.href = userRole === 'supAdmin' 
                            ? '/supAdmin/login' 
                            : '/business/login';
                    }
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
            const response = await this.axiosInstance.post('/superadmin/login', credentials);
            return response.data;
        } catch (error: any) {
            // Don't transform the error, let the component handle it
            throw error;
        }
    },

    async createProspectus(data: ProspectusCreateRequest): Promise<Prospectus> {
        try {
            const response = await this.axiosInstance.post('/executive/prospectus/create', data);
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

    async getAllProspectus(): Promise<ApiResponse<Prospectus[]>> {
        try {
            const response = await this.axiosInstance.get('/executive/prospectus/all');
            return response.data;
        } catch (error: any) {
            throw this.handleError(error);
        }
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
            const response = await this.axiosInstance.get(`/executive/prospectus/${clientId}`);
            return response.data;
        } catch (error: any) {
            throw this.handleError(error);
        }
    },

    // Get single prospect by registration ID
    async getProspectusByRegId(regId: string): Promise<ApiResponse<Prospectus>> {
        try {
            console.log('Fetching prospect by regId:', regId);
            const response = await this.axiosInstance.get(`/executive/prospectus/register/${regId}`);
            console.log('Prospect response:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Error in getProspectusByRegId:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                config: error.config,
                stack: error.stack
            });
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
    async createService(data: Omit<Service, 'id'>): Promise<ApiResponse<Service>> {
        try {
            const response = await this.axiosInstance.post('/common/services/create', data);
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
        return this.axiosInstance.get('/common/services/all')
                .then(response => response.data);
    },

    // Get service by ID
    async getServiceById(id: number): Promise<ApiResponse<Service>> {
        try {
            const response = await this.axiosInstance.get(`/common/services/${id}`);
            return response.data;
        } catch (error: any) {
            throw this.handleError(error);
        }
    },

    // Add new method for updating service
    async updateService(id: number, data: UpdateServiceRequest): Promise<ApiResponse<Service>> {
        try {
            const response = await this.axiosInstance.put(`/common/services/${id}`, data);
            return response.data;
        } catch (error: any) {
            throw this.handleError(error);
        }
    },

    // Add delete service method
    async deleteService(id: number): Promise<ApiResponse<void>> {
        try {
            const response = await this.axiosInstance.delete(`/common/services/${id}`);
            return response.data;
        } catch (error: any) {
            throw this.handleError(error);
        }
    },

    // Add new method for getting executives
    async getAllExecutives(): Promise<ApiResponse<ExecutiveWithRoleName[]>> {
        try {
            // Try one of these endpoints based on your backend structure:
            const response = await this.axiosInstance.get('/executive/all');
            
            return response.data;
        } catch (error: any) {
            console.error('API getAllExecutives error:', error);
            throw this.handleError(error);
        }
    },

    // Add new methods for getting bank accounts
    async getAllBankAccounts(): Promise<ApiResponse<BankAccount[]>> {
        const response = await this.axiosInstance.get('/common/bank-accounts/all');
        return response.data;
    },

    async getBankAccountById(id: string): Promise<ApiResponse<BankAccount>> {
        const response = await this.axiosInstance.get(`/common/bank-accounts/${id}`);
        return response.data;
    },

    // Create new bank account
    async createBankAccount(data: BankAccountRequest): Promise<ApiResponse<BankAccount>> {
        try {
            const response = await this.axiosInstance.post('/common/bank-accounts/create', data);
            return response.data;
        } catch (error: any) {
            throw this.handleError(error);
        }
    },

    // Update bank account
    async updateBankAccount(id: string, data: BankAccountRequest): Promise<ApiResponse<BankAccount>> {
        try {
            const response = await this.axiosInstance.put(`/common/bank-accounts/${id}`, data);
            return response.data;
        } catch (error: any) {
            throw this.handleError(error);
        }
    },

    // Delete bank account
    async deleteBankAccount(id: string): Promise<ApiResponse<void>> {
        try {
            const response = await this.axiosInstance.delete(`/common/bank-accounts/${id}`);
            return response.data;
        } catch (error: any) {
            throw this.handleError(error);
        }
    },

    // Get all registrations
    async getAllRegistrations(): Promise<ApiResponse<PaginatedResponse<ServerRegistration>>> {
        try {
            const response = await this.axiosInstance.get('/common/registration/all');
            return response.data;
        } catch (error: any) {
            throw this.handleError(error);
        }
    },

    // Get registration by ID
    async getRegistrationById(id: number): Promise<ApiResponse<Registration>> {
        try {
            const response = await this.axiosInstance.get(`/common/registration/${id}`);
            return response.data;
        } catch (error: any) {
            throw this.handleError(error);
        }
    },

    // Create new registration
    async createRegistration(data: CreateRegistrationRequest): Promise<ApiResponse<Registration>> {
        try {
            const response = await this.axiosInstance.post('/common/registration/create', data);
            return response.data;
        } catch (error: any) {
            throw this.handleError(error);
        }
    },

    // Add new method for updating registration
    async updateRegistration(id: number, data: Partial<CreateRegistrationRequest>): Promise<ApiResponse<Registration>> {
        try {
            // Log the request for debugging
            // console.log('Updating registration:', {
            //     id,
            //     data
            // });
            
            const response = await this.axiosInstance.put(`/common/registration/${id}`, data);
            return response.data;
        } catch (error: any) {
            console.error('Update registration error:', error);
            throw this.handleError(error);
        }
    },
    
    async approveRegistration(id: number, data: Partial<CreateRegistrationRequest>): Promise<ApiResponse<Registration>> {
        try {
            const response = await this.axiosInstance.put(`/common/registration/approve/${id}`, data);
            return response.data;
        } catch (error: any) {
            throw this.handleError(error);
        }
    },

    // Delete registration by ID
    async deleteRegistration(id: number): Promise<ApiResponse<void>> {
        try {
            const response = await this.axiosInstance.delete(`/common/registration/${id}`);
            return response.data;
        } catch (error: any) {
            throw this.handleError(error);
        }
    },

    // Add new method for getting registrations by executive ID
    async getRegistrationsByExecutive(executiveId: string): Promise<ApiResponse<Registration[]>> {
        try {
            const response = await this.axiosInstance.get(`/executive/registrations/${executiveId}`);
            return response.data;
        } catch (error: any) {
            throw this.handleError(error);
        }
    },

    async getAssignedRegistrations(executiveId: string): Promise<ApiResponse<AssignedRegistration[]>> {
        try {
            const response = await this.axiosInstance.get(`/editor/assigned-registrations/${executiveId}`);
            return response.data;
        } catch (error: any) {
            console.error('Error fetching assigned registrations:', error);
            throw this.handleError(error);
        }
    },

    // Department management methods
    async getAllDepartments(): Promise<ApiResponse<Department[]>> {
        return this.axiosInstance.get('/common/departments/all')
                .then(response => response.data);
    },

    async createDepartment(data: CreateDepartmentRequest): Promise<ApiResponse<Department>> {
        try {
            const response = await this.axiosInstance.post('/common/departments/create', data);
            return response.data;
        } catch (error: any) {
            throw this.handleError(error);
        }
    },

    async updateDepartment(id: number, data: CreateDepartmentRequest): Promise<ApiResponse<Department>> {
        try {
            const response = await this.axiosInstance.put(`/common/departments/${id}`, data);
            return response.data;
        } catch (error: any) {
            throw this.handleError(error);
        }
    },

    async deleteDepartment(id: number): Promise<ApiResponse<void>> {
        try {
            const response = await this.axiosInstance.delete(`/common/departments/${id}`);
            return response.data;
        } catch (error: any) {
            throw this.handleError(error);
        }
    },
    
    async updateProspectus(id: number, data: Partial<ProspectusCreateRequest>): Promise<ApiResponse<Prospectus>> {
        try {
            const response = await this.axiosInstance.put(`/executive/prospectus/${id}`, data);
            return response.data;
        } catch (error: any) {
            throw this.handleError(error);
        }
    },

    // Add new method for getting all roles
    async getAllRoles(): Promise<ApiResponse<Role[]>> {
        try {
            const response = await this.axiosInstance.get('/superadmin/roles/all');
            return response.data;
        } catch (error: any) {
            throw this.handleError(error);
        }
    },

    async createRole(data: CreateRoleRequest): Promise<ApiResponse<Role>> {
        try {
            const response = await this.axiosInstance.post('/superadmin/roles/create', data);
            return response.data;
        } catch (error: any) {
            throw this.handleError(error);
        }
    },

    async updateRole(id: number, data: CreateRoleRequest): Promise<ApiResponse<Role>> {
        try {
            const response = await this.axiosInstance.put(`/superadmin/roles/${id}`, data);
            return response.data;
        } catch (error: any) {
            throw this.handleError(error);
        }
    },

    async deleteRole(id: number): Promise<ApiResponse<void>> {
        try {
            const response = await this.axiosInstance.delete(`/superadmin/roles/${id}`);
            return response.data;
        } catch (error: any) {
            throw this.handleError(error);
        }
    },

    // Add new method for getting all transactions
    async getAllTransactions(): Promise<ApiResponse<Transaction[]>> {
        try {
            const response = await this.axiosInstance.get('/common/transactions/all');
            return response.data;
        } catch (error: any) {
            throw this.handleError(error);
        }
    },

    // Add new method for getting all journal data
    async getAllJournalData(): Promise<ApiResponse<JournalData[]>> {
      try {
        // Remove caching, make direct request
        const response = await this.axiosInstance.get('/editor/journal-data/all');
        return response.data;
      } catch (error: any) {
        console.error('Error fetching journal data:', error);
        throw this.handleError(error);
      }
    },

    async getJournalById(id: number): Promise<ApiResponse<JournalData>> {
        try {
                        const response = await this.axiosInstance.get(                `/editor/journal-data/${id}`            );
            return response.data;
        } catch (error: any) {
            console.error('Error fetching journal data:', error);
            throw this.handleError(error);
        }
    },

    async updateJournal(id: number, data: UpdateJournalRequest): Promise<ApiResponse<JournalData>> {
        try {
            // console.log('Updating journal:', data);
            const response = await this.axiosInstance.put(`/editor/journal-data/${id}`, data);
            return response.data;
        } catch (error: any) {
            console.error('Error updating journal:', error);
            throw this.handleError(error);
        }
    },

    async deleteJournal(id: number): Promise<ApiResponse<void>> {
        try {
            const response = await this.axiosInstance.delete(`/editor/journal-data/${id}`);
            return response.data;
        } catch (error: any) {
            console.error('Error deleting journal:', error);
            throw this.handleError(error);
        }
    },

    async triggerStatusUpload(journalId: number): Promise<ApiResponse<TriggerStatusUploadResponse>> {
        try {
            const response = await this.axiosInstance.post('/editor/trigger-status-upload', {
                journalId: journalId
            });
            console.log('Trigger status upload response:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Error triggering status upload:', error);
            throw this.handleError(error);
        }
    },

    // Add new method for fetching editors
    async getAllEditors(): Promise<ApiResponse<Editor[]>> {
        try {
            console.log('Fetching all editors');
            const response = await this.axiosInstance.get('/executive/editors/all'); // Changed from /editor/editors/all
            console.log('Editors response:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Error in getAllEditors:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                config: error.config,
                stack: error.stack
            });
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

    setStoredAuth(token: string, user: any, role: 'editor' | 'executive' | 'supAdmin') {
        const finalToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
        localStorage.setItem(TOKEN_KEY, finalToken);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        localStorage.setItem(USER_ROLE_KEY, role);
        localStorage.setItem(LOGIN_STATUS_KEY, 'true');
        
        // Dispatch a custom event for login
        window.dispatchEvent(new Event('auth-change'));
    },

    clearStoredAuth() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(USER_ROLE_KEY);
        localStorage.removeItem(LOGIN_STATUS_KEY);
        
        // Dispatch a custom event for logout
        window.dispatchEvent(new Event('auth-change'));
    },

    handleError(error: any) {
        console.error('API Error Details:', {
            message: error.message,
            response: {
                data: error.response?.data,
                status: error.response?.status,
                headers: error.response?.headers
            },
            request: {
                url: error.config?.url,
                method: error.config?.method,
                headers: error.config?.headers
            }
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

export type { 
    Service, 
    CreateServiceRequest, 
    UpdateServiceRequest,
    Executive, 
    BankAccount, 
    Registration, 
    CreateRegistrationRequest,
    TransactionInfo,
    Department,
    CreateDepartmentRequest,
    Role,
    CreateRoleRequest,
    Prospectus,  // Add this export
    ServerRegistration,
    Transaction,
    ExecutiveWithRoleName,
    BankAccountRequest,
    JournalData,
    UpdateJournalRequest,
    Editor,  // Add this export
    AssignedRegistration
};
export default api;
