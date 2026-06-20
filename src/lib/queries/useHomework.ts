import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export type HomeworkSubmission = {
  id: string
  student_id: string
  photo_url: string | null
  note: string | null
  status: 'submitted' | 'reviewed'
  teacher_comment: string | null
  created_at: string
}

export function useMyHomework(studentId: string | null) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['homework', studentId],
    enabled: !!studentId,
    queryFn: async (): Promise<HomeworkSubmission[]> => {
      const { data, error } = await supabase
        .from('homework_submissions' as any)
        .select('*' as any)
        .eq('student_id', studentId!)
        .order('created_at', { ascending: false })
      if (error) throw error
      return ((data ?? []) as unknown) as HomeworkSubmission[]
    },
  })
}

export function useSubmitHomework() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      studentId,
      file,
      note,
    }: {
      studentId: string
      file: File | null
      note: string
    }) => {
      let photoUrl: string | null = null

      // 사진 업로드
      if (file) {
        const ext = file.name.split('.').pop()
        const fileName = `${studentId}/${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage
          .from('homework-photos')
          .upload(fileName, file, { upsert: false })
        if (upErr) throw upErr

        const { data: urlData } = supabase.storage
          .from('homework-photos')
          .getPublicUrl(fileName)
        photoUrl = urlData.publicUrl
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase.from('homework_submissions' as any).insert({
        student_id: studentId,
        photo_url: photoUrl,
        note: note || null,
        status: 'submitted',
      })
      if (error) throw error
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['homework', vars.studentId] })
    },
  })
}

// 선생님용: 학생의 제출 내역 조회
export function useStudentHomeworkSubmissions(studentId: string | null) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['homework-teacher', studentId],
    enabled: !!studentId,
    queryFn: async (): Promise<HomeworkSubmission[]> => {
      const { data, error } = await supabase
        .from('homework_submissions' as any)
        .select('*' as any)
        .eq('student_id', studentId!)
        .order('created_at', { ascending: false })
      if (error) throw error
      return ((data ?? []) as unknown) as HomeworkSubmission[]
    },
  })
}

// 선생님용: 제출에 코멘트 달기
export function useReviewHomework() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, comment, studentId }: { id: string; comment: string; studentId: string }) => {
      const { error } = await supabase
        .from('homework_submissions' as any)
        .update({ status: 'reviewed', teacher_comment: comment } as any)
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['homework-teacher', vars.studentId] })
    },
  })
}
