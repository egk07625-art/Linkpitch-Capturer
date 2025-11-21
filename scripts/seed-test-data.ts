/**
 * Supabase 테스트 데이터 삽입 스크립트
 * 
 * 사용법:
 *   npx tsx scripts/seed-test-data.ts
 *   또는
 *   npm run seed:test
 * 
 * 주의: 이 스크립트는 테스트 데이터를 삽입합니다.
 * RLS가 비활성화되어 있어야 합니다.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// 환경 변수 로드
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config({ path: resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 환경 변수 검증
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다!');
  console.error('필요한 환경 변수:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

console.log('🔍 Supabase 연결 정보:');
console.log(`   URL: ${supabaseUrl}`);
console.log(`   Key: ${supabaseKey.substring(0, 20)}...`);
console.log('');

// Supabase 클라이언트 생성
const supabase = createClient(supabaseUrl, supabaseKey);

// 삽입된 데이터 ID 저장용
const insertedIds: {
  users: string[];
  plans: string[];
  prospects: string[];
  sequences: string[];
  steps: string[];
  reportEvents: string[];
  generationLogs: string[];
  userPlans: string[];
} = {
  users: [],
  plans: [],
  prospects: [],
  sequences: [],
  steps: [],
  reportEvents: [],
  generationLogs: [],
  userPlans: [],
};

/**
 * 1. Users 테이블에 테스트 데이터 삽입
 */
async function insertUsers() {
  console.log('📊 [1/10] users 테이블에 테스트 데이터 삽입 중...');
  
  const testUsers = [
    {
      clerk_id: 'test_user_001',
      email: 'test1@example.com',
      name: '테스트 사용자 1',
    },
    {
      clerk_id: 'test_user_002',
      email: 'test2@example.com',
      name: '테스트 사용자 2',
    },
    {
      clerk_id: 'test_user_003',
      email: 'test3@example.com',
      name: '테스트 사용자 3',
    },
  ];

  try {
    const { data, error } = await supabase
      .from('users')
      .insert(testUsers)
      .select('id, clerk_id, email, name');

    if (error) {
      console.error('❌ Users 삽입 실패:', error.message);
      console.error('   코드:', error.code);
      throw error;
    }

    insertedIds.users = data.map((u) => u.id);
    console.log(`✅ Users 삽입 성공! (${data.length}개)`);
    data.forEach((user) => {
      console.log(`   - ${user.name} (${user.email}) - ID: ${user.id.substring(0, 8)}...`);
    });
    return data;
  } catch (error) {
    console.error('❌ Users 삽입 중 예외 발생:', error);
    throw error;
  }
}

/**
 * 2. Plans 테이블에 테스트 데이터 삽입
 */
async function insertPlans() {
  console.log('\n📊 [2/10] plans 테이블에 테스트 데이터 삽입 중...');
  
  const testPlans = [
    {
      code: 'basic',
      name: '베이직 플랜',
      description: '월 10건까지 이메일 발송 가능',
      monthly_quota: 10,
      price_krw: 0,
      is_active: true,
    },
    {
      code: 'standard',
      name: '스탠다드 플랜',
      description: '월 50건까지 이메일 발송 가능',
      monthly_quota: 50,
      price_krw: 29000,
      is_active: true,
    },
    {
      code: 'pro',
      name: '프로 플랜',
      description: '월 200건까지 이메일 발송 가능',
      monthly_quota: 200,
      price_krw: 99000,
      is_active: true,
    },
  ];

  try {
    const { data, error } = await supabase
      .from('plans')
      .upsert(testPlans, { onConflict: 'code' })
      .select('id, code, name, monthly_quota, price_krw');

    if (error) {
      console.error('❌ Plans 삽입 실패:', error.message);
      console.error('   코드:', error.code);
      throw error;
    }

    insertedIds.plans = data.map((p) => p.id);
    console.log(`✅ Plans 삽입 성공! (${data.length}개)`);
    data.forEach((plan) => {
      console.log(`   - ${plan.name} (${plan.code}): ${plan.monthly_quota}건/월, ${plan.price_krw}원`);
    });
    return data;
  } catch (error) {
    console.error('❌ Plans 삽입 중 예외 발생:', error);
    throw error;
  }
}

/**
 * 3. Prospects 테이블에 테스트 데이터 삽입
 */
async function insertProspects() {
  console.log('\n📊 [3/10] prospects 테이블에 테스트 데이터 삽입 중...');
  
  if (insertedIds.users.length === 0) {
    throw new Error('Users가 먼저 삽입되어야 합니다.');
  }

  const testProspects = [
    {
      user_id: insertedIds.users[0],
      name: '테크 스타트업 A',
      contact_name: '김대표',
      contact_email: 'ceo@techstartup-a.com',
      url: 'https://techstartup-a.com',
      memo: 'AI 솔루션에 관심이 있는 스타트업',
    },
    {
      user_id: insertedIds.users[0],
      name: '이커머스 브랜드 B',
      contact_name: '이마케터',
      contact_email: 'marketer@brand-b.com',
      url: 'https://brand-b.com',
      memo: '온라인 쇼핑몰 운영 중',
    },
    {
      user_id: insertedIds.users[1],
      name: '서비스 회사 C',
      contact_name: '박매니저',
      contact_email: 'manager@service-c.com',
      url: 'https://service-c.com',
      memo: 'B2B 서비스 제공',
    },
  ];

  try {
    const { data, error } = await supabase
      .from('prospects')
      .insert(testProspects)
      .select('id, name, contact_email, user_id');

    if (error) {
      console.error('❌ Prospects 삽입 실패:', error.message);
      console.error('   코드:', error.code);
      throw error;
    }

    insertedIds.prospects = data.map((p) => p.id);
    console.log(`✅ Prospects 삽입 성공! (${data.length}개)`);
    data.forEach((prospect) => {
      console.log(`   - ${prospect.name} (${prospect.contact_email})`);
    });
    return data;
  } catch (error) {
    console.error('❌ Prospects 삽입 중 예외 발생:', error);
    throw error;
  }
}

/**
 * 4. Sequences 테이블에 테스트 데이터 삽입
 */
async function insertSequences() {
  console.log('\n📊 [4/10] sequences 테이블에 테스트 데이터 삽입 중...');
  
  if (insertedIds.users.length === 0 || insertedIds.prospects.length === 0) {
    throw new Error('Users와 Prospects가 먼저 삽입되어야 합니다.');
  }

  const testSequences = [
    {
      user_id: insertedIds.users[0],
      prospect_id: insertedIds.prospects[0],
      name: '테크 스타트업 A 캠페인',
      sequence_type: '9_steps',
      total_steps: 9,
      current_step: 0,
      status: 'draft',
    },
    {
      user_id: insertedIds.users[0],
      prospect_id: insertedIds.prospects[1],
      name: '이커머스 브랜드 B 캠페인',
      sequence_type: '9_steps',
      total_steps: 9,
      current_step: 2,
      status: 'active',
    },
    {
      user_id: insertedIds.users[1],
      prospect_id: insertedIds.prospects[2],
      name: '서비스 회사 C 캠페인',
      sequence_type: '9_steps',
      total_steps: 9,
      current_step: 0,
      status: 'draft',
    },
  ];

  try {
    const { data, error } = await supabase
      .from('sequences')
      .insert(testSequences)
      .select('id, name, sequence_type, status, user_id');

    if (error) {
      console.error('❌ Sequences 삽입 실패:', error.message);
      console.error('   코드:', error.code);
      throw error;
    }

    insertedIds.sequences = data.map((s) => s.id);
    console.log(`✅ Sequences 삽입 성공! (${data.length}개)`);
    data.forEach((sequence) => {
      console.log(`   - ${sequence.name} (${sequence.sequence_type}, ${sequence.status})`);
    });
    return data;
  } catch (error) {
    console.error('❌ Sequences 삽입 중 예외 발생:', error);
    throw error;
  }
}

/**
 * 5. Step 테이블에 테스트 데이터 삽입
 */
async function insertSteps() {
  console.log('\n📊 [5/10] step 테이블에 테스트 데이터 삽입 중...');
  
  if (insertedIds.users.length === 0 || insertedIds.sequences.length === 0) {
    throw new Error('Users와 Sequences가 먼저 삽입되어야 합니다.');
  }

  const testSteps = [
    {
      user_id: insertedIds.users[0],
      sequence_id: insertedIds.sequences[0],
      step_number: 1,
      step_type: 'Hook',
      email_subject: '안녕하세요, 테크 스타트업 A님',
      email_body: '귀하의 비즈니스에 대해 관심이 있습니다...',
      status: 'pending',
      is_core_step: true,
    },
    {
      user_id: insertedIds.users[0],
      sequence_id: insertedIds.sequences[0],
      step_number: 2,
      step_type: 'Problem',
      email_subject: '요즘 테크 스타트업의 공통적인 고민',
      email_body: '저희 제품은 다음과 같은 이점을 제공합니다...',
      status: 'pending',
      is_core_step: false,
    },
    {
      user_id: insertedIds.users[0],
      sequence_id: insertedIds.sequences[1],
      step_number: 1,
      step_type: 'Hook',
      email_subject: '이커머스 브랜드 B님께',
      email_body: '온라인 판매 성장에 관심이 있으시군요...',
      status: 'sent',
      sent_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      is_core_step: true,
    },
    {
      user_id: insertedIds.users[0],
      sequence_id: insertedIds.sequences[1],
      step_number: 3,
      step_type: 'Value',
      email_subject: '추가 정보를 공유드립니다',
      email_body: '이전 이메일에 이어서...',
      status: 'sent',
      sent_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      is_core_step: true,
    },
  ];

  try {
    const { data, error } = await supabase
      .from('step')
      .insert(testSteps)
      .select('id, step_number, step_type, status, sequence_id');

    if (error) {
      console.error('❌ Steps 삽입 실패:', error.message);
      console.error('   코드:', error.code);
      throw error;
    }

    insertedIds.steps = data.map((s) => s.id);
    console.log(`✅ Steps 삽입 성공! (${data.length}개)`);
    data.forEach((step) => {
      console.log(`   - Step ${step.step_number} (${step.step_type}, ${step.status})`);
    });
    return data;
  } catch (error) {
    console.error('❌ Steps 삽입 중 예외 발생:', error);
    throw error;
  }
}

/**
 * 6. Report_events 테이블에 테스트 데이터 삽입
 */
async function insertReportEvents() {
  console.log('\n📊 [6/8] report_events 테이블에 테스트 데이터 삽입 중...');
  
  if (
    insertedIds.users.length === 0 ||
    insertedIds.prospects.length === 0
  ) {
    throw new Error('Users와 Prospects가 먼저 삽입되어야 합니다.');
  }

  const testReportEvents = [
    {
      user_id: insertedIds.users[0],
      prospect_id: insertedIds.prospects[1],
      event_type: 'view',
      metadata: {
        scroll_depth: 0,
        dwell_seconds: 0,
      },
    },
    {
      user_id: insertedIds.users[0],
      prospect_id: insertedIds.prospects[1],
      event_type: 'scroll_50',
      metadata: {
        scroll_depth: 0.5,
        dwell_seconds: 15,
      },
    },
    {
      user_id: insertedIds.users[0],
      prospect_id: insertedIds.prospects[1],
      event_type: 'scroll_80',
      metadata: {
        scroll_depth: 0.8,
        dwell_seconds: 35,
      },
    },
    {
      user_id: insertedIds.users[0],
      prospect_id: insertedIds.prospects[0],
      event_type: 'dwell_10s',
      metadata: {
        scroll_depth: 0.3,
        dwell_seconds: 12,
      },
    },
    {
      user_id: insertedIds.users[0],
      prospect_id: insertedIds.prospects[0],
      event_type: 'dwell_30s',
      metadata: {
        scroll_depth: 0.9,
        dwell_seconds: 45,
      },
    },
  ];

  try {
    const { data, error } = await supabase
      .from('report_events')
      .insert(testReportEvents)
      .select('id, event_type, prospect_id');

    if (error) {
      console.error('❌ Report_events 삽입 실패:', error.message);
      console.error('   코드:', error.code);
      throw error;
    }

    insertedIds.reportEvents = data.map((e) => e.id);
    console.log(`✅ Report_events 삽입 성공! (${data.length}개)`);
    data.forEach((event) => {
      console.log(`   - ${event.event_type} (Prospect: ${event.prospect_id.substring(0, 8)}...)`);
    });
    return data;
  } catch (error) {
    console.error('❌ Report_events 삽입 중 예외 발생:', error);
    throw error;
  }
}

/**
 * 7. Generation_logs 테이블에 테스트 데이터 삽입
 */
async function insertGenerationLogs() {
  console.log('\n📊 [7/8] generation_logs 테이블에 테스트 데이터 삽입 중...');
  
  if (
    insertedIds.users.length === 0 ||
    insertedIds.prospects.length === 0
  ) {
    throw new Error('Users와 Prospects가 먼저 삽입되어야 합니다.');
  }

  const testGenerationLogs = [
    {
      user_id: insertedIds.users[0],
      prospect_id: insertedIds.prospects[0],
      step_number: 1,
      step_type: 'Hook',
      model_name: 'gemini-3.0-pro',
      input_tokens: 500,
      output_tokens: 300,
    },
    {
      user_id: insertedIds.users[0],
      prospect_id: insertedIds.prospects[1],
      step_number: 3,
      step_type: 'Value',
      model_name: 'gemini-3.0-pro',
      input_tokens: 600,
      output_tokens: 350,
    },
  ];

  try {
    const { data, error } = await supabase
      .from('generation_logs')
      .insert(testGenerationLogs)
      .select('id, step_type, step_number, model_name');

    if (error) {
      console.error('❌ Generation_logs 삽입 실패:', error.message);
      console.error('   코드:', error.code);
      throw error;
    }

    insertedIds.generationLogs = data.map((g) => g.id);
    console.log(`✅ Generation_logs 삽입 성공! (${data.length}개)`);
    data.forEach((log) => {
      console.log(`   - Step ${log.step_number} (${log.step_type}) - ${log.model_name}`);
    });
    return data;
  } catch (error) {
    console.error('❌ Generation_logs 삽입 중 예외 발생:', error);
    throw error;
  }
}

/**
 * 8. User_plans 테이블에 테스트 데이터 삽입
 */
async function insertUserPlans() {
  console.log('\n📊 [8/8] user_plans 테이블에 테스트 데이터 삽입 중...');
  
  if (insertedIds.users.length === 0 || insertedIds.plans.length === 0) {
    throw new Error('Users와 Plans가 먼저 삽입되어야 합니다.');
  }

  const testUserPlans = [
    {
      user_id: insertedIds.users[0],
      plan_id: insertedIds.plans[1], // standard
      is_current: true,
      started_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      user_id: insertedIds.users[1],
      plan_id: insertedIds.plans[0], // basic
      is_current: true,
      started_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      user_id: insertedIds.users[2],
      plan_id: insertedIds.plans[2], // pro
      is_current: true,
      started_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  try {
    const { data, error } = await supabase
      .from('user_plans')
      .insert(testUserPlans)
      .select('id, user_id, plan_id, is_current');

    if (error) {
      console.error('❌ User_plans 삽입 실패:', error.message);
      console.error('   코드:', error.code);
      throw error;
    }

    insertedIds.userPlans = data.map((up) => up.id);
    console.log(`✅ User_plans 삽입 성공! (${data.length}개)`);
    data.forEach((userPlan) => {
      console.log(`   - User ${userPlan.user_id.substring(0, 8)}... → Plan ${userPlan.plan_id.substring(0, 8)}...`);
    });
    return data;
  } catch (error) {
    console.error('❌ User_plans 삽입 중 예외 발생:', error);
    throw error;
  }
}

/**
 * 삽입된 데이터 검증
 */
async function verifyInsertedData() {
  console.log('\n' + '='.repeat(50));
  console.log('🔍 삽입된 데이터 검증 중...');
  console.log('='.repeat(50));

  const tables = [
    { name: 'users', count: insertedIds.users.length },
    { name: 'plans', count: insertedIds.plans.length },
    { name: 'prospects', count: insertedIds.prospects.length },
    { name: 'sequences', count: insertedIds.sequences.length },
    { name: 'step', count: insertedIds.steps.length },
    { name: 'report_events', count: insertedIds.reportEvents.length },
    { name: 'generation_logs', count: insertedIds.generationLogs.length },
    { name: 'user_plans', count: insertedIds.userPlans.length },
  ];

  let allVerified = true;

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table.name)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error(`❌ ${table.name} 검증 실패:`, error.message);
        allVerified = false;
      } else {
        const actualCount = count || 0;
        if (actualCount >= table.count) {
          console.log(`✅ ${table.name}: ${actualCount}개 레코드 확인`);
        } else {
          console.log(`⚠️  ${table.name}: ${actualCount}개 (예상: ${table.count}개)`);
        }
      }
    } catch (error) {
      console.error(`❌ ${table.name} 검증 중 예외:`, error);
      allVerified = false;
    }
  }

  // 외래키 관계 검증
  console.log('\n🔗 외래키 관계 검증 중...');
  
  try {
    // sequences가 users와 prospects를 참조하는지 확인
    const { data: sequences, error: seqError } = await supabase
      .from('sequences')
      .select('id, user_id, prospect_id')
      .in('id', insertedIds.sequences.slice(0, 1));

    if (!seqError && sequences && sequences.length > 0) {
      const seq = sequences[0];
      const hasValidUser = insertedIds.users.includes(seq.user_id);
      const hasValidProspect = insertedIds.prospects.includes(seq.prospect_id);
      
      if (hasValidUser && hasValidProspect) {
        console.log('✅ Sequences 외래키 관계 정상');
      } else {
        console.log('⚠️  Sequences 외래키 관계 확인 필요');
      }
    }
  } catch (error) {
    console.error('❌ 외래키 검증 중 예외:', error);
  }

  return allVerified;
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('🚀 테스트 데이터 삽입 시작...\n');

  try {
    // 외래키 관계를 고려한 순서로 삽입
    await insertUsers();
    await insertPlans();
    await insertProspects();
    await insertSequences();
    await insertSteps();
    await insertReportEvents();
    await insertGenerationLogs();
    await insertUserPlans();

    // 데이터 검증
    await verifyInsertedData();

    // 결과 요약
    console.log('\n' + '='.repeat(50));
    console.log('📋 삽입 결과 요약');
    console.log('='.repeat(50));
    console.log(`✅ Users: ${insertedIds.users.length}개`);
    console.log(`✅ Plans: ${insertedIds.plans.length}개`);
    console.log(`✅ Prospects: ${insertedIds.prospects.length}개`);
    console.log(`✅ Sequences: ${insertedIds.sequences.length}개`);
    console.log(`✅ Steps: ${insertedIds.steps.length}개`);
    console.log(`✅ Report_events: ${insertedIds.reportEvents.length}개`);
    console.log(`✅ Generation_logs: ${insertedIds.generationLogs.length}개`);
    console.log(`✅ User_plans: ${insertedIds.userPlans.length}개`);
    console.log('='.repeat(50));

    console.log('\n🎉 모든 테스트 데이터가 성공적으로 삽입되었습니다!');
    console.log('\n💡 Supabase 대시보드에서 확인하세요:');
    console.log('   - Table Editor에서 각 테이블의 데이터 확인');
    console.log('   - updated_at 트리거가 자동으로 작동하는지 확인');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ 테스트 데이터 삽입 실패:', error);
    process.exit(1);
  }
}

// 스크립트 실행
main();

