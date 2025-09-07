"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '@/lib/auth';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      if (!AuthService.isAuthenticated()) {
        router.replace('/login');
        return;
      }
      setIsChecking(false);
    };

    checkAuth();
  }, [router]);

  if (isChecking) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-bg-secondary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="card" style={{
          padding: 'var(--spacing-8)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '2rem',
            height: '2rem',
            border: '2px solid var(--color-border-light)',
            borderTop: '2px solid var(--color-primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto var(--spacing-4)'
          }}></div>
          <p style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)'
          }}>
            인증 확인 중...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}