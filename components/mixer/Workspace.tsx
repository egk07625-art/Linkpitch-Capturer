'use client'

import React, { useState, useEffect } from 'react'
import { 
  DndContext, 
  DragOverlay, 
  useDraggable, 
  useDroppable, 
  DragEndEvent,
  DragStartEvent,
  closestCenter
} from '@dnd-kit/core'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bot, 
  ChevronRight,
  ChevronLeft,
  FileText, 
  GripVertical, 
  LayoutTemplate, 
  Mail, 
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  Upload,
  Plus,
  X
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// --- Mock Data Types ---
type VisionItem = {
  id: string
  label: string
  content: string
  type: 'text' | 'image' | 'file'
  isUserAsset?: boolean
}

const INITIAL_VISION_DATA: VisionItem[] = [
  { id: 'v1', label: '크리에이티브 무드', content: '럭셔리, 미니멀리스트, 하이엔드 패션', type: 'text', isUserAsset: false },
  { id: 'v2', label: '비주얼 차별점', content: '극도의 클로즈업 텍스처와 높은 대비 조명', type: 'text', isUserAsset: false },
  { id: 'v3', label: '메인 소재', content: '금도금 향수병', type: 'text', isUserAsset: false },
  { id: 'v4', label: '성과 데이터', content: 'ROAS +280% (이미지 소재)', type: 'image', isUserAsset: false },
]

export default function Workspace() {
  const [activeTab, setActiveTab] = useState<'email' | 'report'>('report')
  const [visionItems, setVisionItems] = useState(INITIAL_VISION_DATA)
  const [editorContent, setEditorContent] = useState('')
  const [draggedItem, setDraggedItem] = useState<VisionItem | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [droppedInsights, setDroppedInsights] = useState<VisionItem[]>([])
  const [aiEmailContent, setAiEmailContent] = useState('')
  const [showMergeModal, setShowMergeModal] = useState(false)
  const [isAiBarOpen, setIsAiBarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  // --- DnD Handlers ---
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const item = visionItems.find(i => i.id === active.id)
    if (item) setDraggedItem(item)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { over } = event
    if (over && over.id === 'drop-zone' && draggedItem) {
      // Add to dropped insights if not already added
      if (!droppedInsights.find(item => item.id === draggedItem.id)) {
        setDroppedInsights(prev => [...prev, draggedItem])
        // Remove from vision items (move instead of copy)
        setVisionItems(prev => prev.filter(item => item.id !== draggedItem.id))
      }
    }
    setDraggedItem(null)
  }

  // --- Inline Edit Handler for Left Pane ---
  const updateVisionItem = (id: string, newContent: string) => {
    setVisionItems(prev => prev.map(item => 
      item.id === id ? { ...item, content: newContent } : item
    ))
  }

  // --- Remove from Drop Zone ---
  const removeFromDropZone = (id: string) => {
    const removedItem = droppedInsights.find(item => item.id === id)
    if (removedItem) {
      // Add back to vision items
      setVisionItems(prev => [...prev, removedItem])
      // Remove from dropped insights
      setDroppedInsights(prev => prev.filter(item => item.id !== id))
    }
  }

  // --- Merge Handler ---
  const handleMerge = async () => {
    // TODO: Call LLM API to merge droppedInsights + aiEmailContent
    setShowMergeModal(true)
  }

  // --- File Upload Handler ---
  const handleFileUpload = (files: File[]) => {
    const newItems: VisionItem[] = files.map(file => ({
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      label: '내 소재 파일',
      content: file.name, // In a real app, this might be a URL or file preview
      type: 'file',
      isUserAsset: true
    }))
    setVisionItems(prev => [...prev, ...newItems])
  }

  return (
    <DndContext 
      id="workspace-dnd-context"
      collisionDetection={closestCenter} 
      onDragStart={handleDragStart} 
      onDragEnd={handleDragEnd}
    >
      {/* 
        [Global Layout] 
        h-screen & overflow-hidden ensures NO global scrollbar. 
        Everything lives inside this fixed container.
      */}
      <div className="h-screen w-full bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-blue-500/30">
        
        {/* 1. Header: Minimalist & Functional */}
        <Header isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        {/* 2. Main Workspace: 3-Column Layout */}
        <div className="flex-1 overflow-hidden relative flex">
          
          {/* === LEFT PANE: Collapsible Sidebar === */}
          <AnimatePresence mode="wait">
            {isSidebarOpen && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 320, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="flex-shrink-0 bg-zinc-900/30 backdrop-blur-sm z-10 border-r border-zinc-800/50 overflow-hidden"
              >
                <div className="h-full flex flex-col w-80">
                  
                  {/* Pane Header */}
                  <div className="px-5 py-4 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-900/50">
                    <div className="flex items-center gap-2">
                      <LayoutTemplate className="w-4 h-4 text-zinc-400" />
                      <span className="text-sm font-medium text-zinc-200">소재 라이브러리</span>
                    </div>
                    <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-400 font-mono">
                      AI 분석완료
                    </Badge>
                  </div>

                  {/* Scrollable Area for Assets */}
                  <ScrollArea className="flex-1 px-5 py-6">
                    <div className="space-y-8">
                      {/* Section: Vision Analysis */}
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

                      {/* Section: User Assets */}
                      <section>
                        <h3 className="text-sm font-bold text-zinc-400 tracking-wider mb-4 pl-1 uppercase">
                          내 소재
                        </h3>
                        <div className="space-y-3">
                          {/* Uploaded User Assets */}
                          {visionItems.filter(i => i.isUserAsset).map((item) => (
                            <DraggableStrategyChip 
                              key={item.id} 
                              item={item} 
                              onUpdate={updateVisionItem} 
                            />
                          ))}

                          {/* Upload Box */}
                          <FileUploader onFileUpload={handleFileUpload} />
                        </div>
                      </section>
                    </div>
                  </ScrollArea>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* === CENTER: Drop Zone (only for report tab) === */}
          {/* === CENTER: Drop Zone (only for report tab) === */}
          <AnimatePresence mode="wait">
            {activeTab === 'report' && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 384, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="flex-shrink-0 border-r border-zinc-800/50 bg-zinc-950 overflow-hidden"
              >
                <div className="w-96 h-full">
                  <DropZone 
                    droppedInsights={droppedInsights}
                    onRemove={removeFromDropZone}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* === RIGHT PANE: Content Area === */}
          <div className="flex-1 flex flex-col bg-zinc-950 relative h-full overflow-hidden">
              
              {/* Tab Switcher */}
              <div className="flex justify-center pt-6 pb-2 z-20">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-[320px]">
                  <TabsList className="grid w-full grid-cols-2 bg-zinc-800/50 rounded-full p-1">
                    <TabsTrigger value="email" className="rounded-full text-xs font-medium text-zinc-400 data-[state=active]:bg-zinc-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300">
                      <Mail className="w-3 h-3 mr-2" /> 메일 본문
                    </TabsTrigger>
                    <TabsTrigger value="report" className="rounded-full text-xs font-medium text-zinc-400 data-[state=active]:bg-zinc-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300">
                      <FileText className="w-3 h-3 mr-2" /> AI 드래프팅
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Content Area */}
              <ScrollArea className="flex-1 w-full min-h-0 pb-6">
                {activeTab === 'email' ? (
                  <SimpleEmailEditor 
                    content={editorContent}
                    setContent={setEditorContent}
                  />
                ) : (
                  <AIEmailPreview
                    aiContent={aiEmailContent}
                    setAiContent={setAiEmailContent}
                    droppedInsights={droppedInsights}
                    onMerge={handleMerge}
                  />
                )}
              </ScrollArea>

              {/* AI Command Bar (Fixed at bottom of Right Pane) */}
              {/* AI Command Bar (Toggleable) */}

            </div>
        </div>
        
        {/* Fixed AI Command Bar (Always at bottom of viewport) */}
        <AnimatePresence>
          {!isAiBarOpen ? (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsAiBarOpen(true)}
              className="fixed bottom-6 right-6 h-12 w-12 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 flex items-center justify-center z-50 transition-colors"
            >
              <Bot className="w-6 h-6" />
            </motion.button>
          ) : (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-0 left-0 w-full px-8 pb-6 pt-2 z-50 pointer-events-none"
            >
              <div className="pointer-events-auto w-full max-w-3xl mx-auto">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl opacity-20 group-hover:opacity-40 blur transition duration-500" />
                  <div className="relative bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 rounded-xl shadow-2xl flex items-center p-1.5 pl-4 overflow-hidden">
                    <Bot className="w-5 h-5 text-indigo-400 mr-3 animate-pulse" />
                    <input 
                      type="text" 
                      placeholder="AI에게 메시지 개선이나 톤 조정을 요청하세요..." 
                      className="flex-1 bg-transparent border-none outline-none text-sm text-zinc-200 placeholder:text-zinc-500 h-10"
                      autoFocus
                    />
                    <div className="flex gap-1">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-zinc-400 hover:text-white rounded-lg"
                        onClick={() => setIsAiBarOpen(false)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      <Button size="sm" className="h-8 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium">
                        실행
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Drag Overlay (Visual feedback when dragging) */}
      <DragOverlay>
        {draggedItem ? (
          <div className="bg-zinc-800/90 backdrop-blur-md border border-indigo-500/50 text-white px-4 py-3 rounded-lg shadow-2xl w-64 cursor-grabbing flex items-center gap-3">
             <GripVertical className="w-4 h-4 text-zinc-500" />
             <div>
               <p className="text-[10px] font-bold text-indigo-400 uppercase">{draggedItem.label}</p>
               <p className="text-xs truncate text-zinc-300">{draggedItem.content}</p>
             </div>
          </div>
        ) : null}
      </DragOverlay>

      {/* Merge Result Modal */}
      <MergeModal
        isOpen={showMergeModal}
        onClose={() => setShowMergeModal(false)}
        mergedContent="TODO: LLM API 호출 결과가 여기에 표시됩니다."
      />
    </DndContext>
  )
}

// ------------------------------------------------------------------
// Sub-Components (Modular for Cleanliness)
// ------------------------------------------------------------------

/**
 * 1. Header Component
 */
function Header({ isSidebarOpen, onToggleSidebar }: { isSidebarOpen: boolean, onToggleSidebar: () => void }) {
  return (
    <header className="h-12 flex-none border-b border-zinc-800/50 bg-zinc-950/95 backdrop-blur-md px-6 flex items-center justify-between z-50">
      <div className="flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onToggleSidebar}
          className="h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
        >
          {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
        </Button>
        <h1 className="text-sm font-semibold text-zinc-100 tracking-tight">GlowUp 프로젝트 #1</h1>
        <span className="text-[10px] text-zinc-500 font-mono">· 2분 전 자동저장</span>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white hover:bg-zinc-800 h-7 text-xs">
          저장
        </Button>
        <Button size="sm" className="bg-white text-black hover:bg-zinc-200 h-7 px-3 text-xs font-medium rounded-full">
          메일 시퀀스 완성 <ChevronRight className="w-3 h-3 ml-1" />
        </Button>
      </div>
    </header>
  )
}

/**
 * 2. Draggable Strategy Chip
 */
type DraggableStrategyChipProps = {
  item: VisionItem
  onUpdate: (id: string, newContent: string) => void
}

function DraggableStrategyChip({ item, onUpdate }: DraggableStrategyChipProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: item.id })
  const [isEditing, setIsEditing] = useState(false)
  const [localContent, setLocalContent] = useState(item.content)

  const handleBlur = () => {
    setIsEditing(false)
    if (localContent !== item.content) {
      onUpdate(item.id, localContent)
    }
  }

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "relative group bg-zinc-900/30 backdrop-blur-sm border border-white/5 hover:border-indigo-500/30 rounded-lg p-3 cursor-grab active:cursor-grabbing transition-all duration-300",
        isDragging && "opacity-50 scale-95"
      )}
    >
      {/* Drag Handle Icon */}
      <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="w-3 h-3 text-zinc-600" />
      </div>

      {/* Content */}
      <div className="pl-6">
        <p className="text-xs font-bold text-indigo-400 mb-2">{item.label}</p>
        {isEditing ? (
          <input
            type="text"
            value={localContent}
            onChange={(e) => setLocalContent(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
            autoFocus
            className="w-full bg-zinc-900/50 border border-indigo-500/50 rounded px-2 py-1 text-sm text-zinc-200 outline-none"
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

      {/* Edit Hint */}
      {!isEditing && (
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <span className="text-[10px] text-zinc-500">클릭하여 수정</span>
        </div>
      )}
    </div>
  )
}

/**
 * 3. Drop Zone Component
 */
function DropZone({ droppedInsights, onRemove }: { droppedInsights: VisionItem[], onRemove: (id: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'drop-zone',
  })

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-zinc-800/50 bg-zinc-900/50">
        <h3 className="text-base font-semibold text-zinc-200">선택한 인사이트</h3>
        <p className="text-sm text-zinc-500 mt-1">{droppedInsights.length}개 선택됨</p>
      </div>

      {/* Drop Area */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 p-5 transition-colors",
          isOver && "bg-indigo-500/10"
        )}
      >
        {droppedInsights.length === 0 ? (
          <div className="h-full bg-gradient-to-b from-zinc-900/50 to-transparent rounded-xl flex flex-col items-center justify-center text-zinc-500">
            <Sparkles className="w-12 h-12 mb-4 text-indigo-500/50 animate-pulse" />
            <p className="text-base font-medium text-zinc-500">이곳에 칩을 놓고 "제안서 작성" 버튼을 누르면 AI가 조합하여 작성합니다.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {droppedInsights.map((item) => (
              <div 
                key={item.id}
                className="relative group bg-zinc-800/60 border border-indigo-500/30 rounded-lg p-4"
              >
                <button
                  onClick={() => onRemove(item.id)}
                  className="absolute top-2 right-2 p-1 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700 rounded opacity-0 group-hover:opacity-100 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <p className="text-xs font-bold text-indigo-400 mb-1">{item.label}</p>
                <p className="text-sm text-zinc-200">{item.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * 4. Simple Email Editor Component
 */
function SimpleEmailEditor({ content, setContent }: { content: string, setContent: (c: string) => void }) {
  return (
    <div className="max-w-3xl mx-auto py-12 px-8">
      <div className="mb-8 space-y-2 border-b border-zinc-800 pb-6">
        <label className="text-xs font-semibold text-zinc-500">제목</label>
        <input 
          className="w-full bg-transparent text-2xl font-semibold text-white placeholder:text-zinc-700 outline-none"
          placeholder="클릭률 높은 제목을 입력하세요..."
          defaultValue="Re: 최근 캠페인 성과 관련 문의드립니다"
        />
      </div>

      <div 
        className="prose prose-invert max-w-none text-lg leading-relaxed text-zinc-300/90 whitespace-pre-wrap outline-none min-h-[400px] empty:before:content-['이메일_내용을_작성하세요...'] empty:before:text-zinc-700"
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => setContent(e.currentTarget.textContent || '')}
      >
        {content || "안녕하세요 [Name]님,\n\n최근 귀사의 캠페인을 보고 성과 개선 방안을 제안드리고자 연락드립니다...\\n\\n"}
      </div>
    </div>
  )
}

/**
 * 5. AI Email Preview Component
 */
function AIEmailPreview({ 
  aiContent, 
  setAiContent, 
  droppedInsights,
  onMerge 
}: { 
  aiContent: string
  setAiContent: (c: string) => void
  droppedInsights: VisionItem[]
  onMerge: () => void
}) {
  return (
    <div className="max-w-3xl mx-auto py-12 px-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-zinc-100">AI 생성 제안서</h2>
          <Badge variant="outline" className="text-xs border-indigo-500/50 text-indigo-400">
            <Bot className="w-3 h-3 mr-1" />
            AI 생성됨
          </Badge>
        </div>
        <Button
          onClick={onMerge}
          disabled={droppedInsights.length === 0}
          className="bg-[#5B21B6] hover:bg-[#4C1D95] text-white px-6 py-2.5 rounded-lg font-medium text-sm transition-all shadow-md border-none"
        >
          제안서 생성
        </Button>
      </div>

      {/* Info Box */}
      <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-lg p-4 mb-8 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm text-zinc-200 font-medium">
            {droppedInsights.length}개의 인사이트가 선택되었습니다
          </p>
          <p className="text-xs text-zinc-400 leading-relaxed">
            좌측에서 선택한 인사이트들이 AI 제안서에 자동으로 반영됩니다. 
            '인사이트 합치기'를 클릭하여 최종 제안서를 생성하세요.
          </p>
        </div>
      </div>

      <div 
        className="prose prose-invert max-w-none text-base leading-relaxed text-zinc-300 whitespace-pre-wrap outline-none min-h-[400px]"
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => setAiContent(e.currentTarget.textContent || '')}
      >
        {aiContent || "URL을 입력하면 AI가 자동으로 초안을 작성합니다..."}
      </div>
    </div>
  )
}

/**
 * 6. Merge Modal Component
 */
function MergeModal({ isOpen, onClose, mergedContent }: { isOpen: boolean, onClose: () => void, mergedContent: string }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-100">최종 제안서 생성 완료</h3>
              <p className="text-xs text-zinc-400">선택한 인사이트가 모두 반영되었습니다</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 p-6">
          <div className="prose prose-invert max-w-none">
            <div className="whitespace-pre-wrap text-zinc-300 leading-relaxed">
              {mergedContent || "LLM이 생성한 최종 제안서가 여기에 표시됩니다..."}
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            닫기
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-500 text-white">
            다운로드
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

/**
 * 7. File Uploader Component
 */
function FileUploader({ onFileUpload }: { onFileUpload: (files: File[]) => void }) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileUpload(Array.from(e.dataTransfer.files))
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(Array.from(e.target.files))
    }
    // Reset input so same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div
      onClick={() => fileInputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "h-24 border border-dashed rounded-xl flex flex-col items-center justify-center text-zinc-500 transition-all cursor-pointer group",
        isDragging 
          ? "border-indigo-500 bg-indigo-500/10 text-indigo-400" 
          : "border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800/30"
      )}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
        className="hidden" 
        multiple 
      />
      <div className={cn(
        "p-2 rounded-full mb-1 transition-colors",
        isDragging ? "bg-indigo-500/20" : "bg-zinc-800/50 group-hover:bg-zinc-800"
      )}>
        {isDragging ? (
          <Upload className="w-5 h-5 animate-bounce" />
        ) : (
          <Plus className="w-5 h-5 group-hover:text-zinc-300" />
        )}
      </div>
      <span className="text-xs font-medium">
        {isDragging ? "여기에 놓으세요" : "파일 추가하기"}
      </span>
    </div>
  )
}
