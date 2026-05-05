import { NextResponse } from 'next/server';

export async function GET() {
  const apiUrl = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL;
  const res = await fetch(`${apiUrl}/v1/settings/write-keys`, {
    headers: { 'X-Admin-Key': process.env.ADMIN_KEY ?? '' },
    cache: 'no-store',
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
