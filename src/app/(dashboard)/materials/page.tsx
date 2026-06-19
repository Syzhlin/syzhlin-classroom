'use client'

import { useState } from 'react'
import { useStudents } from '@/lib/queries/useStudents'
import { useStudentMaterials, useAddMaterial, useDeleteMaterial } from '@/lib/queries/useMaterials'
import { BookOpen, Plus, Trash2, ExternalLink } from 'lucide-react'
import { format, parseISO } from 'date-fns'

const FILE_TYPES = [
  { value: 'drive', label: 'Google Drive', icon: '📂' },
  { value: 'pdf',   label: 'PDF',          icon: '📄' },
  { value: 'image', label: '이미지',        icon: '🖼️' },
  { value: 'video', label: '영상',          icon: '🎬' },
  { value: 'audio', label: '음성',          icon: '🎵' },
  { value: 'link',  label: '기타 링크',     icon: '🔗' },
]

const TYPE_ICON: Record<string, string> = { ...Object.fromEntries(FILE_TYPES.map(t => [t.value, t.icon])), file: '📁' }

interface AddFormState {
  title: string
  description: string
  file_url: string
  file_name: string
  file_type: string
}

const EMPTY_FORM: AddFormState = {
  title: '',
  description: '',
  file_url: '',
  file_name: '',
  file_type: 'drive',
}

export default function MaterialsPage() {
  const { data: students = [] } = useStudents()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<AddFormState>(EMPTY_FORM)

  const { data: materials = [], isLoading } = useStudentMaterials(selectedId)
  const addMaterial = useAddMaterial()
  const deleteMaterial = useDeleteMaterial()

  const selectedStudent = students.find(s => s.id === selectedId)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedId) return
    await addMaterial.mutateAsync({
      student_id: selectedId,
      teacher_id: '', // hook이 채워줌
      title: form.title,
      description: form.description || null,
      file_url: form.file_url,
      file_name: form.file_name || null,
      file_type: form.file_type,
    })
    setForm(EMPTY_FORM)
    setShowForm(false)
  }

  async function handleDelete(id: string) {
    if (!selectedId) return
    if (!confirm('자료를 삭제할까요?')) return
    await deleteMaterial.mutateAsync({ id, studentId: selectedId })
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          <h1 className="text-xl font-bold text-gray-900">수업 자료 관리</h1>
        </div>
        {selectedId && (
          <button
            onClick={() => { setShowForm(true); setForm(EMPTY_FORM) }}
            className="flex items-center gap-1.5 text-sm px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            자료 추가
          </button>
        )}
      </div>

      {/* Student tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {students.map(s => (
          <button
            key={s.id}
            onClick={() => { setSelectedId(s.id); setShowForm(false) }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedId === s.id
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300'
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">
            {selectedStudent?.name}에게 자료 추가
          </h3>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-gray-500 font-medium block mb-1">제목 *</label>
                <input
                  required
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="예: 6월 3주차 복습 자료"
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500 font-medium block mb-1">Google Drive 공유 링크 *</label>
                <input
                  required
                  value={form.file_url}
                  onChange={e => setForm(p => ({ ...p, file_url: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="https://drive.google.com/file/d/..."
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1">파일 종류</label>
                <select
                  value={form.file_type}
                  onChange={e => setForm(p => ({ ...p, file_type: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  {FILE_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500 font-medium block mb-1">설명 (선택)</label>
                <input
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="간단한 설명 (학생 화면에 표시됩니다)"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={addMaterial.isPending}
                className="flex-1 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {addMaterial.isPending ? '저장 중...' : '저장'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Materials list */}
      {!selectedId ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">위에서 학생을 선택하세요</p>
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : materials.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-sm text-gray-400">
            {selectedStudent?.name}의 수업 자료가 없습니다
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {materials.map(m => (
            <div
              key={m.id}
              className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-3"
            >
              <span className="text-xl flex-shrink-0">{TYPE_ICON[m.file_type ?? 'file'] ?? '📁'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{m.title}</p>
                {m.description && (
                  <p className="text-xs text-gray-400 truncate">{m.description}</p>
                )}
                <p className="text-xs text-gray-300 mt-0.5">
                  {format(parseISO(m.created_at), 'yyyy.MM.dd')}
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <a
                  href={m.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors"
                  title="보기"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => handleDelete(m.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                  title="삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
