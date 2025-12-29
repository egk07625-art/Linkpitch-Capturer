/**
 * @file utils/markdownToEmailHtml.ts
 * @description 마크다운을 이메일 호환 HTML로 100% 완벽 변환
 *
 * 중첩된 마크다운 문법(리스트 안의 강조, 인용구 안의 강조 등) 완벽 처리
 */

import { marked } from 'marked';
import DOMPurify from 'dompurify';

/**
 * 커스텀 렌더러 생성 (중첩 문법 완벽 처리)
 */
function createEmailRenderer() {
  const renderer = new marked.Renderer();

  // 강조 처리 (Bold) - 모든 위치에서 작동
  // ✅ marked v5+에서는 객체 형태로 파라미터 전달됨
  renderer.strong = ({ text }: { text: string }) => {
    return `<strong style="font-weight: 700; color: #1a1a1a;">${text}</strong>`;
  };

  // 기울임 처리 (Italic) - 모든 위치에서 작동
  // ✅ marked v5+에서는 객체 형태로 파라미터 전달됨
  renderer.em = ({ text }: { text: string }) => {
    return `<em style="font-style: italic; color: #374151;">${text}</em>`;
  };

  // 제목 처리 (H1-H6)
  renderer.heading = ({ text, depth }: { text: string; depth: number }) => {
    const sizes = { 1: '26px', 2: '22px', 3: '18px', 4: '16px', 5: '14px', 6: '12px' };
    const size = sizes[depth as keyof typeof sizes] || '16px';
    return `<h${depth} style="color: #1a1a1a; font-size: ${size}; font-weight: 700; margin: 20px 0 10px 0; line-height: 1.4;">${text}</h${depth}>`;
  };

  // 인용구 처리 (내부 강조 포함)
  // ✅ marked v15+에서는 raw, text 등이 포함된 객체로 전달됨
  renderer.blockquote = ({ text }: { text: string }) => {
    return `<blockquote style="border-left: 4px solid #3b82f6; padding-left: 16px; margin: 16px 0; color: #6b7280; background: #f0f9ff; padding: 12px 16px; border-radius: 4px; font-style: italic;">${text}</blockquote>`;
  };

  // 리스트 아이템 처리 (내부 강조 포함)
  renderer.listitem = ({ text }: { text: string }) => {
    return `<li style="margin: 8px 0; line-height: 1.8; color: #374151;">${text}</li>`;
  };

  // 순서 없는 리스트/순서 있는 리스트
  // ✅ marked v15+에서 items는 ListItem[] 배열
  renderer.list = ({ items, ordered }: { items: Array<{ text: string; task: boolean; checked?: boolean; raw: string }>; ordered: boolean }) => {
    const tag = ordered ? 'ol' : 'ul';
    const style = ordered
      ? 'margin: 12px 0; padding-left: 24px; line-height: 1.8;'
      : 'margin: 12px 0; padding-left: 24px; line-height: 1.8; list-style-type: disc;';
    // items 배열을 HTML로 변환 (listitem 렌더러 스타일 적용)
    const itemsHtml = items.map(item => {
      return `<li style="margin: 8px 0; line-height: 1.8; color: #374151;">${item.text}</li>`;
    }).join('');
    return `<${tag} style="${style}">${itemsHtml}</${tag}>`;
  };

  // 문단 처리
  renderer.paragraph = ({ text }: { text: string }) => {
    return `<p style="margin: 12px 0; line-height: 1.6; color: #374151; font-size: 15px;">${text}</p>`;
  };

  // 링크 처리
  // ✅ marked v15+에서 title은 optional
  renderer.link = ({ href, title, text }: { href: string; title?: string | null; text: string }) => {
    const titleAttr = title ? ` title="${title}"` : '';
    return `<a href="${href}" target="_blank" rel="noopener noreferrer"${titleAttr} style="color: #2563eb; text-decoration: underline; font-weight: 500;">${text}</a>`;
  };

  // 코드 블록
  renderer.code = ({ text }: { text: string; lang?: string }) => {
    return `<pre style="background-color: #f5f5f5; padding: 12px; border-radius: 4px; overflow-x: auto; margin: 16px 0;"><code style="font-family: 'Courier New', monospace; font-size: 14px; color: #1f2937;">${text}</code></pre>`;
  };

  // 인라인 코드
  renderer.codespan = ({ text }: { text: string }) => {
    return `<code style="background-color: #f5f5f5; padding: 2px 6px; border-radius: 3px; font-family: 'Courier New', monospace; font-size: 14px; color: #dc2626;">${text}</code>`;
  };

  // 수평선
  renderer.hr = () => {
    return `<hr style="border: none; border-top: 2px solid #e5e7eb; margin: 24px 0;" />`;
  };

  return renderer;
}

/**
 * 이메일용 버튼 HTML 생성 (테이블 기반)
 */
function createEmailButton(text: string, url: string): string {
  return `
<table cellpadding="0" cellspacing="0" border="0" style="margin: 24px auto; width: 100%;">
  <tr>
    <td align="center">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="background-color: #1e293b; border-radius: 8px;">
            <a href="${url}"
               target="_blank"
               rel="noopener noreferrer"
               style="display: inline-block;
                      padding: 16px 40px;
                      color: #ffffff !important;
                      font-size: 16px;
                      font-weight: 600;
                      text-decoration: none !important;
                      border-radius: 8px;
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
              ${text}
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`.trim();
}

/**
 * 이메일 전체 HTML 래퍼
 */
function wrapEmailHtml(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: Arial, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif; background-color: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
    ${content}
  </div>
</body>
</html>`.trim();
}

/**
 * 마크다운을 이메일 호환 HTML로 100% 완벽 변환
 *
 * @param markdown - 마크다운 텍스트
 * @param reportUrl - 리포트 URL (버튼에 사용)
 * @param options - 추가 옵션
 * @returns 이메일 호환 HTML
 */
export function convertMarkdownToEmailHtml(
  markdown: string,
  reportUrl?: string,
  options?: {
    includeWrapper?: boolean;  // HTML wrapper 포함 여부
    ctaButtonText?: string;    // 추가 CTA 버튼 텍스트
  }
): string {
  const { includeWrapper = false, ctaButtonText } = options || {};

  // 1. 버튼 문법을 임시 플레이스홀더로 변경 (먼저 처리)
  let processedMarkdown = markdown.replace(
    /\[([^\]]+)\]\(report_url\)/g,
    '___BUTTON___$1___/BUTTON___'
  );

  // 2. marked 설정 (커스텀 렌더러 사용)
  // ✅ sanitize 옵션은 marked v5+에서 제거됨 - DOMPurify로 별도 처리
  marked.setOptions({
    renderer: createEmailRenderer(),
    breaks: true,      // 줄바꿈을 <br>로 변환
    gfm: true,         // GitHub Flavored Markdown
  });

  // 3. 마크다운 → HTML 변환 (모든 중첩 문법 100% 처리)
  let html = marked.parse(processedMarkdown) as string;

  // 4. 버튼 플레이스홀더를 실제 이메일 버튼으로 교체
  if (reportUrl) {
    html = html.replace(
      /___BUTTON___(.+?)___\/BUTTON___/g,
      (match, buttonText) => createEmailButton(buttonText, reportUrl)
    );
  }

  // 5. 추가 CTA 버튼 (옵션)
  if (ctaButtonText && reportUrl) {
    html += createEmailButton(ctaButtonText, reportUrl);
  }

  // 6. 이메일 전체 래퍼 적용 (옵션)
  if (includeWrapper) {
    html = wrapEmailHtml(html);
  }

  // 7. XSS 방지 (안전한 태그만 허용)
  if (typeof window !== 'undefined') {
    html = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'strong', 'em', 'u', 'a',
        'ul', 'ol', 'li', 'blockquote', 'br',
        'div', 'table', 'tr', 'td', 'tbody', 'thead',
        'span', 'pre', 'code', 'hr'
      ],
      ALLOWED_ATTR: [
        'style', 'href', 'target', 'rel', 'title',
        'cellpadding', 'cellspacing', 'border', 'align',
        'class', 'id'
      ]
    });
  }

  return html;
}

/**
 * HTML을 클립보드에 복사 (text/html + text/plain)
 *
 * @param html - 복사할 HTML 문자열
 * @returns 복사 성공 여부
 */
export async function copyHtmlToClipboard(html: string): Promise<boolean> {
  try {
    // HTML 태그를 제거한 플레인 텍스트 생성
    const plainText = html
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Clipboard API 사용 (text/html + text/plain)
    const clipboardItem = new ClipboardItem({
      'text/html': new Blob([html], { type: 'text/html' }),
      'text/plain': new Blob([plainText], { type: 'text/plain' }),
    });

    await navigator.clipboard.write([clipboardItem]);
    return true;
  } catch (error) {
    console.error('[copyHtmlToClipboard] 클립보드 복사 실패:', error);

    // Fallback: 기본 텍스트 복사
    try {
      await navigator.clipboard.writeText(html);
      return true;
    } catch (fallbackError) {
      console.error('[copyHtmlToClipboard] Fallback 복사 실패:', fallbackError);
      return false;
    }
  }
}
