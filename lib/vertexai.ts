import { VertexAI } from '@google-cloud/vertexai';

const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

if (!projectId) {
  throw new Error("GOOGLE_CLOUD_PROJECT_ID is not set in environment variables");
}

// Vertex AI 클라이언트 설정
let vertex: VertexAI;

try {
  if (serviceAccountKey && serviceAccountKey !== 'YOUR_GOOGLE_SERVICE_ACCOUNT_JSON_KEY_HERE') {
    // JSON 키를 직접 사용
    const credentials = JSON.parse(serviceAccountKey);
    vertex = new VertexAI({
      project: projectId,
      location: location,
      googleAuthOptions: {
        credentials: credentials
      }
    });
  } else {
    // 기본 인증 사용 (Application Default Credentials)
    vertex = new VertexAI({
      project: projectId,
      location: location,
    });
  }
} catch (error) {
  console.warn('Failed to initialize Vertex AI with service account key, using default credentials:', error);
  vertex = new VertexAI({
    project: projectId,
    location: location,
  });
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

export class VertexAIImageGenerator {
  private model;

  constructor() {
    // Imagen 3 모델을 사용합니다 (최신 모델)
    this.model = vertex.preview.getGenerativeModel({
      model: 'imagen-3.0-generate-001',
    });
  }

  async generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
    try {
      const { prompt, style = 'realistic', aspectRatio = '1:1', sampleCount = 1 } = options;
      
      // 스타일에 맞는 프롬프트 강화
      const enhancedPrompt = this.enhancePromptWithStyle(prompt, style);
      
      console.log('Generating image with Vertex AI Imagen 3:', enhancedPrompt);
      
      const request = {
        contents: [{
          role: 'user',
          parts: [{
            text: `Generate an image: ${enhancedPrompt}`
          }]
        }],
        generationConfig: {
          maxOutputTokens: 8192,
          temperature: 0.4,
          topP: 0.8,
        }
      };
      
      const result = await this.model.generateContent(request);
      const response = result.response;
      
      console.log('Vertex AI response:', response);
      
      if (!response.candidates || response.candidates.length === 0) {
        console.log('No candidates in response, using fallback');
        throw new Error('No image generated from Vertex AI');
      }
      
      const candidate = response.candidates[0];
      let imageUrl: string;
      
      // Vertex AI Imagen 3의 응답 처리
      if (candidate.content?.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData) {
            // Base64 인라인 데이터
            imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            console.log('Generated image as base64 data URL');
            break;
          } else if (part.fileData && part.fileData.fileUri) {
            // 파일 URI
            imageUrl = part.fileData.fileUri;
            console.log('Generated image file URI:', imageUrl);
            break;
          }
        }
      }
      
      // 이미지 URL이 없으면 fallback 사용
      if (!imageUrl!) {
        console.log('No image URL found in response, using fallback');
        throw new Error('No image URL in response');
      }

      return {
        imageUrl,
        prompt: enhancedPrompt,
        metadata: {
          model: 'imagen-3.0-generate-001',
          timestamp: new Date().toISOString(),
          style
        }
      };
    } catch (error) {
      console.error('Vertex AI image generation failed:', error);
      
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

  private async generatePlaceholderImage(prompt: string): Promise<string> {
    // 기본 플레이스홀더 이미지 서비스 사용
    const encodedPrompt = encodeURIComponent(prompt.substring(0, 50));
    return `https://via.placeholder.com/512x512/cccccc/333333?text=${encodedPrompt}`;
  }
}

export const vertexAIImageGenerator = new VertexAIImageGenerator();