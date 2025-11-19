/**
 * Supabase 데이터베이스 연결 테스트 스크립트
 * 
 * 사용법:
 *   npx tsx scripts/test-db.ts
 *   또는
 *   npm run test:db (package.json에 스크립트 추가 필요)
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

/**
 * 데이터베이스 연결 테스트 함수
 */
async function testConnection() {
  console.log('🔍 데이터베이스 연결 테스트 시작...\n');

  let successCount = 0;
  let failCount = 0;

  // 1. users 테이블 조회
  console.log('📊 [1/3] users 테이블 조회 중...');
  try {
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5);

    if (usersError) {
      console.error('❌ Users 조회 실패:', usersError.message);
      console.error('   코드:', usersError.code);
      console.error('   상세:', usersError);
      failCount++;
    } else {
      console.log('✅ Users 테이블 연결 성공!');
      console.log(`   조회된 레코드 수: ${users?.length || 0}`);
      if (users && users.length > 0) {
        console.log('   샘플 데이터:', JSON.stringify(users[0], null, 2));
      } else {
        console.log('   ⚠️  테이블이 비어있습니다.');
      }
      successCount++;
    }
  } catch (error) {
    console.error('❌ Users 조회 중 예외 발생:', error);
    failCount++;
  }

  console.log('');

  // 2. plans 테이블 조회
  console.log('📊 [2/3] plans 테이블 조회 중...');
  try {
    const { data: plans, error: plansError } = await supabase
      .from('plans')
      .select('*')
      .limit(5);

    if (plansError) {
      console.error('❌ Plans 조회 실패:', plansError.message);
      console.error('   코드:', plansError.code);
      console.error('   상세:', plansError);
      failCount++;
    } else {
      console.log('✅ Plans 테이블 연결 성공!');
      console.log(`   조회된 레코드 수: ${plans?.length || 0}`);
      if (plans && plans.length > 0) {
        console.log('   샘플 데이터:', JSON.stringify(plans[0], null, 2));
      } else {
        console.log('   ⚠️  테이블이 비어있습니다.');
      }
      successCount++;
    }
  } catch (error) {
    console.error('❌ Plans 조회 중 예외 발생:', error);
    failCount++;
  }

  console.log('');

  // 3. 테이블 목록 확인 (PostgreSQL information_schema 사용)
  console.log('📊 [3/3] 테이블 목록 조회 중...');
  try {
    // Supabase는 직접 information_schema에 접근할 수 없으므로
    // RPC 함수를 사용하거나 다른 방법을 사용해야 합니다.
    // 대신 간단한 쿼리로 테스트합니다.
    
    // 대안: 실제로 존재하는 테이블들을 직접 조회해봅니다
    const testTables = ['users', 'plans', 'profiles', 'subscriptions'];
    const existingTables: string[] = [];
    
    for (const tableName of testTables) {
      const { error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (!error) {
        existingTables.push(tableName);
      }
    }

    console.log('✅ 테이블 목록 조회 완료!');
    console.log(`   발견된 테이블 (${existingTables.length}개):`, existingTables.join(', '));
    
    if (existingTables.length === 0) {
      console.log('   ⚠️  접근 가능한 테이블이 없습니다. RLS 정책을 확인하세요.');
    }
    
    successCount++;
  } catch (error) {
    console.error('❌ 테이블 목록 조회 중 예외 발생:', error);
    failCount++;
  }

  // 결과 요약
  console.log('\n' + '='.repeat(50));
  console.log('📋 테스트 결과 요약');
  console.log('='.repeat(50));
  console.log(`✅ 성공: ${successCount}개`);
  console.log(`❌ 실패: ${failCount}개`);
  console.log('='.repeat(50));

  if (failCount === 0) {
    console.log('\n🎉 모든 테스트가 성공했습니다!');
    process.exit(0);
  } else {
    console.log('\n⚠️  일부 테스트가 실패했습니다. 위의 에러 메시지를 확인하세요.');
    process.exit(1);
  }
}

// 스크립트 실행
testConnection().catch((error) => {
  console.error('❌ 치명적 오류 발생:', error);
  process.exit(1);
});

