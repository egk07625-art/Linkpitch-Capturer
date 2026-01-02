# Chrome Extension 연동 가이드

## 개요

LinkPitch Chrome Extension은 네이버 스마트스토어 상세페이지에서 **Clean Scan** 데이터를 수집하여 웹앱으로 전송합니다.

## Extension 위치

Extension은 프로젝트와 같은 레벨에 위치합니다:

```
LinkPitch-MVP-project/
├── linkpitch-extension/        # Chrome Extension
└── LinkPitch-MVP-project-main/ # 웹앱
```

## 설치 방법

1. Chrome 브라우저에서 `chrome://extensions/` 접속
2. 우측 상단 "개발자 모드" 활성화
3. "압축해제된 확장 프로그램을 로드합니다" 클릭
4. `linkpitch-extension` 폴더 선택
5. Extension 아이콘이 툴바에 표시되는지 확인

## 데이터 수집 프로세스

### 현재 구현 (v1.0)

Extension은 다음 단계로 동작합니다:

1. **페이지 확장**: "펼쳐보기", "상품정보 더보기" 버튼 자동 클릭
2. **고정 요소 제거**: 헤더, 푸터, 플로팅 버튼 등 숨김
3. **스크린샷 캡처**: "상세정보 접기" 버튼까지 스크롤하며 여러 장 캡처
4. **이미지 합성**: 캡처한 이미지들을 하나로 합성
5. **n8n Webhook 전송**: 합성된 이미지와 URL을 n8n으로 전송

### 향후 개선 (Clean Scan)

PRD에 따르면 다음 데이터도 수집해야 합니다:

- `clean_html`: `.se-viewer` 또는 `.se-main-container` 내부의 순수 HTML
- `main_images`: 본문 내 주요 이미지 URL 리스트
- `text_length`: 본문 텍스트 길이 (완독률 분모용)

## 웹앱 연동 방법

### 옵션 1: Extension → 웹앱 API 직접 호출 (권장)

Extension에서 웹앱 API로 Clean Scan 데이터를 직접 전송:

```javascript
// Extension의 popup.js 또는 content.js에서
const response = await fetch('https://your-domain.com/api/extension/scan', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    // 인증 토큰 필요 (Clerk 세션)
  },
  body: JSON.stringify({
    url: window.location.href,
    clean_html: extractedHtml,
    main_images: imageUrls,
    text_length: textLength,
  }),
});
```

**장점**:
- 웹앱에서 직접 데이터 수신 및 Prospect 생성 가능
- 인증 처리 간단 (Clerk 세션 활용)

**단점**:
- Extension에서 인증 토큰 획득 필요

### 옵션 2: Extension → n8n → 웹앱

현재 구현 방식 (Extension → n8n Webhook):

1. Extension이 n8n으로 이미지 전송
2. n8n에서 Vision AI 분석 수행
3. n8n이 웹앱 API로 분석 결과 전송

**장점**:
- Extension 코드 변경 최소화
- n8n에서 중앙 집중식 처리

**단점**:
- Clean Scan 데이터(HTML) 전송 구조 변경 필요

## API 엔드포인트

### POST `/api/extension/scan`

Extension에서 Clean Scan 데이터를 수신하는 엔드포인트.

**요청 본문**:
```json
{
  "url": "https://smartstore.naver.com/products/123456",
  "clean_html": "<div class='se-viewer'>...</div>",
  "main_images": [
    "https://image1.jpg",
    "https://image2.jpg"
  ],
  "text_length": 1234
}
```

**응답**:
```json
{
  "success": true,
  "prospect_id": "uuid",
  "redirect_url": "/prospects/uuid/mix",
  "message": "Clean Scan 데이터가 저장되었습니다."
}
```

**에러 응답**:
```json
{
  "success": false,
  "error": "UNAUTHORIZED",
  "message": "로그인이 필요합니다."
}
```

## 인증 처리

Extension에서 웹앱 API를 호출할 때는 Clerk 인증이 필요합니다.

### 방법 1: Content Script에서 웹페이지의 세션 활용

```javascript
// content.js에서
chrome.runtime.sendMessage({ action: 'getAuthToken' }, async (response) => {
  const token = response.token;
  // API 호출 시 헤더에 포함
});
```

### 방법 2: Extension에서 사용자 로그인 유도

Extension이 웹앱으로 리다이렉트하여 로그인 후 다시 Extension으로 돌아오는 방식.

## 개발 체크리스트

- [ ] Extension에서 `.se-viewer` 또는 `.se-main-container` HTML 추출 로직 추가
- [ ] Extension에서 본문 이미지 URL 추출 로직 추가
- [ ] Extension에서 텍스트 길이 계산 로직 추가
- [ ] Extension에서 웹앱 API 호출 로직 추가 (인증 포함)
- [ ] 웹앱 API 엔드포인트 테스트 (`/api/extension/scan`)
- [ ] `analyze-url.ts`에서 Extension 데이터 처리 로직 확인
- [ ] n8n Webhook과 Extension 데이터 통합 처리

## 참고 문서

- [PRD.md](./PRD.md) - 3.1 Clean Chrome Extension 섹션
- [DEV_GUIDE.md](./DEV_GUIDE.md) - Extension 연동 가이드
- [TODO.md](./TODO.md) - Week 3 Chrome Extension 연동 작업



































