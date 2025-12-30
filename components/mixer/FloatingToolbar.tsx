'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Link,
  Code,
  X
} from 'lucide-react';

// Monaco Editor 인스턴스 타입 (any로 처리하여 의존성 문제 방지)
type MonacoEditor = any;

interface ToolbarPosition {
  top: number;
  left: number;
}

interface FloatingToolbarProps {
  /** Monaco Editor 인스턴스 */
  editorInstance: MonacoEditor | null;
  /** 에디터 컨테이너 ref (위치 계산용) */
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function FloatingToolbar({
  editorInstance,
  containerRef
}: FloatingToolbarProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<ToolbarPosition>({ top: 0, left: 0 });
  const [selectedText, setSelectedText] = useState('');
  const toolbarRef = useRef<HTMLDivElement>(null);

  // 선택 영역 변경 감지
  useEffect(() => {
    if (!editorInstance) return;

    const disposable = editorInstance.onDidChangeCursorSelection((e) => {
      const selection = editorInstance.getSelection();
      const model = editorInstance.getModel();

      if (!selection || !model || selection.isEmpty()) {
        setIsVisible(false);
        return;
      }

      // 선택된 텍스트 가져오기
      const text = model.getValueInRange(selection);
      if (!text.trim()) {
        setIsVisible(false);
        return;
      }

      setSelectedText(text);

      // 선택 영역 위치 계산
      const startPosition = selection.getStartPosition();
      const scrolledPosition = editorInstance.getScrolledVisiblePosition(startPosition);
      const editorDom = editorInstance.getDomNode();

      if (scrolledPosition && editorDom && containerRef.current) {
        const editorRect = editorDom.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();

        // 툴바 위치 계산 (선택 시작점 위)
        const top = editorRect.top - containerRect.top + scrolledPosition.top - 50;
        const left = scrolledPosition.left + 20;

        setPosition({
          top: Math.max(10, top),
          left: Math.max(10, Math.min(left, editorRect.width - 300))
        });
        setIsVisible(true);
      }
    });

    return () => disposable.dispose();
  }, [editorInstance, containerRef]);

  // 외부 클릭 시 툴바 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        // 에디터 내부 클릭은 제외
        const editorDom = editorInstance?.getDomNode();
        if (editorDom && editorDom.contains(e.target as Node)) {
          return;
        }
        setIsVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editorInstance]);

  // 포맷 적용 함수
  const applyFormat = useCallback((type: string) => {
    if (!editorInstance) return;

    const selection = editorInstance.getSelection();
    const model = editorInstance.getModel();

    if (!selection || !model) return;

    const text = model.getValueInRange(selection);
    let newText = text;
    let cursorOffset = 0;

    switch (type) {
      case 'bold':
        newText = `**${text}**`;
        cursorOffset = 2;
        break;

      case 'italic':
        newText = `*${text}*`;
        cursorOffset = 1;
        break;

      case 'code':
        newText = `\`${text}\``;
        cursorOffset = 1;
        break;

      case 'h1':
      case 'h2':
      case 'h3': {
        const prefix = type === 'h1' ? '# ' : type === 'h2' ? '## ' : '### ';
        const lineNumber = selection.startLineNumber;
        const lineContent = model.getLineContent(lineNumber);

        // 기존 헤딩 마크다운 제거
        const cleanedLine = lineContent.replace(/^#{1,6}\s*/, '');
        const fullLineRange = {
          startLineNumber: lineNumber,
          startColumn: 1,
          endLineNumber: lineNumber,
          endColumn: lineContent.length + 1
        };

        editorInstance.executeEdits('format', [{
          range: fullLineRange,
          text: prefix + cleanedLine
        }]);

        setIsVisible(false);
        editorInstance.focus();
        return;
      }

      case 'quote': {
        const lineNumber = selection.startLineNumber;
        const lineContent = model.getLineContent(lineNumber);
        const hasQuote = lineContent.startsWith('> ');

        const fullLineRange = {
          startLineNumber: lineNumber,
          startColumn: 1,
          endLineNumber: lineNumber,
          endColumn: lineContent.length + 1
        };

        if (hasQuote) {
          // 인용구 제거
          editorInstance.executeEdits('format', [{
            range: fullLineRange,
            text: lineContent.substring(2)
          }]);
        } else {
          // 인용구 추가
          editorInstance.executeEdits('format', [{
            range: fullLineRange,
            text: '> ' + lineContent
          }]);
        }

        setIsVisible(false);
        editorInstance.focus();
        return;
      }

      case 'link':
        newText = `[${text}](url)`;
        cursorOffset = 3; // "](" 다음 위치
        break;
    }

    // 텍스트 교체
    editorInstance.executeEdits('format', [{
      range: selection,
      text: newText
    }]);

    // 커서 위치 조정
    const newPosition = {
      lineNumber: selection.endLineNumber,
      column: selection.endColumn + cursorOffset + (newText.length - text.length - cursorOffset)
    };

    editorInstance.setPosition(newPosition);
    setIsVisible(false);
    editorInstance.focus();
  }, [editorInstance]);

  // 키보드 단축키 등록
  useEffect(() => {
    if (!editorInstance) return;

    // Ctrl/Cmd + B: 굵게
    const boldDisposable = editorInstance.addCommand(
      // eslint-disable-next-line no-bitwise
      2048 | 32, // KeyMod.CtrlCmd | KeyCode.KeyB
      () => {
        const selection = editorInstance.getSelection();
        if (selection && !selection.isEmpty()) {
          applyFormat('bold');
        }
      }
    );

    // Ctrl/Cmd + I: 기울임
    const italicDisposable = editorInstance.addCommand(
      // eslint-disable-next-line no-bitwise
      2048 | 39, // KeyMod.CtrlCmd | KeyCode.KeyI
      () => {
        const selection = editorInstance.getSelection();
        if (selection && !selection.isEmpty()) {
          applyFormat('italic');
        }
      }
    );

    // Ctrl/Cmd + K: 링크
    const linkDisposable = editorInstance.addCommand(
      // eslint-disable-next-line no-bitwise
      2048 | 41, // KeyMod.CtrlCmd | KeyCode.KeyK
      () => {
        const selection = editorInstance.getSelection();
        if (selection && !selection.isEmpty()) {
          applyFormat('link');
        }
      }
    );

    return () => {
      // Monaco의 addCommand는 disposable을 반환하지 않음
      // 컴포넌트 언마운트 시 자동 정리됨
    };
  }, [editorInstance, applyFormat]);

  if (!isVisible) return null;

  return (
    <div
      ref={toolbarRef}
      className="absolute z-[200] flex items-center gap-0.5 px-1.5 py-1
                 bg-slate-800 rounded-lg shadow-2xl border border-slate-700
                 animate-in fade-in-0 zoom-in-95 duration-150"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      {/* 굵게 */}
      <ToolbarButton
        icon={<Bold size={15} />}
        label="굵게 (Ctrl+B)"
        onClick={() => applyFormat('bold')}
      />

      {/* 기울임 */}
      <ToolbarButton
        icon={<Italic size={15} />}
        label="기울임 (Ctrl+I)"
        onClick={() => applyFormat('italic')}
      />

      {/* 코드 */}
      <ToolbarButton
        icon={<Code size={15} />}
        label="인라인 코드"
        onClick={() => applyFormat('code')}
      />

      <Divider />

      {/* 제목들 */}
      <ToolbarButton
        icon={<Heading1 size={15} />}
        label="제목 1"
        onClick={() => applyFormat('h1')}
      />
      <ToolbarButton
        icon={<Heading2 size={15} />}
        label="제목 2"
        onClick={() => applyFormat('h2')}
      />
      <ToolbarButton
        icon={<Heading3 size={15} />}
        label="제목 3"
        onClick={() => applyFormat('h3')}
      />

      <Divider />

      {/* 인용 */}
      <ToolbarButton
        icon={<Quote size={15} />}
        label="인용구"
        onClick={() => applyFormat('quote')}
      />

      {/* 링크 */}
      <ToolbarButton
        icon={<Link size={15} />}
        label="링크 삽입"
        onClick={() => applyFormat('link')}
      />

      <Divider />

      {/* 닫기 */}
      <ToolbarButton
        icon={<X size={15} />}
        label="닫기"
        onClick={() => setIsVisible(false)}
        variant="close"
      />
    </div>
  );
}

// 툴바 버튼 컴포넌트
function ToolbarButton({
  icon,
  label,
  onClick,
  variant = 'default'
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'close';
}) {
  return (
    <button
      onClick={onClick}
      className={`p-1.5 rounded transition-colors ${
        variant === 'close'
          ? 'text-slate-400 hover:text-red-400 hover:bg-red-500/10'
          : 'text-slate-300 hover:text-white hover:bg-white/10'
      }`}
      title={label}
    >
      {icon}
    </button>
  );
}

// 구분선 컴포넌트
function Divider() {
  return <div className="w-px h-5 bg-slate-600 mx-1" />;
}
