import { createClient } from '@/lib/supabase/client'

export type ActivityAction =
  | 'login'
  | 'logout'
  | 'page_view'
  | 'sibling_switch'
  | 'change_request'
  | 'inquiry_sent'
  | 'material_viewed'

// auth email → 로그인 코드 추출
// colinp@syzhlin.classroom → COLINP
// teacher email → 그대로 반환
function emailToCode(email: string): string {
  if (email.endsWith('@syzhlin.classroom')) {
    return email.replace('@syzhlin.classroom', '').toUpperCase()
  }
  return email
}

export async function logActivity({
  action,
  detail,
  userRole,
  studentName,
  metadata,
}: {
  action: ActivityAction
  detail?: string
  userRole?: string | null
  studentName?: string | null
  metadata?: Record<string, unknown>
}) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('activity_logs').insert({
      user_code: emailToCode(user.email ?? ''),
      user_role: userRole ?? null,
      student_name: studentName ?? null,
      action,
      detail: detail ?? null,
      metadata: metadata ?? null,
    })
  } catch {
    // 로그 실패는 조용히 무시
  }
}
