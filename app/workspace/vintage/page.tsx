'use client'

import { useState, useEffect } from 'react'
import { DatabaseService } from '@/lib/database'
import type { Asset as DbAsset } from '@/lib/supabaseClient'
import AuthGuard from '../../../components/auth/AuthGuard'
import AssetEditModal from '../../../components/modals/AssetEditModal'

interface Asset {
  id: string
  dbId: string
  name: string
  imageUrl: string
  prompt: string
  createdAt: string
  updatedAt?: string
  style: string
}

export default function VintageWorkspacePage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [prompt, setPrompt] = useState('')
  const [assetName, setAssetName] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const styleName = '빈티지'
  const styleDescription = '클래식하고 복고적인 느낌의 그래픽 스타일'

  // 데이터베이스에서 워크스페이스와 에셋 로드
  useEffect(() => {
    loadWorkspaceAndAssets()
  }, [])

  const loadWorkspaceAndAssets = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // 워크스페이스 찾기
      const workspace = await DatabaseService.getWorkspaceByKey('vintage')
      if (!workspace) {
        throw new Error('빈티지 워크스페이스를 찾을 수 없습니다.')
      }

      setWorkspaceId(workspace.id)

      // 에셋 로드
      const dbAssets = await DatabaseService.getAssets(workspace.id)
      const formattedAssets: Asset[] = dbAssets.map(dbAsset => ({
        id: dbAsset.id,
        name: dbAsset.name || '이름 없음',
        imageUrl: dbAsset.image_url || '',
        prompt: dbAsset.prompt || '',
        createdAt: dbAsset.created_at,
        updatedAt: dbAsset.metadata?.updated_at,
        style: 'vintage'
      }))

      setAssets(formattedAssets)
    } catch (err) {
      console.error('Error loading workspace data:', err)
      setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 데이터베이스 에셋 형식을 로컬 에셋 형식으로 변환
  const convertDbAssetToAsset = (dbAsset: DbAsset): Asset => ({
    id: dbAsset.id,
    dbId: dbAsset.id,
    name: dbAsset.name || '이름 없음',
    imageUrl: dbAsset.image_url || '',
    prompt: dbAsset.prompt || '',
    createdAt: dbAsset.created_at,
    updatedAt: dbAsset.metadata?.updated_at,
    style: 'vintage'
  })

  const handleGenerate = async () => {
    if (!prompt.trim() || !assetName.trim() || !workspaceId) return
    
    try {
      setIsGenerating(true)
      setError(null)

      // AI API 호출 - 실제 이미지 생성
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          style: 'vintage',
          workspaceId: workspaceId,
          assetName: assetName
        })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate image')
      }
      
      const newAsset = convertDbAssetToAsset(result.asset)
      setAssets(prev => [newAsset, ...prev])
      setPrompt('')
      setAssetName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : '에셋 생성에 실패했습니다.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleEditStart = (asset: Asset) => {
    setEditingAsset(asset)
    setIsEditModalOpen(true)
  }

  const handleEditCancel = () => {
    setEditingAsset(null)
    setIsEditModalOpen(false)
  }

  const handleGenerateImage = async (prompt: string): Promise<string> => {
    return `/placeholder-asset-${Date.now()}.png`
  }

  const handleSaveAsset = async (name: string, prompt: string, imageUrl?: string) => {
    if (!editingAsset) return
    
    // 데이터베이스 업데이트
    const dbAsset = await DatabaseService.updateAsset(editingAsset.dbId, {
      name,
      prompt,
      image_url: imageUrl || editingAsset.imageUrl,
    })

    // 로컬 상태 업데이트
    const updatedAsset = convertDbAssetToAsset(dbAsset)
    setAssets(prev => prev.map(a => a.id === editingAsset.id ? updatedAsset : a))
    
    setEditingAsset(null)
    setIsEditModalOpen(false)
  }

  const handleExport = (asset: Asset) => {
    // TODO: 실제 export 기능 구현
    const link = document.createElement('a')
    link.href = asset.imageUrl
    link.download = `${asset.name}.png`
    link.click()
  }

  return (
    <AuthGuard>
    <div className="theme-vintage" style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg-secondary)' }}>
      {/* 헤더 */}
      <header className="workspace-header" style={{ borderBottomColor: 'var(--color-accent)' }}>
        <div className="container">
          <div className="flex justify-between items-center" style={{ padding: 'var(--spacing-4) 0' }}>
            <div className="flex items-center" style={{ gap: 'var(--spacing-4)' }}>
              <button 
                onClick={() => window.history.back()}
                className="back-button"
                style={{ color: 'var(--color-accent)' }}
              >
                ← 뒤로
              </button>
              <div className="flex items-center" style={{ gap: 'var(--spacing-3)' }}>
                <span style={{ fontSize: '2rem' }}>📷</span>
                <div>
                  <h1 className="workspace-title">
                    {styleName} 워크스페이스
                  </h1>
                  <p className="workspace-subtitle">{styleDescription}</p>
                </div>
              </div>
            </div>
            <div>
              <span style={{ 
                fontSize: 'var(--font-size-sm)', 
                color: 'var(--color-text-secondary)' 
              }}>
                총 {assets.length}개 에셋
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="container" style={{ padding: 'var(--spacing-8) var(--spacing-4)' }}>
        {/* 에러 메시지 */}
        {error && (
          <div style={{
            backgroundColor: 'var(--color-error)',
            color: 'white',
            padding: 'var(--spacing-4)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: 'var(--spacing-6)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-2)'
          }}>
            <span>⚠️</span>
            <span>{error}</span>
            <button 
              onClick={() => setError(null)}
              style={{ 
                marginLeft: 'auto', 
                background: 'none', 
                border: 'none', 
                color: 'white', 
                cursor: 'pointer',
                fontSize: 'var(--font-size-lg)'
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* 새 에셋 생성 폼 */}
        <div className="asset-form">
          <div className="asset-form-header">
            <span style={{ fontSize: 'var(--font-size-xl)' }}>📷</span>
            <h2 className="asset-form-title">새 빈티지 에셋 생성</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
            <div className="form-grid">
              <input
                type="text"
                placeholder="에셋 이름을 입력하세요"
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
                className="input"
                style={{ borderColor: 'var(--color-accent)' }}
              />
              <div className="style-indicator">
                스타일: <span style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--color-accent)' }}>{styleName}</span>
                <span className="style-badge" style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent)' }}>클래식</span>
              </div>
            </div>
            <textarea
              placeholder="빈티지한 그래픽 생성을 위한 프롬프트를 입력하세요... (예: 복고풍 포스터, 세피아 톤, 오래된 종이 질감)"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="input textarea"
              style={{ borderColor: 'var(--color-accent)' }}
            />
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim() || !assetName.trim()}
              className="btn btn-primary"
              style={{ 
                backgroundColor: 'var(--color-accent)', 
                borderColor: 'var(--color-accent)',
                alignSelf: 'flex-start'
              }}
            >
              {isGenerating ? '생성 중...' : '빈티지 에셋 생성'}
            </button>
          </div>
        </div>

        {/* 에셋 목록 */}
        <div className="assets-container">
          <div className="assets-header">
            <h2 className="assets-title">생성된 빈티지 에셋</h2>
          </div>
          
          {isLoading ? (
            <div className="empty-state">
              <div className="empty-state-icon skeleton" style={{ backgroundColor: 'var(--color-accent-light)' }}>
                📷
              </div>
              <p className="empty-state-title">에셋을 불러오는 중...</p>
            </div>
          ) : assets.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon" style={{ backgroundColor: 'var(--color-accent-light)' }}>
                📷
              </div>
              <p className="empty-state-title">아직 생성된 빈티지 에셋이 없습니다</p>
              <p className="empty-state-description">위의 폼을 사용하여 첫 번째 빈티지 에셋을 생성해보세요</p>
            </div>
          ) : (
            <div className="assets-grid">
              {assets.map((asset) => (
                <div key={asset.id} className="asset-card">
                  <div className="asset-preview vintage">
                    {asset.imageUrl ? (
                      <img 
                        src={asset.imageUrl} 
                        alt={asset.name}
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          // Fallback to icon on error
                          e.currentTarget.style.display = 'none';
                          if (e.currentTarget.nextElementSibling) {
                            (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    <div className="asset-preview-placeholder" style={{ display: asset.imageUrl ? 'none' : 'flex' }}>
                      <div className="asset-preview-icon">
                        <span>📷</span>
                      </div>
                      <p style={{ fontSize: 'var(--font-size-xs)' }}>빈티지 이미지</p>
                    </div>
                  </div>
                  
                  <div className="asset-content">
                    <h3 className="asset-name">{asset.name}</h3>
                    <p className="asset-prompt">{asset.prompt}</p>
                    <div className="asset-meta" style={{ marginBottom: 'var(--spacing-3)' }}>
                      <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--spacing-1)' }}>
                        생성: {new Date(asset.createdAt).toLocaleDateString()}
                      </p>
                      {asset.updatedAt && (
                        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                          수정: {new Date(asset.updatedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    
                    <div className="asset-actions">
                      <button
                        onClick={() => handleEditStart(asset)}
                        className="asset-button"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleExport(asset)}
                        className="asset-button primary"
                        style={{ backgroundColor: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}
                      >
                        내보내기
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 에셋 수정 모달 */}
      <AssetEditModal
        isOpen={isEditModalOpen}
        onClose={handleEditCancel}
        asset={editingAsset}
        onSave={handleSaveAsset}
        onGenerateImage={handleGenerateImage}
        styleConfig={{
          name: '빈티지',
          icon: '📷',
          gradient: 'linear-gradient(135deg, var(--color-vintage-primary) 0%, #b8860b 100%)',
          accentColor: 'var(--color-vintage-primary)'
        }}
      />
    </div>
    </AuthGuard>
  )
}