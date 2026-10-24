// hooks/useAuthorization.ts
"use client";

import { useAuth } from "./useAuth";

export function useAuthorization() {
  const { user, hasRole, hasPermission, can } = useAuth();

  // Module to permission mapping
  const modulePermissionMap: Record<string, string> = {
    users: "view users",
    roles: "view roles",
    permissions: "view permissions",
    posts: "view posts",
    services: "view services",
    products: "view products",
    cards: "view cards",
    faqs: "view faqs",
    testimonials: "view testimonials",
    navigation: "view navigation",
    sliders: "view sliders",
    settings: "view settings",
    contacts: "view contacts",
    "company-info": "view company info",
    reach: "view reach",
    subscriptions: "view subscriptions",
    orders: "view orders",
  };

  // Check if user can access a specific module
  const canAccessModule = (
    module: string,
    action: 'view' | 'create' | 'update' | 'delete' = 'view'
  ): boolean => {
    // Super Admin always has access
    if (user?.roles.includes("Super Admin")) return true;

    // Special case for customers accessing orders
    if (module === "orders" && user?.roles.includes("Customer")) {
      // Customers can access orders in public section
      return true;
    }

    const permission = modulePermissionMap[module];
    if (!permission) return false;

    // For view action, check permission
    if (action === 'view') {
      return hasPermission(permission);
    }

    // For other actions, check both permission and authorized flag
    const actionPermission = permission.replace('view', action);
    return hasPermission(actionPermission) && can(action);
  };

  // Check if user can access a specific navigation item
  const canAccessNavigation = (
    navigationItem: any,
    action: 'view' | 'create' | 'update' | 'delete' = 'view'
  ): boolean => {
    if (!navigationItem?.authorized) return false;

    // Super Admin always has access
    if (user?.roles.includes("Super Admin")) return true;

    return navigationItem.authorized[action] === true;
  };

  // Find navigation item by module name
  const findNavigationItem = (navigations: any[], moduleName: string): any => {
    for (const nav of navigations) {
      if (
        nav.url === `/${moduleName}` ||
        nav.url === `/admin/${moduleName}` ||
        nav.name?.en?.toLowerCase() === moduleName.toLowerCase()
      ) {
        return nav;
      }
      if (nav.children && nav.children.length > 0) {
        const found = findNavigationItem(nav.children, moduleName);
        if (found) return found;
      }
    }
    return null;
  };

  // Get allowed actions for a module
  const getAllowedActions = (module: string) => {
    // Super Admin always has access
    if (user?.roles.includes("Super Admin")) {
      return { view: true, create: true, update: true, delete: true };
    }

    // Special case for customers accessing orders
    if (module === "orders" && user?.roles.includes("Customer")) {
      return { view: true, create: false, update: false, delete: false };
    }

    // Attempt to find the module in the user's navigations tree
    if (user?.navigations) {
      const navItem = findNavigationItem(user.navigations, module);
      if (navItem && navItem.authorized) {
        return {
          view: navItem.authorized.view === true,
          create: navItem.authorized.create === true,
          update: navItem.authorized.update === true,
          delete: navItem.authorized.delete === true,
        };
      }
    }

    // Fallback to role/permission-based checks
    return {
      view: canAccessModule(module, 'view'),
      create: canAccessModule(module, 'create'),
      update: canAccessModule(module, 'update'),
      delete: canAccessModule(module, 'delete'),
    };
  };

  // Filter navigations based on user permissions
  const getAccessibleNavigations = (navigations: any[] = []) => {
    return navigations.filter(nav => canAccessNavigation(nav));
  };

  return {
    user,
    canAccessModule,
    canAccessNavigation,
    getAllowedActions,
    getAccessibleNavigations,
    hasRole,
    hasPermission,
    can,
  };
}