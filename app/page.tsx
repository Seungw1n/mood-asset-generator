"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '../lib/auth';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // 인증 상태에 따라 리디렉션
    if (AuthService.isAuthenticated()) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [router]);

  // 로딩 화면
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
          페이지를 로드하는 중...
        </p>
      </div>
    </div>
  );
}