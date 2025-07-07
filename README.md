# Auto Video Maker 🎬

AI를 활용한 자동 비디오 제작 플랫폼입니다. 텍스트 파일을 업로드하면 자동으로 교육용 비디오로 변환해줍니다.

## 주요 기능 ✨

- 📄 **텍스트 요약**: GPT-3.5를 활용한 지능형 텍스트 요약
- 🎨 **이미지 생성**: DALL-E 3로 읏맨 캐릭터 이미지 자동 생성
- 🎙️ **음성 합성**: ElevenLabs를 통한 고품질 TTS
- 🎥 **비디오 제작**: 자동 슬라이드 비디오 생성
- 💾 **데이터 관리**: Supabase 기반 데이터베이스 및 스토리지

## 기술 스택 🛠️

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Shadcn UI
- **Database**: Supabase
- **AI Services**: 
  - OpenAI (GPT-3.5, DALL-E 3)
  - ElevenLabs (TTS)
- **State Management**: Zustand, React Query
- **Form**: React Hook Form + Zod

## 시작하기 🚀

### 1. 저장소 클론

```bash
git clone <repository-url>
cd auto-video-maker
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경변수 설정

`.env.example` 파일을 `.env.local`로 복사하고 필요한 값들을 설정하세요:

```bash
cp .env.example .env.local
```

#### 필요한 API 키들:

- **Supabase**: [https://supabase.com](https://supabase.com)에서 프로젝트 생성 후 URL과 Anon Key 획득
- **OpenAI**: [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)에서 API 키 생성
- **ElevenLabs**: [https://elevenlabs.io/app/settings/api-keys](https://elevenlabs.io/app/settings/api-keys)에서 API 키 생성

### 4. 데이터베이스 설정

Supabase 프로젝트에서 `/doc/4) ERD.md`에 정의된 테이블들을 생성하세요.

### 5. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 애플리케이션을 확인할 수 있습니다.

## 프로젝트 구조 📁

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API 라우트
│   │   ├── dall-e/        # DALL-E 이미지 생성
│   │   ├── summarize/     # 텍스트 요약
│   │   └── tts/           # 음성 합성
│   ├── jobs/              # 작업 관리 페이지
│   └── page.tsx           # 홈페이지
├── components/            # React 컴포넌트
│   ├── layout/           # 레이아웃 컴포넌트
│   ├── ui/               # Shadcn UI 컴포넌트
│   ├── upload/           # 파일 업로드 컴포넌트
│   └── videos/           # 비디오 관련 컴포넌트
├── hooks/                # 커스텀 훅
├── lib/                  # 유틸리티 및 설정
└── constants/            # 상수 정의
```

## API 엔드포인트 🔌

- `POST /api/summarize` - 텍스트 요약 (GPT-3.5)
- `POST /api/dall-e` - 읏맨 이미지 생성 (DALL-E 3)
- `POST /api/tts` - 음성 합성 (ElevenLabs)

## 사용 방법 📖

1. **파일 업로드**: 홈페이지에서 텍스트 파일(.txt, .md 등)을 업로드
2. **자동 처리**: AI가 자동으로 텍스트를 분석하고 6개 슬라이드로 요약
3. **이미지 생성**: 각 슬라이드에 맞는 읏맨 캐릭터 이미지 생성
4. **음성 합성**: 슬라이드 내용을 자연스러운 음성으로 변환
5. **비디오 완성**: 최종 교육용 비디오 다운로드

## 배포 🌐

### Vercel 배포

1. [Vercel](https://vercel.com)에 프로젝트 연결
2. 환경변수 설정
3. 자동 배포 완료

### 기타 배포 플랫폼

Next.js를 지원하는 모든 플랫폼에서 배포 가능합니다.

## 기여하기 🤝

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 라이센스 📝

이 프로젝트는 MIT 라이센스 하에 배포됩니다.

## 지원 💬

문제나 질문이 있으시면 Issues를 통해 문의해주세요.

---

이 프로젝트는 [`EasyNext`](https://github.com/easynext/easynext)를 사용해 생성된 [Next.js](https://nextjs.org) 프로젝트입니다.

## Getting Started

개발 서버를 실행합니다.<br/>
환경에 따른 명령어를 사용해주세요.

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 결과를 확인할 수 있습니다.

`app/page.tsx` 파일을 수정하여 페이지를 편집할 수 있습니다. 파일을 수정하면 자동으로 페이지가 업데이트됩니다.

## 기본 포함 라이브러리

- [Next.js](https://nextjs.org)
- [React](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [TypeScript](https://www.typescriptlang.org)
- [ESLint](https://eslint.org)
- [Prettier](https://prettier.io)
- [Shadcn UI](https://ui.shadcn.com)
- [Lucide Icon](https://lucide.dev)
- [date-fns](https://date-fns.org)
- [react-use](https://github.com/streamich/react-use)
- [es-toolkit](https://github.com/toss/es-toolkit)
- [Zod](https://zod.dev)
- [React Query](https://tanstack.com/query/latest)
- [React Hook Form](https://react-hook-form.com)
- [TS Pattern](https://github.com/gvergnaud/ts-pattern)

## 사용 가능한 명령어

한글버전 사용

```sh
easynext lang ko
```

최신버전으로 업데이트

```sh
npm i -g @easynext/cli@latest
# or
yarn add -g @easynext/cli@latest
# or
pnpm add -g @easynext/cli@latest
```

Supabase 설정

```sh
easynext supabase
```

Next-Auth 설정

```sh
easynext auth

# ID,PW 로그인
easynext auth idpw
# 카카오 로그인
easynext auth kakao
```

유용한 서비스 연동

```sh
# Google Analytics
easynext gtag

# Microsoft Clarity
easynext clarity

# ChannelIO
easynext channelio

# Sentry
easynext sentry

# Google Adsense
easynext adsense
```
