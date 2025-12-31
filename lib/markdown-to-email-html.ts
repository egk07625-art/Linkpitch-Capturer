/**
 * @file lib/markdown-to-email-html.ts
 * @description 마크다운 → 이메일 HTML 완전 변환 시스템
 *
 * Gmail, Outlook 등 주요 이메일 클라이언트에서 안정적으로 렌더링되도록
 * 모든 스타일을 인라인 CSS로 적용합니다.
 *
 * 지원하는 마크다운 문법:
 * - 헤더 (###, ##, #)
 * - 인용문 (>)
 * - 목록 (-, 1.)
 * - 볼드 (**)
 * - 수평선 (---)
 * - 줄바꿈
 */

// ===== 인라인 스타일 정의 (Gmail/Outlook 호환) =====
const STYLES = {
  // 기본 텍스트
  paragraph: `
    margin: 0 0 16px 0;
    font-size: 15px;
    line-height: 1.7;
    color: #333333;
  `.replace(/\s+/g, ' ').trim(),

  // 헤더 스타일
  h1: `
    margin: 32px 0 16px 0;
    font-size: 24px;
    font-weight: 700;
    line-height: 1.3;
    color: #1a1a1a;
  `.replace(/\s+/g, ' ').trim(),

  h2: `
    margin: 28px 0 14px 0;
    font-size: 20px;
    font-weight: 700;
    line-height: 1.3;
    color: #1a1a1a;
  `.replace(/\s+/g, ' ').trim(),

  h3: `
    margin: 24px 0 12px 0;
    font-size: 17px;
    font-weight: 700;
    line-height: 1.4;
    color: #1a1a1a;
  `.replace(/\s+/g, ' ').trim(),

  // 인용문
  blockquote: `
    margin: 16px 0;
    padding: 12px 16px;
    border-left: 4px solid #3b82f6;
    background-color: #eff6ff;
    border-radius: 0 8px 8px 0;
    font-style: italic;
    color: #374151;
  `.replace(/\s+/g, ' ').trim(),

  // 목록
  ul: `
    margin: 16px 0;
    padding-left: 24px;
    list-style-type: disc;
  `.replace(/\s+/g, ' ').trim(),

  ol: `
    margin: 16px 0;
    padding-left: 24px;
    list-style-type: decimal;
  `.replace(/\s+/g, ' ').trim(),

  li: `
    margin: 8px 0;
    font-size: 15px;
    line-height: 1.6;
    color: #333333;
  `.replace(/\s+/g, ' ').trim(),

  // 수평선
  hr: `
    margin: 24px 0;
    border: none;
    border-top: 1px solid #e5e7eb;
    height: 0;
  `.replace(/\s+/g, ' ').trim(),

  // 볼드
  strong: `
    font-weight: 700;
    color: #1a1a1a;
  `.replace(/\s+/g, ' ').trim(),
};

/**
 * 볼드 마크다운(**) → HTML <strong> 태그 변환
 * 공백 보존 로직 포함
 */
function convertBold(text: string): string {
  if (!text) return '';
  let result = text;

  // 1단계: ** 내부 공백 정리
  result = result.replace(/\*\*\s+([^*]+?)\s+\*\*/g, '**$1**');
  result = result.replace(/\*\*\s+([^*]+?)\*\*/g, '**$1**');
  result = result.replace(/\*\*([^*]+?)\s+\*\*/g, '**$1**');

  // 2단계: 볼드 → <strong> 변환
  result = result.replace(/\*\*([^*\n]+?)\*\*/g, `<strong style="${STYLES.strong}">$1</strong>`);

  // 3단계: 특수 컨텍스트 추가 처리
  result = result.replace(/\[\*\*([^\]]+?)\*\*\]/g, `[<strong style="${STYLES.strong}">$1</strong>]`);
  result = result.replace(/\(\*\*([^)]+?)\*\*\)/g, `(<strong style="${STYLES.strong}">$1</strong>)`);
  result = result.replace(/\|\*\*([^|]+?)\*\*\|/g, `|<strong style="${STYLES.strong}">$1</strong>|`);
  result = result.replace(/\|\*\*([^|]+?)\*\*/g, `|<strong style="${STYLES.strong}">$1</strong>`);
  result = result.replace(/\*\*([^|]+?)\*\*\|/g, `<strong style="${STYLES.strong}">$1</strong>|`);

  // 4단계: 남은 고아 별표 제거
  result = result.replace(/\*\*/g, '');

  // 5단계: 공백 복원
  result = result.replace(/([가-힣a-zA-Z0-9\)\]\%])<strong/g, '$1 <strong');
  result = result.replace(/<\/strong>([가-힣a-zA-Z0-9\(\[])/g, '</strong> $1');

  return result;
}

/**
 * 헤더 마크다운(#) → HTML <h1>, <h2>, <h3> 태그 변환
 */
function convertHeaders(text: string): string {
  let result = text;

  // H3: ### 텍스트
  result = result.replace(
    /^###\s+(.+)$/gm,
    `<h3 style="${STYLES.h3}">$1</h3>`
  );

  // H2: ## 텍스트
  result = result.replace(
    /^##\s+(.+)$/gm,
    `<h2 style="${STYLES.h2}">$1</h2>`
  );

  // H1: # 텍스트
  result = result.replace(
    /^#\s+(.+)$/gm,
    `<h1 style="${STYLES.h1}">$1</h1>`
  );

  return result;
}

/**
 * 인용문 마크다운(>) → HTML <blockquote> 태그 변환
 * 연속된 인용문 라인을 하나의 blockquote로 묶음
 *
 * 지원 패턴:
 * - `> 텍스트` (표준 마크다운)
 * - `>[레이블]` (레이블 스타일)
 * - `>텍스트` (공백 없는 경우)
 */
function convertBlockquotes(text: string): string {
  const lines = text.split('\n');
  const result: string[] = [];
  let blockquoteContent: string[] = [];
  let inBlockquote = false;

  for (const line of lines) {
    // 줄 앞 공백 제거 후 매칭 (trim)
    const trimmedLine = line.trim();

    // 패턴 1: 표준 인용문 `> 텍스트` 또는 `>텍스트` (공백 선택적)
    const blockquoteMatch = trimmedLine.match(/^>\s*(.*)$/);

    if (blockquoteMatch) {
      inBlockquote = true;
      // 대괄호 레이블 [text] 형식이면 대괄호 제거
      let content = blockquoteMatch[1];
      content = content.replace(/^\[([^\]]+)\]$/, '$1'); // [text] → text
      content = content.replace(/^\[([^\]]+)\]\s*/, '<strong>$1</strong> '); // [label] text → <strong>label</strong> text
      blockquoteContent.push(content);
    } else {
      if (inBlockquote) {
        // 인용문 종료, blockquote 태그로 감싸기
        const content = blockquoteContent.join('<br>');
        result.push(`<blockquote style="${STYLES.blockquote}">${content}</blockquote>`);
        blockquoteContent = [];
        inBlockquote = false;
      }
      result.push(line);
    }
  }

  // 마지막 인용문 처리
  if (inBlockquote && blockquoteContent.length > 0) {
    const content = blockquoteContent.join('<br>');
    result.push(`<blockquote style="${STYLES.blockquote}">${content}</blockquote>`);
  }

  return result.join('\n');
}

/**
 * 목록 마크다운(-, 1.) → HTML <ul>, <ol>, <li> 태그 변환
 */
function convertLists(text: string): string {
  const lines = text.split('\n');
  const result: string[] = [];
  let listItems: string[] = [];
  let listType: 'ul' | 'ol' | null = null;

  const flushList = () => {
    if (listItems.length > 0 && listType) {
      const style = listType === 'ul' ? STYLES.ul : STYLES.ol;
      const listHtml = listItems.map(item => `<li style="${STYLES.li}">${item}</li>`).join('');
      result.push(`<${listType} style="${style}">${listHtml}</${listType}>`);
      listItems = [];
      listType = null;
    }
  };

  for (const line of lines) {
    // 비순서 목록: - 텍스트 또는 * 텍스트 (공백 없이도 매칭)
    const ulMatch = line.match(/^[-*]\s*(.+)$/);
    // 순서 목록: 1. 텍스트
    const olMatch = line.match(/^\d+\.\s*(.+)$/);

    if (ulMatch) {
      if (listType === 'ol') flushList();
      listType = 'ul';
      listItems.push(ulMatch[1]);
    } else if (olMatch) {
      if (listType === 'ul') flushList();
      listType = 'ol';
      listItems.push(olMatch[1]);
    } else {
      flushList();
      result.push(line);
    }
  }

  flushList();
  return result.join('\n');
}

/**
 * 수평선 마크다운(---) → HTML <hr> 태그 변환
 */
function convertHorizontalRules(text: string): string {
  return text.replace(
    /^---+$/gm,
    `<hr style="${STYLES.hr}">`
  );
}

/**
 * 줄바꿈 및 단락 처리
 * - 빈 줄로 구분된 텍스트를 <p> 태그로 감싸기
 * - 단일 줄바꿈은 <br>로 변환
 */
function convertParagraphs(text: string): string {
  // HTML 태그가 이미 있는 라인은 그대로 유지
  const lines = text.split('\n');
  const result: string[] = [];
  let paragraphLines: string[] = [];

  const flushParagraph = () => {
    if (paragraphLines.length > 0) {
      const content = paragraphLines.join('<br>');
      // 이미 블록 태그로 감싸진 경우 스킵
      if (content.trim()) {
        const isBlockElement = /^<(h[1-6]|blockquote|ul|ol|hr|div|table)/i.test(content.trim());
        if (isBlockElement) {
          result.push(content);
        } else {
          result.push(`<p style="${STYLES.paragraph}">${content}</p>`);
        }
      }
      paragraphLines = [];
    }
  };

  for (const line of lines) {
    const trimmedLine = line.trim();

    // 빈 줄이면 현재 단락 종료
    if (trimmedLine === '') {
      flushParagraph();
      continue;
    }

    // 블록 요소는 바로 추가
    const isBlockElement = /^<(h[1-6]|blockquote|ul|ol|hr|div|table)/i.test(trimmedLine);
    if (isBlockElement) {
      flushParagraph();
      result.push(line);
    } else {
      paragraphLines.push(line);
    }
  }

  flushParagraph();
  return result.join('\n');
}

/**
 * 마크다운 → 이메일 HTML 완전 변환
 *
 * @param markdown - 마크다운 텍스트
 * @returns 이메일 클라이언트 호환 HTML
 */
export function convertMarkdownToEmailHtml(markdown: string): string {
  if (!markdown) return '';

  let result = markdown;

  // ===== 전처리: 특수 패턴 정규화 =====
  // `>[text]>` 패턴에서 뒤의 `>` 제거
  result = result.replace(/>\[([^\]]+)\]>/g, '>[$1]');
  // `> [text]` 패턴을 `>[text]`로 정규화
  result = result.replace(/>\s*\[([^\]]+)\]/g, '>[$1]');
  // HTML 엔티티 디코딩 (&gt; → >)
  result = result.replace(/&gt;/g, '>');
  result = result.replace(/&lt;/g, '<');
  result = result.replace(/&amp;/g, '&');

  // 변환 순서가 중요! (겹치는 문법 고려)
  // 1. 수평선 먼저 (---가 리스트 -와 겹칠 수 있음)
  result = convertHorizontalRules(result);

  // 2. 헤더 변환
  result = convertHeaders(result);

  // 3. 인용문 변환
  result = convertBlockquotes(result);

  // 4. 목록 변환
  result = convertLists(result);

  // 5. 볼드 변환 (인라인 요소라 나중에)
  result = convertBold(result);

  // 6. 단락 및 줄바꿈 처리 (가장 마지막)
  result = convertParagraphs(result);

  // ===== 후처리: 남은 마크다운 기호 제거 =====
  // 변환되지 않은 고아 기호들 정리
  result = result.replace(/^>\s*/gm, '');        // 줄 시작 > 제거
  result = result.replace(/^#{1,6}\s*/gm, '');   // 줄 시작 # 제거

  // 최종 정리: 연속된 빈 줄 제거
  result = result.replace(/\n{3,}/g, '\n\n');

  return result;
}

/**
 * contentEditable에서 가져온 HTML을 이메일용 HTML로 변환
 * (이미 HTML이지만 스타일이 없는 경우)
 *
 * @param html - contentEditable innerHTML
 * @param applyBoldOptimization - 볼드 최적화 적용 여부
 * @returns 이메일 클라이언트 호환 HTML
 */
export function convertHtmlToEmailHtml(html: string, applyBoldOptimization = false): string {
  if (!html) return '';

  let result = html;

  // 볼드 최적화 (** → <strong>) 적용
  if (applyBoldOptimization) {
    result = convertBold(result);
  }

  // <br> 태그 정규화
  result = result.replace(/<br\s*\/?>/gi, '<br>');

  // <div> 태그를 <p>로 변환 (contentEditable의 기본 동작)
  result = result.replace(/<div>/gi, '<p style="' + STYLES.paragraph + '">');
  result = result.replace(/<\/div>/gi, '</p>');

  // 기존 <p> 태그에 스타일 추가
  result = result.replace(/<p>/gi, '<p style="' + STYLES.paragraph + '">');

  // <strong> 태그에 스타일 추가 (이미 스타일이 없는 경우)
  result = result.replace(/<strong>([^<]+)<\/strong>/gi, `<strong style="${STYLES.strong}">$1</strong>`);

  return result;
}

/**
 * 이메일 본문 + CTA 버튼을 포함한 최종 이메일 HTML 생성
 *
 * @param bodyHtml - 변환된 이메일 본문 HTML
 * @param ctaText - CTA 버튼 텍스트
 * @param ctaUrl - CTA 버튼 링크 URL
 * @returns 최종 이메일 HTML
 */
export function wrapEmailHtml(bodyHtml: string, ctaText: string, ctaUrl: string): string {
  return `
<div style="font-family: 'Apple SD Gothic Neo', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto;">
  ${bodyHtml}

  <!-- CTA 버튼 (Table 방식 - 메일 앱에서 안정적) -->
  <table cellspacing="0" cellpadding="0" border="0" style="margin: 32px auto; text-align: center;">
    <tr>
      <td align="center" bgcolor="#1A1A1A" style="border-radius: 10px; mso-padding-alt: 0;">
        <a href="${ctaUrl}"
           target="_blank"
           rel="noopener noreferrer"
           aria-label="${ctaText}"
           style="display: inline-block;
                  padding: 12px 28px;
                  font-size: 15px;
                  color: #ffffff;
                  text-decoration: none;
                  font-weight: 600;
                  letter-spacing: -0.02em;
                  line-height: 1;
                  mso-padding-alt: 0;
                  mso-line-height-rule: exactly;">
          ${ctaText}
        </a>
      </td>
    </tr>
  </table>
</div>
`.trim();
}

/**
 * HTML을 클립보드에 복사 (text/html + text/plain 동시 복사)
 *
 * @param html - 복사할 HTML 문자열
 * @returns 복사 성공 여부
 */
export async function copyEmailHtmlToClipboard(html: string): Promise<boolean> {
  try {
    // HTML 태그를 제거한 플레인 텍스트 생성
    const plainText = html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]*>/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    // Clipboard API를 사용하여 HTML과 Plain Text 동시 복사
    const clipboardItem = new ClipboardItem({
      'text/html': new Blob([html], { type: 'text/html' }),
      'text/plain': new Blob([plainText], { type: 'text/plain' }),
    });

    await navigator.clipboard.write([clipboardItem]);
    return true;
  } catch (error) {
    console.error('클립보드 복사 실패:', error);

    // Fallback: 기본 복사 시도
    try {
      await navigator.clipboard.writeText(html);
      return true;
    } catch (fallbackError) {
      console.error('Fallback 복사 실패:', fallbackError);
      return false;
    }
  }
}
