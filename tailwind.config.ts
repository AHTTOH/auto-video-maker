import type { Config } from 'tailwindcss';

const config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        // 🎨 NEW: 사용자 정의 색상 시스템
        primary: {
          50: '#F5F3F4',  // 매우 연한 그레이브라운
          100: '#E8E4E5', // 연한 그레이브라운
          200: '#D1C8CA', // 중간 연한 그레이브라운
          300: '#B9ACAF', // 중간 그레이브라운
          400: '#A29094', // 약간 진한 그레이브라운
          500: '#55474A', // 메인 컬러 (사용자 제공)
          600: '#4D3F42', // 진한 그레이브라운
          700: '#453739', // 더 진한 그레이브라운
          800: '#3D2F31', // 매우 진한 그레이브라운
          900: '#2F2326', // 가장 진한 그레이브라운
          DEFAULT: '#55474A',
          foreground: '#FFFFFF',
        },
        accent: {
          50: '#FEF3F0',  // 매우 연한 오렌지
          100: '#FCE4DD', // 연한 오렌지
          200: '#F8C9BB', // 중간 연한 오렌지
          300: '#F5AE99', // 중간 오렌지
          400: '#F27D5B', // 약간 진한 오렌지
          500: '#F04C23', // 메인 액센트 (사용자 제공)
          600: '#E43E1A', // 진한 오렌지레드
          700: '#C2341A', // 더 진한 오렌지레드
          800: '#A02A15', // 매우 진한 오렌지레드
          900: '#7E2010', // 가장 진한 오렌지레드
          DEFAULT: '#F04C23',
          foreground: '#FFFFFF',
        },
        secondary: {
          50: '#FFFCF0',  // 매우 연한 옐로우
          100: '#FEF8E0', // 연한 옐로우
          200: '#FDF1C1', // 중간 연한 옐로우
          300: '#FCEA9F', // 중간 옐로우
          400: '#FBD360', // 약간 진한 옐로우
          500: '#FAA61A', // 보조 액센트 (사용자 제공)
          600: '#E89410', // 진한 골든
          700: '#C6800E', // 더 진한 골든
          800: '#A46C0C', // 매우 진한 골든
          900: '#825409', // 가장 진한 골든
          DEFAULT: '#FAA61A',
          foreground: '#FFFFFF',
        },
        neutral: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
        success: {
          500: '#22C55E',
          DEFAULT: '#22C55E',
        },
        warning: {
          500: '#FAA61A', // 사용자 색상 활용
          DEFAULT: '#FAA61A',
        },
        error: {
          500: '#F04C23', // 사용자 색상 활용
          DEFAULT: '#F04C23',
        },
        info: {
          500: '#3B82F6',
          DEFAULT: '#3B82F6',
        },
        
        // Shadcn-ui compatibility colors
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        destructive: {
          DEFAULT: '#F04C23', // 사용자 색상 활용
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: '#F5F3F4',
          foreground: '#55474A',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      fontFamily: {
        pretendard: ['Pretendard', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      spacing: {
        '2xs': '2px',
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        '2xl': '48px',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xs: '4px',
        xl: '24px',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'elevation-1': '0 1px 3px rgba(85, 71, 74, 0.12), 0 1px 2px rgba(85, 71, 74, 0.24)',
        'elevation-2': '0 4px 6px rgba(85, 71, 74, 0.07), 0 1px 3px rgba(85, 71, 74, 0.1)',
        'elevation-3': '0 10px 15px rgba(85, 71, 74, 0.1), 0 4px 6px rgba(85, 71, 74, 0.05)',
        'glass': '0 8px 32px 0 rgba(85, 71, 74, 0.37)',
        'warm': '0 8px 32px 0 rgba(240, 76, 35, 0.2)',
        'golden': '0 8px 32px 0 rgba(250, 166, 26, 0.2)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        'bounce-gentle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-2px)' },
        },
        'glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(240, 76, 35, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(240, 76, 35, 0.6)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'pulse-subtle': 'pulse-subtle 2s ease-in-out infinite',
        'bounce-gentle': 'bounce-gentle 1s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
      },
      transitionDuration: {
        'quick': '100ms',
        'default': '200ms',
        'slow': '300ms',
      },
      width: {
        '120': '30rem', // 480px
      },
      height: {
        '120': '30rem', // 480px
      },
    },
  },
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/typography')],
} satisfies Config;

export default config;
