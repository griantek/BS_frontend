/**
 * Utility functions for checking user permissions
 */

// Permission constants
export const PERMISSIONS = {
//   EXECUTIVE PERMISSIONS
  SHOW_ADD_PROSPECT: 'show_add_prosp_btn',
  SHOW_PROSPECTUS_TABLE: 'show_prosp_table',
  SHOW_REGISTRATION_TAB: 'show_reg_tab_ex',
  VIEW_DASHBOARD_EXECUTIVE: 'view_dash_ex',
  CLICK_PROSPECT_ROWS: 'click_prosp_rows',
  CLICK_REGISTRATION_ROWS: 'click_reg_rows',
  SHOW_SEND_QUOTE_BTN: 'show_send_quote_btn',
  SHOW_REGISTER_BTN: 'show_reg_btn',
  SHOW_EDIT_BUTTON_EXECUTIVE: 'show_edit_btn_ex',
  SHOW_DELETE_BUTTON_EXECUTIVE: 'show_del_btn_ex',
  SHOW_EDIT_REGISTRATION_BUTTON: 'show_edit_reg_btn',
  SHOW_DELETE_REGISTRATION_BUTTON: 'show_del_reg_btn',
  SHOW_APPROVE_BUTTON: 'show_approve_btn',
  
  // EDITOR PERMISSIONS
  VIEW_NOTIFICATIONS: 'view_notifs',
  VIEW_DASHBOARD_EDITOR: 'view_dash_ed',
  SHOW_ASSIGNED_TABLE: 'show_assigned_table',
  CLICK_ASSIGNED_ROWS: 'click_assigned_rows',
  SHOW_JOURNAL_TABLE: 'show_journal_table',
  CLICK_JOURNAL_ROWS: 'click_journal_rows',
  SHOW_EDIT_BUTTON_EDITOR: 'show_edit_btn_ed',
  SHOW_DELETE_BUTTON_EDITOR: 'show_del_btn_ed',
  SHOW_UPDATE_SCREENSHOT_BUTTON: 'show_update_scr_btn',
  SHOW_ADD_JOURNAL_BUTTON: 'show_add_journal_btn',
  
  // ADMIN PERMISSIONS
  SHOW_USERS_NAV: 'show_users_nav',
  SHOW_EXECUTIVES_TAB: 'show_execs',
  VIEW_EXECUTIVE_DETAILS: 'view_exec',
  UPDATE_USERS: 'update_users',
  SHOW_ADD_EXECUTIVE_BUTTON: 'show_add_exec_btn',
  SHOW_ROLES: 'show_roles', 
  SHOW_SERVICES_TAB: 'show_svc_tab',
  SHOW_ADD_SERVICE_BUTTON: 'show_add_svc_btn',
  SHOW_CLIENTS_TAB: 'show_clients_tab',
  SHOW_PROSPECTS_TAB: 'show_prosp_tab',
  SHOW_REGISTRATIONS_TAB_ADMIN: 'show_reg_tab_adm',
  SHOW_JOURNALS_TAB_ADMIN: 'show_journals_tab_adm',
  CLICK_JOURNAL_ROWS_ADMIN: 'click_journal_rows_adm',
  SHOW_FINANCE_TAB: 'show_fin_tab',
  SHOW_TRANSACTIONS_TAB: 'show_txn_tab',
  SHOW_BANK_ACCOUNTS_TAB: 'show_bank_tab',
  SHOW_ADD_BANK_BUTTON: 'show_add_bank_btn',
  SHOW_DEPARTMENT_TAB: 'show_dept_tab',
  SHOW_ADD_DEPARTMENT_BUTTON: 'show_add_dept_btn',
  SHOW_APPROVAL_NAV: 'show_approval_nav',

  // LEADS PERMISSIONS
  VIEW_DASHBOARD_LEADS: 'view_dash_leads',
  VIEW_FOLLOWUPS: 'view_followups',
};

/**
 * Type for user with permissions array
 */
export interface UserWithPermissions {
  permissions?: Array<{ name: string; description?: string }>;
  [key: string]: any;
}

/**
 * Check if the user is a SuperAdmin
 */
export const isSuperAdmin = (user: UserWithPermissions | null | undefined): boolean => {
  if (!user) return false;
  // Check both entity_type in role and role name for "SupAdmin"
  return user.role?.entity_type === 'SupAdmin' || 
         user.role?.name?.toLowerCase().includes('superadmin');
};

/**
 * Get the currently logged in user with permissions
 */
export const getCurrentUser = (): UserWithPermissions | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    return JSON.parse(userStr);
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

/**
 * Check if the user has a specific permission
 * SuperAdmin users automatically have all permissions
 */
export const hasPermission = (
  user: UserWithPermissions | null | undefined,
  permissionName: string
): boolean => {
  if (!user) return false;
  
  // SuperAdmin has all permissions
  if (isSuperAdmin(user)) {
    return true;
  }
  
  if (!user.permissions || !Array.isArray(user.permissions)) {
    return false;
  }

  return user.permissions.some(
    (permission) => permission.name === permissionName
  );
};

/**
 * Check if current user has specific permission
 * SuperAdmin users automatically have all permissions
 */
export const currentUserHasPermission = (permissionName: string): boolean => {
  const currentUser = getCurrentUser();
  
  // SuperAdmin has all permissions
  if (isSuperAdmin(currentUser)) {
    return true;
  }
  
  const result = hasPermission(currentUser, permissionName);
  
  // Add debug logs for critical navigation permissions
  if (permissionName === 'show_users_nav' || 
      permissionName === 'show_svc_tab' || 
      permissionName === 'show_clients_tab') {
    console.log(`Permission check: ${permissionName} => ${result}`, 
      { currentUser, permissions: currentUser?.permissions });
  }
  
  return result;
};

/**
 * Check if user has access to records (either prospects or registrations)
 */
export const hasRecordsAccess = (user: UserWithPermissions | null | undefined): boolean => {
  return (
    hasPermission(user, PERMISSIONS.SHOW_PROSPECTUS_TABLE) ||
    hasPermission(user, PERMISSIONS.SHOW_REGISTRATION_TAB)
  );
};

/**
 * Check if current user has access to records
 */
export const currentUserHasRecordsAccess = (): boolean => {
  const currentUser = getCurrentUser();
  return hasRecordsAccess(currentUser);
};

/**
 * Get all permissions for a user
 */
export const getUserPermissions = (user: UserWithPermissions | null | undefined): string[] => {
  if (!user || !user.permissions) return [];
  return user.permissions.map(p => p.name);
};
