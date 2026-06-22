'use client'

import { FileText, Download } from 'lucide-react'
import type { Attachment } from '@/lib/queries/useHomework'

/**
 * 제출물 첨부 렌더러 (학생 포털 + 선생님 대시보드 공용)
 * - 새 제출물: attachments(jsonb) 사용 — 이미지는 그리드, 파일은 다운로드 링크
 * - 예전 제출물: attachments 가 비어 있으면 photo_url 로 폴백
 */
export function HomeworkAttachments({
  attachments,
  photoUrl,
}: {
  attachments: Attachment[] | null
  photoUrl: string | null
}) {
  const items: Attachment[] =
    attachments && attachments.length > 0
      ? attachments
      : photoUrl
        ? [{ url: photoUrl, type: 'image', name: '숙제 사진' }]
        : []

  if (items.length === 0) return null

  const images = items.filter(i => i.type === 'image')
  const files = items.filter(i => i.type === 'file')

  return (
    <div>
      {images.length === 1 && (
        // eslint-disable-next-line @next/next/no-img-element
        <a href={images[0].url} target="_blank" rel="noopener noreferrer" className="block">
          <img src={images[0].url} alt={images[0].name} className="w-full aspect-[4/3] object-cover" />
        </a>
      )}

      {images.length > 1 && (
        <div className="grid grid-cols-2 gap-1.5 p-1.5">
          {images.map((img, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <a key={i} href={img.url} target="_blank" rel="noopener noreferrer" className="block">
              <img src={img.url} alt={img.name} className="w-full aspect-square object-cover rounded-xl" />
            </a>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-1.5 px-4 pt-3">
          {files.map((f, i) => (
            
              key={i}
              href={f.url}
              target="_blank"
              rel="noopener noreferrer"
              download={f.name}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-all"
              style={{ backgroundColor: 'rgba(175,196,216,0.12)', color: 'var(--sz-blue-soft)' }}
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span className="text-sm font-medium truncate flex-1">{f.name}</span>
              <Download className="w-3.5 h-3.5 shrink-0 opacity-60" />
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
