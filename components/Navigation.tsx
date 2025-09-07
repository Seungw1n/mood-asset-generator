'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AuthService } from '../lib/auth'

export default function Navigation() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // 저장된 테마 불러오기
    const savedTheme = localStorage.getItem('theme')
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setIsDarkMode(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  useEffect(() => {
    // 외부 클릭 시 메뉴 닫기
    const handleClickOutside = (event: MouseEvent) => {
      if (showProfileMenu && !(event.target as Element)?.closest('.user-profile')) {
        setShowProfileMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showProfileMenu])

  const toggleDarkMode = () => {
    const newMode = !isDarkMode
    setIsDarkMode(newMode)
    
    if (newMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  const handleLogout = () => {
    AuthService.logout()
    router.push('/login')
  }

  return (
    <nav className="global-navigation">
      <div className="nav-container">
        {/* 브랜드 로고 */}
        <div className="nav-brand">
          <Link href="/" className="brand-link">
            <div className="brand-icon">🎨</div>
            <span className="brand-text">Mood Asset</span>
          </Link>
        </div>

        {/* 네비게이션 메뉴 */}
        <div className="nav-menu">
          <Link href="/dashboard" className="nav-item">
            <span className="nav-icon">📊</span>
            <span className="nav-text">대시보드</span>
          </Link>
        </div>

        {/* 사용자 액션 */}
        <div className="nav-actions">
          {/* 다크모드 토글 */}
          <button
            onClick={toggleDarkMode}
            className="theme-toggle"
            aria-label={isDarkMode ? '라이트 모드로 전환' : '다크 모드로 전환'}
          >
            <div className="toggle-track">
              <div className="toggle-thumb">
                <span className="toggle-icon">
                  {isDarkMode ? '🌙' : '☀️'}
                </span>
              </div>
            </div>
          </button>

          {/* 사용자 프로필 */}
          <div className="user-profile" style={{ position: 'relative' }}>
            <button 
              className="profile-button"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <div className="profile-avatar">
                <span>👤</span>
              </div>
            </button>
            
            {showProfileMenu && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: 'var(--spacing-2)',
                backgroundColor: 'var(--color-bg-primary)',
                border: '1px solid var(--color-border-light)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-md)',
                padding: 'var(--spacing-2)',
                minWidth: '160px',
                zIndex: 'var(--z-dropdown)'
              }}>
                <div style={{
                  padding: 'var(--spacing-2) var(--spacing-3)',
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-secondary)',
                  borderBottom: '1px solid var(--color-border-light)',
                  marginBottom: 'var(--spacing-2)'
                }}>
                  generator_admin
                </div>
                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    padding: 'var(--spacing-2) var(--spacing-3)',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--color-text-secondary)',
                    fontSize: 'var(--font-size-sm)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)'
                    e.currentTarget.style.color = 'var(--color-text-primary)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = 'var(--color-text-secondary)'
                  }}
                >
                  로그아웃
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}