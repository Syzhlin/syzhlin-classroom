import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export type Attachment = {
  url: string
  type: 'image' | 'file'
  name: string
  size?: number
}

export type HomeworkSubmission = {
  id: string
  student_id: string
  photo_url: string | null
  attachments: Attachment[] | null
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
      files,
      file,
      note,
    }: {
      studentId: string
      // 새 방식: 여러 개 첨부. 기존 방식(file: 단일)도 그대로 지원.
      files?: File[]
      file?: File | null
      note: string
    }) => {
      const fileList = files ?? (file ? [file] : [])
      const attachments: Attachment[] = []

      for (const f of fileList) {
        const ext = f.name.includes('.') ? f.name.split('.').pop() : 'dat'
        const path = `${studentId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
        const { error: upErr } = await supabase.storage
          .from('homework-photos')
          .upload(path, f, { upsert: false })
        if (upErr) throw upErr

        const { data: urlData } = supabase.storage
          .from('homework-photos')
          .getPublicUrl(path)

        attachments.push({
          url: urlData.publicUrl,
          type: f.type.startsWith('image/') ? 'image' : 'file',
          name: f.name,
          size: f.size,
        })
      }

      // 하위 호환: 기존 photo_url 컬럼에는 첫 번째 이미지를 채워둠
      const firstImage = attachments.find(a => a.type === 'image')

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase.from('homework_submissions' as any).insert({
        student_id: studentId,
        photo_url: firstImage?.url ?? null,
        attachments,
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
