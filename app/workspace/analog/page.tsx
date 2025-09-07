'use client'

import { useState, useEffect } from 'react'
import { DatabaseService } from '@/lib/database'
import type { Asset as DbAsset } from '@/lib/supabaseClient'
import AuthGuard from '../../../components/auth/AuthGuard'
import AssetEditModal from '../../../components/modals/AssetEditModal'
import { useToast } from '../../../components/ui/Toast'

interface Asset {
  id: string
  name: string
  imageUrl: string
  prompt: string
  createdAt: string
  updatedAt?: string
  style: string
}

interface ConvertedAsset extends Asset {
  dbId: string
}

export default function AnalogWorkspacePage() {
  const [assets, setAssets] = useState<ConvertedAsset[]>([])
  const [prompt, setPrompt] = useState('')
  const [assetName, setAssetName] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [editingAsset, setEditingAsset] = useState<ConvertedAsset | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  
  const { showToast, ToastContainer } = useToast()

  const styleName = '아날로그'
  const styleDescription = '따뜻하고 아날로그적인 느낌의 그래픽 스타일'

  const convertDbAssetToAsset = (dbAsset: DbAsset): ConvertedAsset => ({
    id: dbAsset.id,
    dbId: dbAsset.id,
    name: dbAsset.name || 'Untitled',
    imageUrl: dbAsset.image_url || '/placeholder-asset.png',
    prompt: dbAsset.prompt || '',
    createdAt: dbAsset.created_at,
    updatedAt: dbAsset.metadata?.updated_at,
    style: 'analog'
  })

  useEffect(() => {
    const loadWorkspaceAndAssets = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const workspace = await DatabaseService.getWorkspaceByKey('analog')
        if (!workspace) {
          throw new Error('아날로그 워크스페이스를 찾을 수 없습니다.')
        }
        
        setWorkspaceId(workspace.id)
        const dbAssets = await DatabaseService.getAssets(workspace.id)
        const convertedAssets = dbAssets.map(convertDbAssetToAsset)
        setAssets(convertedAssets)
      } catch (err) {
        setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    loadWorkspaceAndAssets()
  }, [])

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
          style: 'analog',
          workspaceId: workspaceId,
          assetName: assetName
        })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate image')
      }
      
      console.log('API Response:', result)
      console.log('Generated Image URL:', result.imageGeneration?.imageUrl)
      
      // result.asset에서 이미지 URL 확인
      const newAsset = convertDbAssetToAsset(result.asset)
      console.log('Converted Asset:', newAsset)
      
      setAssets(prev => [newAsset, ...prev])
      setPrompt('')
      setAssetName('')
      
      // 토스트 알림 표시
      if (result.success && result.imageGeneration?.realImageGenerated) {
        showToast('🎨 AI로 실제 이미지가 생성되었습니다!', 'success')
      } else {
        showToast('⚠️ 임시 이미지로 생성되었습니다. OpenRouter API 확인이 필요합니다.', 'info')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '에셋 생성에 실패했습니다.'
      setError(errorMessage)
      showToast(`❌ 이미지 생성 실패: ${errorMessage}`, 'error')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleEditStart = (asset: ConvertedAsset) => {
    setEditingAsset(asset)
    setIsEditModalOpen(true)
  }

  const handleEditCancel = () => {
    setEditingAsset(null)
    setIsEditModalOpen(false)
  }

  const handleGenerateImage = async (prompt: string): Promise<string> => {
    // 실제 이미지 생성 로직 (현재는 플레이스홀더)
    return `/placeholder-asset-${Date.now()}.png`
  }

  const handleSaveAsset = async (name: string, prompt: string, imageUrl?: string) => {
    if (!editingAsset) return
    
    const dbAsset = await DatabaseService.updateAsset(editingAsset.dbId, {
      name,
      prompt,
      image_url: imageUrl || editingAsset.imageUrl
    })
    
    const updatedAsset = convertDbAssetToAsset(dbAsset)
    setAssets(prev => prev.map(a => a.id === editingAsset.id ? updatedAsset : a))
    setEditingAsset(null)
    setIsEditModalOpen(false)
  }

  const handleExport = (asset: ConvertedAsset) => {
    // TODO: 실제 export 기능 구현
    const link = document.createElement('a')
    link.href = asset.imageUrl
    link.download = `${asset.name}.png`
    link.click()
  }

  if (isLoading) {
    return (
      <div className="theme-analog" style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg-secondary)' }}>
        <div className="container" style={{ padding: 'var(--spacing-8)', textAlign: 'center' }}>
          <div style={{ color: 'var(--color-accent)', marginBottom: 'var(--spacing-4)' }}>
            <span style={{ fontSize: '2rem' }}>📻</span>
          </div>
          <p style={{ color: 'var(--color-text-secondary)' }}>아날로그 워크스페이스를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <AuthGuard>
    <div className="theme-analog" style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg-secondary)' }}>
      {error && (
        <div style={{ 
          backgroundColor: '#fee', 
          color: '#c33', 
          padding: 'var(--spacing-3)', 
          margin: 'var(--spacing-4)', 
          borderRadius: 'var(--radius-md)',
          border: '1px solid #fcc'
        }}>
          <strong>오류:</strong> {error}
          <button 
            onClick={() => setError(null)}
            style={{ float: 'right', background: 'none', border: 'none', color: '#c33', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}
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
                <span style={{ fontSize: '2rem' }}>📻</span>
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
        {/* 새 에셋 생성 폼 */}
        <div className="asset-form">
          <div className="asset-form-header">
            <span style={{ fontSize: 'var(--font-size-xl)' }}>📻</span>
            <h2 className="asset-form-title">새 아날로그 에셋 생성</h2>
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
                <span className="style-badge" style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent)' }}>따뜻함</span>
              </div>
            </div>
            <textarea
              placeholder="아날로그한 그래픽 생성을 위한 프롬프트를 입력하세요... (예: 따뜻한 색감, 손그림 질감, 자연스러운 느낌)"
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
              {isGenerating ? '생성 중...' : '아날로그 에셋 생성'}
            </button>
          </div>
        </div>

        {/* 에셋 목록 */}
        <div className="assets-container">
          <div className="assets-header">
            <h2 className="assets-title">생성된 아날로그 에셋</h2>
          </div>
          
          {assets.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon" style={{ backgroundColor: 'var(--color-accent-light)' }}>
                📻
              </div>
              <p className="empty-state-title">아직 생성된 아날로그 에셋이 없습니다</p>
              <p className="empty-state-description">위의 폼을 사용하여 첫 번째 아날로그 에셋을 생성해보세요</p>
            </div>
          ) : (
            <div className="assets-grid">
              {assets.map((asset) => (
                <div key={asset.id} className="asset-card">
                  <div className="asset-preview analog">
                    {asset.imageUrl ? (
                      <img 
                        src={asset.imageUrl} 
                        alt={asset.name}
                        className="w-full h-full object-cover rounded-lg"
                        onLoad={(e) => {
                          console.log('Image loaded successfully:', asset.imageUrl);
                        }}
                        onError={(e) => {
                          console.error('Image failed to load:', asset.imageUrl);
                          // 대체 이미지로 시도
                          const img = e.currentTarget;
                          if (!img.dataset.fallbackAttempted) {
                            img.dataset.fallbackAttempted = 'true';
                            const fallbackUrl = `https://picsum.photos/seed/${asset.id}/512/512`;
                            console.log('Trying fallback image:', fallbackUrl);
                            img.src = fallbackUrl;
                          } else {
                            // 대체 이미지도 실패한 경우 아이콘 표시
                            img.style.display = 'none';
                            if (img.nextElementSibling) {
                              (img.nextElementSibling as HTMLElement).style.display = 'flex';
                            }
                          }
                        }}
                      />
                    ) : null}
                    <div className="asset-preview-placeholder" style={{ display: asset.imageUrl ? 'none' : 'flex' }}>
                      <div className="asset-preview-icon">
                        <span>📻</span>
                      </div>
                      <p style={{ fontSize: 'var(--font-size-xs)' }}>Loading image...</p>
                      <p style={{ fontSize: 'var(--font-size-xs)', opacity: 0.7 }}>{asset.prompt.substring(0, 30)}...</p>
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
          name: '아날로그',
          icon: '📻',
          gradient: 'linear-gradient(135deg, var(--color-analog-primary) 0%, #0f7b3c 100%)',
          accentColor: 'var(--color-analog-primary)'
        }}
      />
      <ToastContainer />
    </div>
    </AuthGuard>
  )
}