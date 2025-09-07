import { GoogleAuth } from 'google-auth-library';

const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

if (!projectId) {
  throw new Error("GOOGLE_CLOUD_PROJECT_ID is not set in environment variables");
}

export interface ImageGenerationOptions {
  prompt: string;
  style?: string;
  aspectRatio?: '1:1' | '16:9' | '9:16';
  quality?: 'standard' | 'hd';
  negativePrompt?: string;
  sampleCount?: number;
}

export interface ImageGenerationResult {
  imageUrl: string;
  prompt: string;
  metadata: {
    model: string;
    timestamp: string;
    style?: string;
  };
}

export class ImagenGenerator {
  private auth: GoogleAuth;
  private endpoint: string;

  constructor() {
    this.auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });
    this.endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/imagegeneration@006:predict`;
  }

  async generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
    try {
      const { prompt, style = 'realistic', aspectRatio = '1:1', sampleCount = 1 } = options;
      
      // 스타일에 맞는 프롬프트 강화
      const enhancedPrompt = this.enhancePromptWithStyle(prompt, style);
      
      console.log('Generating image with Google Imagen:', enhancedPrompt);
      
      // Google Auth 클라이언트 얻기
      const authClient = await this.auth.getClient();
      
      const requestBody = {
        instances: [{
          prompt: enhancedPrompt,
          sampleCount: sampleCount,
          aspectRatio: aspectRatio,
          safetyFilterLevel: "block_some",
          personGeneration: "dont_allow"
        }],
        parameters: {
          sampleCount: sampleCount
        }
      };

      const response = await authClient.request({
        url: this.endpoint,
        method: 'POST',
        data: requestBody,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Imagen API response status:', response.status);
      
      if (response.status !== 200) {
        throw new Error(`Imagen API returned status ${response.status}`);
      }

      const responseData = response.data as any;
      
      if (!responseData.predictions || responseData.predictions.length === 0) {
        console.log('No predictions in response:', responseData);
        throw new Error('No image generated from Imagen');
      }

      const prediction = responseData.predictions[0];
      let imageUrl: string;

      if (prediction.bytesBase64Encoded) {
        // Base64 인코딩된 이미지
        imageUrl = `data:image/png;base64,${prediction.bytesBase64Encoded}`;
        console.log('Generated image as base64 data URL');
      } else if (prediction.gcsUri) {
        // Google Cloud Storage URI
        imageUrl = prediction.gcsUri;
        console.log('Generated image GCS URI:', imageUrl);
      } else {
        throw new Error('No image data in prediction response');
      }

      return {
        imageUrl,
        prompt: enhancedPrompt,
        metadata: {
          model: 'imagegeneration@006',
          timestamp: new Date().toISOString(),
          style
        }
      };

    } catch (error) {
      console.error('Imagen generation failed:', error);
      
      // Fallback to enhanced placeholder image
      const enhancedPrompt = this.enhancePromptWithStyle(options.prompt, options.style || 'realistic');
      const imageUrl = await this.generateEnhancedPlaceholder(enhancedPrompt, options.style);
      
      return {
        imageUrl,
        prompt: enhancedPrompt,
        metadata: {
          model: 'fallback-placeholder',
          timestamp: new Date().toISOString(),
          style: options.style || 'realistic'
        }
      };
    }
  }

  private enhancePromptWithStyle(prompt: string, style: string): string {
    const styleEnhancements: Record<string, string> = {
      'analog': 'warm colors, hand-drawn texture, natural feeling, vintage aesthetic, film grain, analog photography style',
      'metal': 'cold metallic surfaces, industrial design, sharp edges, chrome finish, modern technology, metallic textures',
      'vintage': 'classic retro style, faded colors, aged paper texture, nostalgic mood, antique elements, vintage aesthetic',
      'realistic': 'photorealistic, high detail, natural lighting, professional photography, 8k resolution'
    };

    const enhancement = styleEnhancements[style] || styleEnhancements['realistic'];
    return `${prompt}, ${enhancement}, high quality, detailed, professional`;
  }

  private async generateEnhancedPlaceholder(prompt: string, style?: string): Promise<string> {
    // 스타일별 색상 및 아이콘
    const styleConfig = {
      'analog': { bg: 'E8F5E8', color: '2D5A3D', emoji: '📻' },
      'metal': { bg: 'E5E7EB', color: '374151', emoji: '🔧' },
      'vintage': { bg: 'FEF3C7', color: '92400E', emoji: '📰' },
      'realistic': { bg: 'F3F4F6', color: '111827', emoji: '🎨' }
    };
    
    const config = styleConfig[style as keyof typeof styleConfig] || styleConfig.realistic;
    const shortPrompt = encodeURIComponent(prompt.substring(0, 40));
    
    return `https://via.placeholder.com/512x512/${config.bg}/${config.color}?text=${config.emoji}+${shortPrompt}`;
  }
}

export const imagenGenerator = new ImagenGenerator();