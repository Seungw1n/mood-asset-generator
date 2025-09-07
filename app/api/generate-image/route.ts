import { NextRequest, NextResponse } from "next/server";
import { geminiImageGenerator } from "@/lib/gemini-image";
import { DatabaseService } from "@/lib/database";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, style, workspaceId, assetName } = body;

    // 입력 검증
    if (!prompt || !workspaceId || !assetName) {
      return NextResponse.json(
        { error: "Missing required fields: prompt, workspaceId, assetName" },
        { status: 400 }
      );
    }

    console.log('Generating image with params:', { prompt, style, workspaceId, assetName });
    
    // 이미진 생성 (Gemini Enhanced 사용) - Supabase Storage 정보 포함
    const result = await geminiImageGenerator.generateImage({
      prompt,
      style: style || 'realistic',
      aspectRatio: '1:1',
      quality: 'standard',
      assetName,
      workspaceId
    });
    
    console.log('Image generation result:', result);
    console.log('Generated image URL:', result.imageUrl);

    // 데이터베이스에 에셋 저장
    const asset = await DatabaseService.createAsset({
      workspace_id: workspaceId,
      name: assetName,
      prompt: result.prompt,
      image_url: result.imageUrl,
      metadata: {
        ...result.metadata,
        originalPrompt: prompt,
        generatedAt: new Date().toISOString()
      }
    });
    
    console.log('Created asset:', asset);

    return NextResponse.json({
      success: true,
      asset,
      imageGeneration: {
        imageUrl: result.imageUrl,
        enhancedPrompt: result.prompt,
        metadata: result.metadata
      }
    });

  } catch (error) {
    console.error("Image generation error:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to generate image",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}