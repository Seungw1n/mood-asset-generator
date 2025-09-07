"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    // 하드코딩된 관리자 계정 인증
    if (username === "generator_admin" && password === "moodAsset") {
      // 인증 성공
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("user", JSON.stringify({ username: "generator_admin", role: "admin" }));
      router.push("/dashboard");
    } else {
      // 인증 실패
      setError("아이디 또는 비밀번호가 올바르지 않습니다.");
    }
    
    setIsLoading(false);
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: 'var(--color-bg-secondary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--spacing-4)'
    }}>
      <div className="card" style={{
        width: '100%',
        maxWidth: '420px',
        padding: 'var(--spacing-8)'
      }}>
        {/* 브랜드 헤더 */}
        <div style={{
          textAlign: 'center',
          marginBottom: 'var(--spacing-8)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--spacing-3)',
            marginBottom: 'var(--spacing-4)'
          }}>
            <div style={{
              width: '3rem',
              height: '3rem',
              background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%)',
              borderRadius: 'var(--radius-xl)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem'
            }}>🎨</div>
            <h1 style={{
              fontSize: 'var(--font-size-3xl)',
              fontWeight: 'var(--font-weight-semibold)',
              fontFamily: 'var(--font-family-display)',
              color: 'var(--color-text-primary)',
              margin: 0
            }}>
              Mood Asset
            </h1>
          </div>
          <p style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
            margin: 0
          }}>
            AI 그래픽 생성 플랫폼에 로그인하세요
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* 아이디 입력 */}
          <div className="form-field" style={{ marginBottom: 'var(--spacing-5)' }}>
            <label className="form-label">아이디</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="아이디를 입력하세요"
              className="input"
              required
              disabled={isLoading}
            />
          </div>

          {/* 비밀번호 입력 */}
          <div className="form-field" style={{ marginBottom: 'var(--spacing-6)' }}>
            <label className="form-label">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              className="input"
              required
              disabled={isLoading}
            />
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div style={{
              padding: 'var(--spacing-3) var(--spacing-4)',
              backgroundColor: 'rgba(234, 67, 53, 0.1)',
              color: 'var(--color-error)',
              border: '1px solid rgba(234, 67, 53, 0.2)',
              borderRadius: 'var(--radius-lg)',
              fontSize: 'var(--font-size-sm)',
              marginBottom: 'var(--spacing-5)'
            }}>
              {error}
            </div>
          )}

          {/* 로그인 버튼 */}
          <button
            type="submit"
            className={`btn btn-primary ${isLoading ? 'loading' : ''}`}
            style={{ width: '100%' }}
            disabled={isLoading}
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        {/* 추가 정보 */}
        <div style={{
          marginTop: 'var(--spacing-6)',
          textAlign: 'center',
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-text-tertiary)'
        }}>
          내부 사용자 전용 시스템
        </div>
      </div>
    </div>
  );
}
