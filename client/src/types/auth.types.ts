export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'project_manager' | 'member';
  isEmailVerified: boolean;
  bio?: string;
  jobTitle?: string;
  timezone: string;
  notificationPreferences: NotificationPreferences;
  lastSeen?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreferences {
  email: boolean;
  inApp: boolean;
  taskAssigned: boolean;
  taskCompleted: boolean;
  mentioned: boolean;
  commentAdded: boolean;
  projectInvitation: boolean;
  dueSoon: boolean;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}
