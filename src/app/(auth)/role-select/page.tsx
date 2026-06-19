'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCreateProfile } from '@/lib/queries/useProfile'

type Role = 'teacher' | 'adult_learner' | 'student' | 'parent'

const roles: {
  value: Role
  label: string
  description: string
  color: string
  bgColor: string
  borderColor: string
  icon: string
}[] = [
  {
    value: 'teacher',
    label: '선생님',
    description: '수업 일정, 학생, 결제를 관리합니다',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-300',
    icon: '📚',
  },
  {
    value: 'adult_learner',
    label: '성인 학습자',
    description: '나의 수업 일정과 결제 현황을 확인합니다',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-300',
    icon: '🎓',
  },
  {
    value: 'student',
    label: '학생',
    description: '나의 수업 일정과 숙제를 확인합니다',
    color: 'text-sky-700',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-300',
    icon: '✏️',
  },
  {
    value: 'parent',
    label: '학부모',
    description: '자녀의 수업 일정과 결제 현황을 확인합니다',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-300',
    icon: '👨‍👩‍👧',
  },
]

export default function RoleSelectPage() {
  const [selected, setSelected] = useState<Role | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const createProfile = useCreateProfile()

  async function handleConfirm() {
    if (!selected) return
    setError(null)
    try {
      await createProfile.mutateAsync({ role: selected })
      if (selected === 'teacher') {
        router.push('/schedule')
      } else {
        router.push('/portal/home')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다. 다시 시도해주세요.')
    }
  }

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-8 pt-8 pb-4 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
            <path d="M6 12v5c3 3 9 3 12 0v-5"/>
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900">역할을 선택해주세요</h1>
        <p className="mt-1 text-sm text-gray-500">본인에게 해당하는 역할을 선택하세요</p>
      </div>

      <div className="px-8 pb-8 space-y-3">
        {error && (
          <div className="px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        {roles.map((role) => (
          <button
            key={role.value}
            onClick={() => setSelected(role.value)}
            className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left ${
              selected === role.value
                ? `${role.bgColor} ${role.borderColor}`
                : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
            }`}
          >
            <span className="text-2xl mt-0.5">{role.icon}</span>
            <div className="flex-1 min-w-0">
              <p className={`font-semibold text-sm ${selected === role.value ? role.color : 'text-gray-800'}`}>
                {role.label}
              </p>
              <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">
                {role.description}
              </p>
            </div>
            <div className={`mt-1 w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all ${
              selected === role.value
                ? `${role.borderColor} ${role.bgColor}`
                : 'border-gray-300'
            }`}>
              {selected === role.value && (
                <div className={`w-full h-full rounded-full scale-50 ${role.bgColor.replace('bg-', 'bg-').replace('-50', '-500')}`} />
              )}
            </div>
          </button>
        ))}

        <button
          onClick={handleConfirm}
          disabled={!selected || createProfile.isPending}
          className="w-full mt-2 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {createProfile.isPending ? '처리 중...' : '확인'}
        </button>
      </div>
    </div>
  )
}
