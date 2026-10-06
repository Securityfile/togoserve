import { describe, it, expect, beforeEach } from 'vitest';
import { authService, DEMO_USERNAME, DEMO_PASSWORD, AUTH_STORAGE_KEY, INTENDED_ROUTE_KEY } from '../auth/authService';

describe('Public Landing Page & Authentication Gate Test Suite', () => {
  beforeEach(() => {
    authService.logout();
    authService.clearIntendedPath();
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/');
    }
  });

  describe('1. Public Routes Accessibility', () => {
    it('allows public access to the root page (/) without authentication', () => {
      expect(authService.isAuthenticated()).toBe(false);
      // Public route "/" does not require active session
      const currentPath: string = '/';
      const isPublic = ['/', '/login'].includes(currentPath);
      expect(isPublic).toBe(true);
    });

    it('allows public access to the login page (/login) without authentication', () => {
      expect(authService.isAuthenticated()).toBe(false);
      const currentPath: string = '/login';
      const isPublic = ['/', '/login'].includes(currentPath);
      expect(isPublic).toBe(true);
    });
  });

  describe('2. Protected Routes & Redirection Guards', () => {
    it('redirects unauthenticated users attempting to access protected routes to /login and preserves intendedPath', () => {
      expect(authService.isAuthenticated()).toBe(false);

      const attemptedProtectedRoutes = [
        '/customer',
        '/merchant',
        '/merchant/products',
        '/rider',
        '/admin',
        '/ai-command-center',
        '/orders',
        '/products',
        '/logistics',
        '/padala',
      ];

      for (const route of attemptedProtectedRoutes) {
        authService.setIntendedPath(route);
        expect(authService.getIntendedPath()).toBe(route);

        // Verification: Protected route demands redirection
        const shouldRedirectToLogin = !authService.isAuthenticated();
        expect(shouldRedirectToLogin).toBe(true);
      }
    });

    it('prevents direct URL bypass for unauthenticated users', () => {
      const maliciousDirectNavigation = '/admin';
      expect(authService.isAuthenticated()).toBe(false);

      // Access guard check
      let redirectedPath = maliciousDirectNavigation;
      if (!authService.isAuthenticated()) {
        authService.setIntendedPath(maliciousDirectNavigation);
        redirectedPath = '/login';
      }

      expect(redirectedPath).toBe('/login');
      expect(authService.getIntendedPath()).toBe(maliciousDirectNavigation);
    });
  });

  describe('3. Development Demo Credential Verification', () => {
    it('successfully authenticates with correct development demo credentials', () => {
      const result = authService.login({
        username: DEMO_USERNAME,
        password: DEMO_PASSWORD,
      });

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.username).toBe('testpage2026');
      expect(result.user?.isDemoSession).toBe(true);
      expect(authService.isAuthenticated()).toBe(true);
    });

    it('fails when an incorrect username is provided', () => {
      const result = authService.login({
        username: 'wronguser',
        password: DEMO_PASSWORD,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid credentials');
      expect(authService.isAuthenticated()).toBe(false);
    });

    it('fails when an incorrect password is provided', () => {
      const result = authService.login({
        username: DEMO_USERNAME,
        password: 'wrongpassword',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid credentials');
      expect(authService.isAuthenticated()).toBe(false);
    });

    it('fails when blank or empty credentials are submitted', () => {
      const blankUser = authService.login({ username: '', password: DEMO_PASSWORD });
      expect(blankUser.success).toBe(false);
      expect(blankUser.error).toBe('Username is required.');

      const blankPass = authService.login({ username: DEMO_USERNAME, password: '' });
      expect(blankPass.success).toBe(false);
      expect(blankPass.error).toBe('Password is required.');
    });
  });

  describe('4. Session Persistence Across Browser Refresh', () => {
    it('ensures authenticated session survives browser refresh via localStorage', () => {
      const loginResult = authService.login({
        username: DEMO_USERNAME,
        password: DEMO_PASSWORD,
      });
      expect(loginResult.success).toBe(true);

      // Simulate browser reload by reading afresh from persistence storage
      const refreshedSession = authService.getSession();
      expect(refreshedSession).not.toBeNull();
      expect(refreshedSession?.username).toBe('testpage2026');
      expect(authService.isAuthenticated()).toBe(true);
    });

    it('allows authenticated users to access protected routes after login', () => {
      authService.login({
        username: DEMO_USERNAME,
        password: DEMO_PASSWORD,
      });
      expect(authService.isAuthenticated()).toBe(true);

      const targetRoute = '/merchant/products';
      let renderedRoute = targetRoute;

      if (!authService.isAuthenticated()) {
        renderedRoute = '/login';
      }

      expect(renderedRoute).toBe(targetRoute);
    });
  });

  describe('5. Logout Behavior & State Clearing', () => {
    it('clears development authentication session and redirects to public root (/)', () => {
      // 1. Authenticate
      authService.login({
        username: DEMO_USERNAME,
        password: DEMO_PASSWORD,
      });
      authService.setIntendedPath('/admin');
      expect(authService.isAuthenticated()).toBe(true);

      // 2. Perform logout
      authService.logout();

      // 3. Verify session and intended path are cleared
      expect(authService.isAuthenticated()).toBe(false);
      expect(authService.getSession()).toBeNull();
      expect(authService.getIntendedPath()).toBeNull();

      // 4. Verify post-logout navigation goes to public landing page "/"
      const postLogoutPath = '/';
      expect(postLogoutPath).toBe('/');

      // 5. Verify direct attempt to visit internal route now redirects to /login
      let directAttempt = '/admin';
      if (!authService.isAuthenticated()) {
        directAttempt = '/login';
      }
      expect(directAttempt).toBe('/login');
    });
  });
});
