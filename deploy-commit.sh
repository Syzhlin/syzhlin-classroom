#!/bin/bash
# 오늘 수정사항 커밋 + main 푸시 (자동배포 트리거)
# 사용법: 터미널에서  bash deploy-commit.sh
set -e
cd "/Users/sejin/Documents/Claude/Projects/syzhlin-classroom"

# 샌드박스가 남긴 잠금파일 제거 (있으면)
rm -f .git/index.lock

git add -A
git commit -m "fix: 수업완료 정산/포털 반영 + 성인학습자 자료실 노출 + 계정연결 기능

- 완료 버튼(상세Sheet/오늘브리핑/빠른상태)을 useCompleteClass로 통일 → 정산 +1 및 포털 캐시 갱신
- 성인학습자에 자료 메뉴 노출(roles에 adult_learner 추가)
- 학생 상세에 계정 연결 카드(AccountLinkCard) 추가
- RLS 마이그레이션 파일 추가"

git push origin main
echo "✅ 푸시 완료 — 자동배포가 시작됩니다."
