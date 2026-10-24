import api, { setupCsrf } from "@/lib/clientAxios";

// Helper function to get cookie by name
const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

// Function to ensure CSRF token is available
const ensureCsrfToken = async (): Promise<void> => {
  // Always refresh the CSRF token to ensure it's valid
  // Some servers invalidate tokens after use or after a period
  await setupCsrf();
};

export const apiService = {
  get: async <T>(url: string): Promise<T> => {
    // Ensure CSRF token is available before making request
    await ensureCsrfToken();

    // Prepare config to ensure auth headers are set
    const config: any = {
      headers: {}, // Initialize headers object
    };

    // Ensure auth headers are set for GET requests
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("auth_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Add XSRF token from cookies
      const xsrfToken = getCookie('XSRF-TOKEN');
      if (xsrfToken) {
        config.headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrfToken);
      }
    }

    // Add common headers for Laravel Sanctum compatibility
    config.headers["Accept"] = "application/json";
    config.headers["X-Requested-With"] = "XMLHttpRequest";

    // For cross-origin requests, ensure credentials are included
    config.withCredentials = true;

    const response = await api.get<T>(url, config);
    return response.data;
  },

  post: async <T>(url: string, data?: any): Promise<T> => {
    // Ensure CSRF token is available before making request
    await ensureCsrfToken();

    const isFormData = data instanceof FormData;

    if (isFormData) {
      const dataObj: any = {};
      data.forEach((value, key) => {
        dataObj[key] = value instanceof File ? `File: ${value.name} (${value.size} bytes)` : value;
      });
    } else {
      console.log("API Service v2: Request data:");
    }

    try {
      // For FormData, we must let axios/browser set the Content-Type with the boundary.
      // We explicitly delete/override the default application/json.
      const config: any = {
        headers: {}, // Initialize headers object
      };

      if (isFormData) {
        config.headers["Content-Type"] = undefined;
      }

      // Ensure auth headers are set even for FormData requests
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("auth_token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add XSRF token from cookies
        const xsrfToken = getCookie('XSRF-TOKEN');
        if (xsrfToken) {
          config.headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrfToken);
        }
      }

      // Add common headers for Laravel Sanctum compatibility
      config.headers["Accept"] = "application/json";
      config.headers["X-Requested-With"] = "XMLHttpRequest";

      // For cross-origin requests, ensure credentials are included
      config.withCredentials = true;

      const response = await api.post<T>(url, data, config);
      return response.data;
    } catch (error: any) {
      console.error("API Service v2: POST request failed");
      console.error("API Service v2: Error status:", error.response?.status);
     // console.error("API Service v2: Error data:", error.response?.data);
      throw error;
    }
  },

  put: async <T>(url: string, data?: any): Promise<T> => {
    // Ensure CSRF token is available before making request
    await ensureCsrfToken();

    const isFormData = data instanceof FormData;

    if (isFormData) {
      const dataObj: any = {};
      data.forEach((value, key) => {
        dataObj[key] = value instanceof File ? `File: ${value.name} (${value.size} bytes)` : value;
      });
    } else {
      console.log("API Service v2: Request data:");
    }

    try {
      const config: any = {
        headers: {}, // Initialize headers object
      };

      if (isFormData) {
        config.headers["Content-Type"] = undefined;
      }

      // Ensure auth headers are set even for FormData requests
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("auth_token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add XSRF token from cookies
        const xsrfToken = getCookie('XSRF-TOKEN');
        if (xsrfToken) {
          config.headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrfToken);
        }
      }

      // Add common headers for Laravel Sanctum compatibility
      config.headers["Accept"] = "application/json";
      config.headers["X-Requested-With"] = "XMLHttpRequest";

      // For cross-origin requests, ensure credentials are included
      config.withCredentials = true;

      const response = await api.put<T>(url, data, config);
      return response.data;
    } catch (error: any) {
      console.error("API Service v2: Error status:", error.response?.status);
      //console.error("API Service v2: Error data:", error.response?.data);
      throw error;
    }
  },
   patch: async <T>(url: string, data?: any): Promise<T> => {
    // Ensure CSRF token is available before making request
    await ensureCsrfToken();

    const isFormData = data instanceof FormData;
    //console.log("API Service: Sending PATCH request to", url);

    if (isFormData) {
      const dataObj: any = {};
      data.forEach((value, key) => {
        dataObj[key] = value instanceof File ? `File: ${value.name} (${value.size} bytes)` : value;
      });
      console.log("API Service: Request FormData:");
    } else {
      console.log("API Service: Request data:");
    }

    try {
      const config: any = {
        headers: {}, // Initialize headers object
      };
      
      if (isFormData) {
        config.headers["Content-Type"] = undefined;
      }
      
      // Ensure auth headers are set
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("auth_token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Add XSRF token from cookies
        const xsrfToken = getCookie('XSRF-TOKEN');
        if (xsrfToken) {
          config.headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrfToken);
        }
      }
      
      // Add common headers for Laravel Sanctum compatibility
      config.headers["Accept"] = "application/json";
      config.headers["X-Requested-With"] = "XMLHttpRequest";
      
      // For cross-origin requests, ensure credentials are included
      config.withCredentials = true;

      const response = await api.patch<T>(url, data, config);
      console.log("API Service: PATCH response status:", response.status);
     // console.log("API Service: PATCH response data:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("API Service: PATCH request failed");
      console.error("API Service: Error status:", error.response?.status);
     // console.error("API Service: Error data:", error.response?.data);
      throw error;
    }
  },

  delete: async <T>(url: string): Promise<T> => {
    // Ensure CSRF token is available before making request
    await ensureCsrfToken();

    // Prepare config to ensure auth headers are set
    const config: any = {
      headers: {}, // Initialize headers object
    };

    // Ensure auth headers are set for DELETE requests
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("auth_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Add XSRF token from cookies
      const xsrfToken = getCookie('XSRF-TOKEN');
      if (xsrfToken) {
        config.headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrfToken);
      }
    }

    // Add common headers for Laravel Sanctum compatibility
    config.headers["Accept"] = "application/json";
    config.headers["X-Requested-With"] = "XMLHttpRequest";

    // For cross-origin requests, ensure credentials are included
    config.withCredentials = true;

    const response = await api.delete<T>(url, config);
    return response.data;
  },
};



