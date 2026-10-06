export interface AuthUser {
  username: string;
  displayName: string;
  role: string;
  authenticatedAt: string;
  isDemoSession: boolean;
}

export interface AuthCredentials {
  username: string;
  password: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  intendedPath: string | null;
}
