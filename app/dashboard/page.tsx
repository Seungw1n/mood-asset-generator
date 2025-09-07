'use client'

import Link from 'next/link'
import AuthGuard from '../../components/auth/AuthGuard'

const WORKSPACES = [
  {
    id: 'metal',
    name: '메탈',
    description: '메탈릭하고 산업적인 느낌의 그래픽 스타일',
    color: 'from-gray-600 to-gray-800',
    icon: '⚙️'
  },
  {
    id: 'vintage',
    name: '빈티지',
    description: '클래식하고 복고적인 느낌의 그래픽 스타일',
    color: 'from-amber-600 to-orange-800',
    icon: '📷'
  },
  {
    id: 'analog',
    name: '아날로그',
    description: '따뜻하고 아날로그적인 느낌의 그래픽 스타일',
    color: 'from-green-600 to-teal-800',
    icon: '📻'
  }
]

export default function WorkspacesPage() {
  return (
    <AuthGuard>
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg-secondary)' }}>
      {/* 헤더 */}
      <header className="workspace-header">
        <div className="container">
          <div className="flex justify-between items-center" style={{ padding: 'var(--spacing-6) 0' }}>
            <div>
              <h1 className="workspace-title text-3xl">워크스페이스</h1>
              <p className="workspace-subtitle">그래픽 스타일별로 에셋을 관리하세요</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container" style={{ padding: 'var(--spacing-12) var(--spacing-4)' }}>
        {/* 워크스페이스 선택 */}
        <div style={{ marginBottom: 'var(--spacing-8)' }}>
          <h2 style={{ 
            fontSize: 'var(--font-size-xl)', 
            fontWeight: 'var(--font-weight-semibold)', 
            color: 'var(--color-text-primary)',
            marginBottom: 'var(--spacing-6)'
          }}>
            그래픽 스타일 선택
          </h2>
          
          <div className="workspace-grid">
            {WORKSPACES.map((workspace) => (
              <Link
                key={workspace.id}
                href={`/workspace/${workspace.id}`}
                className="workspace-card"
              >
                <div className={`workspace-card-header ${workspace.id}`}>
                  <span className="workspace-card-icon">{workspace.icon}</span>
                </div>
                
                <div className="workspace-card-content">
                  <h3 className="workspace-card-title">
                    {workspace.name} 스타일
                  </h3>
                  <p className="workspace-card-description">
                    {workspace.description}
                  </p>
                  
                  <div className="workspace-card-footer">
                    <span className="workspace-card-meta">
                      워크스페이스 진입
                    </span>
                    <span className="workspace-card-arrow">
                      →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 최근 작업 */}
        <div className="card" style={{ padding: 'var(--spacing-6)' }}>
          <h3 className="assets-title">최근 작업</h3>
          
          <div className="empty-state">
            <div className="empty-state-icon">
              ⏱️
            </div>
            <p className="empty-state-title">최근 작업한 에셋이 없습니다</p>
            <p className="empty-state-description">
              위의 워크스페이스 중 하나를 선택하여 시작해보세요
            </p>
          </div>
        </div>

        {/* 도움말 */}
        <div className="help-section">
          <div className="help-content">
            <div className="help-icon">💡</div>
            <div className="help-text">
              <h4 className="help-title">워크스페이스 사용 가이드</h4>
              <ul className="help-list">
                <li>각 워크스페이스는 고유한 그래픽 스타일을 가지고 있습니다</li>
                <li>프롬프트 입력 시 선택한 스타일이 자동으로 적용됩니다</li>
                <li>생성된 에셋은 수정하거나 바로 내보낼 수 있습니다</li>
                <li>모든 에셋은 워크스페이스별로 자동 저장됩니다</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
    </AuthGuard>
  )
}