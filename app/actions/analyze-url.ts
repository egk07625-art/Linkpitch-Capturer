'use server';

import { getServiceRoleClient } from '@/lib/supabase/service-role';
import { auth } from '@clerk/nextjs/server';

interface AnalyzeUrlOptions {
  url: string;
  clean_html?: string;
  main_images?: string[];
  text_length?: number;
}

export async function analyzeUrl(options: AnalyzeUrlOptions | string) {
  // 문자열로 전달된 경우 (기존 호환성)
  const url = typeof options === 'string' ? options : options.url;
  const clean_html = typeof options === 'string' ? undefined : options.clean_html;
  const main_images = typeof options === 'string' ? undefined : options.main_images;
  const text_length = typeof options === 'string' ? undefined : options.text_length;
  // Use Service Role client to bypass RLS (no RLS policies needed)
  const supabase = getServiceRoleClient();
  
  // 1. Get current user from Clerk
  const { userId: clerkId } = await auth();
  
  if (!clerkId) {
    return {
      success: false,
      error: 'UNAUTHORIZED',
      message: '로그인이 필요합니다.',
    };
  }

  // 2. Fetch user's UUID from database (or create if missing)
  let userUuid: string;
  
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', clerkId)
    .single();

  if (userError || !userData) {
    console.log('User not found in Supabase. Creating new user...');
    // Fetch user details from Clerk to insert
    const { clerkClient } = await import('@clerk/nextjs/server');
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(clerkId);
    const email = clerkUser.emailAddresses[0]?.emailAddress;

    if (!email) {
      return { success: false, error: 'NO_EMAIL', message: '이메일 정보를 찾을 수 없습니다.' };
    }

    // Use existing Service Role client (already bypasses RLS)
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        clerk_id: clerkId,
        email: email,
        name: clerkUser.fullName || clerkUser.username || email,
      })
      .select('id')
      .single();

    if (createError || !newUser) {
      console.error('Failed to create user:', createError);
      return { success: false, error: 'USER_CREATION_FAILED', message: '사용자 생성에 실패했습니다.' };
    }
    userUuid = newUser.id;
  } else {
    userUuid = userData.id;
  }



  const extractDomain = (url: string) => {
    try {
      const hostname = new URL(url).hostname;
      return hostname.startsWith('www.') ? hostname.substring(4) : hostname;
    } catch {
      return url;
    }
  };

  // 3. n8n Webhook 호출 (6가지 방법론 기반 Vision AI 분석)
  let vision_data = {};
  const n8nWebhookUrl = process.env.N8N_WEBHOOK_ANALYZE_URL;
  
  if (n8nWebhookUrl) {
    try {
      const response = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          user_id: clerkId,
          clean_html,
          main_images,
          text_length,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        vision_data = result.vision_data || {};
      } else {
        console.warn('n8n webhook 호출 실패, 기본 데이터로 진행:', response.status);
      }
    } catch (error) {
      console.error('n8n webhook 호출 중 오류:', error);
      // n8n 호출 실패 시에도 Prospect는 생성하되, vision_data는 빈 객체로 진행
    }
  }

  // 4. Create Prospect (Clean Scan 데이터 포함)
  const { data: prospect, error: prospectError } = await supabase
    .from('prospects')
    .insert({
      user_id: userUuid,
      name: extractDomain(url),
      contact_email: `info@${extractDomain(url)}`, // Placeholder
      url,
      clean_html: clean_html || null,
      main_images: main_images || null,
      text_length: text_length || null,
      vision_data: vision_data,
    })
    .select()
    .single();

  if (prospectError) {
    console.error('Failed to create prospect:', prospectError);
    return {
      success: false,
      error: 'DATABASE_ERROR',
      message: '프로스펙트 생성에 실패했습니다.',
    };
  }

  return {
    success: true,
    redirectUrl: `/prospects/${prospect.id}/mix`,
  };
}
