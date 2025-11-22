'use client';

import React from 'react';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { useMixerStore } from '@/store/mixer-store';
import { FileText, Mail, MessageSquare } from 'lucide-react';
import StepCard from './StepCard';

export default function SequencePlaylist() {
  const { setIsDragging } = useMixerStore();

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setIsDragging(false);
    // Logic for handling drop will go here later
    console.log('Dropped:', event);
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="h-full p-8 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          <header className="mb-12">
            <h1 className="text-2xl font-bold text-zinc-100 mb-2">제안 시나리오 구성</h1>
            <p className="text-zinc-500">좌측의 전략 칩을 드래그하여, 각 단계별 이메일 내용을 완성하세요.</p>
          </header>

          <div className="space-y-6">
            <StepCard 
              step={1} 
              title="1. 후킹 (Hook)" 
              icon={<MessageSquare className="w-5 h-5" />} 
            />
            <StepCard 
              step={2} 
              title="2. 문제 제기 (Problem)" 
              icon={<FileText className="w-5 h-5" />} 
            />
            <StepCard 
              step={3} 
              title="3. 솔루션 제안 (Solution)" 
              icon={<Mail className="w-5 h-5" />} 
            />
          </div>
        </div>
      </div>
    </DndContext>
  );
}
