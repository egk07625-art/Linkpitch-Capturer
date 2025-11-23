'use client'

import React, { useState } from 'react'
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
  PanelLeftOpen
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
  type: 'text' | 'image'
}

const INITIAL_VISION_DATA: VisionItem[] = [
  { id: 'v1', label: '크리에이티브 무드', content: '럭셔리, 미니멀리스트, 하이엔드 패션', type: 'text' },
  { id: 'v2', label: '비주얼 차별점', content: '극도의 클로즈업 텍스처와 높은 대비 조명', type: 'text' },
  { id: 'v3', label: '메인 소재', content: '금도금 향수병', type: 'text' },
  { id: 'v4', label: '성과 데이터', content: 'ROAS +280% (이미지 소재)', type: 'image' },
]

export default function Workspace() {
  const [activeTab, setActiveTab] = useState<'email' | 'report'>('email')
  const [visionItems, setVisionItems] = useState(INITIAL_VISION_DATA)
  const [editorContent, setEditorContent] = useState('')
  const [draggedItem, setDraggedItem] = useState<VisionItem | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  // --- DnD Handlers ---
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const item = visionItems.find(i => i.id === active.id)
    if (item) setDraggedItem(item)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { over } = event
    if (over && over.id === 'editor-drop-zone' && draggedItem) {
      // Simulate inserting content into editor
      const newContent = `\n[Inserted Strategy: ${draggedItem.content}]\n`
      setEditorContent((prev) => prev + newContent)
    }
    setDraggedItem(null)
  }

  // --- Inline Edit Handler for Left Pane ---
  const updateVisionItem = (id: string, newContent: string) => {
    setVisionItems(prev => prev.map(item => 
      item.id === id ? { ...item, content: newContent } : item
    ))
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

        {/* 2. Main Workspace: Split View */}
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
                        <h3 className="text-xs font-bold text-zinc-500 tracking-widest mb-4 pl-1">
                          크리에이티브 인사이트
                        </h3>
                        <div className="space-y-3">
                          {visionItems.map((item) => (
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
                        <h3 className="text-xs font-bold text-zinc-500 tracking-widest mb-4 pl-1">
                          내 소재
                        </h3>
                        <div className="h-32 border border-dashed border-zinc-800 rounded-xl flex flex-col items-center justify-center text-zinc-500 hover:border-zinc-600 hover:bg-zinc-800/30 transition-colors cursor-pointer group">
                          <FileText className="w-6 h-6 mb-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                          <span className="text-xs">소재 파일 추가하기</span>
                        </div>
                      </section>
                    </div>
                  </ScrollArea>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* === RIGHT PANE: Editor Canvas === */}
          <div className="flex-1 flex flex-col bg-zinc-950 relative">
              
              {/* Tab Switcher (Floating feel) */}
              <div className="flex justify-center pt-6 pb-2 z-20">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-[320px]">
                  <TabsList className="grid w-full grid-cols-2 bg-zinc-900/80 border border-zinc-800/50 backdrop-blur-xl h-10 p-1 rounded-lg">
                    <TabsTrigger value="email" className="text-xs data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 transition-all">
                      <Mail className="w-3 h-3 mr-2" /> 콜드메일 작성
                    </TabsTrigger>
                    <TabsTrigger value="report" className="text-xs data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 transition-all">
                      <FileText className="w-3 h-3 mr-2" /> 제안서 미리보기
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* The Editor Canvas - with bottom padding for fixed AI bar */}
              <ScrollArea className="flex-1 w-full pb-24">
                <DroppableEditor 
                  activeTab={activeTab} 
                  content={editorContent} 
                  setContent={setEditorContent} 
                />
              </ScrollArea>

            </div>
        </div>
        
        {/* Fixed AI Command Bar (Always at bottom of viewport) */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[600px] max-w-[90%] z-50 pointer-events-none">
          <div className="relative group pointer-events-auto">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl opacity-20 group-hover:opacity-40 blur transition duration-500" />
            <div className="relative bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 rounded-xl shadow-2xl flex items-center p-1.5 pl-4 overflow-hidden">
              <Bot className="w-5 h-5 text-indigo-400 mr-3 animate-pulse" />
              <input 
                type="text" 
                placeholder="AI에게 메시지 개선이나 톤 조정을 요청하세요..." 
                className="flex-1 bg-transparent border-none outline-none text-sm text-zinc-200 placeholder:text-zinc-500 h-10"
              />
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-400 hover:text-white rounded-lg">
                  <Sparkles className="w-4 h-4" />
                </Button>
                <Button size="sm" className="h-8 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium">
                  실행
                </Button>
              </div>
            </div>
          </div>
        </div>
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
        "relative group bg-zinc-800/40 hover:bg-zinc-800/60 border border-zinc-700/50 hover:border-zinc-600 rounded-lg p-3 cursor-grab active:cursor-grabbing transition-all",
        isDragging && "opacity-50 scale-95"
      )}
    >
      {/* Drag Handle Icon */}
      <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="w-3 h-3 text-zinc-600" />
      </div>

      {/* Content */}
      <div className="pl-6">
        <p className="text-[10px] font-bold text-indigo-400 mb-1.5">{item.label}</p>
        {isEditing ? (
          <input
            type="text"
            value={localContent}
            onChange={(e) => setLocalContent(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
            autoFocus
            className="w-full bg-zinc-900/50 border border-indigo-500/50 rounded px-2 py-1 text-xs text-zinc-200 outline-none"
          />
        ) : (
          <p
            onClick={() => setIsEditing(true)}
            className="text-xs text-zinc-300 leading-relaxed cursor-text hover:text-zinc-100 transition-colors"
          >
            {item.content}
          </p>
        )}
      </div>

      {/* Edit Hint */}
      {!isEditing && (
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <span className="text-[9px] text-zinc-500">클릭하여 수정</span>
        </div>
      )}
    </div>
  )
}

/**
 * 3. Droppable Editor Area
 */
type DroppableEditorProps = {
  activeTab: 'email' | 'report'
  content: string
  setContent: (content: string) => void
}

function DroppableEditor({ activeTab, content, setContent }: DroppableEditorProps) {
  const { setNodeRef, isOver } = useDroppable({ id: 'editor-drop-zone' })

  return (
    <div ref={setNodeRef} className="w-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="w-full"
        >
          {/* The "Paper" Area */}
          <div className="min-h-[600px] text-zinc-100 p-8 md:p-12 bg-transparent outline-none">
            
            {activeTab === 'email' && (
               <div className="mb-8 space-y-2 border-b border-zinc-800 pb-6">
                  <label className="text-xs font-semibold text-zinc-500">제목</label>
                  <input 
                    className="w-full bg-transparent text-2xl font-semibold text-white placeholder:text-zinc-700 outline-none"
                    placeholder="클릭률 높은 제목을 입력하세요..."
                    defaultValue="Re: 최근 캠페인 성과 관련 문의드립니다"
                  />
               </div>
            )}

            <div 
              className="prose prose-invert max-w-none text-lg leading-relaxed text-zinc-300/90 whitespace-pre-wrap outline-none empty:before:content-['인사이트를_드래그하거나_직접_작성하세요...'] empty:before:text-zinc-700"
              contentEditable
              suppressContentEditableWarning
              onInput={(e) => setContent(e.currentTarget.textContent || '')}
            >
              {content || (
                activeTab === 'email' 
                ? "안녕하세요 [Name]님,\n\n최근 귀사의 캠페인을 보고 성과 개선 방안을 제안드리고자 연락드립니다...\n\n"
                : "# 크리에이티브 성과 분석\n\nAI 분석 결과, 현재 소재가 타겟 오디언스에게 높은 반응을 얻고 있습니다..."
              )}
            </div>

            {/* Visual Cue for Drop */}
            {isOver && (
              <div className="mt-4 h-24 border-2 border-dashed border-indigo-500/50 rounded-xl bg-indigo-500/5 flex items-center justify-center animate-pulse">
                <span className="text-indigo-400 font-medium text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> 여기에 인사이트 추가
                </span>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
