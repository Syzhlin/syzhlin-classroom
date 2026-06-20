'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAllStudentMessages, useMessages, useSendMessage, useMarkMessagesRead } from '@/lib/queries/useMessages'

export default function MessagesPage() {
  return (
    <Suspense>
      <MessagesInner />
    </Suspense>
  )
}

function MessagesInner() {
  const searchParams = useSearchParams()
  const studentParam = searchParams.get('student')
  const { data: threads = [] } = useAllStudentMessages()
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)

  const selected = threads.find(t => t.student.id === selectedStudentId)

  useEffect(() => {
    if (studentParam) {
      setSelectedStudentId(studentParam)
    } else if (threads.length > 0 && !selectedStudentId) {
      setSelectedStudentId(threads[0].student.id)
    }
  }, [threads, studentParam])

  return (
    <div className="flex h-[calc(100dvh-5rem)] min-w-0 flex-col md:h-[calc(100vh-64px)] md:flex-row">
      {/* 왼쪽: 학생 목록 */}
      <div className="border-b border-[rgba(175,196,216,0.15)] bg-white flex shrink-0 flex-col md:w-64 md:border-b-0 md:border-r">
        <div className="px-4 py-3 border-b border-[rgba(175,196,216,0.15)]">
          <h2 className="text-sm font-semibold text-[var(--sz-text-deep)]">문의함</h2>
        </div>
        <div className="flex gap-2 overflow-x-auto px-3 py-2 md:block md:flex-1 md:overflow-y-auto md:px-0 md:py-0">
          {threads.length === 0 && (
            <p className="text-xs text-[var(--sz-text-muted)] opacity-70 text-center mt-8">아직 메시지가 없어요</p>
          )}
          {threads.map(t => (
            <button
              key={t.student.id}
              onClick={() => setSelectedStudentId(t.student.id)}
              className={`flex min-h-14 w-56 shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors md:w-full md:rounded-none md:border-b md:border-gray-50 md:px-4 ${
                selectedStudentId === t.student.id ? 'bg-[var(--sz-blue-pale)]' : 'bg-[var(--sz-bg-pastel)] hover:bg-[rgba(175,196,216,0.1)] md:bg-transparent'
              }`}
            >
              <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: t.student.color ?? '#6366f1' }}>
                {t.student.name.slice(0, 1)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--sz-text-deep)]">{t.student.name}</span>
                  {t.unread > 0 && (
                    <span className="text-xs bg-[var(--sz-blue-soft)] text-white px-1.5 py-0.5 rounded-full">{t.unread}</span>
                  )}
                </div>
                <p className="text-xs text-[var(--sz-text-muted)] opacity-70 truncate mt-0.5">{t.lastMsg.body}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 오른쪽: 채팅 */}
      {selectedStudentId && selected ? (
        <ChatPanel studentId={selectedStudentId} studentName={selected.student.name} />
      ) : (
        <div className="flex min-h-64 flex-1 items-center justify-center text-[var(--sz-text-muted)] opacity-70">
          <p className="text-sm">학생을 선택하세요</p>
        </div>
      )}
    </div>
  )
}

function ChatPanel({ studentId, studentName }: { studentId: string; studentName: string }) {
  const { data: messages = [] } = useMessages(studentId)
  const send = useSendMessage()
  const markRead = useMarkMessagesRead()
  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    markRead.mutate(studentId)
  }, [studentId, messages.length])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    if (!text.trim()) return
    const body = text.trim()
    setText('')
    await send.mutateAsync({ student_id: studentId, body, sender_role: 'teacher' })
  }

  return (
    <div className="min-w-0 flex-1 flex flex-col">
      <div className="px-5 py-3 border-b border-[rgba(175,196,216,0.15)] bg-white">
        <h3 className="text-sm font-semibold text-[var(--sz-text-deep)]">{studentName}</h3>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[var(--sz-bg-pastel)] sm:px-5">
        {messages.map(msg => {
          const isTeacher = msg.sender_role === 'teacher'
          return (
            <div key={msg.id} className={`flex ${isTeacher ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[86%] sm:max-w-[70%] flex flex-col gap-1 ${isTeacher ? 'items-end' : 'items-start'}`}>
                {!isTeacher && (
                  <span className="text-xs text-[var(--sz-text-muted)] opacity-70 px-1">{studentName}</span>
                )}
                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isTeacher
                    ? 'bg-[var(--sz-blue-soft)] text-white rounded-br-sm'
                    : 'bg-white text-[var(--sz-text-deep)] border border-gray-100 rounded-bl-sm'
                }`}>
                  {msg.body}
                </div>
                <span className="text-[10px] text-[var(--sz-text-muted)] opacity-70 px-1">
                  {new Date(msg.created_at).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-3 border-t border-gray-100 bg-white flex gap-2 items-end">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }}}
          placeholder="메시지를 입력하세요..."
          rows={1}
          className="flex-1 px-4 py-2.5 bg-[rgba(175,196,216,0.1)] rounded-2xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--sz-blue-soft)]-400 max-h-24"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || send.isPending}
          className="w-11 h-11 bg-[var(--sz-blue-soft)] text-white rounded-full flex items-center justify-center disabled:opacity-40 shrink-0"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
