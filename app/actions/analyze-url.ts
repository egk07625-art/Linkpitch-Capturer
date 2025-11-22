'use server';

import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';

export async function analyzeUrl(url: string) {
  const supabase = createClerkSupabaseClient();
  
  // 1. Get current user from Clerk
  const { userId: clerkId } = await auth();
  
  if (!clerkId) {
    return {
      success: false,
      error: 'UNAUTHORIZED',
      message: '로그인이 필요합니다.',
    };
  }

  // 2. Fetch user from database
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, credits')
    .eq('clerk_id', clerkId)
    .single();

  if (userError || !user) {
    return {
      success: false,
      error: 'USER_NOT_FOUND',
      message: '사용자 정보를 찾을 수 없습니다.',
    };
  }

  // 3. Check if user has credits
  if (user.credits <= 0) {
    return {
      success: false,
      error: 'NO_CREDITS',
      message: '무료 횟수가 모두 소진되었습니다. 더 많은 분석을 위해 플랜을 업그레이드하세요.',
    };
  }

  // 4. Proceed with analysis (simulate network delay)
  await new Promise((resolve) => setTimeout(resolve, 3500));

  // Mock ID generation
  const mockId = 'mock-id-' + Math.random().toString(36).substring(7);

  // 5. Deduct 1 credit after successful analysis
  const { error: updateError } = await supabase
    .from('users')
    .update({ credits: user.credits - 1 })
    .eq('id', user.id);

  if (updateError) {
    console.error('Failed to deduct credit:', updateError);
    // Continue anyway - don't block the user
  }

  // In a real implementation, this would trigger the AI analysis pipeline
  // and store the initial results in the database.

  return {
    success: true,
    redirectUrl: `/prospects/${mockId}/mix`,
    remainingCredits: user.credits - 1,
  };
}
