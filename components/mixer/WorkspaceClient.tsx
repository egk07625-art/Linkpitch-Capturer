'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  DragEndEvent,
  DragStartEvent,
  closestCenter
} from '@dnd-kit/core';
import { GripVertical, Upload, Plus, Sparkles, ChevronLeft, ChevronRight, Image, FileText } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { VisionItem } from '@/types/vision';
import type { Prospect, VisionData } from '@/types/prospect';
import type { UserAsset } from '@/types/user-asset';
import type { GeneratedEmail } from '@/types/generated-email';
import { createUserAsset } from '@/actions/user-assets';
import SequencePlaylist from './SequencePlaylist';
import StrategySidebar from './StrategySidebar';

interface WorkspaceClientProps {
  prospectId: string;
  prospect: Prospect;
  visionData: VisionData | null;
  initialUserAssets: UserAsset[];
  initialGeneratedEmails: GeneratedEmail[];
}

// VisionData를 VisionItem 배열로 변환
function visionDataToItems(visionData: VisionData | null): VisionItem[] {
  if (!visionData) return [];

  const items: VisionItem[] = [];

  if (visionData.mood) {
    items.push({
      id: 'vision-mood',
      label: '크리에이티브 무드',
      content: visionData.mood,
      type: 'text',
      isUserAsset: false,
    });
  }

  if (visionData.visual_usp && visionData.visual_usp.length > 0) {
    items.push({
      id: 'vision-usp',
      label: '비주얼 차별점',
      content: visionData.visual_usp.join(', '),
      type: 'text',
      isUserAsset: false,
    });
  }

  if (visionData.price_offer) {
    items.push({
      id: 'vision-price',
      label: '가격/이벤트 정보',
      content: visionData.price_offer,
      type: 'text',
      isUserAsset: false,
    });
  }

  if (visionData.report_title) {
    items.push({
      id: 'vision-title',
      label: '리포트 헤드라인',
      content: visionData.report_title,
      type: 'text',
      isUserAsset: false,
    });
  }

  if (visionData.visual_analysis_text) {
    items.push({
      id: 'vision-analysis',
      label: '시각적 분석',
      content: visionData.visual_analysis_text,
      type: 'text',
      isUserAsset: false,
    });
  }

  if (visionData.opportunity_text) {
    items.push({
      id: 'vision-opportunity',
      label: '기회 포착',
      content: visionData.opportunity_text,
      type: 'text',
      isUserAsset: false,
    });
  }

  return items;
}

// UserAsset을 VisionItem으로 변환
function userAssetToVisionItem(asset: UserAsset): VisionItem {
  const typeLabel = asset.file_type.startsWith('image') ? '이미지' : '파일';
  return {
    id: `asset-${asset.id}`,
    label: `내 소재 (${typeLabel})`,
    content: asset.summary || asset.file_name,
    type: asset.file_type.startsWith('image') ? 'image' : 'file',
    isUserAsset: true,
  };
}

// Draggable Strategy Chip Component
type DraggableStrategyChipProps = {
  item: VisionItem;
  onUpdate: (id: string, newContent: string) => void;
};

function DraggableStrategyChip({ item, onUpdate }: DraggableStrategyChipProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: item.id });
  const [isEditing, setIsEditing] = useState(false);
  const [localContent, setLocalContent] = useState(item.content);

  const handleBlur = () => {
    setIsEditing(false);
    if (localContent !== item.content) {
      onUpdate(item.id, localContent);
    }
  };

  const getIcon = () => {
    if (item.type === 'image') return <Image className="w-3 h-3 text-amber-400" />;
    if (item.type === 'file') return <FileText className="w-3 h-3 text-amber-400" />;
    return null;
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "relative group bg-zinc-900/30 backdrop-blur-sm border border-white/5 hover:border-amber-500/30 rounded-lg p-3 cursor-grab active:cursor-grabbing transition-all duration-300",
        isDragging && "opacity-50 scale-95"
      )}
    >
      <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="w-3 h-3 text-zinc-600" />
      </div>
      <div className="pl-6">
        <div className="flex items-center gap-1.5 mb-2">
          {getIcon()}
          <p className="text-xs font-bold text-amber-400">{item.label}</p>
        </div>
        {isEditing ? (
          <input
            type="text"
            value={localContent}
            onChange={(e) => setLocalContent(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
            autoFocus
            className="w-full bg-zinc-900/50 border border-amber-500/50 rounded px-2 py-1 text-sm text-zinc-200 outline-none"
          />
        ) : (
          <p
            onClick={() => setIsEditing(true)}
            className="text-sm text-zinc-300 leading-relaxed cursor-text hover:text-zinc-100 transition-colors"
          >
            {item.content}
          </p>
        )}
      </div>
    </div>
  );
}

// File Uploader Component
function FileUploader({ onFileUpload, isUploading }: { onFileUpload: (files: File[]) => void; isUploading: boolean }) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileUpload(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(Array.from(e.target.files));
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div
      onClick={() => !isUploading && fileInputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "h-24 border border-dashed rounded-xl flex flex-col items-center justify-center text-zinc-500 transition-all cursor-pointer group",
        isDragging
          ? "border-amber-500 bg-amber-500/10 text-amber-400"
          : "border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800/30",
        isUploading && "opacity-50 cursor-wait"
      )}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        multiple
        accept="image/*,.pdf,.gif"
        disabled={isUploading}
      />
      <div className={cn(
        "p-2 rounded-full mb-1 transition-colors",
        isDragging ? "bg-amber-500/20" : "bg-zinc-800/50 group-hover:bg-zinc-800"
      )}>
        {isDragging ? (
          <Upload className="w-5 h-5 animate-bounce" />
        ) : isUploading ? (
          <div className="w-5 h-5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <Plus className="w-5 h-5 group-hover:text-zinc-300" />
        )}
      </div>
      <span className="text-xs font-medium">
        {isDragging ? "여기에 놓으세요" : isUploading ? "업로드 중..." : "파일 추가하기"}
      </span>
    </div>
  );
}

// Collapsible Drop Zone Component
function CollapsibleDropZone({
  droppedInsights,
  onRemove
}: {
  droppedInsights: VisionItem[];
  onRemove: (id: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { setNodeRef, isOver } = useDroppable({
    id: 'drop-zone',
  });

  return (
    <div className="border border-zinc-800/50 rounded-xl overflow-hidden bg-zinc-900/30">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors flex items-center justify-between group"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <div className="text-left">
            <h3 className="text-sm font-semibold text-zinc-200">선택한 인사이트</h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              {droppedInsights.length}개 선택됨
            </p>
          </div>
        </div>
        <ChevronRight className={cn(
          "w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-all duration-200",
          isExpanded && "rotate-90"
        )} />
      </button>

      {/* Content */}
      {isExpanded && (
        <div
          ref={setNodeRef}
          className={cn(
            "p-4 transition-all duration-200",
            droppedInsights.length === 0 ? "min-h-[140px]" : "",
            isOver && "bg-amber-500/10"
          )}
        >
          {droppedInsights.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-8">
              <Sparkles className="w-8 h-8 mb-2 text-amber-500/50 animate-pulse" />
              <p className="text-xs font-medium text-zinc-500">이곳에 칩을 놓으세요</p>
              <p className="text-xs text-zinc-600 mt-1">드래그하여 추가</p>
            </div>
          ) : (
            <div className="space-y-2">
              {droppedInsights.map((item) => (
                <div
                  key={item.id}
                  className="relative group/item bg-zinc-800/60 border border-amber-500/30 rounded-lg p-3 hover:bg-zinc-800/80 transition-colors"
                >
                  <button
                    onClick={() => onRemove(item.id)}
                    className="absolute top-2 right-2 p-1 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700 rounded opacity-0 group-hover/item:opacity-100 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <p className="text-xs font-bold text-amber-400 mb-1">{item.label}</p>
                  <p className="text-sm text-zinc-200 pr-6 leading-relaxed">{item.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function WorkspaceClient({
  prospectId,
  prospect,
  visionData,
  initialUserAssets,
  initialGeneratedEmails,
}: WorkspaceClientProps) {
  // Vision 데이터를 VisionItem으로 변환
  const initialVisionItems = visionDataToItems(visionData);

  // User Assets를 VisionItem으로 변환
  const initialAssetItems = initialUserAssets.map(userAssetToVisionItem);

  const [visionItems, setVisionItems] = useState<VisionItem[]>([
    ...initialVisionItems,
    ...initialAssetItems,
  ]);
  const [draggedItem, setDraggedItem] = useState<VisionItem | null>(null);
  const [droppedInsights, setDroppedInsights] = useState<VisionItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const item = visionItems.find(i => i.id === active.id);
    if (item) setDraggedItem(item);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { over } = event;
    if (over && over.id === 'drop-zone' && draggedItem) {
      if (!droppedInsights.find(item => item.id === draggedItem.id)) {
        setDroppedInsights(prev => [...prev, draggedItem]);
        setVisionItems(prev => prev.filter(item => item.id !== draggedItem.id));
      }
    }
    setDraggedItem(null);
  };

  const updateVisionItem = (id: string, newContent: string) => {
    setVisionItems(prev => prev.map(item =>
      item.id === id ? { ...item, content: newContent } : item
    ));
  };

  const removeFromDropZone = (id: string) => {
    const removedItem = droppedInsights.find(item => item.id === id);
    if (removedItem) {
      setVisionItems(prev => [...prev, removedItem]);
      setDroppedInsights(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleFileUpload = useCallback(async (files: File[]) => {
    setIsUploading(true);

    try {
      // 각 파일에 대해 처리
      for (const file of files) {
        // TODO: Supabase Storage에 파일 업로드 (현재는 로컬 미리보기만)
        // 실제 구현 시에는 클라이언트에서 Storage에 업로드 후 URL을 받아와야 함

        // 임시: 로컬 파일로 VisionItem 생성
        const newItem: VisionItem = {
          id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          label: `내 소재 (${file.type.startsWith('image') ? '이미지' : '파일'})`,
          content: file.name,
          type: file.type.startsWith('image') ? 'image' : 'file',
          isUserAsset: true,
        };

        setVisionItems(prev => [...prev, newItem]);

        // Server Action으로 메타데이터 저장 (Storage 업로드 후)
        // const { data: asset, error } = await createUserAsset({
        //   file_type: file.type,
        //   file_url: uploadedUrl,
        //   file_name: file.name,
        // });
      }
    } catch (error) {
      console.error('파일 업로드 실패:', error);
    } finally {
      setIsUploading(false);
    }
  }, []);

  if (!mounted) return null;

  return (
    <DndContext
      id="workspace-dnd-context"
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Outer Shell: No Global Scroll */}
      <div className="flex h-screen w-screen bg-zinc-950 overflow-hidden text-zinc-100">

        {/* Left Sidebar: Fixed Width */}
        <aside className="w-[350px] flex-none border-r border-zinc-800/50 flex flex-col bg-zinc-900/20 overflow-y-auto custom-scrollbar">
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="px-5 py-4 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-900/50">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-zinc-200">소재 라이브러리</span>
              </div>
              <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-400 font-mono">
                {prospect.store_name || prospect.name}
              </Badge>
            </div>

            {/* Scrollable Area */}
            <ScrollArea className="flex-1 px-5 py-6">
              <div className="space-y-8">
                {/* Vision Analysis */}
                {visionItems.filter(i => !i.isUserAsset).length > 0 && (
                  <section>
                    <h3 className="text-sm font-bold text-zinc-400 tracking-wider mb-4 pl-1 uppercase">
                      크리에이티브 인사이트
                    </h3>
                    <div className="space-y-3">
                      {visionItems.filter(i => !i.isUserAsset).map((item) => (
                        <DraggableStrategyChip
                          key={item.id}
                          item={item}
                          onUpdate={updateVisionItem}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* User Assets */}
                <section>
                  <h3 className="text-sm font-bold text-zinc-400 tracking-wider mb-4 pl-1 uppercase">
                    내 소재
                  </h3>
                  <div className="space-y-3">
                    {visionItems.filter(i => i.isUserAsset).map((item) => (
                      <DraggableStrategyChip
                        key={item.id}
                        item={item}
                        onUpdate={updateVisionItem}
                      />
                    ))}
                    <FileUploader onFileUpload={handleFileUpload} isUploading={isUploading} />
                  </div>
                </section>

                {/* Drop Zone Section */}
                <section>
                  <CollapsibleDropZone
                    droppedInsights={droppedInsights}
                    onRemove={removeFromDropZone}
                  />
                </section>
              </div>
            </ScrollArea>
          </div>
        </aside>

        {/* Center Stage: Takes ALL remaining space */}
        {/* min-w-0 is CRITICAL to prevent flex collapse */}
        <main className="flex-1 min-w-0 flex flex-col relative bg-zinc-950">
          <SequencePlaylist
            droppedInsights={droppedInsights}
            onRemove={removeFromDropZone}
            currentStep={activeStep}
            generatedEmails={initialGeneratedEmails}
            prospect={prospect}
          />
        </main>

        {/* Right Sidebar: Fixed Width */}
        <aside className="w-[300px] flex-none border-l border-zinc-800/50 bg-zinc-900/20 overflow-y-auto custom-scrollbar">
          <StrategySidebar
            currentStep={activeStep}
            onStepChange={setActiveStep}
          />
        </aside>

      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {draggedItem ? (
          <div className="bg-zinc-800/90 backdrop-blur-md border border-amber-500/50 text-white px-4 py-3 rounded-lg shadow-2xl w-64 cursor-grabbing flex items-center gap-3">
            <GripVertical className="w-4 h-4 text-zinc-500" />
            <div>
              <p className="text-[10px] font-bold text-amber-400 uppercase">{draggedItem.label}</p>
              <p className="text-xs truncate text-zinc-300">{draggedItem.content}</p>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
