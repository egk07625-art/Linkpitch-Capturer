/**
 * @file test-design-system/page.tsx
 * @description 디자인 시스템 테스트 페이지
 * 
 * DESIGN_PLAN.md의 컬러 시스템, 타이포그래피, 애니메이션을 테스트합니다.
 */

export default function TestDesignSystemPage() {
  return (
    <div className="min-h-screen bg-bg-primary p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* 헤더 */}
        <div>
          <h1 className="text-2xl font-semibold text-text-primary mb-2">
            디자인 시스템 테스트
          </h1>
          <p className="text-sm text-text-secondary">
            DESIGN_PLAN.md의 컬러 시스템, 타이포그래피, 애니메이션 확인
          </p>
        </div>

        {/* 컬러 시스템 테스트 */}
        <section className="space-y-4">
          <h2 className="text-lg font-medium text-text-primary">
            1. 컬러 시스템
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Background Colors */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-text-secondary">Background</h3>
              <div className="bg-bg-primary border border-border-default p-3 rounded-sm">
                <span className="text-xs text-text-primary">bg-bg-primary</span>
              </div>
              <div className="bg-bg-secondary border border-border-default p-3 rounded-sm">
                <span className="text-xs text-text-primary">bg-bg-secondary</span>
              </div>
              <div className="bg-bg-tertiary border border-border-default p-3 rounded-sm">
                <span className="text-xs text-text-primary">bg-bg-tertiary</span>
              </div>
            </div>

            {/* Text Colors */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-text-secondary">Text</h3>
              <div className="bg-bg-secondary p-3 rounded-sm">
                <p className="text-text-primary text-sm">text-text-primary</p>
                <p className="text-text-secondary text-sm">text-text-secondary</p>
                <p className="text-text-tertiary text-sm">text-text-tertiary</p>
              </div>
            </div>

            {/* Interactive Colors */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-text-secondary">Interactive</h3>
              <button className="bg-interactive hover:bg-interactive-hover text-white px-4 py-2 rounded-sm transition-colors duration-snap">
                Interactive Button
              </button>
              <button className="bg-destructive-color text-white px-4 py-2 rounded-sm">
                Destructive Button
              </button>
            </div>

            {/* Borders */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-text-secondary">Borders</h3>
              <div className="border border-border-default p-3 rounded-sm">
                <span className="text-xs text-text-primary">border-border-default</span>
              </div>
              <div className="border border-border-subtle p-3 rounded-sm">
                <span className="text-xs text-text-primary">border-border-subtle</span>
              </div>
            </div>
          </div>
        </section>

        {/* 타이포그래피 테스트 */}
        <section className="space-y-4">
          <h2 className="text-lg font-medium text-text-primary">
            2. 타이포그래피
          </h2>
          
          <div className="bg-bg-secondary border border-border-default p-6 rounded-sm space-y-4">
            <div>
              <p className="text-xs text-text-tertiary mb-1">Body Font (Inter 우선)</p>
              <p className="text-sm text-text-primary">
                The quick brown fox jumps over the lazy dog. 
                빠른 갈색 여우가 게으른 개를 뛰어넘습니다.
              </p>
            </div>
            
            <div>
              <p className="text-xs text-text-tertiary mb-1">Monospace Font (JetBrains Mono)</p>
              <code className="font-mono text-xs text-interactive block">
                &gt; npm install
                <br />
                &gt; Analyzing dependencies...
              </code>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-semibold text-text-primary">Heading 1</h1>
              <h2 className="text-lg font-medium text-text-primary">Heading 2</h2>
              <h3 className="text-sm font-medium text-text-primary">Heading 3</h3>
              <p className="text-sm text-text-secondary">Body Text</p>
              <span className="text-xs text-text-tertiary">Caption/Label</span>
            </div>
          </div>
        </section>

        {/* 애니메이션 테스트 */}
        <section className="space-y-4">
          <h2 className="text-lg font-medium text-text-primary">
            3. 애니메이션 타이밍
          </h2>
          
          <div className="bg-bg-secondary border border-border-default p-6 rounded-sm space-y-4">
            <div>
              <p className="text-xs text-text-tertiary mb-2">Duration Snap (150ms)</p>
              <button className="bg-interactive hover:bg-interactive-hover text-white px-4 py-2 rounded-sm transition-colors duration-snap">
                Hover me (150ms)
              </button>
            </div>
            
            <div>
              <p className="text-xs text-text-tertiary mb-2">Duration Standard (200ms)</p>
              <button className="border border-border-default hover:border-interactive hover:bg-bg-tertiary text-text-primary px-4 py-2 rounded-sm transition-all duration-standard">
                Hover me (200ms)
              </button>
            </div>

            <div>
              <p className="text-xs text-text-tertiary mb-2">Easing Sharp (cubic-bezier)</p>
              <div className="w-full bg-bg-tertiary rounded-sm h-2 relative overflow-hidden">
                <div className="bg-interactive h-full w-0 hover:w-full transition-all duration-standard ease-sharp">
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CSS 변수 확인 안내 */}
        <section className="bg-bg-secondary border border-border-default p-6 rounded-sm">
          <h2 className="text-lg font-medium text-text-primary mb-4">
            4. 개발자 도구 확인 방법
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-sm text-text-secondary">
            <li>F12 또는 우클릭 → 검사로 개발자 도구 열기</li>
            <li>Elements 탭에서 요소 선택</li>
            <li>Computed 탭에서 계산된 색상 값 확인</li>
            <li>Styles 탭에서 CSS 변수 값 확인 (--bg-primary, --text-primary 등)</li>
            <li>Console에서 다음 명령어 실행:
              <code className="font-mono text-xs text-interactive block mt-1 ml-4">
                getComputedStyle(document.documentElement).getPropertyValue("--bg-primary")
              </code>
            </li>
          </ol>
        </section>
      </div>
    </div>
  );
}


