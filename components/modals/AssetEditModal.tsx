"use client";

import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';

interface Asset {
  id: string;
  dbId: string;
  name: string;
  imageUrl: string;
  prompt: string;
  createdAt: string;
  updatedAt?: string;
  style: string;
}

interface AssetEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: Asset | null;
  onSave: (name: string, prompt: string, imageUrl?: string) => Promise<void>;
  onGenerateImage: (prompt: string) => Promise<string>;
  styleConfig: {
    name: string;
    icon: string;
    gradient: string;
    accentColor: string;
  };
}

export default function AssetEditModal({
  isOpen,
  onClose,
  asset,
  onSave,
  onGenerateImage,
  styleConfig
}: AssetEditModalProps) {
  const [editName, setEditName] = useState('');
  const [editPrompt, setEditPrompt] = useState('');
  const [previewImage, setPreviewImage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 에셋이 변경될 때 폼 초기화
  useEffect(() => {
    if (asset) {
      setEditName(asset.name);
      setEditPrompt(asset.prompt);
      setPreviewImage('');
      setError(null);
    }
  }, [asset]);

  const handleGenerateNewImage = async () => {
    if (!editPrompt.trim()) return;
    
    try {
      setIsGenerating(true);
      setError(null);
      const newImageUrl = await onGenerateImage(editPrompt);
      setPreviewImage(newImageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : '이미지 생성에 실패했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!editName.trim()) {
      setError('에셋 이름을 입력해주세요.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      await onSave(editName, editPrompt, previewImage || asset?.imageUrl);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (isSaving || isGenerating) return;
    onClose();
  };

  if (!asset) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      size="lg"
      showCloseButton={!isSaving && !isGenerating}
    >
      <div>
        {/* 헤더 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-3)',
          marginBottom: 'var(--spacing-6)'
        }}>
          <div style={{
            width: '2.5rem',
            height: '2.5rem',
            background: styleConfig.gradient,
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'var(--font-size-lg)'
          }}>
            {styleConfig.icon}
          </div>
          <h3 style={{
            fontSize: 'var(--font-size-xl)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--color-text-primary)',
            margin: 0
          }}>
            {styleConfig.name} 에셋 수정
          </h3>
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
            marginBottom: 'var(--spacing-4)'
          }}>
            {error}
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 'var(--spacing-6)'
        }}>
          {/* 이미지 미리보기 */}
          <div>
            <label className="form-label" style={{ marginBottom: 'var(--spacing-3)' }}>
              이미지 미리보기
            </label>
            <div style={{
              aspectRatio: '1',
              background: styleConfig.gradient,
              borderRadius: 'var(--radius-xl)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              overflow: 'hidden',
              position: 'relative'
            }}>
              {(previewImage || asset.imageUrl) ? (
                <img 
                  src={previewImage || asset.imageUrl} 
                  alt={asset.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: '4rem',
                    height: '4rem',
                    margin: '0 auto var(--spacing-2)',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: 'var(--radius-lg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem'
                  }}>
                    {styleConfig.icon}
                  </div>
                  <p style={{ fontSize: 'var(--font-size-sm)', opacity: 0.9 }}>
                    이미지를 생성해보세요
                  </p>
                </div>
              )}
              
              {isGenerating && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white'
                }}>
                  <div style={{
                    width: '2rem',
                    height: '2rem',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginBottom: 'var(--spacing-2)'
                  }}></div>
                  <p style={{ fontSize: 'var(--font-size-sm)' }}>생성 중...</p>
                </div>
              )}
            </div>
          </div>

          {/* 폼 입력 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
            {/* 에셋 이름 */}
            <div className="form-field">
              <label className="form-label">에셋 이름</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="input"
                placeholder="에셋 이름을 입력하세요"
                disabled={isSaving || isGenerating}
              />
            </div>

            {/* 프롬프트 */}
            <div className="form-field" style={{ flex: 1 }}>
              <label className="form-label">프롬프트</label>
              <textarea
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                rows={4}
                className="input textarea"
                placeholder={`${styleConfig.name} 스타일 그래픽 생성을 위한 프롬프트를 입력하세요...`}
                disabled={isSaving || isGenerating}
                style={{ resize: 'vertical', minHeight: '100px' }}
              />
            </div>

            {/* 이미지 생성 버튼 */}
            <button
              onClick={handleGenerateNewImage}
              disabled={!editPrompt.trim() || isGenerating || isSaving}
              className="btn btn-secondary"
              style={{ width: '100%' }}
            >
              {isGenerating ? '생성 중...' : '새 이미지 생성'}
            </button>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="modal-actions" style={{ marginTop: 'var(--spacing-6)' }}>
          <button
            onClick={handleClose}
            disabled={isSaving || isGenerating}
            className="btn btn-secondary"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={!editName.trim() || isSaving || isGenerating}
            className="btn btn-primary"
            style={{
              backgroundColor: styleConfig.accentColor,
              borderColor: styleConfig.accentColor
            }}
          >
            {isSaving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </Modal>
  );
}