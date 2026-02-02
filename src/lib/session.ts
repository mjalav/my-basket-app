// Simple user session management for demo purposes
// In a real app, this would integrate with your authentication system

const USER_ID_KEY = 'demo_user_id';

export function getUserId(): string {
  if (typeof window === 'undefined') return 'user123'; // SSR fallback
  
  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    // Security Audit: Replaced Math.random() with crypto.randomUUID() for CSP/Identity compliance
    userId = `user_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`;
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
}

export function setUserId(userId: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_ID_KEY, userId);
  }
}

export function clearUserId(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(USER_ID_KEY);
  }
}
