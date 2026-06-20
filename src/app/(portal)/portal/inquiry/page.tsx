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
        <p className="text-sm" style={{ color: 'var(--sz-text-muted)' }}>
          계정이 연결되면 선생님과 대화할 수 있어요
        </p>
      </div>
    )
  }

  return (
    <div
      className="flex flex-col"
      style={{
        height: 'calc(100dvh - 56px)',   // 헤더 높이(56px) 제외, dvh로 Safari 주소창 대응
        maxHeight: 'calc(100dvh - 56px)',
      }}
    >
      {/* 채팅 헤더 */}
      <div
        className="flex-shrink-0 px-4 py-3 flex items-center gap-3 border-b"
        style={{
          backgroundColor: 'rgba(255,253,246,0.97)',
          borderColor: 'rgba(175,196,216,0.2)',
        }}
      >
        <div
          className="w-9 h-9 rounded-2xl flex items-center justify-center text-base flex-shrink-0"
          style={{ backgroundColor: 'var(--sz-peach-pale)' }}
        >
          👩‍🏫
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--sz-text-deep)' }}>선생님</p>
          <p className="text-[11px]" style={{ color: 'var(--sz-text-muted)' }}>문의사항을 남겨주세요</p>
        </div>
      </div>

      {/* 메시지 목록 */}
      <div
        className="flex-1 overflow-y-auto"
        style={{
          padding: '20px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          backgroundColor: 'var(--sz-bg-pastel)',
        }}
      >
        {isLoading && (
          <div className="flex justify-center pt-10">
            <div
              className="w-5 h-5 rounded-full animate-spin"
              style={{ border: '2px solid var(--sz-blue-soft)', borderTopColor: 'transparent' }}
            />
          </div>
        )}
        {!isLoading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center flex-1 text-center py-12">
            <div
              className="w-16 h-16 rounded-3xl flex items-center justify-center text-2xl mb-4"
              style={{ backgroundColor: 'var(--sz-blue-pale)' }}
            >
              💌
            </div>
            <p className="text-sm font-semibold" style={{ color: 'var(--sz-text-deep)' }}>
              첫 번째 메시지를 보내보세요!
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--sz-text-muted)' }}>
              선생님과 편하게 대화할 수 있어요
            </p>
          </div>
        )}

        {messages.map(msg => {
          const isMe = msg.sender_role !== 'teacher'
          return (
            <div
              key={msg.id}
              className="flex"
              style={{ justifyContent: isMe ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: '8px' }}
            >
              {/* 선생님 아바타 */}
              {!isMe && (
                <div
                  className="w-7 h-7 rounded-2xl flex items-center justify-center text-xs flex-shrink-0 mb-1"
                  style={{ backgroundColor: 'var(--sz-peach-pale)' }}
                >
                  👩‍🏫
                </div>
              )}

              <div
                className="flex flex-col"
                style={{
                  maxWidth: '75%',
                  alignItems: isMe ? 'flex-end' : 'flex-start',
                  gap: '4px',
                }}
              >
                {/* 말풍선 */}
                <div
                  className="text-sm leading-relaxed"
                  style={{
                    padding: '10px 14px',
                    borderRadius: isMe ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                    // ✅ 핵심: 학생 말풍선은 소프트 블루 배경 + 딥 네이비 텍스트
                    backgroundColor: isMe ? '#DCEAF7' : '#FFFFFF',
                    color: '#2E3545',
                    boxShadow: '0 1px 4px rgba(46,53,69,0.08)',
                    wordBreak: 'break-word',
                  }}
                >
                  {msg.body}
                </div>

                {/* 시간 */}
                <span
                  className="text-[10px] px-1"
                  style={{
                    color: '#9AA3B2',
                    textAlign: isMe ? 'right' : 'left',
                  }}
                >
                  {new Date(msg.created_at).toLocaleString('ko-KR', {
                    month: 'numeric',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* 입력창 — 탭바 위에 고정 */}
      <div
        className="flex-shrink-0 flex items-end gap-2"
        style={{
          padding: '10px 12px',
          paddingBottom: 'max(10px, env(safe-area-inset-bottom, 10px))',
          backgroundColor: 'rgba(255,253,246,0.97)',
          borderTop: '1px solid rgba(175,196,216,0.2)',
        }}
      >
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          placeholder="메시지를 입력하세요..."
          rows={1}
          className="flex-1 text-sm resize-none focus:outline-none"
          style={{
            padding: '10px 16px',
            borderRadius: '24px',
            backgroundColor: 'rgba(175,196,216,0.12)',
            border: '1.5px solid rgba(175,196,216,0.3)',
            color: '#2E3545',
            maxHeight: '100px',
            lineHeight: '1.5',
          }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || send.isPending}
          className="flex-shrink-0 flex items-center justify-center rounded-full transition-all"
          style={{
            width: '40px',
            height: '40px',
            backgroundColor: text.trim() ? 'var(--sz-blue-soft)' : 'rgba(175,196,216,0.25)',
            color: text.trim() ? 'white' : 'var(--sz-text-muted)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
