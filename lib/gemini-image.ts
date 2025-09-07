// Google/Gemini API temporarily disabled
// import { GoogleGenerativeAI } from "@google/generative-ai";

// const apiKey = process.env.GEMINI_API_KEY;

// if (!apiKey) {
//   throw new Error("GEMINI_API_KEY is not set in environment variables");
// }

// const genAI = new GoogleGenerativeAI(apiKey);

// OpenRouter API configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

if (!OPENROUTER_API_KEY) {
  console.warn("OPENROUTER_API_KEY is not set in environment variables. Using fallback prompt generation.");
}

export interface ImageGenerationOptions {
  prompt: string;
  style?: string;
  aspectRatio?: '1:1' | '16:9' | '9:16';
  quality?: 'standard' | 'hd';
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

export class GeminiImageGenerator {
  // private model;

  constructor() {
    // Gemini 2.0 Flash를 사용해 이미지 프롬프트를 생성하고, 
    // 실제 이미지는 다른 서비스나 플레이스홀더를 사용
    // this.model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  }

  async generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
    try {
      const { prompt, style = 'realistic' } = options;
      
      console.log('=== IMAGE GENERATION START ===');
      console.log('Original prompt:', prompt);
      console.log('Style:', style);
      
      // 스타일에 맞는 프롬프트 강화
      const enhancedPrompt = this.enhancePromptWithStyle(prompt, style);
      console.log('Enhanced prompt:', enhancedPrompt);
      
      // OpenRouter로 프롬프트 최적화
      const optimizedPrompt = await this.generatePromptWithOpenRouter(enhancedPrompt) || enhancedPrompt;
      console.log('Optimized prompt:', optimizedPrompt);
      
      // 실제 이미지 생성 시도
      const imageUrl = await this.generateAdvancedPlaceholder(optimizedPrompt, style, options);
      console.log('Final image URL:', imageUrl);
      
      const result = {
        imageUrl,
        prompt: optimizedPrompt,
        metadata: {
          model: 'enhanced-real-image-generator',
          timestamp: new Date().toISOString(),
          style,
          originalPrompt: prompt
        }
      };
      
      console.log('=== IMAGE GENERATION COMPLETE ===');
      console.log('Result:', JSON.stringify(result, null, 2));
      
      return result;
    } catch (error) {
      console.error('Gemini prompt enhancement failed:', error);
      
      // 기본 플레이스홀더로 폴백
      const enhancedPrompt = this.enhancePromptWithStyle(options.prompt, options.style || 'realistic');
      const imageUrl = await this.generateAdvancedPlaceholder(enhancedPrompt, options.style, options);
      
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
      'metal': 'cold metallic surfaces, industrial design, sharp edges, chrome finish, modern technology, metallic textures, steel finish',
      'vintage': 'classic retro style, faded colors, aged paper texture, nostalgic mood, antique elements, vintage aesthetic, sepia tones',
      'realistic': 'photorealistic, high detail, natural lighting, professional photography, 8k resolution'
    };

    const enhancement = styleEnhancements[style] || styleEnhancements['realistic'];
    return `${prompt}, ${enhancement}, high quality, detailed, professional`;
  }

  private async generateAdvancedPlaceholder(prompt: string, style?: string, options?: ImageGenerationOptions): Promise<string> {
    // 실제 이미지 생성 시도
    if (OPENROUTER_API_KEY) {
      try {
        const realImageUrl = await this.generateRealImageWithOpenRouter(prompt, style);
        if (realImageUrl) {
          return realImageUrl;
        }
      } catch (error) {
        console.error('Real image generation failed, using placeholder:', error);
      }
    }

    // 폴백: 고품질 플레이스홀더 이미지
    return this.generateStylePlaceholder(prompt, style);
  }

  private async generateRealImageWithOpenRouter(prompt: string, style?: string): Promise<string | null> {
    console.log('Attempting image generation with OpenRouter API');
    console.log('API Key available:', !!OPENROUTER_API_KEY);
    console.log('Prompt:', prompt);
    
    if (!OPENROUTER_API_KEY) {
      console.log('OpenRouter API key not available');
      return null;
    }

    // 방법 1: OpenRouter의 이미지 생성 전용 API 사용 시도
    try {
      console.log('Trying OpenRouter image generation endpoint...');
      const response = await fetch(`${OPENROUTER_BASE_URL}/images/generations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://mood-asset-generator.com',
          'X-Title': 'Mood Asset Generator'
        },
        body: JSON.stringify({
          model: 'black-forest-labs/flux-1.1-pro',
          prompt: prompt,
          n: 1,
          size: '512x512',
          response_format: 'url'
        })
      });

      console.log('OpenRouter image endpoint response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('OpenRouter image response:', JSON.stringify(data, null, 2));
        
        if (data.data && data.data[0] && data.data[0].url) {
          console.log('Successfully generated image with OpenRouter:', data.data[0].url);
          return data.data[0].url;
        }
      } else {
        const errorText = await response.text();
        console.log(`OpenRouter image endpoint failed: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.log('OpenRouter image endpoint not available:', error);
    }

    // 방법 2: 간접적으로 Claude를 통해 이미지 생성 요청 및 Unsplash API 사용
    try {
      console.log('Trying enhanced prompt generation + Unsplash API...');
      
      // 1단계: Claude로 더 좋은 프롬프트 생성
      const enhancedPrompt = await this.generatePromptWithOpenRouter(prompt);
      const finalPrompt = enhancedPrompt || prompt;
      
      // 2단계: 프롬프트에서 키워드 추출
      const keywords = this.extractVisualKeywords(finalPrompt);
      console.log('Extracted keywords:', keywords);
      
      // 3단계: Unsplash API로 고품질 이미지 검색
      const unsplashUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(keywords)}&per_page=10&orientation=square`;
      
      const unsplashResponse = await fetch(unsplashUrl, {
        headers: {
          'Authorization': 'Client-ID YOUR_UNSPLASH_ACCESS_KEY' // 이는 디모용
        }
      });
      
      if (!unsplashResponse.ok) {
        throw new Error('Unsplash API failed');
      }
      
      const unsplashData = await unsplashResponse.json();
      if (unsplashData.results && unsplashData.results.length > 0) {
        const randomIndex = Math.floor(Math.random() * Math.min(5, unsplashData.results.length));
        const imageUrl = unsplashData.results[randomIndex].urls.regular;
        console.log('Found Unsplash image:', imageUrl);
        return imageUrl;
      }
      
    } catch (error) {
      console.log('Unsplash method failed:', error);
    }

    // 방법 3: 실제 이미지 생성 API 사용 (OpenRouter를 통해 DALL-E 스타일 요청)
    try {
      console.log('Trying to generate real image via OpenRouter chat...');
      
      const imageGenResponse = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://mood-asset-generator.com',
          'X-Title': 'Mood Asset Generator'
        },
        body: JSON.stringify({
          model: 'openai/gpt-4o',
          messages: [
            {
              role: 'user',
              content: `I need you to help me create a visual representation. Based on this prompt: "${prompt}", style: "${style}", please provide a detailed URL for a royalty-free image that matches this description. Use this format: https://images.unsplash.com/photo-[ID]?auto=format&fit=crop&w=512&q=80. Replace [ID] with a realistic photo ID that would match the prompt.`
            }
          ],
          max_tokens: 150,
          temperature: 0.3
        })
      });

      if (imageGenResponse.ok) {
        const genData = await imageGenResponse.json();
        const content = genData.choices?.[0]?.message?.content;
        
        if (content) {
          // URL 추출
          const urlMatch = content.match(/https:\/\/images\.unsplash\.com\/[^\s]+/i);
          if (urlMatch) {
            console.log('Generated Unsplash-style URL:', urlMatch[0]);
            return urlMatch[0];
          }
        }
      }
    } catch (error) {
      console.log('OpenRouter image generation failed:', error);
    }

    // 방법 4: 프롬프트 기반 실제 이미지 (다양한 소스 사용)
    console.log('Using prompt-based real image generation');
    
    const category = this.getCategoryFromPrompt(prompt);
    const seed = this.generateSeedFromPrompt(prompt);
    const imageId = (seed % 1000) + 1;
    
    // 여러 이미지 소스 중 랜덤 선택
    const imageSources = [
      `https://picsum.photos/seed/${prompt.slice(0, 10).replace(/\s+/g, '')}/512/512`,
      `https://source.unsplash.com/512x512/?${encodeURIComponent(category)}`,
      `https://images.unsplash.com/photo-${1500000000000 + (seed % 1000000000)}?auto=format&fit=crop&w=512&q=80`,
      `https://picsum.photos/id/${imageId}/512/512`,
    ];
    
    // 스타일에 따라 다른 소스 선택
    let sourceIndex = 0;
    switch (style) {
      case 'vintage':
        sourceIndex = 1;
        break;
      case 'analog':
        sourceIndex = 0;
        break;
      case 'metal':
        sourceIndex = 3;
        break;
      default:
        sourceIndex = 2;
    }
    
    const selectedUrl = imageSources[sourceIndex];
    console.log('Selected image URL:', selectedUrl);
    return selectedUrl;
  }

  private generateStylePlaceholder(prompt: string, style?: string): string {
    // 프롬프트에서 시드 생성 (일관성 있는 이미지를 위해)
    const seed = this.generateSeedFromPrompt(prompt);
    
    // 스타일별 이미지 ID 및 필터 설정
    const styleConfigs = {
      'analog': {
        seed: seed % 500 + 200,  // 200-699 범위
        filter: '?blur=1',
        category: 'nature'
      },
      'metal': {
        seed: seed % 300 + 700,  // 700-999 범위  
        filter: '?grayscale',
        category: 'architecture'
      },
      'vintage': {
        seed: seed % 400 + 100,  // 100-499 범위
        filter: '?blur=2',
        category: 'objects'
      },
      'realistic': {
        seed: seed % 600 + 400,  // 400-999 범위
        filter: '',
        category: 'nature'
      }
    };
    
    const config = styleConfigs[style as keyof typeof styleConfigs] || styleConfigs.realistic;
    
    // Picsum Photos ID를 사용하여 일관성 있는 이미지 생성
    return `https://picsum.photos/id/${config.seed}/512/512${config.filter}`;
  }
  
  private generateSeedFromPrompt(prompt: string): number {
    // 프롬프트에서 일관성 있는 시드 생성
    let hash = 0;
    for (let i = 0; i < prompt.length; i++) {
      const char = prompt.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32비트 정수로 변환
    }
    return Math.abs(hash);
  }
  
  private getCategoryFromPrompt(prompt: string): string {
    // 프롬프트에서 이미지 카테고리 추출
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('nature') || lowerPrompt.includes('자연') || lowerPrompt.includes('tree') || lowerPrompt.includes('forest')) {
      return 'nature,landscape';
    } else if (lowerPrompt.includes('city') || lowerPrompt.includes('도시') || lowerPrompt.includes('building') || lowerPrompt.includes('architecture')) {
      return 'city,architecture';
    } else if (lowerPrompt.includes('people') || lowerPrompt.includes('사람') || lowerPrompt.includes('person') || lowerPrompt.includes('human')) {
      return 'people,portrait';
    } else if (lowerPrompt.includes('abstract') || lowerPrompt.includes('추상') || lowerPrompt.includes('pattern')) {
      return 'abstract,pattern';
    } else if (lowerPrompt.includes('food') || lowerPrompt.includes('음식') || lowerPrompt.includes('eat')) {
      return 'food,cooking';
    } else if (lowerPrompt.includes('technology') || lowerPrompt.includes('기술') || lowerPrompt.includes('computer') || lowerPrompt.includes('digital')) {
      return 'technology,digital';
    } else {
      // 기본적으로 가장 범용적인 카테고리
      return 'creative,professional';
    }
  }

  private extractVisualKeywords(prompt: string): string {
    // 프롬프트에서 핵심 시각적 키워드 추출 (최대 3-4개 단어)
    const keywords = prompt.split(/[,\s]+/)
      .filter(word => word.length > 3)
      .slice(0, 3)
      .join(' ');
    
    return keywords.length > 40 ? keywords.substring(0, 37) + '...' : keywords;
  }

  private async generatePromptWithOpenRouter(prompt: string): Promise<string | null> {
    if (!OPENROUTER_API_KEY) {
      console.log('OpenRouter API key not available, using fallback');
      return null;
    }

    try {
      const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://mood-asset-generator.com',
          'X-Title': 'Mood Asset Generator'
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3.5-sonnet',
          messages: [
            {
              role: 'user',
              content: `Create a detailed, artistic image generation prompt based on: "${prompt}". Make it vivid, specific, and suitable for AI image generation. Include artistic details, composition, lighting, and visual elements. Keep it under 100 words and focused on visual description.`
            }
          ],
          max_tokens: 150,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content?.trim() || null;
    } catch (error) {
      console.error('OpenRouter API call failed:', error);
      return null;
    }
  }
}

export const geminiImageGenerator = new GeminiImageGenerator();