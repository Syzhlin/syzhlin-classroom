'use client'

import { useState } from 'react'
import { useStudents, useDeleteStudent } from '@/lib/queries/useStudents'
import StudentFormDialog from '@/components/students/StudentFormDialog'
import { GrowthReportModal } from '@/components/growth/GrowthReportModal'
import type { Database } from '@/types/database'

type Student = Database['public']['Tables']['students']['Row']

const SUBJECT_COLORS: Record<string, string> = {
  영어: 'bg-green-100 text-green-700',
  중국어: 'bg-red-100 text-red-700',
}

export default function StudentsPage() {
  const { data: students, isLoading } = useStudents()
  const deleteStudent = useDeleteStudent()
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Student | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [reportTarget, setReportTarget] = useState<Student | null>(null)

  function handleEdit(student: Student) {
    setEditTarget(student)
    setFormOpen(true)
  }

  function handleAdd() {
    setEditTarget(null)
    setFormOpen(true)
  }

  async function handleDelete(id: string) {
    await deleteStudent.mutateAsync(id)
    setDeleteConfirm(null)
  }

  return (
    <div className="p-6 max-w-4xl">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">학생 관리</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {isLoading ? '...' : `총 ${students?.length ?? 0}명`}
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <span className="text-lg leading-none">+</span> 학생 추가
        </button>
      </div>

      {/* 로딩 */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-36 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* 빈 상태 */}
      {!isLoading && (!students || students.length === 0) && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-5xl mb-4">👨‍🎓</div>
          <p className="font-medium text-gray-700">아직 등록된 학생이 없어요</p>
          <p className="mt-1 text-sm text-gray-400">학생을 추가하면 수업 일정에서 선택할 수 있어요</p>
          <button
            onClick={handleAdd}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            첫 번째 학생 추가하기
          </button>
        </div>
      )}

      {/* 학생 목록 */}
      {!isLoading && students && students.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {students.map(student => (
            <div key={student.id} className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start gap-3">
                {/* 색상 아바타 */}
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: student.color ?? '#6366f1' }}
                >
                  {student.name.charAt(0)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{student.name}</h3>
                    {student.grade && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {student.grade}
                      </span>
                    )}
                  </div>

                  {student.school && (
                    <p className="mt-0.5 text-xs text-gray-500">{student.school}</p>
                  )}

                  {/* 과목 태그 */}
                  {student.subjects && student.subjects.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {student.subjects.map(s => (
                        <span
                          key={s}
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${SUBJECT_COLORS[s] ?? 'bg-gray-100 text-gray-600'}`}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 수업료 */}
                  {!!student.hourly_rate && (
                    <p className="mt-2 text-xs text-gray-500">
                      한달 {student.hourly_rate.toLocaleString()}원
                    </p>
                  )}

                  {/* 정기 수업 시간 */}
                  {student.schedule_note && (
                    <p className="mt-1.5 text-xs text-indigo-600 font-medium">
                      🕐 {student.schedule_note}
                    </p>
                  )}

                  {/* 연락처 */}
                  {(student.phone || student.parent_phone) && (
                    <p className="mt-1 text-xs text-gray-400">
                      {student.phone && `📱 ${student.phone}`}
                      {student.phone && student.parent_phone && '  ·  '}
                      {student.parent_phone && `👨‍👩‍👧 ${student.parent_phone}`}
                    </p>
                  )}
                </div>

                {/* 액션 버튼 */}
                <div className="flex gap-1">
                  <button
                    onClick={() => setReportTarget(student)}
                    className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                    title="성장리포트"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => handleEdit(student)}
                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="수정"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  {deleteConfirm === student.id ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleDelete(student.id)}
                        className="px-2 py-1 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        삭제
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-2 py-1 text-xs border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        취소
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(student.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="삭제"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        <path d="M10 11v6M14 11v6"/>
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
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
