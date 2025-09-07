"use client";

export interface User {
  username: string;
  role: string;
}

export class AuthService {
  static isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('isAuthenticated') === 'true';
  }

  static getUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr) as User;
    } catch {
      return null;
    }
  }

  static login(username: string, password: string): boolean {
    // 하드코딩된 관리자 계정 확인
    if (username === 'generator_admin' && password === 'moodAsset') {
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('user', JSON.stringify({ 
        username: 'generator_admin', 
        role: 'admin' 
      }));
      return true;
    }
    return false;
  }

  static logout(): void {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
  }
}