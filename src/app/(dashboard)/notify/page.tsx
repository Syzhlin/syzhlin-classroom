'use client'

import { useMemo, useState } from 'react'
import { Send, Users, User, Check } from 'lucide-react'
import { useStudents } from '@/lib/queries/useStudents'
import { useSendNotification, type Channel } from '@/lib/queries/useNotify'

type Preset = { key: string; label: string; title: string; body: string }

const PRESETS: Preset[] = [
  {
    key: 'reminder',
    label: '수업 리마인더',
    title: '수업 안내',
    body: '오늘 수업 잊지 마세요! 시간 맞춰 준비해 주세요 😊',
  },
  {
    key: 'homework',
    label: '숙제 안내',
    title: '숙제 안내',
    body: '오늘 나간 숙제를 확인해 주세요. 다음 수업 전까지 완료 부탁드려요!',
  },
  {
    key: 'notice',
    label: '공지/안내',
    title: '안내',
    body: '안내사항이 있어요. 확인 부탁드립니다.',
  },
]

export default function NotifyPage() {
  const { data: students = [], isLoading } = useStudents()
  const send = useSendNotification()

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [channels, setChannels] = useState<Channel[]>(['parent'])
  const [activePreset, setActivePreset] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [result, setResult] = useState<string | null>(null)

  const allSelected = students.length > 0 && selectedIds.length === students.length

  const selectedStudents = useMemo(
    () => students.filter((s) => selectedIds.includes(s.id)),
    [students, selectedIds]
  )

  function toggleStudent(id: string) {
    setResult(null)
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function toggleAll() {
    setResult(null)
    setSelectedIds(allSelected ? [] : students.map((s) => s.id))
  }

  function toggleChannel(ch: Channel) {
    setResult(null)
    setChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    )
  }

  function applyPreset(p: Preset) {
    setActivePreset(p.key)
    setTitle(p.title)
    setBody(p.body)
    setResult(null)
  }

  const canSend =
    selectedIds.length > 0 && channels.length > 0 && body.trim().length > 0 && !send.isPending

  async function handleSend() {
    setResult(null)
    try {
      const r = await send.mutateAsync({
        studentIds: selectedIds,
        channels,
        title: title.trim() || '선생님 알림',
        body: body.trim(),
      })
      let msg = `${r.studentCount}명에게 알림을 보냈어요. (앱 알림 ${r.messagesSent}건`
      if (r.pushConfigured) {
        msg += `, 휴대폰 푸시 ${r.pushSent}건`
        if (r.pushFailed > 0) msg += ` · 실패 ${r.pushFailed}건`
      }
      msg += ')'
      setResult(msg)
    } catch (e) {
      setResult(e instanceof Error ? e.message : '알림 발송에 실패했습니다.')
    }
  }

  const chip = (active: boolean) => ({
    backgroundColor: active ? 'var(--sz-blue-soft)' : 'var(--sz-bg-pastel)',
    color: active ? '#fff' : 'var(--sz-text-muted)',
    border: active ? '1px solid var(--sz-blue-soft)' : '1px solid rgba(175,196,216,0.3)',
  })

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 pb-28 md:py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: 'var(--sz-text-deep)' }}>
          알림 보내기
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--sz-text-muted)' }}>
          학부모·아이에게 앱 알림과 휴대폰 푸시를 직접 보냅니다.
        </p>
      </div>

      {/* 1. 받는 학생 */}
      <section className="mb-5 rounded-2xl bg-white p-4" style={{ border: '1px solid rgba(175,196,216,0.25)' }}>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold" style={{ color: 'var(--sz-text-deep)' }}>
            받는 학생
          </span>
          <button
            type="button"
            onClick={toggleAll}
            disabled={students.length === 0}
            className="rounded-full px-3 py-1 text-xs font-semibold transition-colors disabled:opacity-40"
            style={chip(allSelected)}
          >
            {allSelected ? '전체 해제' : '전체 선택'}
          </button>
        </div>

        {isLoading ? (
          <p className="py-4 text-center text-xs" style={{ color: 'var(--sz-text-muted)' }}>불러오는 중…</p>
        ) : students.length === 0 ? (
          <p className="py-4 text-center text-xs" style={{ color: 'var(--sz-text-muted)' }}>
            먼저 학생을 추가해주세요.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {students.map((s) => {
              const active = selectedIds.includes(s.id)
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleStudent(s.id)}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
                  style={chip(active)}
                >
                  <span
                    className="flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
                    style={{ backgroundColor: active ? 'rgba(255,255,255,0.3)' : s.color }}
                  >
                    {active ? <Check className="h-3 w-3" /> : s.name.slice(0, 1)}
                  </span>
                  {s.name}
                </button>
              )
            })}
          </div>
        )}
        {selectedIds.length > 0 && (
          <p className="mt-3 text-xs" style={{ color: 'var(--sz-blue-soft)' }}>
            {selectedIds.length}명 선택됨
          </p>
        )}
      </section>

      {/* 2. 받는 대상 (채널) */}
      <section className="mb-5 rounded-2xl bg-white p-4" style={{ border: '1px solid rgba(175,196,216,0.25)' }}>
        <span className="mb-3 block text-sm font-semibold" style={{ color: 'var(--sz-text-deep)' }}>
          받는 대상
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => toggleChannel('parent')}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition-colors"
            style={chip(channels.includes('parent'))}
          >
            <Users className="h-4 w-4" /> 학부모
          </button>
          <button
            type="button"
            onClick={() => toggleChannel('student')}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition-colors"
            style={chip(channels.includes('student'))}
          >
            <User className="h-4 w-4" /> 아이
          </button>
        </div>
      </section>

      {/* 3. 내용 */}
      <section className="mb-5 rounded-2xl bg-white p-4" style={{ border: '1px solid rgba(175,196,216,0.25)' }}>
        <span className="mb-3 block text-sm font-semibold" style={{ color: 'var(--sz-text-deep)' }}>
          내용
        </span>
        <div className="mb-3 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => applyPreset(p)}
              className="rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
              style={chip(activePreset === p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>

        <input
          value={title}
          onChange={(e) => { setTitle(e.target.value); setActivePreset(null) }}
          placeholder="알림 제목 (예: 수업 안내)"
          className="mb-2 w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
          style={{ backgroundColor: 'rgba(175,196,216,0.1)', color: 'var(--sz-text-deep)' }}
        />
        <textarea
          value={body}
          onChange={(e) => { setBody(e.target.value); setActivePreset(null) }}
          placeholder="알림 내용을 입력하세요…"
          rows={4}
          className="w-full resize-none rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
          style={{ backgroundColor: 'rgba(175,196,216,0.1)', color: 'var(--sz-text-deep)' }}
        />
      </section>

      {/* 미리보기 */}
      {body.trim() && selectedStudents.length > 0 && (
        <section className="mb-5 rounded-2xl p-4" style={{ backgroundColor: 'var(--sz-bg-pastel)', border: '1px solid rgba(175,196,216,0.25)' }}>
          <p className="mb-2 text-xs font-semibold" style={{ color: 'var(--sz-text-muted)' }}>미리보기</p>
          <div className="rounded-xl bg-white p-3" style={{ border: '1px solid rgba(175,196,216,0.2)' }}>
            <p className="text-[13px] font-bold" style={{ color: 'var(--sz-text-deep)' }}>
              {title.trim() || '선생님 알림'}
            </p>
            <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed" style={{ color: 'var(--sz-text-muted)' }}>
              {body.trim()}
            </p>
          </div>
          <p className="mt-2 text-[11px]" style={{ color: 'var(--sz-text-muted)' }}>
            {selectedStudents.map((s) => s.name).join(', ')} · {channels.map((c) => (c === 'parent' ? '학부모' : '아이')).join('/')}
          </p>
        </section>
      )}

      {result && (
        <div
          className="mb-4 rounded-xl px-4 py-3 text-sm"
          style={{
            backgroundColor: send.isError ? 'var(--sz-pink-pale)' : 'var(--sz-blue-pale)',
            color: send.isError ? 'var(--sz-pink-soft)' : 'var(--sz-blue-soft)',
          }}
        >
          {result}
        </div>
      )}

      <button
        type="button"
        onClick={handleSend}
        disabled={!canSend}
        className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white transition-opacity disabled:opacity-40"
        style={{ backgroundColor: 'var(--sz-blue-soft)' }}
      >
        <Send className="h-4 w-4" />
        {send.isPending ? '보내는 중…' : '알림 보내기'}
      </button>
    </div>
  )
}
