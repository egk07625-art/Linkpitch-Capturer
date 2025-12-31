'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Pencil, Copy, CheckCircle2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

// 카테고리 타입
interface CategoryInfo {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SubjectOptionsProps {
  // Step별 카테고리 정의
  categories: Record<string, CategoryInfo>;
  // 카테고리별 제목 리스트
  subjectsByCategory: Record<string, string[]>;
  // 현재 활성 카테고리
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  // 선택된 제목 텍스트
  selectedSubject: string;
  onSubjectSelect: (subject: string) => void;
  // 제목 수정
  getDisplaySubject: (idx: number, original: string) => string;
  onSubjectEdit: (idx: number, newText: string) => void;
  // 복사 상태
  isCopied: boolean;
  onCopy: () => void;
}

export function SubjectOptions({
  categories,
  subjectsByCategory,
  activeCategory,
  onCategoryChange,
  selectedSubject,
  onSubjectSelect,
  getDisplaySubject,
  onSubjectEdit,
  isCopied,
  onCopy,
}: SubjectOptionsProps) {
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // 현재 카테고리의 제목들
  const currentSubjects = subjectsByCategory[activeCategory] || [];

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
      // 편집 완료 후 해당 제목 선택
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

  // 카테고리 키 목록
  const categoryKeys = Object.keys(categories);

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <label className="flex items-center gap-2 text-base font-bold text-zinc-500 uppercase tracking-widest">
          <Sparkles className="w-5 h-5 text-cyan-500" /> Subject Options
        </label>

        {/* 제목 복사 버튼 */}
        <button
          onClick={onCopy}
          disabled={!selectedSubject}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all border ${
            isCopied
              ? 'bg-emerald-500 text-white border-emerald-600'
              : selectedSubject
              ? 'bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700 hover:border-zinc-600'
              : 'bg-zinc-800/50 text-zinc-500 border-zinc-700/50 cursor-not-allowed'
          }`}
        >
          {isCopied ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              복사됨!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              제목 복사
            </>
          )}
        </button>
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex items-center gap-2 p-1.5 bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-x-auto no-scrollbar">
        {categoryKeys.map((key) => {
          const category = categories[key];
          const Icon = category.icon;
          const isActive = activeCategory === key;
          const hasSubjects = (subjectsByCategory[key]?.length || 0) > 0;
          const hasSelected = subjectsByCategory[key]?.some(
            (_, idx) => getDisplaySubject(idx, subjectsByCategory[key][idx]) === selectedSubject
          );

          return (
            <motion.button
              key={key}
              onClick={() => onCategoryChange(key)}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/15 text-cyan-400 border border-cyan-500/30 shadow-lg shadow-cyan-500/10'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 border border-transparent'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-zinc-500'}`} />
              <span className="hidden sm:inline">{category.label}</span>

              {/* 선택된 항목 있음 표시 */}
              {hasSelected && (
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              )}

              {/* 제목 개수 뱃지 */}
              {hasSubjects && !isActive && (
                <span className="px-1.5 py-0.5 rounded text-xs bg-zinc-800 text-zinc-500">
                  {subjectsByCategory[key]?.length || 0}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* 제목 카드 리스트 */}
      <div className="space-y-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-2"
          >
            {currentSubjects.length > 0 ? (
              currentSubjects.map((originalSubject, idx) => {
                const displayText = getDisplaySubject(idx, originalSubject);
                const isSelected = selectedSubject === displayText;
                const isEditing = editingIdx === idx;
                const isEdited = displayText !== originalSubject;

                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => !isEditing && onSubjectSelect(displayText)}
                    className={`group relative rounded-xl cursor-pointer transition-all duration-200 border overflow-hidden ${
                      isSelected
                        ? 'bg-gradient-to-r from-cyan-500/10 via-cyan-500/5 to-transparent border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                        : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/40'
                    }`}
                  >
                    {/* 왼쪽 선택 바 */}
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 ${
                        isSelected
                          ? 'bg-gradient-to-b from-cyan-400 to-blue-500'
                          : 'bg-transparent group-hover:bg-zinc-700'
                      }`}
                    />

                    <div className="flex items-center gap-5 p-4 pl-5">
                      {/* 번호 태그 */}
                      <span
                        className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${
                          isSelected
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : 'bg-zinc-800 text-zinc-500 border border-zinc-700 group-hover:text-zinc-400'
                        }`}
                      >
                        {idx + 1}
                      </span>

                      {/* 제목 입력/표시 영역 - 70% 너비 제한 */}
                      <div className="flex-1 min-w-0 max-w-[70%]">
                        {isEditing ? (
                          <div className="space-y-1.5">
                            <input
                              ref={inputRef}
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={finishEditing}
                              onKeyDown={handleKeyDown}
                              onClick={(e) => e.stopPropagation()}
                              className="w-full max-w-[700px] bg-zinc-900 text-white text-sm px-3 py-2.5 rounded-md
                                         border border-zinc-700/50
                                         focus:border-cyan-500/70 focus:shadow-[0_0_0_3px_rgba(34,211,238,0.1),0_0_15px_rgba(34,211,238,0.15)]
                                         outline-none transition-all duration-200"
                              placeholder="제목을 입력하세요..."
                            />
                            {/* 팁 문구 */}
                            <p className="text-[10px] text-zinc-600 pl-1">
                              팁: 40자 이내의 제목이 클릭률이 가장 높습니다.
                            </p>
                          </div>
                        ) : (
                          <div
                            onClick={(e) => startEditing(idx, displayText, e)}
                            className="group/text relative cursor-text"
                          >
                            <p
                              className={`text-sm leading-relaxed transition-colors ${
                                isSelected ? 'text-zinc-200' : 'text-zinc-400 group-hover:text-zinc-300'
                              }`}
                            >
                              {displayText}
                            </p>

                            {/* 수정됨 표시 */}
                            {isEdited && (
                              <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-amber-500/70">
                                <Pencil size={9} />
                                수정됨
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* 글자 수 카운터 */}
                      <div className="flex-shrink-0 flex items-center gap-3">
                        {isEditing ? (
                          <span
                            className={`text-xs font-mono tabular-nums transition-colors ${
                              editValue.length > 60
                                ? 'text-red-400'
                                : editValue.length > 40
                                ? 'text-amber-400'
                                : 'text-zinc-500'
                            }`}
                          >
                            {editValue.length} / 60자
                          </span>
                        ) : (
                          <span
                            className={`text-xs font-mono tabular-nums transition-colors opacity-0 group-hover:opacity-100 ${
                              displayText.length > 60
                                ? 'text-red-400'
                                : displayText.length > 40
                                ? 'text-amber-400'
                                : 'text-zinc-600'
                            }`}
                          >
                            {displayText.length}자
                          </span>
                        )}

                        {/* 편집 힌트 아이콘 */}
                        {!isEditing && (
                          <div
                            onClick={(e) => startEditing(idx, displayText, e)}
                            className="p-1.5 rounded-md bg-zinc-800/80 border border-zinc-700/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-zinc-700"
                          >
                            <Pencil size={11} className="text-zinc-400" />
                          </div>
                        )}
                      </div>

                      {/* 선택 체크 아이콘 */}
                      <div
                        className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-gradient-to-br from-cyan-400 to-blue-500 text-white scale-100 shadow-lg shadow-cyan-500/30'
                            : 'bg-zinc-800 text-zinc-600 scale-90 opacity-0 group-hover:opacity-50 border border-zinc-700'
                        }`}
                      >
                        <Check size={14} strokeWidth={3} />
                      </div>
                    </div>

                    {/* 호버 글로우 효과 */}
                    <div
                      className={`absolute inset-0 rounded-xl pointer-events-none transition-opacity duration-300 ${
                        isSelected
                          ? 'opacity-0'
                          : 'opacity-0 group-hover:opacity-100 bg-gradient-to-r from-zinc-700/10 to-transparent'
                      }`}
                    />
                  </motion.div>
                );
              })
            ) : (
              <div className="p-8 rounded-xl border border-zinc-800 bg-zinc-900/30 text-center">
                <p className="text-zinc-500 text-sm">
                  이 카테고리에 제목이 없습니다
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
}
