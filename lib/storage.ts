import { supabase } from './supabaseClient';

export class StorageService {
  private static readonly BUCKET_NAME = 'asset-images';

  /**
   * URL에서 이미지를 다운로드하여 Supabase Storage에 업로드
   */
  static async uploadImageFromUrl(imageUrl: string, fileName: string): Promise<string> {
    try {
      console.log('Downloading image from URL:', imageUrl);
      
      // 외부 URL에서 이미지 다운로드
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }

      const imageBlob = await response.blob();
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      
      // 파일 확장자 결정
      const extension = this.getExtensionFromContentType(contentType);
      const finalFileName = fileName.endsWith(extension) ? fileName : `${fileName}${extension}`;
      
      console.log(`Uploading image to Supabase Storage: ${finalFileName}`);
      console.log(`Content type: ${contentType}, Size: ${imageBlob.size} bytes`);

      // Supabase Storage에 업로드
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(finalFileName, imageBlob, {
          contentType,
          upsert: true, // 같은 이름의 파일이 있으면 덮어쓰기
        });

      if (error) {
        throw new Error(`Supabase upload error: ${error.message}`);
      }

      console.log('Upload successful:', data);

      // 업로드된 파일의 public URL 가져오기
      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(finalFileName);

      console.log('Generated public URL:', urlData.publicUrl);
      return urlData.publicUrl;

    } catch (error) {
      console.error('Error uploading image to storage:', error);
      throw error;
    }
  }

  /**
   * 파일을 직접 Supabase Storage에 업로드
   */
  static async uploadImageFile(file: Blob, fileName: string): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(fileName, file, {
          upsert: true,
        });

      if (error) {
        throw new Error(`Supabase upload error: ${error.message}`);
      }

      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading file to storage:', error);
      throw error;
    }
  }

  /**
   * 이미지 삭제
   */
  static async deleteImage(fileName: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([fileName]);

      if (error) {
        throw new Error(`Failed to delete image: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting image from storage:', error);
      throw error;
    }
  }

  /**
   * Content-Type에서 파일 확장자 추출
   */
  private static getExtensionFromContentType(contentType: string): string {
    switch (contentType.toLowerCase()) {
      case 'image/jpeg':
      case 'image/jpg':
        return '.jpg';
      case 'image/png':
        return '.png';
      case 'image/gif':
        return '.gif';
      case 'image/webp':
        return '.webp';
      case 'image/svg+xml':
        return '.svg';
      default:
        return '.jpg'; // 기본값
    }
  }

  /**
   * 고유한 파일명 생성
   */
  static generateUniqueFileName(assetName: string, workspaceId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const sanitizedName = assetName.replace(/[^a-zA-Z0-9]/g, '_');
    return `${workspaceId}/${sanitizedName}_${timestamp}_${random}`;
  }

  /**
   * 스토리지 버킷이 존재하는지 확인하고 없으면 생성
   */
  static async ensureBucketExists(): Promise<void> {
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === this.BUCKET_NAME);
      
      if (!bucketExists) {
        console.log(`Creating bucket: ${this.BUCKET_NAME}`);
        const { error } = await supabase.storage.createBucket(this.BUCKET_NAME, {
          public: true,
          fileSizeLimit: 10485760, // 10MB
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        });

        if (error) {
          throw new Error(`Failed to create bucket: ${error.message}`);
        }
      }
    } catch (error) {
      console.error('Error ensuring bucket exists:', error);
      // 버킷 생성 실패는 치명적이지 않으므로 경고만 출력
    }
  }
}