import { NextResponse } from 'next/server';

/**
 * GET route handler
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  return NextResponse.json({ 
    message: "This endpoint works",
    id: params.id
  });
}

/**
 * PATCH route handler
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  return NextResponse.json({ 
    message: "PATCH endpoint works",
    id: params.id 
  });
}

/**
 * DELETE route handler
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  return NextResponse.json({ 
    message: "DELETE endpoint works",
    id: params.id 
  });
} 