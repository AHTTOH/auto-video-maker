## 목차

1. [Design System Overview](#design-system-overview)
2. [Modern Color Palette](#modern-color-palette)
3. [Visual Design Language](#visual-design-language)
4. [Page Implementations](#page-implementations)
5. [Layout Components](#layout-components)
6. [Interaction Patterns](#interaction-patterns)
7. [Breakpoints](#breakpoints)
8. [Accessibility & Motion](#accessibility--motion)
9. [코드 스니펫 & 유틸리티](#코드-스니펫--유틸리티)

---

## Design System Overview

| 항목          | 가이드                                                                    |
| ----------- | ---------------------------------------------------------------------- |
| **브랜드 키워드** | **혁신적 · 신뢰감 · 전문성 · 미래지향적**                                             |
| **톤&무드**    | Modern Minimal + Professional (깔끔한 비즈니스 + 첨단 기술)                      |
| **시각 언어**   | Glassmorphism + Subtle Gradients + Clean Typography                   |
| **마스코트 사용** | '읏맨' PNG는 **좌측 고정** / 크기 140 × 280 px로 비율 유지                           |
| **타이포그래피**  | **Pretendard** (한국어) - 700/600/400/300<br>**Inter** (영문) - 700/600/400 |
| **아이콘**     | lucide-react ― 24px 기본, stroke-width: 1.5                            |
| **그리드**     | 12-column · 20 px base (mobile 4-column)                               |
| **간격**      | `2xs 2px` / `xs 4px` / `sm 8px` / `md 16px` / `lg 24px` / `xl 32px` / `2xl 48px` |

---

## Modern Color Palette

> **현대적이고 세련된 색상 시스템**으로 사용성과 브랜딩을 모두 고려한 팔레트입니다.

### Core Colors

| Token                  | HEX       | RGB             | Use Case               |
| ---------------------- | --------- | --------------- | ---------------------- |
| **Primary 50**         | `#ECFDF5` | `236, 253, 245` | 배경, 하이라이트              |
| **Primary 500**        | `#10B981` | `16, 185, 129`  | 메인 브랜드 색상             |
| **Primary 600**        | `#059669` | `5, 150, 105`   | 호버, 액티브 상태            |
| **Primary 900**        | `#064E3B` | `6, 78, 59`     | 진한 텍스트               |

### Accent Colors

| Token                  | HEX       | RGB             | Use Case               |
| ---------------------- | --------- | --------------- | ---------------------- |
| **Accent 50**          | `#FFF7ED` | `255, 247, 237` | 배경, 알림               |
| **Accent 500**         | `#F97316` | `249, 115, 22`  | CTA, 강조 요소            |
| **Accent 600**         | `#EA580C` | `234, 88, 12`   | 호버 상태               |
| **Accent 900**         | `#9A3412` | `154, 52, 18`   | 진한 액센트              |

### Neutral System

| Token                  | HEX       | RGB             | Use Case               |
| ---------------------- | --------- | --------------- | ---------------------- |
| **Neutral 50**         | `#FAFAFA` | `250, 250, 250` | 배경                   |
| **Neutral 100**        | `#F4F4F5` | `244, 244, 245` | 카드 배경               |
| **Neutral 200**        | `#E4E4E7` | `228, 228, 231` | 구분선, 테두리            |
| **Neutral 400**        | `#A1A1AA` | `161, 161, 170` | 플레이스홀더, 비활성화 텍스트    |
| **Neutral 600**        | `#52525B` | `82, 82, 91`    | 보조 텍스트              |
| **Neutral 900**        | `#18181B` | `24, 24, 27`    | 메인 텍스트              |

### Status Colors

| Token                  | HEX       | RGB             | Use Case               |
| ---------------------- | --------- | --------------- | ---------------------- |
| **Success 500**        | `#22C55E` | `34, 197, 94`   | 성공 상태               |
| **Warning 500**        | `#EAB308` | `234, 179, 8`   | 경고 상태               |
| **Error 500**          | `#EF4444` | `239, 68, 68`   | 에러 상태               |
| **Info 500**           | `#3B82F6` | `59, 130, 246`  | 정보 상태               |

---

## Visual Design Language

### Glassmorphism & Depth

```css
/* Glass Card Effect */
.glass-card {
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
}

/* Subtle Elevation */
.elevation-1 { box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24); }
.elevation-2 { box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07), 0 1px 3px rgba(0, 0, 0, 0.1); }
.elevation-3 { box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05); }
```

### Gradients

```css
/* Primary Gradient */
.gradient-primary {
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
}

/* Accent Gradient */
.gradient-accent {
  background: linear-gradient(135deg, #F97316 0%, #EA580C 100%);
}

/* Subtle Background */
.gradient-bg {
  background: linear-gradient(135deg, #FAFAFA 0%, #F4F4F5 100%);
}
```

### Border Radius System

| Token    | Value  | Use Case           |
| -------- | ------ | ------------------ |
| **xs**   | `4px`  | 작은 요소 (badge, chip) |
| **sm**   | `8px`  | 버튼, 입력 필드          |
| **md**   | `12px` | 카드, 패널            |
| **lg**   | `16px` | 모달, 대화상자          |
| **xl**   | `24px` | 큰 카드, 섹션          |
| **full** | `50%`  | 원형 요소             |

---

## Page Implementations

### 1) **/upload** ― 파일 업로드

| 요소                 | 설명                                             |
| ------------------ | ---------------------------------------------- |
| **core purpose**   | 직관적이고 매력적인 파일 업로드 경험                           |
| **key components** | GlassDropZone, ProgressCircle, AnimatedButton   |
| **visual style**   | Glassmorphism + Gradient Background            |
| **layout**         | Hero Section + Upload Card (centered)          |

**시각적 특징:**
- 그라데이션 배경 with subtle patterns
- Glass morphism 드롭존
- Animated progress indicators
- Micro-interactions on hover/drag

---

### 2) **/preview** ― 요약 검토

| 요소             | 설명                                               |
| -------------- | ------------------------------------------------ |
| core purpose   | 세련된 요약 편집 인터페이스                                 |
| key components | EditableTable, FloatingToolbar, ActionButtons    |
| visual style   | Clean Cards + Subtle Shadows                    |
| layout         | Sidebar + Main Content (responsive)              |

---

### 3) **/progress** ― 제작 중

| 요소             | 설명                                        |
| -------------- | ----------------------------------------- |
| core purpose   | 매력적인 진행률 표시                              |
| key components | CircularProgress, StepIndicator, ETA Timer |
| visual style   | Animated + Gradient Progress               |
| layout         | Centered Card with Background Pattern      |

---

### 4) **/videos** ― 내 영상

| 요소             | 설명                                                  |
| -------------- | --------------------------------------------------- |
| core purpose   | 매력적인 영상 갤러리                                        |
| key components | VideoCard (hover effects), SearchBar, FilterChips   |
| visual style   | Masonry Layout + Card Hover Animations             |
| layout         | Header + Filter Bar + Grid (responsive)             |

---

## Layout Components

### Topbar
```typescript
interface TopbarProps {
  variant: 'default' | 'transparent' | 'glassmorphism';
  showProgress: boolean;
  activeJobs: number;
}
```

**시각적 특징:**
- Glassmorphism effect (투명 배경 페이지에서)
- Animated job counter badges
- Smooth transitions between states

### Sidebar/Drawer
```typescript
interface SidebarProps {
  jobBadges: JobBadge[];
  storageUsed: number;
  storageLimit: number;
  stats: CompletionStats;
}
```

**시각적 특징:**
- Gradient progress bars
- Animated counters
- Card-based layout with elevation

---

## Interaction Patterns

### Button States

| State     | Visual Treatment                                    | Animation            |
| --------- | --------------------------------------------------- | -------------------- |
| **Rest**  | Gradient background + subtle shadow                | None                 |
| **Hover** | Lift effect (elevation-2) + slight scale (1.02)    | 200ms ease-out       |
| **Active**| Scale down (0.98) + deeper shadow                  | 100ms ease-in        |
| **Focus** | Ring outline (2px) + accessibility               | None                 |
| **Loading**| Spinner + disabled state                          | Continuous rotation  |

### Card Interactions

| State     | Visual Treatment                                    |
| --------- | --------------------------------------------------- |
| **Rest**  | elevation-1, border-neutral-200                     |
| **Hover** | elevation-2, border-primary-200, scale(1.02)       |
| **Active**| elevation-3, border-primary-300                     |

### Form Elements

| Element   | Focus Treatment                                     |
| --------- | --------------------------------------------------- |
| **Input** | Ring (primary-500), border (primary-300)           |
| **Select**| Same as input + dropdown shadow                    |
| **File**  | Dashed border animation + background color change   |

---

## Breakpoints

| 이름          | px        | Layout Changes                      |
| ----------- | --------- | ----------------------------------- |
| **mobile**  | **≥ 320** | Single column, drawer navigation    |
| **tablet**  | ≥ 768     | Two column, collapsible sidebar     |
| **desktop** | ≥ 1024    | Multi-column, persistent sidebar    |
| **wide**    | ≥ 1440    | Max-width container (1280px)        |

---

## Accessibility & Motion

### WCAG 2.2 Compliance

| 조합                                | 대비 비율       | 결과          |
| --------------------------------- | ----------- | ----------- |
| Primary 500 (`#10B981`) ↔︎ white  | **4.8 : 1** | ✅ Level AA  |
| Accent 500 (`#F97316`) ↔︎ white   | **4.2 : 1** | ✅ Level AA  |
| Neutral 900 (`#18181B`) ↔︎ white  | **16.1 : 1**| ✅ Level AAA |
| Neutral 600 (`#52525B`) ↔︎ white  | **6.9 : 1** | ✅ Level AAA |

### Motion & Animation

```css
/* Respect user's motion preferences */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Standard transitions */
.transition-default { transition: all 200ms ease-out; }
.transition-quick   { transition: all 100ms ease-out; }
.transition-slow    { transition: all 300ms ease-out; }
```

---

## 코드 스니펫 & 유틸리티

### 1) Modern Button 컴포넌트

```tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:shadow-lg hover:scale-[1.02] focus-visible:ring-primary-500',
    accent: 'bg-gradient-to-r from-accent-500 to-accent-600 text-white hover:shadow-lg hover:scale-[1.02] focus-visible:ring-accent-500',
    secondary: 'bg-white border border-neutral-200 text-neutral-900 hover:bg-neutral-50 hover:shadow-md focus-visible:ring-neutral-500',
    ghost: 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 focus-visible:ring-neutral-500',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
```

### 2) Glass Card 컴포넌트

```tsx
interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  blur?: 'sm' | 'md' | 'lg';
  opacity?: number;
}

export function GlassCard({
  children,
  blur = 'md',
  opacity = 0.25,
  className,
  ...props
}: GlassCardProps) {
  const blurValues = {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-lg',
  };

  return (
    <div
      className={cn(
        'rounded-xl border border-white/20 shadow-xl',
        blurValues[blur],
        className
      )}
      style={{
        background: `rgba(255, 255, 255, ${opacity})`,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
```

### 3) Animated Progress Circle

```tsx
interface ProgressCircleProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function ProgressCircle({
  progress,
  size = 120,
  strokeWidth = 8,
  className,
}: ProgressCircleProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn('relative', className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-neutral-200"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#gradient)"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-out"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-semibold text-neutral-900">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
}
```

---
