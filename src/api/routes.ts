// API REST Routes para o Reality Show Logger
import { LogEntry, Participant, Location, ActionCategory, Tag } from '../types';

const API_BASE_URL = '/api/v1';

// Tipos para as respostas da API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ===== LOG ENTRIES =====
export const logEntriesAPI = {
  // GET /api/v1/log-entries
  getAll: async (params?: {
    page?: number;
    limit?: number;
    participantId?: string;
    locationId?: string;
    actionCategoryId?: string;
    tagId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<PaginatedResponse<LogEntry>> => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const response = await fetch(`${API_BASE_URL}/log-entries?${queryParams}`);
    return response.json();
  },

  // GET /api/v1/log-entries/:id
  getById: async (id: string): Promise<ApiResponse<LogEntry>> => {
    const response = await fetch(`${API_BASE_URL}/log-entries/${id}`);
    return response.json();
  },

  // POST /api/v1/log-entries
  create: async (entry: Omit<LogEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<LogEntry>> => {
    const response = await fetch(`${API_BASE_URL}/log-entries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify(entry)
    });
    return response.json();
  },

  // PUT /api/v1/log-entries/:id
  update: async (id: string, entry: Partial<LogEntry>): Promise<ApiResponse<LogEntry>> => {
    const response = await fetch(`${API_BASE_URL}/log-entries/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify(entry)
    });
    return response.json();
  },

  // DELETE /api/v1/log-entries/:id
  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await fetch(`${API_BASE_URL}/log-entries/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });
    return response.json();
  },

  // POST /api/v1/log-entries/bulk
  bulkCreate: async (entries: Omit<LogEntry, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<ApiResponse<LogEntry[]>> => {
    const response = await fetch(`${API_BASE_URL}/log-entries/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify({ entries })
    });
    return response.json();
  },

  // GET /api/v1/log-entries/export
  export: async (format: 'pdf' | 'csv' | 'json', filters?: any): Promise<Blob> => {
    const queryParams = new URLSearchParams({ format });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const response = await fetch(`${API_BASE_URL}/log-entries/export?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });
    return response.blob();
  }
};

// ===== PARTICIPANTS =====
export const participantsAPI = {
  // GET /api/v1/participants
  getAll: async (): Promise<ApiResponse<Participant[]>> => {
    const response = await fetch(`${API_BASE_URL}/participants`);
    return response.json();
  },

  // GET /api/v1/participants/:id
  getById: async (id: string): Promise<ApiResponse<Participant>> => {
    const response = await fetch(`${API_BASE_URL}/participants/${id}`);
    return response.json();
  },

  // POST /api/v1/participants
  create: async (participant: Omit<Participant, 'id' | 'createdAt'>): Promise<ApiResponse<Participant>> => {
    const response = await fetch(`${API_BASE_URL}/participants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify(participant)
    });
    return response.json();
  },

  // PUT /api/v1/participants/:id
  update: async (id: string, participant: Partial<Participant>): Promise<ApiResponse<Participant>> => {
    const response = await fetch(`${API_BASE_URL}/participants/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify(participant)
    });
    return response.json();
  },

  // DELETE /api/v1/participants/:id
  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await fetch(`${API_BASE_URL}/participants/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });
    return response.json();
  },

  // POST /api/v1/participants/:id/upload-photo
  uploadPhoto: async (id: string, photo: File): Promise<ApiResponse<{ photoUrl: string }>> => {
    const formData = new FormData();
    formData.append('photo', photo);

    const response = await fetch(`${API_BASE_URL}/participants/${id}/upload-photo`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: formData
    });
    return response.json();
  }
};

// ===== LOCATIONS =====
export const locationsAPI = {
  getAll: async (): Promise<ApiResponse<Location[]>> => {
    const response = await fetch(`${API_BASE_URL}/locations`);
    return response.json();
  },

  getById: async (id: string): Promise<ApiResponse<Location>> => {
    const response = await fetch(`${API_BASE_URL}/locations/${id}`);
    return response.json();
  },

  create: async (location: Omit<Location, 'id' | 'createdAt'>): Promise<ApiResponse<Location>> => {
    const response = await fetch(`${API_BASE_URL}/locations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify(location)
    });
    return response.json();
  },

  update: async (id: string, location: Partial<Location>): Promise<ApiResponse<Location>> => {
    const response = await fetch(`${API_BASE_URL}/locations/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify(location)
    });
    return response.json();
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await fetch(`${API_BASE_URL}/locations/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });
    return response.json();
  }
};

// ===== ACTION CATEGORIES =====
export const actionCategoriesAPI = {
  getAll: async (): Promise<ApiResponse<ActionCategory[]>> => {
    const response = await fetch(`${API_BASE_URL}/action-categories`);
    return response.json();
  },

  getById: async (id: string): Promise<ApiResponse<ActionCategory>> => {
    const response = await fetch(`${API_BASE_URL}/action-categories/${id}`);
    return response.json();
  },

  create: async (actionCategory: Omit<ActionCategory, 'id' | 'createdAt'>): Promise<ApiResponse<ActionCategory>> => {
    const response = await fetch(`${API_BASE_URL}/action-categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify(actionCategory)
    });
    return response.json();
  },

  update: async (id: string, actionCategory: Partial<ActionCategory>): Promise<ApiResponse<ActionCategory>> => {
    const response = await fetch(`${API_BASE_URL}/action-categories/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify(actionCategory)
    });
    return response.json();
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await fetch(`${API_BASE_URL}/action-categories/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });
    return response.json();
  }
};

// ===== TAGS =====
export const tagsAPI = {
  getAll: async (): Promise<ApiResponse<Tag[]>> => {
    const response = await fetch(`${API_BASE_URL}/tags`);
    return response.json();
  },

  getById: async (id: string): Promise<ApiResponse<Tag>> => {
    const response = await fetch(`${API_BASE_URL}/tags/${id}`);
    return response.json();
  },

  create: async (tag: Omit<Tag, 'id' | 'createdAt'>): Promise<ApiResponse<Tag>> => {
    const response = await fetch(`${API_BASE_URL}/tags`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify(tag)
    });
    return response.json();
  },

  update: async (id: string, tag: Partial<Tag>): Promise<ApiResponse<Tag>> => {
    const response = await fetch(`${API_BASE_URL}/tags/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify(tag)
    });
    return response.json();
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await fetch(`${API_BASE_URL}/tags/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });
    return response.json();
  }
};

// ===== ANALYTICS =====
export const analyticsAPI = {
  // GET /api/v1/analytics/dashboard
  getDashboardStats: async (dateRange?: { start: string; end: string }): Promise<ApiResponse<{
    totalEntries: number;
    activeParticipants: number;
    topLocations: Array<{ location: string; count: number }>;
    topActions: Array<{ action: string; count: number }>;
    entriesPerDay: Array<{ date: string; count: number }>;
    participantActivity: Array<{ participant: string; count: number }>;
  }>> => {
    const queryParams = new URLSearchParams();
    if (dateRange) {
      queryParams.append('startDate', dateRange.start);
      queryParams.append('endDate', dateRange.end);
    }

    const response = await fetch(`${API_BASE_URL}/analytics/dashboard?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });
    return response.json();
  },

  // GET /api/v1/analytics/timeline
  getTimeline: async (filters?: {
    participantId?: string;
    locationId?: string;
    actionCategoryId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<Array<{
    timestamp: string;
    timecode: string;
    participants: string[];
    location: string;
    action: string;
    notes: string;
  }>>> => {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const response = await fetch(`${API_BASE_URL}/analytics/timeline?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });
    return response.json();
  }
};

// ===== AUTHENTICATION =====
export const authAPI = {
  // POST /api/v1/auth/login
  login: async (email: string, password: string): Promise<ApiResponse<{ token: string; user: any }>> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    return response.json();
  },

  // POST /api/v1/auth/register
  register: async (userData: {
    email: string;
    password: string;
    displayName: string;
    role?: string;
  }): Promise<ApiResponse<{ token: string; user: any }>> => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    return response.json();
  },

  // POST /api/v1/auth/logout
  logout: async (): Promise<ApiResponse<void>> => {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });
    return response.json();
  },

  // GET /api/v1/auth/me
  getCurrentUser: async (): Promise<ApiResponse<any>> => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });
    return response.json();
  }
};

// ===== REAL-TIME WEBSOCKET =====
export class RealtimeConnection {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Function[]> = new Map();

  connect(token: string) {
    const wsUrl = `ws://localhost:3001/ws?token=${token}`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const listeners = this.listeners.get(data.type) || [];
      listeners.forEach(listener => listener(data.payload));
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      // Tentar reconectar após 3 segundos
      setTimeout(() => this.connect(token), 3000);
    };
  }

  subscribe(eventType: string, callback: Function) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(callback);
  }

  unsubscribe(eventType: string, callback: Function) {
    const listeners = this.listeners.get(eventType) || [];
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Instância global do WebSocket
export const realtimeConnection = new RealtimeConnection();