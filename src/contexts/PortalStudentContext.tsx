'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/lib/queries/useProfile'

type Sibling = { id: string; name: string; color: string | null }

type PortalStudentContextType = {
  selectedStudentId: string | null
  setSelectedStudentId: (id: string) => void
  siblings: Sibling[]
  hasSiblings: boolean
  linkedStudentName: string | null
}

const PortalStudentContext = createContext<PortalStudentContextType>({
  selectedStudentId: null,
  setSelectedStudentId: () => {},
  siblings: [],
  hasSiblings: false,
  linkedStudentName: null,
})

export function PortalStudentProvider({ children }: { children: ReactNode }) {
  const { data: profile } = useProfile()
  const linkedId = profile?.linked_student_id ?? null
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [siblings, setSiblings] = useState<Sibling[]>([])
  const [linkedStudentName, setLinkedStudentName] = useState<string | null>(null)

  useEffect(() => {
    if (linkedId && !selectedStudentId) {
      setSelectedStudentId(linkedId)
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

    // 형제 목록
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
  }, [linkedId])

  return (
    <PortalStudentContext.Provider value={{
      selectedStudentId,
      setSelectedStudentId,
      siblings,
      hasSiblings: siblings.length > 0,
      linkedStudentName,
    }}>
      {children}
    </PortalStudentContext.Provider>
  )
}

export function usePortalStudent() {
  return useContext(PortalStudentContext)
}
