
'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useStudents, useDeleteStudent, useResetAllPassportStamps } from '@/lib/queries/useStudents'
import StudentFormDialog from '@/components/students/StudentFormDialog'
import { GrowthReportModal } from '@/components/growth/GrowthReportModal'
import type { Database } from '@/types/database'
import { Search, Plus, Star, MoreHorizontal, Pencil, Trash2, BookOpen, Stamp } from 'lucide-react'

type Student = Database['public']['Tables']['students']['Row']

type FilterType = 'all' | 'fav' | 'has_schedule' | 'no_info'

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all',          label: '전체' },
  { key: 'fav',          label: '즐겨찾기' },
  { key: 'has_schedule', label: '정기수업' },
  { key: 'no_info',      label: '정보 미등록' },
]

function MoreMenu({ student, onEdit, onDelete, onReport }: {
  student: Student
  onEdit: () => void
  onDelete: () => void
  onReport: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(v => !v) }}
        className="w-8 h-8 flex items-center justify-center rounded-xl transition-colors"
        style={{ color: 'var(--sz-text-muted)' }}
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <div
          className="absolute right-0 top-9 z-50 min-w-[148px] rounded-2xl overflow-hidden"
          style={{
            backgroundColor: 'var(--sz-card-pastel)',
            boxShadow: '0 8px 32px rgba(46,53,69,0.14), 0 2px 8px rgba(46,53,69,0.08)',
          }}
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={() => { onReport(); setOpen(false) }}
            className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-left transition-colors hover:bg-[rgba(175,196,216,0.1)]"
            style={{ color: 'var(--sz-text-deep)' }}
          >
            <Star className="w-3.5 h-3.5 opacity-60" /> 성장 리포트
          </button>
          <button
            onClick={() => { onEdit(); setOpen(false) }}
            className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-left transition-colors hover:bg-[rgba(175,196,216,0.1)]"
            style={{ color: 'var(--sz-text-deep)' }}
          >
            <Pencil className="w-3.5 h-3.5 opacity-60" /> 정보 수정
          </button>
          <div className="mx-4 h-px" style={{ backgroundColor: 'rgba(175,196,216,0.2)' }} />
          <button
            onClick={() => { onDelete(); setOpen(false) }}
            className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-left transition-colors hover:bg-red-50"
            style={{ color: '#E05252' }}
          >
            <Trash2 className="w-3.5 h-3.5" /> 삭제
          </button>
        </div>
      )}
    </div>
  )
}

function StudentCard({ student, onEdit, onDelete, onReport, favorites, onToggleFav }: {
  student: Student
  onEdit: () => void
  onDelete: () => void
  onReport: () => void
  favorites: Set<string>
  onToggleFav: (id: string) => void
}) {
  const isFav = favorites.has(student.id)
  const subject = student.subjects?.[0] ?? null
  const hasInfo = !!(student.hourly_rate || student.schedule_note)

  return (
    <Link
      href={`/students/${student.id}`}
      className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all active:scale-[0.99]"
      style={{
        backgroundColor: 'var(--sz-card-pastel)',
        boxShadow: '0 1px 4px rgba(46,53,69,0.06)',
      }}
    >
      {/* 아바타 */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
        style={{ backgroundColor: student.color ?? '#AFC4D8' }}
      >
        {student.name.charAt(0)}
      </div>

      {/* 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm" style={{ color: 'var(--sz-text-deep)' }}>
            {student.name}
          </span>
          {subject && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: 'var(--sz-sage-pale)', color: 'var(--sz-sage)' }}>
              {subject}
            </span>
          )}
        </div>
        {hasInfo ? (
          <>
            {!!student.hourly_rate && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--sz-text-muted)' }}>
                월 {student.hourly_rate.toLocaleString()}원
              </p>
            )}
            {student.schedule_note && (
              <p className="text-xs mt-0.5 font-medium truncate" style={{ color: 'var(--sz-blue-soft)' }}>
                {student.schedule_note}
              </p>
            )}
          </>
        ) : (
          <p className="text-xs mt-0.5" style={{ color: 'rgba(175,196,216,0.7)' }}>정보 미등록</p>
        )}
      </div>

      {/* 액션 */}
      <div className="flex items-center gap-0.5 shrink-0" onClick={e => e.preventDefault()}>
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFav(student.id) }}
          className="w-8 h-8 flex items-center justify-center rounded-xl transition-colors"
          style={{ color: isFav ? '#F5A623' : 'rgba(175,196,216,0.5)' }}
        >
          <Star className="w-4 h-4" fill={isFav ? 'currentColor' : 'none'} />
        </button>
        <MoreMenu
          student={student}
          onEdit={onEdit}
          onDelete={onDelete}
          onReport={onReport}
        />
      </div>
    </Link>
  )
}

export default function StudentsPage() {
  const { data: students, isLoading } = useStudents()
  const deleteStudent = useDeleteStudent()
  const resetStamps = useResetAllPassportStamps()
  const [stampResetOpen, setStampResetOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Student | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null)
  const [reportTarget, setReportTarget] = useState<Student | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set()
    try { return new Set(JSON.parse(localStorage.getItem('sz_fav_students') ?? '[]')) }
    catch { return new Set() }
  })

  function toggleFav(id: string) {
    setFavorites(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      localStorage.setItem('sz_fav_students', JSON.stringify([...next]))
      return next
    })
  }

  function handleEdit(student: Student) { setEditTarget(student); setFormOpen(true) }
  function handleAdd() { setEditTarget(null); setFormOpen(true) }
  async function handleDelete(student: Student) {
    await deleteStudent.mutateAsync(student.id)
    setDeleteTarget(null)
  }

  const filtered = useMemo(() => {
    if (!students) return []
    let list = students
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(s => s.name.toLowerCase().includes(q))
    }
    if (filter === 'fav')          list = list.filter(s => favorites.has(s.id))
    if (filter === 'has_schedule') list = list.filter(s => !!s.schedule_note)
    if (filter === 'no_info')      list = list.filter(s => !s.hourly_rate && !s.schedule_note)
    return list
  }, [students, search, filter, favorites])

  return (
    <div className="flex flex-col h-[calc(100dvh-5rem)] md:h-screen"
      style={{ backgroundColor: 'var(--sz-bg-pastel)' }}>

      {/* ── 헤더 ── */}
      <div className="px-4 pt-5 pb-3 shrink-0"
        style={{ borderBottom: '1px solid rgba(175,196,216,0.15)' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--sz-text-deep)' }}>학생 관리</h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--sz-text-muted)' }}>
              총 {students?.length ?? 0}명
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStampResetOpen(true)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2.5 rounded-xl"
              style={{ backgroundColor: 'rgba(175,196,216,0.15)', color: 'var(--sz-text-muted)' }}
              title="여권 스탬프 전체 초기화"
            >
              <Stamp className="w-3.5 h-3.5" />스탬프 초기화
            </button>
            <button
              onClick={handleAdd}
              className="flex items-center gap-1.5 text-sm font-semibold px-3 py-2.5 rounded-xl text-white"
              style={{ backgroundColor: 'var(--sz-blue-soft)' }}
            >
              <Plus className="w-4 h-4" />추가
            </button>
          </div>
        </div>

        {/* 검색창 */}
        <div className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 mb-3"
          style={{ backgroundColor: 'var(--sz-card-pastel)', boxShadow: '0 1px 4px rgba(46,53,69,0.06)' }}>
          <Search className="w-4 h-4 shrink-0" style={{ color: 'rgba(175,196,216,0.6)' }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="학생 이름 검색"
            className="flex-1 bg-transparent outline-none placeholder:text-[rgba(175,196,216,0.6)]"
            style={{ fontSize: '16px', color: 'var(--sz-text-deep)', border: 'none' }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ color: 'rgba(175,196,216,0.6)' }}>✕</button>
          )}
        </div>

        {/* 필터 칩 */}
        <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="whitespace-nowrap text-xs font-semibold px-3 py-1.5 rounded-full transition-all shrink-0"
              style={filter === f.key
                ? { backgroundColor: 'var(--sz-blue-soft)', color: '#fff' }
                : { backgroundColor: 'rgba(175,196,216,0.15)', color: 'var(--sz-text-muted)' }}
            >
              {f.label}
              {f.key === 'all' && students ? ` ${students.length}` : ''}
            </button>
          ))}
        </div>
      </div>

      {/* ── 리스트 ── */}
      <div className="flex-1 overflow-auto px-4 py-3"
        style={{ paddingBottom: 'calc(120px + env(safe-area-inset-bottom))' }}>

        {isLoading && (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 rounded-2xl animate-pulse"
                style={{ backgroundColor: 'rgba(175,196,216,0.12)' }} />
            ))}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-4xl mb-3">👨‍🎓</div>
            <p className="font-medium" style={{ color: 'var(--sz-text-deep)' }}>
              {search ? '검색 결과가 없어요' : '등록된 학생이 없어요'}
            </p>
            {!search && (
              <button onClick={handleAdd}
                className="mt-4 px-4 py-2 text-sm font-semibold text-white rounded-xl"
                style={{ backgroundColor: 'var(--sz-blue-soft)' }}>
                + 첫 번째 학생 추가
              </button>
            )}
          </div>
        )}

        {!isLoading && filtered.length > 0 && (
          <div className="space-y-2">
            {filtered.map(student => (
              <StudentCard
                key={student.id}
                student={student}
                onEdit={() => handleEdit(student)}
                onDelete={() => setDeleteTarget(student)}
                onReport={() => setReportTarget(student)}
                favorites={favorites}
                onToggleFav={toggleFav}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── 스탬프 초기화 확인 모달 ── */}
      {stampResetOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center pb-[env(safe-area-inset-bottom)]"
          style={{ backgroundColor: 'rgba(30,45,78,0.35)', backdropFilter: 'blur(4px)' }}
          onClick={() => setStampResetOpen(false)}>
          <div className="w-full max-w-md rounded-t-3xl p-6"
            style={{ backgroundColor: 'var(--sz-card-pastel)' }}
            onClick={e => e.stopPropagation()}>
            <div className="text-2xl mb-3 text-center">🗺️</div>
            <p className="text-base font-bold mb-1 text-center" style={{ color: 'var(--sz-text-deep)' }}>
              여권 스탬프 전체 초기화
            </p>
            <p className="text-sm mb-5 text-center" style={{ color: 'var(--sz-text-muted)' }}>
              모든 학생의 스탬프가 0부터 다시 시작돼요. 수업 회차와 기록은 그대로 유지됩니다.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setStampResetOpen(false)}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold"
                style={{ backgroundColor: 'rgba(175,196,216,0.15)', color: 'var(--sz-text-muted)' }}>
                취소
              </button>
              <button
                onClick={async () => {
                  await resetStamps.mutateAsync()
                  setStampResetOpen(false)
                }}
                disabled={resetStamps.isPending}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: 'var(--sz-blue-soft)' }}>
                {resetStamps.isPending ? '초기화 중...' : '초기화'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 삭제 확인 모달 ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-end justify-center pb-[env(safe-area-inset-bottom)]"
          style={{ backgroundColor: 'rgba(30,45,78,0.35)', backdropFilter: 'blur(4px)' }}
          onClick={() => setDeleteTarget(null)}>
          <div className="w-full max-w-md rounded-t-3xl p-6"
            style={{ backgroundColor: 'var(--sz-card-pastel)' }}
            onClick={e => e.stopPropagation()}>
            <p className="text-base font-bold mb-1" style={{ color: 'var(--sz-text-deep)' }}>
              {deleteTarget.name} 학생을 삭제할까요?
            </p>
            <p className="text-sm mb-5" style={{ color: 'var(--sz-text-muted)' }}>
              삭제하면 관련 수업 기록도 함께 제거됩니다. 되돌릴 수 없어요.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold"
                style={{ backgroundColor: 'rgba(175,196,216,0.15)', color: 'var(--sz-text-muted)' }}>
                취소
              </button>
              <button
                onClick={() => handleDelete(deleteTarget)}
                disabled={deleteStudent.isPending}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: '#E05252' }}>
                {deleteStudent.isPending ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}

      {reportTarget && (
        <GrowthReportModal
          studentId={reportTarget.id}
          studentName={reportTarget.name}
          onClose={() => setReportTarget(null)}
        />
      )}

      <StudentFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        student={editTarget}
      />
    </div>
  )
}
