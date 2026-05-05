import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email');
  const userId = request.nextUrl.searchParams.get('userId');

  const params = new URLSearchParams();
  if (email) params.set('email', email);
  if (userId) params.set('userId', userId);

  const apiUrl = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL;
  const res = await fetch(`${apiUrl}/v1/reports/journeys?${params}`, {
    headers: { 'X-Admin-Key': process.env.ADMIN_KEY ?? '' },
    cache: 'no-store',
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
