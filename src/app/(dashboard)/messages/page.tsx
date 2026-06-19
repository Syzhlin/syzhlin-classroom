'use client'

import { useState, useRef, useEffect } from 'react'
import { useAllStudentMessages, useMessages, useSendMessage, useMarkMessagesRead } from '@/lib/queries/useMessages'

export default function MessagesPage() {
  const { data: threads = [] } = useAllStudentMessages()
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)

  const selected = threads.find(t => t.student.id === selectedStudentId)

  useEffect(() => {
    if (threads.length > 0 && !selectedStudentId) {
      setSelectedStudentId(threads[0].student.id)
    }
  }, [threads])

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* 왼쪽: 학생 목록 */}
      <div className="w-64 border-r border-gray-100 bg-white flex flex-col shrink-0">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800">문의함</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {threads.length === 0 && (
            <p className="text-xs text-gray-400 text-center mt-8">아직 메시지가 없어요</p>
          )}
          {threads.map(t => (
            <button
              key={t.student.id}
              onClick={() => setSelectedStudentId(t.student.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-gray-50 ${
                selectedStudentId === t.student.id ? 'bg-indigo-50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: t.student.color ?? '#6366f1' }}>
                {t.student.name.slice(0, 1)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-800">{t.student.name}</span>
                  {t.unread > 0 && (
                    <span className="text-xs bg-indigo-600 text-white px-1.5 py-0.5 rounded-full">{t.unread}</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 truncate mt-0.5">{t.lastMsg.body}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 오른쪽: 채팅 */}
      {selectedStudentId && selected ? (
        <ChatPanel studentId={selectedStudentId} studentName={selected.student.name} />
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400">
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
    <div className="flex-1 flex flex-col">
      <div className="px-5 py-3 border-b border-gray-100 bg-white">
        <h3 className="text-sm font-semibold text-gray-800">{studentName}</h3>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-gray-50">
        {messages.map(msg => {
          const isTeacher = msg.sender_role === 'teacher'
          return (
            <div key={msg.id} className={`flex ${isTeacher ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] flex flex-col gap-1 ${isTeacher ? 'items-end' : 'items-start'}`}>
                {!isTeacher && (
                  <span className="text-xs text-gray-400 px-1">{studentName}</span>
                )}
                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isTeacher
                    ? 'bg-indigo-600 text-white rounded-br-sm'
                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'
                }`}>
                  {msg.body}
                </div>
                <span className="text-[10px] text-gray-400 px-1">
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
          className="flex-1 px-4 py-2.5 bg-gray-100 rounded-2xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 max-h-24"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || send.isPending}
          className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center disabled:opacity-40 shrink-0"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
