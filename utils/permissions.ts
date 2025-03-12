/**
 * Utility functions for checking user permissions
 */

// Permission constants
export const PERMISSIONS = {
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
};

/**
 * Type for user with permissions array
 */
export interface UserWithPermissions {
  permissions?: Array<{ name: string; description?: string }>;
  [key: string]: any;
}

/**
 * Check if the user has a specific permission
 */
export const hasPermission = (
  user: UserWithPermissions | null | undefined,
  permissionName: string
): boolean => {
  if (!user || !user.permissions || !Array.isArray(user.permissions)) {
    return false;
  }

  return user.permissions.some(
    (permission) => permission.name === permissionName
  );
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
 * Check if current user has specific permission
 */
export const currentUserHasPermission = (permissionName: string): boolean => {
  const currentUser = getCurrentUser();
  return hasPermission(currentUser, permissionName);
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
