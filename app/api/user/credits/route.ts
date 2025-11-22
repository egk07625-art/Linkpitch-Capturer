import { NextResponse } from 'next/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const supabase = createClerkSupabaseClient();
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Fetch user credits from database
    const { data: user, error } = await supabase
      .from('users')
      .select('credits')
      .eq('clerk_id', clerkId)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      credits: user.credits,
    });
  } catch (error) {
    console.error('Failed to fetch credits:', error);
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
