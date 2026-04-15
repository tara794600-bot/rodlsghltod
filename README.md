# Landing Project (Vite + Vercel API)

## 로컬 실행
1. `npm install`
2. `.env.example`를 참고해 `.env` 생성
3. `npm run dev`

## 배포 전 필수 확인 (Vercel)
이 프로젝트는 프론트(Vite) + 서버리스 함수(`api/survey.js`)를 같이 사용합니다.  
따라서 **새 Git 저장소/새 Vercel 프로젝트로 배포하면 환경변수를 반드시 다시 등록**해야 합니다.

런타임 기준:
- Node.js `20+` (프로젝트에 `engines.node`와 `vercel.json`으로 고정)

필수 환경변수:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MSG_ID`
- `VITE_FIREBASE_APP_ID`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `SHEET_ID`
- `GOOGLE_SERVICE_ACCOUNT` 또는 `GOOGLE_SERVICE_ACCOUNT_B64`

## GOOGLE_SERVICE_ACCOUNT 등록 방식
- 권장: `GOOGLE_SERVICE_ACCOUNT`에 서비스 계정 JSON을 한 줄(minified)로 넣기
- 대안: JSON 파일 내용을 base64로 인코딩해 `GOOGLE_SERVICE_ACCOUNT_B64`로 넣기
- `private_key`는 `\n` 형태여도 서버에서 자동으로 줄바꿈 복구됩니다.

## 500 에러가 나는 대표 원인
- Vercel 프로젝트에 서버 환경변수 누락
- `GOOGLE_SERVICE_ACCOUNT` JSON 형식 오류
- 텔레그램 토큰/채팅 ID 오입력
- 구글 시트 ID 오입력 또는 시트 권한 누락
