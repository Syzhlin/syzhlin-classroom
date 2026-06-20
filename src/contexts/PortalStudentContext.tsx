'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/lib/queries/useProfile'

type Sibling = { id: string; name: string; color: string | null }

type PortalStudentContextType = {
  selectedStudentId: string | null
  setSelectedStudentId: (id: string) => void
  siblings: Sibling[]
  hasSiblings: boolean
  linkedStudentName: string | null
  isTransitioning: boolean
}

const PortalStudentContext = createContext<PortalStudentContextType>({
  selectedStudentId: null,
  setSelectedStudentId: () => {},
  siblings: [],
  hasSiblings: false,
  linkedStudentName: null,
  isTransitioning: false,
})

export function PortalStudentProvider({ children }: { children: ReactNode }) {
  const { data: profile } = useProfile()
  const linkedId = profile?.linked_student_id ?? null
  const [selectedStudentId, _setSelectedStudentId] = useState<string | null>(null)
  const [siblings, setSiblings] = useState<Sibling[]>([])
  const [linkedStudentName, setLinkedStudentName] = useState<string | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    if (linkedId && !selectedStudentId) {
      _setSelectedStudentId(linkedId)
    }
  }, [linkedId])

  useEffect(() => {
    if (!linkedId) return
    const supabase = createClient()

    // 내 아이 이름
    supabase
      .from('students')
      .select('name')
      .eq('id', linkedId)
      .single()
      .then(({ data }) => {
        if (data) setLinkedStudentName(data.name)
      })

    // 형제 목록 — 학부모만 조회 (학생끼리는 서로 데이터 접근 불가)
    if (profile?.role !== 'parent') {
      setSiblings([])
      return
    }
    supabase
      .from('student_siblings')
      .select('sibling_id, students!sibling_id(id, name, color)')
      .eq('student_id', linkedId)
      .then(({ data }) => {
        if (!data) return
        const list = data
          .filter((r: any) => r.students != null)
          .map((r: any) => ({
            id: r.students.id,
            name: r.students.name,
            color: r.students.color,
          }))
        setSiblings(list)
      })
  }, [linkedId, profile?.role])

  const setSelectedStudentId = useCallback((id: string) => {
    if (id === selectedStudentId) return
    setIsTransitioning(true)
    setTimeout(() => {
      _setSelectedStudentId(id)
      // 학생 변경 후 짧게 기다렸다가 fade in
      setTimeout(() => setIsTransitioning(false), 50)
    }, 200)
  }, [selectedStudentId])

  return (
    <PortalStudentContext.Provider value={{
      selectedStudentId,
      setSelectedStudentId,
      siblings,
      hasSiblings: siblings.length > 0,
      linkedStudentName,
      isTransitioning,
    }}>
      {children}
    </PortalStudentContext.Provider>
  )
}

export function usePortalStudent() {
  return useContext(PortalStudentContext)
}
