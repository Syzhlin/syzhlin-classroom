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
}

const PortalStudentContext = createContext<PortalStudentContextType>({
  selectedStudentId: null,
  setSelectedStudentId: () => {},
  siblings: [],
  hasSiblings: false,
})

export function PortalStudentProvider({ children }: { children: ReactNode }) {
  const { data: profile } = useProfile()
  const linkedId = profile?.linked_student_id ?? null
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [siblings, setSiblings] = useState<Sibling[]>([])

  useEffect(() => {
    if (linkedId && !selectedStudentId) {
      setSelectedStudentId(linkedId)
    }
  }, [linkedId])

  useEffect(() => {
    if (!linkedId) return
    const supabase = createClient()
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
    }}>
      {children}
    </PortalStudentContext.Provider>
  )
}

export function usePortalStudent() {
  return useContext(PortalStudentContext)
}
