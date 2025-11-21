/**
 * @file analyze-url.ts
 * @description Vision 분석 Server Action
 *
 * URL을 입력받아 Vision AI로 분석하고 Prospect를 생성합니다.
 * PRD.md의 /webhook/analyze-url 명세를 따릅니다.
 */

'use server';

import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import type { Prospect, VisionData } from '@/types/prospect';

/**
 * URL에서 도메인 추출 헬퍼 함수
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    // URL 파싱 실패 시 원본 반환
    return url;
  }
}

/**
 * 도메인 기반 기본 contact_email 생성
 */
function generateDefaultContactEmail(domain: string): string {
  return `contact@${domain}`;
}

/**
 * Vision 분석 및 Prospect 생성
 * 
 * @param url 분석할 URL
 * @returns 생성된 Prospect 객체
 * @throws 에러 발생 시 예외 던짐
 */
export async function analyzeUrlAction(url: string): Promise<Prospect> {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized: 사용자 인증이 필요합니다.');
  }

  const n8nWebhookUrl = process.env.N8N_WEBHOOK_ANALYZE_URL;
  
  if (!n8nWebhookUrl) {
    throw new Error('N8N_WEBHOOK_ANALYZE_URL 환경 변수가 설정되지 않았습니다.');
  }

  // 1. n8n Webhook 호출
  const response = await fetch(n8nWebhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      user_id: userId,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Vision 분석 실패: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  const visionData: VisionData = result.vision_data;

  // 2. Supabase 클라이언트 생성
  const supabase = await createClerkSupabaseClient();

  // 3. 도메인 추출 및 기본 contact_email 생성
  const domain = extractDomain(url);
  const defaultContactEmail = generateDefaultContactEmail(domain);

  // 4. Prospect 생성
  const { data: prospect, error } = await supabase
    .from('prospects')
    .insert({
      user_id: userId,
      name: domain,
      contact_email: defaultContactEmail,
      url,
      vision_data: visionData,
      crm_status: 'cold',
      visit_count: 0,
    })
    .select()
    .single();

  if (error) {
    console.error('Prospect 생성 실패:', error);
    throw new Error(`Prospect 생성 실패: ${error.message}`);
  }

  if (!prospect) {
    throw new Error('Prospect 생성 실패: 데이터가 반환되지 않았습니다.');
  }

  return prospect as Prospect;
}


