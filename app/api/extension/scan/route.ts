/**
 * Chrome Extension에서 수집한 Clean Scan 데이터를 수신하는 API 엔드포인트
 * 
 * Extension에서 .se-viewer 또는 .se-main-container 내부의 순수 HTML을 추출하여
 * 이 API로 전송하면, 웹앱에서 Prospect를 생성하고 Vision AI 분석을 진행합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getServiceRoleClient } from '@/lib/supabase/service-role';

export async function POST(request: NextRequest) {
  try {
    // 1. 인증 확인
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    // 2. 요청 본문 파싱
    const body = await request.json();
    const { url, clean_html, main_images, text_length } = body;

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'MISSING_URL', message: 'URL이 필요합니다.' },
        { status: 400 }
      );
    }

    // 3. 사용자 UUID 조회
    const supabase = getServiceRoleClient();
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', clerkId)
      .single();

    if (!userData) {
      return NextResponse.json(
        { success: false, error: 'USER_NOT_FOUND', message: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 4. Domain 추출
    const extractDomain = (url: string) => {
      try {
        const hostname = new URL(url).hostname;
        return hostname.startsWith('www.') ? hostname.substring(4) : hostname;
      } catch {
        return url;
      }
    };

    // 5. Prospect 생성 (Clean Scan 데이터 포함)
    const { data: prospect, error: prospectError } = await supabase
      .from('prospects')
      .insert({
        user_id: userData.id,
        name: extractDomain(url),
        contact_email: `info@${extractDomain(url)}`, // Placeholder
        url,
        clean_html: clean_html || null,
        main_images: main_images || null,
        text_length: text_length || null,
        vision_data: {}, // n8n 분석 후 업데이트됨
      })
      .select()
      .single();

    if (prospectError) {
      console.error('Failed to create prospect:', prospectError);
      return NextResponse.json(
        {
          success: false,
          error: 'DATABASE_ERROR',
          message: '프로스펙트 생성에 실패했습니다.',
        },
        { status: 500 }
      );
    }

    // 6. 성공 응답
    return NextResponse.json({
      success: true,
      prospect_id: prospect.id,
      redirect_url: `/prospects/${prospect.id}/mix`,
      message: 'Clean Scan 데이터가 저장되었습니다.',
    });
  } catch (error) {
    console.error('Extension scan API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: '서버 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}





























