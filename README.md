# monote

학생들을 위한 시험 범위 · 수행평가 · 족보 공유 커뮤니티

---

## 주요 기능

| 기능 | 설명 |
|---|---|
| 학년/과목별 게시판 | 1~3학년, 21개 과목별 정보 분리 |
| 시험 범위 공유 | 시험 날짜, 중요도, 선생님 주의사항 |
| 수행평가 공유 | 준비물, 제출일, PPT 양식, 발표 순서 |
| 선생님 스타일 기록 | 출제 경향, 서술형 비중, 자주 나오는 유형 |
| 실시간 채팅 | 학교/학년/과목별 채팅방 + 자유 채팅 |
| 중요도 투표 | 무조건 외우기 / 시험 가능성 높음 / 중요 / 참고 |
| 시험 직전 모드 | 중요 정보만 우선 표시되는 다크 모드 |
| 랭킹 시스템 | 포인트, 레벨, 뱃지 (범위 마스터, 족보왕 등) |
| 익명 기능 | 닉네임 또는 익명으로 자유롭게 작성 |
| 파일 업로드 | PDF, 이미지, 문서 첨부 |
| 신고 시스템 | 허위 정보 신고, 관리자 검토 |

## 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS 4
- **Backend**: Firebase (Auth, Firestore, Storage, Realtime DB)
- **State**: Zustand
- **UI**: 커스텀 컴포넌트 (DESIGN.md 기반 디자인 시스템)
- **모바일**: PWA + WebView 지원, 인스타그램식 하단 탭 네비게이션

## 시작하기

### 1. Firebase 프로젝트 설정

1. [Firebase 콘솔](https://console.firebase.google.com)에서 새 프로젝트 생성
2. Authentication → 이메일/비밀번호 로그인 활성화
3. Firestore Database 생성
4. Storage 활성화
5. Realtime Database 생성

### 2. 환경 변수 설정

`.env.local` 파일에 Firebase 설정 입력:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
```

### 3. 개발 서버 실행

```bash
npm install
npm run dev
```

`http://localhost:3000` 접속

## 파일 구조

```
src/
├── app/
│   ├── (app)/           # 메인 앱 (로그인 후)
│   │   ├── feed/        # 홈 피드
│   │   ├── board/       # 전체 게시판
│   │   ├── chat/        # 채팅 목록 + 채팅방
│   │   ├── ranking/     # 랭킹
│   │   ├── profile/     # 내 정보
│   │   ├── search/      # 검색
│   │   └── notifications/ # 알림
│   ├── (auth)/          # 인증
│   │   ├── login/       # 로그인
│   │   └── register/    # 회원가입 (4단계)
│   └── post/
│       ├── new/         # 글 작성 (3단계)
│       └── [id]/        # 게시물 상세
├── components/
│   ├── ui/              # Button, Card, Input, Badge, Avatar
│   ├── layout/          # Sidebar, TopBar, BottomNav
│   └── posts/           # PostCard
├── lib/
│   ├── firebase.ts      # Firebase 초기화
│   ├── utils.ts         # 유틸리티
│   └── mock-data.ts     # 개발용 목업 데이터
├── store/
│   ├── auth-store.ts    # 사용자 상태
│   └── ui-store.ts      # UI 상태 (시험모드 등)
└── types/index.ts       # TypeScript 타입
```

## 법적 고지

- 교과서 전체 PDF 업로드는 저작권법 위반으로 불가능합니다
- 요약본, 직접 작성 노트, 일부 캡처만 업로드 가능합니다
- 개인정보(실명, 학번) 포함 게시물은 즉시 삭제됩니다
- 허위 정보 게시, 타인 비방 시 계정이 정지됩니다
- 학생 전용 서비스입니다

## 배포

```bash
npm run build
```

Vercel, Firebase Hosting, 또는 임의의 Node.js 서버에 배포 가능합니다.

## 모바일 앱

`public/manifest.json`이 설정되어 있어 PWA로 설치 가능합니다.
React Native WebView로 래핑하면 네이티브 앱으로 배포할 수 있습니다.
