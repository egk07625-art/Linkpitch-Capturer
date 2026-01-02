'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, Pencil, Copy, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CategoryInfo {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SubjectOptionsCompactProps {
  categories: Record<string, CategoryInfo>;
  subjectsByCategory: Record<string, string[]>;
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  selectedSubject: string;
  onSubjectSelect: (subject: string) => void;
  getDisplaySubject: (idx: number, original: string) => string;
  onSubjectEdit: (idx: number, newText: string) => void;
  currentStep: number;
  isCopied: boolean;
  onCopy: () => void;
}

export function SubjectOptionsCompact({
  categories,
  subjectsByCategory,
  activeCategory,
  onCategoryChange,
  selectedSubject,
  onSubjectSelect,
  getDisplaySubject,
  onSubjectEdit,
  currentStep,
  isCopied,
  onCopy,
}: SubjectOptionsCompactProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // 현재 카테고리의 제목들
  const currentSubjects = subjectsByCategory[activeCategory] || [];
  const categoryKeys = Object.keys(categories);
  
  // 현재 카테고리의 모든 displayText 목록
  const currentCategoryDisplayTexts = currentSubjects.map((subj, idx) => getDisplaySubject(idx, subj));

  // 편집 모드 시작
  const startEditing = useCallback((idx: number, currentText: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingIdx(idx);
    setEditValue(currentText);
  }, []);

  // 편집 완료
  const finishEditing = useCallback(() => {
    if (editingIdx !== null && editValue.trim()) {
      onSubjectEdit(editingIdx, editValue.trim());
      onSubjectSelect(editValue.trim());
    }
    setEditingIdx(null);
    setEditValue('');
  }, [editingIdx, editValue, onSubjectEdit, onSubjectSelect]);

  // 편집 취소
  const cancelEditing = useCallback(() => {
    setEditingIdx(null);
    setEditValue('');
  }, []);

  // 키보드 핸들러
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      finishEditing();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  }, [finishEditing, cancelEditing]);

  // 편집 모드 진입 시 포커스
  useEffect(() => {
    if (editingIdx !== null && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingIdx]);

  // 키보드 접근성 핸들러 (펼치기/접기)
  const handleHeaderKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsExpanded(!isExpanded);
    }
  }, [isExpanded]);

  return (
    <div className="bg-white rounded-xl border border-zinc-200 border-b shadow-sm overflow-hidden">
      {/* 헤더 - 선택된 제목 표시 */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={handleHeaderKeyDown}
        role="button"
        tabIndex={0}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2 focus:ring-offset-white"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Step 배지 - SegmentedControl 스타일 */}
          <div className="inline-flex p-1 bg-white rounded-xl border border-zinc-200 shadow-sm">
            <span className="relative px-5 py-1.5 rounded-lg text-sm font-medium tracking-tight bg-zinc-100 text-zinc-900 border border-zinc-200">
              Step {currentStep}
            </span>
          </div>
          <span className="text-xl font-bold text-slate-900 truncate leading-relaxed">
            {selectedSubject || '제목을 선택하세요'}
          </span>
          {selectedSubject && (
            <span className="text-sm text-gray-700 flex-shrink-0 font-medium">
              ({selectedSubject.length}자)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* 복사 버튼 - ToolbarButton 스타일 */}
          <div className="inline-flex p-1 bg-white rounded-xl border border-zinc-200 shadow-sm">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCopy();
              }}
              disabled={!selectedSubject}
              className={cn(
                'relative px-5 py-1.5 rounded-lg text-sm font-medium tracking-tight transition-all duration-200 active:scale-[0.98] flex items-center gap-1.5',
                isCopied
                  ? 'text-emerald-700'
                  : selectedSubject
                    ? 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50'
                    : 'text-zinc-300 cursor-not-allowed'
              )}
            >
              {isCopied && (
                <motion.div
                  layoutId="copyButtonIndicator"
                  className="absolute inset-0 bg-emerald-50 border border-emerald-200 rounded-lg shadow-sm"
                  transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                {isCopied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                {isCopied ? '복사됨' : '복사'}
              </span>
            </button>
          </div>

          <ChevronDown
            size={18}
            className={cn(
              'text-gray-500 transition-transform',
              isExpanded && 'rotate-180'
            )}
          />
        </div>
      </div>

      {/* 확장 영역 - 카테고리 탭 + 제목 리스트 */}
      {isExpanded && (
        <div className="overflow-hidden">
            {/* 카테고리 탭 - 3D Tactile Buttons */}
            <div className="border-t border-zinc-200 px-4 py-3 flex gap-3 overflow-x-auto no-scrollbar bg-white">
              {categoryKeys.map((key) => {
                const category = categories[key];
                const Icon = category.icon;
                const isActive = activeCategory === key;
                const hasSubjects = (subjectsByCategory[key]?.length || 0) > 0;

                return (
                  <button
                    key={key}
                    onClick={() => onCategoryChange(key)}
                    className={cn(
                      'bg-white border border-zinc-200 rounded-lg shadow-md',
                      'px-5 py-3 whitespace-nowrap',
                      'hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200',
                      'active:scale-[0.98]',
                      isActive
                        ? 'bg-blue-50 text-blue-600 border-blue-200 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]'
                        : 'text-slate-900 hover:bg-gray-50'
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span className="hidden md:inline text-base font-semibold">{category.label}</span>
                      {hasSubjects && !isActive && (
                        <span className="px-1.5 py-0.5 rounded-md text-xs bg-gray-100 text-gray-700 font-semibold">
                          {subjectsByCategory[key]?.length || 0}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 제목 리스트 */}
            <div className="border-t border-zinc-200 p-3 space-y-1 max-h-[280px] overflow-y-auto bg-gray-50">
              {currentSubjects.length > 0 ? (
                currentSubjects.map((originalSubject, idx) => {
                  const displayText = getDisplaySubject(idx, originalSubject);
                  // 현재 활성 카테고리의 제목만 선택 상태로 표시
                  const isSelected = selectedSubject === displayText && 
                    currentCategoryDisplayTexts.includes(selectedSubject);
                  const isEditing = editingIdx === idx;
                  const isEdited = displayText !== originalSubject;

                  return (
                    <div
                      key={idx}
                      onClick={() => !isEditing && onSubjectSelect(displayText)}
                      className={cn(
                        'group flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all leading-relaxed',
                        isSelected
                          ? 'bg-blue-50 ring-1 ring-blue-200 shadow-sm'
                          : 'hover:bg-gray-100'
                      )}
                    >
                      {/* 번호 */}
                      <span className={cn(
                        'flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold',
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700'
                      )}>
                        {idx + 1}
                      </span>

                      {/* 제목 텍스트/입력 */}
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <input
                            ref={inputRef}
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={finishEditing}
                            onKeyDown={handleKeyDown}
                            onClick={(e) => e.stopPropagation()}
                            className="w-1/2 bg-white text-slate-900 text-base px-3 py-2 rounded-lg
                                       border border-zinc-300 focus:border-blue-500
                                       focus:ring-2 focus:ring-blue-500/20
                                       outline-none transition-all duration-200 font-medium"
                          />
                        ) : (
                          <p
                            onClick={(e) => startEditing(idx, displayText, e)}
                            className={cn(
                              'text-base truncate cursor-text transition-colors leading-relaxed font-medium',
                              isSelected ? 'text-slate-900' : 'text-gray-700 hover:text-slate-900'
                            )}
                          >
                            {displayText}
                            {isEdited && (
                              <span className="ml-1.5 text-xs text-amber-600 font-medium">
                                (수정됨)
                              </span>
                            )}
                          </p>
                        )}
                      </div>

                      {/* 글자 수 + 편집 + 체크 */}
                      <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
                        {isEditing ? (
                          <span className={cn(
                            'text-sm font-mono tabular-nums font-medium',
                            editValue.length > 60
                              ? 'text-red-600'
                              : editValue.length > 40
                                ? 'text-amber-600'
                                : 'text-gray-700'
                          )}>
                            {editValue.length}/60
                          </span>
                        ) : (
                          <>
                            <span className="text-xs text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                              {displayText.length}자
                            </span>
                            <button
                              onClick={(e) => startEditing(idx, displayText, e)}
                              className="p-1.5 rounded-lg bg-white border border-zinc-300
                                         opacity-0 group-hover:opacity-100 transition-opacity
                                         hover:bg-gray-50"
                            >
                              <Pencil size={12} className="text-gray-700" />
                            </button>
                          </>
                        )}

                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                            <Check size={11} className="text-white" strokeWidth={3} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-6 text-center text-gray-700 text-base font-medium">
                  이 카테고리에 제목이 없습니다
                </div>
              )}
            </div>

            {/* 하단 팁 */}
            <div className="px-4 py-2 border-t border-zinc-200 bg-gray-50">
              <p className="text-sm text-gray-700 font-medium leading-relaxed">
                제목을 클릭하면 직접 수정할 수 있어요
              </p>
            </div>
        </div>
      )}
    </div>
  );
}
