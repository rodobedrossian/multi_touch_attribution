import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const from = request.nextUrl.searchParams.get('from');
  const to = request.nextUrl.searchParams.get('to');
  const model = request.nextUrl.searchParams.get('model') ?? 'last_touch';

  const apiUrl = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL;
  const res = await fetch(`${apiUrl}/v1/reports/channels?from=${from}&to=${to}&model=${model}`, {
    headers: { 'X-Admin-Key': process.env.ADMIN_KEY ?? '' },
    cache: 'no-store',
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
