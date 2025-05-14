
import { suggestEventDetails } from '@/ai/flows/suggest-event-details';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Ensure this API route is treated as dynamic

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Assuming suggestEventDetails is a function that can be called directly.
    // If it's a Genkit flow object with an 'invoke' method:
    // const result = await suggestEventDetails.invoke(body);
    // If suggestEventDetails is the direct async function:
    const result = await suggestEventDetails(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[API /api/genkit-flow] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}
