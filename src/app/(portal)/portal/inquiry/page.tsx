'use client'

import { useState, useRef, useEffect } from 'react'
import { useProfile } from '@/lib/queries/useProfile'
import { usePortalStudent } from '@/contexts/PortalStudentContext'
import { useMessages, useSendMessage, useMarkMessagesRead } from '@/lib/queries/useMessages'

export default function InquiryPage() {
  const { data: profile } = useProfile()
  const { selectedStudentId: studentId } = usePortalStudent()
  const role = (profile?.role ?? 'parent') as 'parent' | 'student'

  const { data: messages = [], isLoading } = useMessages(studentId)
  const send = useSendMessage()
  const markRead = useMarkMessagesRead()

  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (studentId) markRead.mutate(studentId)
  }, [studentId, messages.length])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    if (!text.trim() || !studentId) return
    const body = text.trim()
    setText('')
    await send.mutateAsync({ student_id: studentId, body, sender_role: role })
  }

  if (!studentId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <p className="text-3xl mb-3">💬</p>
        <p className="text-sm text-gray-400">계정이 연결되면 선생님과 대화할 수 있어요</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* 헤더 */}
      <div className="px-4 py-3 border-b border-gray-100 bg-white">
        <h1 className="text-sm font-semibold text-gray-800">선생님과 대화</h1>
        <p className="text-xs text-gray-400 mt-0.5">문의사항을 남겨주세요</p>
      </div>

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {isLoading && (
          <div className="flex justify-center pt-10">
            <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!isLoading && messages.length === 0 && (
          <div className="text-center pt-12">
            <p className="text-3xl mb-3">💌</p>
            <p className="text-sm text-gray-400">첫 번째 메시지를 보내보세요!</p>
          </div>
        )}
        {messages.map(msg => {
          const isMe = msg.sender_role !== 'teacher'
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              {!isMe && (
                <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs mr-2 mt-1 shrink-0">
                  👩‍🏫
                </div>
              )}
              <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isMe
                    ? 'bg-indigo-600 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm'
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

      {/* 입력창 */}
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
