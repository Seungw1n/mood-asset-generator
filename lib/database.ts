import { supabase, type Workspace, type Asset, WORKSPACE_MAP } from './supabaseClient'

export class DatabaseService {
  // 워크스페이스 관련 함수들
  static async getWorkspaces(): Promise<Workspace[]> {
    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .order('created_at')

    if (error) {
      console.error('Error fetching workspaces:', error)
      throw new Error('워크스페이스를 불러오는데 실패했습니다.')
    }

    return data || []
  }

  static async getWorkspaceByName(name: string): Promise<Workspace | null> {
    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .eq('name', name)
      .single()

    if (error) {
      console.error('Error fetching workspace:', error)
      return null
    }

    return data
  }

  static async getWorkspaceByKey(key: string): Promise<Workspace | null> {
    const workspaceName = WORKSPACE_MAP[key]
    if (!workspaceName) {
      throw new Error(`Invalid workspace key: ${key}`)
    }

    return this.getWorkspaceByName(workspaceName)
  }

  // 에셋 관련 함수들
  static async getAssets(workspaceId: string): Promise<Asset[]> {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching assets:', error)
      throw new Error('에셋을 불러오는데 실패했습니다.')
    }

    return data || []
  }

  static async getAssetById(assetId: string): Promise<Asset | null> {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('id', assetId)
      .single()

    if (error) {
      console.error('Error fetching asset:', error)
      return null
    }

    return data
  }

  static async createAsset(asset: {
    workspace_id: string
    name: string
    prompt: string
    image_url: string
    metadata?: any
  }): Promise<Asset> {
    const { data, error } = await supabase
      .from('assets')
      .insert([
        {
          workspace_id: asset.workspace_id,
          name: asset.name,
          prompt: asset.prompt,
          image_url: asset.image_url,
          metadata: asset.metadata || {}
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creating asset:', error)
      throw new Error('에셋 생성에 실패했습니다.')
    }

    return data
  }

  static async updateAsset(
    assetId: string, 
    updates: {
      name?: string
      prompt?: string
      image_url?: string
      metadata?: any
    }
  ): Promise<Asset> {
    // metadata에 updated_at 추가
    const updatedMetadata = {
      ...(updates.metadata || {}),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('assets')
      .update({
        ...updates,
        metadata: updatedMetadata
      })
      .eq('id', assetId)
      .select()
      .single()

    if (error) {
      console.error('Error updating asset:', error)
      throw new Error('에셋 수정에 실패했습니다.')
    }

    return data
  }

  static async deleteAsset(assetId: string): Promise<void> {
    const { error } = await supabase
      .from('assets')
      .delete()
      .eq('id', assetId)

    if (error) {
      console.error('Error deleting asset:', error)
      throw new Error('에셋 삭제에 실패했습니다.')
    }
  }

  // 통계 및 유틸리티 함수들
  static async getAssetCount(workspaceId: string): Promise<number> {
    const { count, error } = await supabase
      .from('assets')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)

    if (error) {
      console.error('Error counting assets:', error)
      return 0
    }

    return count || 0
  }

  static async getRecentAssets(limit: number = 10): Promise<Asset[]> {
    const { data, error } = await supabase
      .from('assets')
      .select(`
        *,
        workspaces (
          name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching recent assets:', error)
      return []
    }

    return data || []
  }
}