'use client';

import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Plus, Mail, Monitor } from 'lucide-react';

interface StepCardProps {
  step: number;
  title: string;
  icon: React.ReactNode;
}

export default function StepCard({ step, title, icon }: StepCardProps) {
  const [activeTab, setActiveTab] = useState<'email' | 'report'>('email');
  const { setNodeRef, isOver } = useDroppable({
    id: `step-${step}`,
  });

  return (
    <div className="group relative rounded-xl border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/50 hover:border-zinc-700 transition-all duration-300 overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between p-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-medium text-zinc-400">
            {step}
          </div>
          <span className="text-zinc-200 font-medium">{title}</span>
        </div>
        <div className="text-zinc-600 group-hover:text-zinc-500 transition-colors">
          {icon}
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-zinc-800 px-6">
        <button
          onClick={() => setActiveTab('email')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative ${
            activeTab === 'email'
              ? 'text-zinc-100'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>✉️ 예고편 (Email)</span>
          {activeTab === 'email' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-100" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('report')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative ${
            activeTab === 'report'
              ? 'text-zinc-100'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Monitor className="w-4 h-4" />
          <span>🖥️ 본편 (Report)</span>
          {activeTab === 'report' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-100" />
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'email' ? (
          <div className="space-y-4">
            {/* Subject Line */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-2">
                제목
              </label>
              <input
                type="text"
                placeholder="이메일 제목을 입력하세요..."
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700"
              />
            </div>

            {/* Email Body with Drop Zone */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-2">
                본문
              </label>
              <div
                ref={setNodeRef}
                className={`relative min-h-[200px] rounded-lg border-2 border-dashed transition-all ${
                  isOver
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-zinc-800 bg-zinc-950/50'
                }`}
              >
                <textarea
                  placeholder="이메일 본문을 입력하거나, 좌측의 전략 칩을 드래그하여 AI가 생성한 내용을 추가하세요..."
                  className="w-full h-full min-h-[200px] bg-transparent p-4 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none resize-none"
                />
                
                {/* Drop Zone Overlay */}
                {isOver && (
                  <div className="absolute inset-0 flex items-center justify-center bg-blue-500/5 pointer-events-none">
                    <div className="flex items-center gap-2 text-blue-400 font-medium">
                      <Plus className="w-5 h-5" />
                      <span>여기에 놓으면 AI가 내용을 생성합니다</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="min-h-[200px] rounded-lg border border-zinc-800 bg-zinc-950/50 flex items-center justify-center">
            <div className="text-center text-zinc-500">
              <Monitor className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">웹 리포트 미리보기</p>
              <p className="text-xs mt-1">곧 제공될 예정입니다</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
