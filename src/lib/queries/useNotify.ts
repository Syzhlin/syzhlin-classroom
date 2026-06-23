import { useMutation, useQueryClient } from '@tanstack/react-query'

export type Channel = 'parent' | 'student'

export interface SendNotificationInput {
  studentIds: string[]
  channels: Channel[]
  title: string
  body: string
}

export interface SendNotificationResult {
  ok: boolean
  studentCount: number
  channels: Channel[]
  messagesSent: number
  pushConfigured: boolean
  pushSent: number
  pushFailed: number
}

/** 선생님 → 학부모/학생 알림 발송 (앱 벨 메시지 + 휴대폰 푸시) */
export function useSendNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: SendNotificationInput): Promise<SendNotificationResult> => {
      const res = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error ?? '알림 발송에 실패했습니다.')
      }
      return data as SendNotificationResult
    },
    onSuccess: () => {
      // 문의함/메시지 목록 갱신
      queryClient.invalidateQueries({ queryKey: ['messages-all'] })
      queryClient.invalidateQueries({ queryKey: ['messages'] })
    },
  })
}
