import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const TOKEN_KEY = process.env.NEXT_PUBLIC_TOKEN_KEY || 'token' ;
const USER_KEY = process.env.NEXT_PUBLIC_USER_KEY || 'user';
const LOGIN_STATUS_KEY = process.env.NEXT_PUBLIC_LOGIN_STATUS_KEY || 'isLoggedIn';
const USER_ROLE_KEY = process.env.NEXT_PUBLIC_USER_ROLE_KEY || 'userRole';
// Types
interface LoginCredentials {
    username: string;
    password: string;
}

interface ExecutiveLoginResponse {
    success: boolean;
    token: string;
    entities: {
        id: string;
        username: string;
        email: string;
        entity_type: 'Editor' | 'Executive' | 'Leads' | 'clients'; // Add new entity types
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

interface AdminLoginResponse {
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
    entity_id: string; // Changed from executive_id
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
    isregistered:boolean;
    entities?: {
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
    message:string;
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
        entity_type:string;
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
    entity_id: string;
}

interface CreateDepartmentRequest {
    name: string;
    entity_id?: string;
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
  status: 'pending' | 'registered' | 'waiting for approval';
  month: number;
  year: number;
  created_at: string;
  transaction_id: number;  // Added
  notes?: string;
  client_id:string;
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
    entity_id: string;
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

// Update the CreateRegistrationRequest interface
interface CreateRegistrationRequest {
  // Transaction details
  transaction_type: TransactionInfo['transaction_type'];
  transaction_id: string;
  amount: number;
  transaction_date: string;
  additional_info: Record<string, any>;
  

  entity_id: string; 
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
  status: 'registered' | 'pending'  | 'waiting for approval';  // Explicitly define literal types
  month: number;
  year: number;
  assigned_to?: string;  // Add this field
  registered_by: string;
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
  status: 'pending' | 'registered' | 'waiting for approval';
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

// Update the Role interface to match the new response format
interface Role {
    id: number;
    name: string;
    description: string;
    permissions: {
        id: number;
        name?: string;
        description?: string;
        entity_type?: string;
    }[];
    entity_type: string;
    created_at: string;
    updated_at: string;
}

// Add these new interfaces
interface Permission {
  id: number;
  name: string;
  description: string;
  entity_type:string;
}

// Update the CreateRoleRequest interface
interface CreateRoleRequest {
  name: string;
  description: string;
  permissions: number[];  // Changed from object to array of permission IDs
  entity_type: string;
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
  assigned_to: string;
  status: 'pending' | 'registered';
  month: number;
  year: number;
  created_at: string;
  prospectus: {
    id: number;
    reg_id: string;
    client_name: string;
    entities:{
        id:string;
        username:string;
        email:string;
    };
  };
  assigned_username:string;
  bank_account: {
    bank: string;
    account_number: string;
  };
  transaction: {
    id: number;
    amount: number;
    entity_id: string; 
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
  entity_id: string;
  entities: { 
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
  entities: {
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

// Add new interface for journal creation
interface CreateJournalRequest {
    prospectus_id: number;
    client_name: string;
    requirement: string;
    personal_email: string;
    assigned_to: string;
    journal_name: string;
    status: string;
    journal_link: string;
    username: string;
    password: string;
    orcid_username1: string;
    password1: string;
    paper_title: string;
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
  author_status:string;
  prospectus: {
    id: number;
    email: string;
    reg_id: string;
    client_name: string;
    requirement: string;
    phone:string;
    department:string;
    tech_person:string;
    state:string;
    entity: {
      id: string;
      email: string;
      username: string;
    };
  };
}

// Add new interface for prospectus assist data
interface ProspectusAssistData {
    personal_email: string;
    client_name: string;
    requirement: string;
}

// Add new interfaces for dashboard
interface DashboardStats {
    total_journals: number;
    published_count: number;
    pending_count: number;
    under_review_count: number;
    approved_count: number;
    rejected_count: number;
    total_assigned: number;
}

interface ActivityItem {
    id: number;
    journal_id: number;
    journal_name: string;
    client_name: string;
    action: 'created' | 'updated' | 'status_changed';
    old_status?: string;
    new_status?: string;
    timestamp: string;
}

interface ProspectusResponse {
  data: Prospectus[];
  total: number;
  page: number;
  per_page: number;
}

// Add new interfaces for leads
interface Lead {
  id: number;
  lead_source: string;
  client_name: string;
  phone_number: string;
  country: string;
  domain:string;
  state: string;
  requirement: string;
  detailed_requirement?: string;
  remarks?: string;
  date: string;
  followup_date: string;
  created_at: string;
  updated_at: string;
  status?: string;
  prospectus_type:string;
  assigned_to?: string;
  entity_id?: string;
  research_area?: string;
  title?: string;
  degree?: string;
  university?: string;
  attended?: boolean;
  followup_status?: string;
}

interface CreateLeadRequest {
  lead_source: string;
  client_name: string;
  phone_number: string; // Changed from contact_number
  country: string;
  state: string;
  domain: string; // Changed from main_subject
  requirement: string; // Changed from requirements
  detailed_requirement?: string;
  remarks?: string; // Changed from customer_remarks
  followup_date?: string;
  prospectus_type?: string;
  assigned_to?: string; 
  created_by?: string; // Added to match schema
  followup_status?: string; // Changed from boolean to string
  attended?: boolean; // Added to match schema
  // Fields for form handling only (not sent to API)
  other_source?: string;
  other_domain?: string;
  other_service?: string;
}

interface UpdateLeadRequest {
  lead_source?: string;
  client_name?: string;
  phone_number?: string;
  country?: string;
  prospectus_type?:string;
  state?: string;
  domain?: string;
  requirement?: string;
  detailed_requirement?: string;
  remarks?: string;
  followup_date?: string;
  status?: string;
  assigned_to?: string;
  followup_status?:string;
}

interface TodayFollowupResponse {
  data: Lead[];
  count: number;
  today: string;
}

// Add this new interface for the lead approval request
interface ApproveLeadRequest {
  leads_id: number;
  client_name: string;
  phone: string;
  email: string;
  state: string;
  country: string;
  requirement: string;
  assigned_to: string;
  reg_id: string;
  tech_person: string;
  proposed_service_period: string;
  services: string;
  notes: string;
}

// Add new interface for client creation
interface CreateClientRequest {
  prospectus_id: number;
  email: string;
  password: string | null;
}

// Update the interface to match the actual response
interface CreateClientResponse {
  id: string;
  prospectus_id: number;
  email: string;
  created_at: string;
  updated_at: string;
}

// Add new interface for client login
interface ClientLoginRequest {
  email: string;
  password: string;
}

// Update the ClientLoginResponse interface to match the actual response structure
interface ClientLoginResponse {
  success: boolean;
  token: string;
  data: {
    id: string;
    email: string;
    prospectus_id?: number;
    created_at: string;
    updated_at: string;
    prospectus?: {
      id: number;
      email: string;
      phone: string;
      client_name: string;
    };
  };
  timestamp: string;
}

// Update the interface name and structure
interface ClientPendingRegistrationResponse {
  success: boolean;
  data: Registration[];
  count: number;
  timestamp: string;
}

// Add new interfaces for author tasks
interface AuthorTask {
  id: number;
  title: string;
  description: string;
  journal_name: string;
  client_name: string;
  assigned_date: string;
  deadline: string;
  status: 'pending' | 'in_progress' | 'under_review' | 'completed';
  completion_percentage: number;
  document_url?: string;
  paper_requirements?: string;
  research_area?: string;
  word_count?: number;
  review_comments?: string[];
  last_updated: string;
}

interface AuthorTaskUpdateRequest {
  status?: 'pending' | 'in_progress' | 'under_review' | 'completed';
  completion_percentage?: number;
  document_url?: string;
  review_comments?: string[];
}

interface AuthorStats {
  assigned_count: number;
  in_progress_count: number;
  completed_count: number;
  under_review_count: number;
  tasks_this_week: number;
  tasks_past_due: number;
}

// Add new interface for pending registration response
interface PendingRegistrationResponse {
  registration: {
    id: number;
    date: string;
    services: string;
    initialAmount: number;
    acceptedAmount: number;
    discount: number;
    totalAmount: number;
    acceptPeriod: string;
    pubPeriod: string;
    status: string;
    month: number;
    year: number;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
    adminAssigned: boolean;
  };
  prospectus: {
    id: number;
    regId: string;
    clientName: string;
    email: string;
    phone: string;
    department: string;
    state: string;
    techPerson: string;
    requirement: string;
    services: string;
    proposedServicePeriod: string;
    notes: string;
    nextFollowUp: string;
    createdBy: {
      id: string;
      username: string;
      email: string;
    };
  };
  leads: {
    id: number;
    date: string;
    leadSource: string;
    clientName: string;
    phoneNumber: string;
    domain: string;
    researchArea: string | null;
    title: string | null;
    degree: string | null;
    university: string | null;
    state: string;
    country: string;
    requirement: string;
    detailedRequirement: string;
    prospectusType: string;
    followupDate: string;
    remarks: string;
    followupStatus: string;
    createdAt: string;
    updatedAt: string;
  };
  registeredBy: {
    id: string;
    username: string;
    email: string;
  };
  bankDetails: {
    id: string;
    bank: string;
    branch: string;
    upi_id: string;
    ifsc_code: string;
    created_at: string;
    updated_at: string;
    account_name: string;
    account_type: string;
    account_number: string;
    account_holder_name: string;
  };
  transactionDetails: {
    id: number;
    amount: number;
    entity_id: string;
    updated_at: string;
    transaction_id: string;
    additional_info: Record<string, any>;
    transaction_date: string;
    transaction_type: string;
  };
}

interface PendingRegistrationsResponse {
  success: boolean;
  data: PendingRegistrationResponse[];
  count: number;
  timestamp: string;
}

// Add new interfaces for client payment
interface ClientPaymentRequest {
  quotation_id: number;
  name: string;
  amount: number;
  notes?: string;
  transaction_date: string;
  entity_id: string;
}

// Add new interfaces for profile update
interface UpdateProfileRequest {
  username?: string;
  email?: string;
}

interface VerifyPasswordRequest {
  entityId: string;
  password: string;
}

interface ChangePasswordRequest {
  newPassword: string;
}

const PUBLIC_ENDPOINTS = [
    '/entity/login',     // Add the new entity login endpoint
    '/entity/create',    // Add entity creation endpoint
    '/admin/login',
    '/clients/login',
    '/entity/verify-password' // Add this to public endpoints to prevent auto-logout
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
                // Check if the endpoint is public before requiring authentication
                const isPublicEndpoint = PUBLIC_ENDPOINTS.some(
                    endpoint => config.url?.includes(endpoint)
                );

                if (isPublicEndpoint) {
                    // For verify-password, we still need to add the auth token
                    if (config.url?.includes('/entity/verify-password')) {
                        const token = this.getStoredToken();
                        if (token) {
                            const finalToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
                            config.headers.Authorization = finalToken;
                        }
                    }
                    return config; // Allow public endpoints without auth requirement
                }

                const token = this.getStoredToken();
                const isLoggedIn = localStorage.getItem(LOGIN_STATUS_KEY);
                
                if (!token || isLoggedIn !== 'true') {
                    return Promise.reject(new Error('Not authenticated'));
                }

                const finalToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
                config.headers.Authorization = finalToken;
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        this.axiosInstance.interceptors.response.use(
            (response) => response,
            (error) => {
                // Ignore 401 errors from verify-password endpoint
                if (error?.config?.url?.includes('/entity/verify-password')) {
                    return Promise.reject(error);
                }
                
                // Only handle auth errors for non-public endpoints
                if (error?.response?.status === 401 && 
                    !PUBLIC_ENDPOINTS.some(endpoint => error.config?.url?.includes(endpoint))) {
                    const userRole = localStorage.getItem(USER_ROLE_KEY) || 'executive';
                    const path = window.location.pathname;
                    
                    if (!path.includes('/login')) {
                        this.clearStoredAuth();
                        window.location.href = userRole === 'admin' 
                            ? '/admin/login' 
                            : '/business/executive/login';
                    }
                }
                return Promise.reject(error);
            }
        );
    },

    async loginExecutive(credentials: LoginCredentials): Promise<ExecutiveLoginResponse> {
        try {
            const response = await this.axiosInstance.post('/entity/login', credentials);
            
            // Extract the entity type from the response for role-based redirection
            const entityType = response.data.entities?.entity_type;
            let role = 'executive'; // Default role
            
            // Map entity types to roles
            switch(entityType?.toLowerCase()) {
                case 'editor':
                    role = 'editor';
                    break;
                case 'executive':
                    role = 'executive';
                    break;
                case 'leads':
                    role = 'leads';
                    break;
                case 'clients':
                    role = 'clients';
                    break;
                default:
                    role = 'executive'; // Fallback
            }
            
            // Store the role in local storage for later use
            localStorage.setItem(USER_ROLE_KEY, role);
            
            return response.data;
        } catch (error: any) {
            throw error;
        }
    },

    async loginAdmin(credentials: LoginCredentials): Promise<AdminLoginResponse> {
        try {
            const response = await this.axiosInstance.post('/admin/login', credentials);
            
            // The server now returns role details in the admin response
            localStorage.setItem(USER_ROLE_KEY, 'admin');
            
            return response.data;
        } catch (error: any) {
            // Don't transform the error, let the component handle it
            throw error;
        }
    },

    async createProspectus(data: ProspectusCreateRequest): Promise<Prospectus> {
        try {
            const response = await this.axiosInstance.post('/entity/prospectus/create', data);
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

    async getAllProspectus(page: number = 1, per_page: number = 10): Promise<ApiResponse<ProspectusResponse>> {
        try {
            const response = await this.axiosInstance.get('/entity/prospectus/all', {
                params: { page, per_page }
            });
            return response.data;
        } catch (error: any) {
            throw this.handleError(error);
        }
    },

    async createExecutive(data: CreateExecutiveRequest) {
        try {
            const response = await this.axiosInstance.post('/entity/create', data);
            return response.data;
        } catch (error: any) {
            console.error('API Error:', error.response || error);
            throw error;
        }
    },

    // Get prospects by executive's clientId
    async getProspectusByClientId(clientId: string): Promise<ApiResponse<Prospectus[]>> {
        try {
            const response = await this.axiosInstance.get(`/entity/prospectus/${clientId}`);
            return response.data;
        } catch (error: any) {
            throw this.handleError(error);
        }
    },

    // Get single prospect by registration ID
    async getProspectusByRegId(regId: string): Promise<ApiResponse<Prospectus>> {
        try {
            const response = await this.axiosInstance.get(`/entity/prospectus/register/${regId}`);
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
            
            if (!data.client_id) {
              console.error("Missing client_id in registration data!");
            }
            
            // Don't spread data - explicitly construct the object to ensure all fields are included
            const requestData = {
              transaction_type: data.transaction_type,
              transaction_id: data.transaction_id,
              amount: data.amount,
              transaction_date: data.transaction_date,
              additional_info: data.additional_info,
              entity_id: data.entity_id,
              client_id: data.client_id, // Ensure client_id is explicitly included
              registered_by: data.registered_by,
              prospectus_id: data.prospectus_id,
              services: data.services,
              init_amount: data.init_amount,
              accept_amount: data.accept_amount,
              discount: data.discount,
              total_amount: data.total_amount,
              accept_period: data.accept_period,
              pub_period: data.pub_period,
              bank_id: data.bank_id,
              status: data.status,
              month: data.month,
              year: data.year,
              assigned_to: data.assigned_to
            };
            
            const response = await this.axiosInstance.post('/common/registration/create', requestData);
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
            const response = await this.axiosInstance.get(`/entity/registrations/${executiveId}`);
            return response.data;
        } catch (error: any) {
            throw this.handleError(error);
        }
    },

    async getAssignedRegistrations(entityId: string): Promise<ApiResponse<AssignedRegistration[]>> {
        try {
            const response = await this.axiosInstance.get(`/editor/assigned-registrations/${entityId}`);
            return response.data;
        } catch (error: any) {
            console.error('Error fetching assigned registrations:', error);
            throw this.handleError(error);
        }
    },
    
    async getAssignedRegistrationsAuthor(entityId: string): Promise<ApiResponse<AssignedRegistration[]>> {
        try {
            const response = await this.axiosInstance.get(`/authors/assigned-registrations/${entityId}`);
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
            const response = await this.axiosInstance.post('/common/departments/create', {
                ...data,
                entity_id: data.entity_id // Ensure this field is included
            });
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
            const response = await this.axiosInstance.put(`/entity/prospectus/${id}`, data);
            return response.data;
        } catch (error: any) {
            throw this.handleError(error);
        }
    },

    // Add new method for getting all roles
    async getAllRoles(): Promise<ApiResponse<Role[]>> {
        try {
            const response = await this.axiosInstance.get('/admin/roles/all');
            return response.data;
        } catch (error: any) {
            throw this.handleError(error);
        }
    },

    async getPermissionsByEntityType(entityType:string): Promise<ApiResponse<Permission[]>> {
        try {
            const response = await this.axiosInstance.get(`/admin/permissions/entity-type/${entityType}`);
            return response.data;
        } catch (error: any) {
            throw this.handleError(error);
        }
    },

    async createRole(data: CreateRoleRequest): Promise<ApiResponse<Role>> {
        try {
            const response = await this.axiosInstance.post('/admin/roles/create', data);
            return response.data;
        } catch (error: any) {
            throw this.handleError(error);
        }
    },

    async updateRole(id: number, data: CreateRoleRequest): Promise<ApiResponse<Role>> {
        try {
            const response = await this.axiosInstance.put(`/admin/roles/${id}`, data);
            return response.data;
        } catch (error: any) {
            throw this.handleError(error);
        }
    },

    async deleteRole(id: number): Promise<ApiResponse<void>> {
        try {
            const response = await this.axiosInstance.delete(`/admin/roles/${id}`);
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
            const response = await this.axiosInstance.get(`/editor/journal-data/${id}`);
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

    // Add new method for creating journal data
    async createJournalData(data: CreateJournalRequest): Promise<ApiResponse<JournalData>> {
        try {
            const response = await this.axiosInstance.post('/editor/journal-data/create', data);
            return response.data;
        } catch (error: any) {
            throw this.handleError(error);
        }
    },

    // Add new method for getting executives
    async getAllEntities(): Promise<ApiResponse<ExecutiveWithRoleName[]>> {
        try {
            // Try one of these endpoints based on your backend structure:
            const response = await this.axiosInstance.get('/entity/all');
            
            return response.data;
        } catch (error: any) {
            console.error('API getAllExecutives error:', error);
            throw this.handleError(error);
        }
    },

    // Add new method for fetching editors
    async getAllEditors(): Promise<ApiResponse<Editor[]>> {
        try {
            
            const response = await this.axiosInstance.get('/entity/editors/all');
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
    // Add new method for fetching editors
    async getAllAuthors(): Promise<ApiResponse<Editor[]>> {
        try {
            
            const response = await this.axiosInstance.get('/entity/author/all');
            return response.data;
        } catch (error: any) {
            console.error('Error in getAllAuthors:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                config: error.config,
                stack: error.stack
            });
            throw this.handleError(error);
        }
    },

    async getAllEditorsAndAuthors(): Promise<ApiResponse<Editor[]>> {
        try {
            
            const response = await this.axiosInstance.get('/entity/editors-authors/all');
            return response.data;
        } catch (error: any) {
            console.error('Error in getAllEditorsAndAuthors:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                config: error.config,
                stack: error.stack
            });
            throw this.handleError(error);
        }
    },

    // Add new method for fetching editors
    async getAllExecutives(): Promise<ApiResponse<Editor[]>> {
        try {
            console.log('Fetching all executives');
            const response = await this.axiosInstance.get('/entity/exec/all');
            return response.data;
        } catch (error: any) {
            console.error('Error in getAllExecutives:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                config: error.config,
                stack: error.stack
            });
            throw this.handleError(error);
        }
    },

    // Add new method to get prospectus assist data
    async getProspectusAssistData(prospectusId: number): Promise<ApiResponse<ProspectusAssistData>> {
        try {
            const response = await this.axiosInstance.get(`/editor/prospectus-assist/${prospectusId}`);
            return response.data;
        } catch (error: any) {
            throw this.handleError(error);
        }
    },
    // Leads endpoints
    async getAllLeads(): Promise<ApiResponse<Lead[]>> {
        try {
            const response = await this.axiosInstance.get('/leads');
            return response.data;
        } catch (error: any) {
            throw this.handleError(error);
        }
    },
    
    async getAllUnapprovedLeads(): Promise<ApiResponse<Lead[]>> {
        try {
            const response = await this.axiosInstance.get('/leads/unapproved');
            return response.data;
        } catch (error: any) {
            throw this.handleError(error);
        }
    },

    async getLeadById(id: number): Promise<ApiResponse<Lead>> {
        try {
            const response = await this.axiosInstance.get(`/leads/${id}`);
            return response.data;
        } catch (error: any) {
            throw this.handleError(error);
        }
    },

    async getLeadsBySource(source: string): Promise<ApiResponse<Lead[]>> {
        try {
            const response = await this.axiosInstance.get(`/leads/source/${source}`);
            return response.data;
        } catch (error: any) {
            throw this.handleError(error);
        }
    },

    async createLead(data: CreateLeadRequest): Promise<ApiResponse<Lead>> {
        try {
            const response = await this.axiosInstance.post('/leads', data);
            return response.data;
        } catch (error: any) {
            throw this.handleError(error);
        }
    },

    async updateLead(id: number, data: UpdateLeadRequest): Promise<ApiResponse<Lead>> {
        try {
            const response = await this.axiosInstance.put(`/leads/${id}`, data);
            return response.data;
        } catch (error: any) {
            throw this.handleError(error);
        }
    },

    // Add new method for updating lead status
    async updateLeadStatus(id: number, data: UpdateLeadRequest): Promise<ApiResponse<Lead>> {
        try {
            const response = await this.axiosInstance.put(`/leads/${id}/status`, data);
            return response.data;
        } catch (error: any) {
            throw this.handleError(error);
        }
    },

    async deleteLead(id: number): Promise<ApiResponse<void>> {
        try {
            const response = await this.axiosInstance.delete(`/leads/${id}`);
            return response.data;
        } catch (error: any) {
            throw this.handleError(error);
        }
    },

    // Add new method for approving lead as prospect
    async approveLeadAsProspect(id: number, data: ApproveLeadRequest): Promise<ApiResponse<any>> {
        try {
            const response = await this.axiosInstance.post(`/leads/${id}/approve`, data);
            return response.data;
        } catch (error: any) {
            throw this.handleError(error);
        }
    },

    // Add new function to get today's follow-up leads
    async getTodayFollowupLeads(): Promise<ApiResponse<Lead[]>> {
        try {
            const response = await this.axiosInstance.get('/leads/today-followup');
            // Return the response data directly, which contains the nested data structure
            return response.data;
        } catch (error: any) {
            console.error('Error fetching today followups:', error);
            throw this.handleError(error);
        }
    },

    // Update the createClient method to handle null passwords
    async createClient(data: CreateClientRequest): Promise<ApiResponse<any>> {
        try {
            const response = await this.axiosInstance.post('/clients', data);
            
            return {
                success: true,
                data: response.data, // Keep the original nested structure
                timestamp: new Date().toISOString(),
                message: "Client created successfully"
            };
        } catch (error: any) {
            console.error('Error creating client:', error);
            throw this.handleError(error);
        }
    },

    // Add client login method
    async clientLogin(email: string, password: string): Promise<ClientLoginResponse> {
        try {
            const response = await this.axiosInstance.post('/clients/login', {
                email,
                password
            });
            
            // Store client role
            if (response.data && response.data.token) {
                localStorage.setItem(USER_ROLE_KEY, 'clients');
            }
            
            return response.data;
        } catch (error: any) {
            console.error('Client login error:', error);
            throw this.handleError(error);
        }
    },

    // Add new method to check if client exists by email
    async getClientByEmail(email: string): Promise<ApiResponse<any>> {
        try {
            const response = await this.axiosInstance.get(`/clients/email/${email}`);
            return response.data;
        } catch (error: any) {
            console.error('Error checking client by email:', error);
            throw this.handleError(error);
        }
    },

    // Add new method to get client pending prospectus
    async getClientPendingRegistration(clientId: string): Promise<ClientPendingRegistrationResponse> {
        try {
            const response = await this.axiosInstance.get(`/clients/${clientId}/registration/pending`);
            return response.data;
        } catch (error: any) {
            console.error('Error fetching client pending registrations:', error);
            throw this.handleError(error);
        }
    },

    // Mock data functions for author tasks while the backend is developed
    // Author-related mock functions
    async getAuthorStats(): Promise<ApiResponse<AuthorStats>> {
        // Mock data for now
        const mockStats = {
          assigned_count: 8,
          in_progress_count: 3,
          completed_count: 12,
          under_review_count: 2,
          tasks_this_week: 4,
          tasks_past_due: 1,
        };
        
        return {
          success: true,
          data: mockStats,
          timestamp: new Date().toISOString(),
          message: "Author stats retrieved successfully"
        };
      },
      
      async getAuthorTasks(): Promise<ApiResponse<AuthorTask[]>> {
        // Mock data for now
        const mockTasks = [
          {
            id: 1,
            title: "Smart City Infrastructure Paper",
            description: "Research and write a paper on smart city infrastructure implementation challenges and solutions.",
            journal_name: "Journal of Urban Technology",
            client_name: "Smart Cities Inc.",
            assigned_date: "2023-10-15",
            deadline: "2023-11-15",
            status: "in_progress" as const,
            completion_percentage: 65,
            paper_requirements: "5000-7000 words, APA format, at least 25 citations from reputable sources",
            research_area: "Urban Technology",
            word_count: 6500,
            last_updated: "2023-11-01",
          },
          {
            id: 2,
            title: "Quantum Computing Applications in Healthcare",
            description: "Write a comprehensive review of quantum computing applications in healthcare and diagnostics.",
            journal_name: "Digital Health Research",
            client_name: "QuantumHealth Research",
            assigned_date: "2023-10-20",
            deadline: "2023-11-30",
            status: "pending" as const,
            completion_percentage: 0,
            paper_requirements: "Academic review, 10,000+ words with extensive citations",
            research_area: "Quantum Computing, Healthcare",
            last_updated: "2023-10-20",
          },
          {
            id: 3,
            title: "Sustainable Energy Systems",
            description: "Create a research paper on innovative sustainable energy systems for developing countries.",
            journal_name: "Renewable Energy Research",
            client_name: "GreenEnergy Foundation",
            assigned_date: "2023-09-05",
            deadline: "2023-10-20",
            status: "completed" as const,
            completion_percentage: 100,
            document_url: "https://example.com/documents/sustainable-energy-paper-final.pdf",
            paper_requirements: "Case study approach, focus on practical implementations",
            research_area: "Renewable Energy",
            word_count: 8200,
            last_updated: "2023-10-18",
          },
          {
            id: 4,
            title: "Blockchain in Financial Inclusion",
            description: "Research on blockchain technology applications for financial inclusion in underbanked populations.",
            journal_name: "Financial Technology Review",
            client_name: "Global Finance Initiative",
            assigned_date: "2023-10-25",
            deadline: "2023-12-10",
            status: "under_review" as const,
            completion_percentage: 90,
            document_url: "https://example.com/documents/blockchain-finance-draft.pdf",
            paper_requirements: "Focus on case studies from Southeast Asia and Africa",
            research_area: "Blockchain, Financial Technology",
            word_count: 7800,
            review_comments: ["Please expand section 3.2 with more examples", "Add recent regulations from 2023"],
            last_updated: "2023-11-05",
          },
          {
            id: 5,
            title: "AI Ethics in Automated Decision Systems",
            description: "Critical analysis of ethical considerations in AI-powered automated decision systems.",
            journal_name: "AI and Society",
            client_name: "Ethics in Technology Institute",
            assigned_date: "2023-11-01",
            deadline: "2023-12-20",
            status: "pending" as const,
            completion_percentage: 0,
            paper_requirements: "Interdisciplinary approach, combining technical and philosophical perspectives",
            research_area: "AI Ethics",
            last_updated: "2023-11-01",
          }
        ];
        
        return {
          success: true,
          data: mockTasks,
          timestamp: new Date().toISOString(),
          message: "Tasks retrieved successfully"
        };
      },
      
      async getTaskById(id: number): Promise<ApiResponse<AuthorTask>> {
        // Mock implementation
        const allTasks = await this.getAuthorTasks();
        const task = allTasks.data.find(t => t.id === id);
        
        if (!task) {
          throw new Error(`Task with ID ${id} not found`);
        }
        
        return {
          success: true,
          data: task,
          timestamp: new Date().toISOString(),
          message:"Task retrieved successfully"
        };
      },
      
      async updateTask(id: number, data: AuthorTaskUpdateRequest): Promise<ApiResponse<AuthorTask>> {
        // Mock implementation - would normally send to backend
        console.log(`Updating task ${id} with data:`, data);
        
        // For mock purposes, we'll pretend the update was successful and return the task
        const taskResponse = await this.getTaskById(id);
        const updatedTask = {
          ...taskResponse.data,
          ...data,
          last_updated: new Date().toISOString()
        };
        
        return {
          success: true,
          data: updatedTask,
          timestamp: new Date().toISOString(),
          message: "Task updated successfully"
        };
      },

    // Add new method for fetching pending registrations
    async getPendingRegistrations(): Promise<PendingRegistrationsResponse> {
        try {
            const response = await this.axiosInstance.get('/admin/registrations/pending');
            return response.data;
        } catch (error: any) {
            console.error('Error fetching pending registrations:', error);
            throw this.handleError(error);
        }
    },

    // Add method to approve/assign a registration
    async assignRegistration(registrationId: number, editorId: string): Promise<ApiResponse<Registration>> {
        try {
            const response = await this.axiosInstance.put(`/admin/registrations/${registrationId}/assign`, {
                assigned_to: editorId
            });
            return response.data;
        } catch (error: any) {
            console.error('Error assigning registration:', error);
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

    setStoredAuth(token: string, user: any, role: 'editor' | 'executive' | 'admin' | 'leads' | 'clients' | 'author') {
        if (!token || !role) {
            throw new Error('Invalid auth data: missing token or role');
        }

        const finalToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
        localStorage.setItem(TOKEN_KEY, finalToken);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        localStorage.setItem(USER_ROLE_KEY, role);
        localStorage.setItem(LOGIN_STATUS_KEY, 'true');
        
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

    /**
     * Get stored authentication data including user and token
     * @returns Object containing token and user data
     */
    getStoredAuth() {
      if (typeof window === 'undefined') return null;
      
      try {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        
        if (!token || !userStr) return null;
        
        const user = JSON.parse(userStr);
        
        return {
          token,
          user
        };
      } catch (error) {
        console.error('Error retrieving stored auth data:', error);
        return null;
      }
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
    },

    // Add new method to get journal data by editor ID
    async getJournalDataByEditor(editorId: string): Promise<ApiResponse<JournalData[]>> {
        try {
            const response = await this.axiosInstance.get(`/editor/journal-data/editor/${editorId}`);
            return response.data;
        } catch (error: any) {
            console.error('Error fetching journal data by editor:', error);
            throw this.handleError(error);
        }
    },

    // Update this method to handle just the status and optional comments update
    async updateAuthorStatus(regId: number, data: {status: string, comments?: string}): Promise<ApiResponse<any>> {
        try {
            const response = await this.axiosInstance.put(`/authors/status/${regId}`, data);
            return response.data;
        } catch (error: any) {
            console.error('Error updating author status:', error);
            throw this.handleError(error);
        }
    },

    // Update this method to handle optional file uploads with status update
    async updateAuthorStatusWithFile(formData: FormData): Promise<ApiResponse<any>> {
        try {
            const response = await this.axiosInstance.post('/authors/upload-paper', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error: any) {
            console.error('Error uploading paper:', error);
            throw this.handleError(error);
        }
    },

    // Add the new client payment method
    async submitClientPayment(paymentData: FormData): Promise<ApiResponse<any>> {
        try {
            const response = await this.axiosInstance.post('/clients/payment/submit', paymentData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error: any) {
            console.error('Error submitting client payment:', error);
            throw this.handleError(error);
        }
    },

    // Add these methods to the api object
    async updateUserProfile(userId: string, data: UpdateProfileRequest): Promise<ApiResponse<any>> {
        try {
            const response = await this.axiosInstance.put(`/entity/${userId}/user-profile`, data);
            return response.data;
        } catch (error: any) {
            console.error('Error updating user profile:', error);
            throw this.handleError(error);
        }
    },

    async verifyPassword(data: VerifyPasswordRequest): Promise<ApiResponse<{success: boolean}>> {
        try {
            const response = await this.axiosInstance.post('/entity/verify-password', data);
            
            // If the request is successful, make sure to return the proper structure
            return {
                success: true,
                data: { success: true },
                timestamp: new Date().toISOString(),
                message: 'Password verified successfully'
            };
        } catch (error: any) {
            console.error('Error verifying password:', error);
            
            // Check if the error response matches the expected format for wrong password
            if (error.response?.data?.error === 'Invalid password') {
                return {
                    success: false,
                    data: { success: false },
                    timestamp: new Date().toISOString(),
                    message: 'Current password is incorrect'
                };
            }
            
            // Return a generic error for other error types
            return {
                success: false,
                data: { success: false },
                timestamp: new Date().toISOString(),
                message: 'Failed to verify password'
            };
        }
    },

    async changePassword(userId: string, data: ChangePasswordRequest): Promise<ApiResponse<{success: boolean}>> {
        try {
            const response = await this.axiosInstance.put(`/entity/${userId}/change-password`, data);
            return response.data;
        } catch (error: any) {
            console.error('Error changing password:', error);
            throw this.handleError(error);
        }
    },
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
    Editor,
    AssignedRegistration,
    CreateJournalRequest,
    ProspectusAssistData,
    DashboardStats,
    ActivityItem,
    Permission,
    Lead,
    CreateLeadRequest,
    UpdateLeadRequest,
    TodayFollowupResponse,
    ApproveLeadRequest,
    CreateClientRequest,
    CreateClientResponse,  
    ClientLoginRequest,
    ClientLoginResponse,
    ClientPendingRegistrationResponse,
    AuthorTask,
    AuthorTaskUpdateRequest,
    AuthorStats,
    PendingRegistrationResponse,
    PendingRegistrationsResponse,
    ClientPaymentRequest,
    UpdateProfileRequest,
    VerifyPasswordRequest,
    ChangePasswordRequest
};
export default api;
