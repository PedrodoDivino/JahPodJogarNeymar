import { NextResponse } from 'next/server';
import { checkNeymarMatch } from '@/lib/api';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const result = await checkNeymarMatch();
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        playing: false,
        match: null,
        nextMatch: null,
        error: 'Erro ao verificar. Tente novamente.',
      },
      { status: 500 }
    );
  }
}