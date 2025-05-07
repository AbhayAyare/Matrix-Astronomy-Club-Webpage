import { getSiteContent } from '@/services/content';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await getSiteContent();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching site content:", error);
    return NextResponse.json({ error: 'Failed to fetch site content' }, { status: 500 });
  }
}