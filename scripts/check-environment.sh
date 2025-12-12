#!/bin/bash
# 환경 설정 검증 스크립트
# 우분투 터미널에서 실행: bash scripts/check-environment.sh

echo "🔍 LinkPitch MVP 프로젝트 환경 검증"
echo "=================================="
echo ""

# 색상 정의
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# 1. Node.js 버전 확인
echo "1️⃣  Node.js 버전 확인..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'v' -f2 | cut -d'.' -f1)
    
    if [ "$NODE_MAJOR" -ge 20 ]; then
        echo -e "   ${GREEN}✅ Node.js $NODE_VERSION${NC}"
    else
        echo -e "   ${RED}❌ Node.js $NODE_VERSION (Node.js 20 이상 필요)${NC}"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "   ${RED}❌ Node.js가 설치되어 있지 않습니다${NC}"
    ERRORS=$((ERRORS + 1))
fi

# 2. nvm 확인
echo ""
echo "2️⃣  nvm 확인..."
if [ -s "$HOME/.nvm/nvm.sh" ]; then
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
    
    if command -v nvm &> /dev/null || [ -s "$NVM_DIR/nvm.sh" ]; then
        NVM_VERSION=$(nvm --version 2>/dev/null || echo "installed")
        echo -e "   ${GREEN}✅ nvm 설치됨 ($NVM_VERSION)${NC}"
        
        # nvm default 버전 확인
        DEFAULT_VERSION=$(nvm alias default 2>/dev/null | grep -o 'v[0-9]*\.[0-9]*\.[0-9]*' | head -1)
        if [ -n "$DEFAULT_VERSION" ]; then
            echo -e "   ${GREEN}   기본 버전: $DEFAULT_VERSION${NC}"
        fi
    else
        echo -e "   ${YELLOW}⚠️  nvm이 설치되어 있지만 로드되지 않았습니다${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "   ${YELLOW}⚠️  nvm이 설치되어 있지 않습니다 (선택사항)${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# 3. .nvmrc 파일 확인
echo ""
echo "3️⃣  .nvmrc 파일 확인..."
if [ -f ".nvmrc" ]; then
    NVMRC_VERSION=$(cat .nvmrc | tr -d '[:space:]')
    echo -e "   ${GREEN}✅ .nvmrc 파일 존재 (Node.js $NVMRC_VERSION)${NC}"
else
    echo -e "   ${YELLOW}⚠️  .nvmrc 파일이 없습니다${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# 4. pnpm 확인
echo ""
echo "4️⃣  pnpm 확인..."
if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm --version)
    echo -e "   ${GREEN}✅ pnpm $PNPM_VERSION${NC}"
else
    echo -e "   ${RED}❌ pnpm이 설치되어 있지 않습니다${NC}"
    echo "   설치 방법: npm install -g pnpm"
    ERRORS=$((ERRORS + 1))
fi

# 5. 환경 변수 확인
echo ""
echo "5️⃣  환경 변수 확인..."
ENV_FILE=".env.local"
if [ -f "$ENV_FILE" ]; then
    echo -e "   ${GREEN}✅ $ENV_FILE 파일 존재${NC}"
    
    # 필수 환경 변수 확인
    REQUIRED_VARS=(
        "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
        "CLERK_SECRET_KEY"
        "NEXT_PUBLIC_SUPABASE_URL"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        "SUPABASE_SERVICE_ROLE_KEY"
    )
    
    MISSING_VARS=0
    for VAR in "${REQUIRED_VARS[@]}"; do
        if ! grep -q "^${VAR}=" "$ENV_FILE" 2>/dev/null; then
            MISSING_VARS=$((MISSING_VARS + 1))
        fi
    done
    
    if [ $MISSING_VARS -eq 0 ]; then
        echo -e "   ${GREEN}✅ 필수 환경 변수 모두 설정됨${NC}"
    else
        echo -e "   ${YELLOW}⚠️  일부 환경 변수가 설정되지 않았습니다 ($MISSING_VARS개 누락)${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "   ${YELLOW}⚠️  $ENV_FILE 파일이 없습니다${NC}"
    echo "   .env.example을 참고하여 생성하세요"
    WARNINGS=$((WARNINGS + 1))
fi

# 6. PATH 확인
echo ""
echo "6️⃣  PATH 확인..."
NODE_PATH=$(which node 2>/dev/null)
if [[ "$NODE_PATH" == *".nvm"* ]]; then
    echo -e "   ${GREEN}✅ nvm의 Node.js 사용 중: $NODE_PATH${NC}"
elif [[ "$NODE_PATH" == *"/usr/bin/node"* ]]; then
    echo -e "   ${YELLOW}⚠️  시스템 Node.js 사용 중: $NODE_PATH${NC}"
    echo "   nvm을 사용하려면: nvm use 20"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "   ${YELLOW}⚠️  Node.js 경로: $NODE_PATH${NC}"
fi

# 7. 프로젝트 의존성 확인
echo ""
echo "7️⃣  프로젝트 의존성 확인..."
if [ -d "node_modules" ]; then
    echo -e "   ${GREEN}✅ node_modules 디렉토리 존재${NC}"
else
    echo -e "   ${YELLOW}⚠️  node_modules가 없습니다. pnpm install을 실행하세요${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# 결과 요약
echo ""
echo "=================================="
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ 모든 검증 통과!${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  경고 $WARNINGS개 (정상 작동 가능)${NC}"
    exit 0
else
    echo -e "${RED}❌ 오류 $ERRORS개 발견${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}   경고 $WARNINGS개${NC}"
    fi
    exit 1
fi

