import { DatabaseService } from "@/lib/database";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const assets = await DatabaseService.getRecentAssets();
    return NextResponse.json(assets);
  } catch (error) {
    console.error('Error fetching assets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assets' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { workspace_id, name, prompt, image_url, metadata } = body;

    if (!workspace_id || !name || !prompt || !image_url) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const asset = await DatabaseService.createAsset({
      workspace_id,
      name,
      prompt,
      image_url,
      metadata
    });

    return NextResponse.json(asset);
  } catch (error) {
    console.error('Error creating asset:', error);
    return NextResponse.json(
      { error: 'Failed to create asset' },
      { status: 500 }
    );
  }
}