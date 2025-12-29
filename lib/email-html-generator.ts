/**
 * @file lib/email-html-generator.ts
 * @description 이메일 HTML 생성 유틸리티
 *
 * 마크다운 본문과 CTA 버튼을 결합하여 이메일 앱에서 사용 가능한 HTML을 생성합니다.
 */

import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true, // 줄바꿈을 <br>로 변환
});

export interface EmailHtmlOptions {
  /** 이메일 본문 (마크다운 형식) */
  emailBody: string;
  /** CTA 버튼 텍스트 */
  ctaText: string;
  /** 리포트 링크 URL */
  reportUrl: string;
}

/**
 * 마크다운 본문과 CTA 버튼을 결합하여 이메일 HTML 생성
 * Gmail, Outlook 등 주요 이메일 앱에서 안정적으로 렌더링되는 HTML을 반환합니다.
 *
 * @param options - 이메일 생성 옵션
 * @returns 이메일 앱에 붙여넣을 수 있는 HTML 문자열
 */
export function generateEmailHtml(options: EmailHtmlOptions): string {
  const { emailBody, ctaText, reportUrl } = options;

  // 마크다운을 HTML로 변환
  let bodyHtml = md.render(emailBody);

  // DOMPurify로 XSS 방어 (클라이언트 환경에서만)
  if (typeof window !== 'undefined') {
    bodyHtml = DOMPurify.sanitize(bodyHtml, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 's', 'a', 'img',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'hr',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'style', 'target', 'rel', 'class', 'id'],
    });
  }

  // 이메일 앱에 안전한 HTML 구조 (Table 기반)
  const emailHtml = `
<div style="font-family: 'Apple SD Gothic Neo', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto;">
  <!-- 본문 내용 -->
  ${bodyHtml}

  <!-- CTA 버튼 (Table 방식 - 메일 앱에서 안정적) -->
  <table cellspacing="0" cellpadding="0" border="0" style="margin: 40px auto; text-align: center;">
    <tr>
      <td align="center" bgcolor="#1A2B3C" style="border-radius: 4px; min-width: 200px;">
        <a href="${reportUrl}"
           target="_blank"
           rel="noopener noreferrer"
           aria-label="${ctaText}"
           style="display: inline-block;
                  padding: 16px 32px;
                  min-height: 44px;
                  font-size: 16px;
                  color: #ffffff;
                  text-decoration: none;
                  font-weight: bold;
                  line-height: 1.5;">
          ${ctaText}
        </a>
      </td>
    </tr>
  </table>
</div>
`.trim();

  return emailHtml;
}

/**
 * HTML을 클립보드에 복사 (text/html + text/plain 동시 복사)
 * 이메일 앱에서 디자인을 유지하면서 붙여넣을 수 있도록 합니다.
 *
 * @param html - 복사할 HTML 문자열
 * @returns 복사 성공 여부
 */
export async function copyHtmlToClipboard(html: string): Promise<boolean> {
  try {
    // HTML 태그를 제거한 플레인 텍스트 생성
    const plainText = html.replace(/<[^>]*>/g, '').trim();

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
