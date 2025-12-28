import { auth } from '@clerk/nextjs/server';
import { getServiceRoleClient } from '@/lib/supabase/service-role';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ supabaseUserId: null }, { status: 401 });
    }

    const supabase = getServiceRoleClient();
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', clerkId)
      .single();

    if (error) {
      console.error('Supabase UUID 조회 오류:', error);
      return NextResponse.json({ supabaseUserId: null }, { status: 500 });
    }

    return NextResponse.json({ supabaseUserId: data?.id || null });
  } catch (error) {
    console.error('API 오류:', error);
    return NextResponse.json({ supabaseUserId: null }, { status: 500 });
  }
}
