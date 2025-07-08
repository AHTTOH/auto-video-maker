import { NextRequest, NextResponse } from 'next/server';

// ElevenLabs API configuration
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || 'sk_16e9decdae05ade8ed6c1707eaf52b059d5af8ec07297c96';
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

// Default voice ID (한국어 음성)
const DEFAULT_VOICE_ID = 'WzMnDIgiICcj1oXbUBO0';

interface TTSRequest {
  text: string;
  voice_id?: string;
}

interface SlideData {
  title: string;
  content: string;
  duration: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slides }: { slides: SlideData[] } = body;

    if (!slides || slides.length === 0) {
      return NextResponse.json(
        { error: '슬라이드 데이터가 필요합니다.' },
        { status: 400 }
      );
    }

    // 각 슬라이드별로 음성 생성
    const audioResults = [];

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      
      // 슬라이드 텍스트 준비 (제목 + 내용)
      const slideText = `슬라이드 ${i + 1}. ${slide.title}. ${slide.content}`;

      try {
        // ElevenLabs API 호출
        const response = await fetch(
          `${ELEVENLABS_API_URL}/text-to-speech/${DEFAULT_VOICE_ID}`,
          {
            method: 'POST',
            headers: {
              'Accept': 'audio/mpeg',
              'Content-Type': 'application/json',
              'xi-api-key': ELEVENLABS_API_KEY,
            },
            body: JSON.stringify({
              text: slideText,
              model_id: 'eleven_multilingual_v2',
              voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75,
                style: 0.0,
                use_speaker_boost: true
              }
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`ElevenLabs API error for slide ${i + 1}:`, errorText);
          throw new Error(`음성 생성 실패: ${response.status}`);
        }

        // 오디오 데이터를 Base64로 변환
        const audioBuffer = await response.arrayBuffer();
        const audioBase64 = Buffer.from(audioBuffer).toString('base64');

        audioResults.push({
          slideIndex: i,
          title: slide.title,
          audioData: `data:audio/mpeg;base64,${audioBase64}`,
          duration: slide.duration
        });

      } catch (error) {
        console.error(`슬라이드 ${i + 1} 음성 생성 오류:`, error);
        // 개별 슬라이드 실패시에도 계속 진행
        audioResults.push({
          slideIndex: i,
          title: slide.title,
          audioData: null,
          error: error instanceof Error ? error.message : '음성 생성 실패'
        });
      }
    }

    return NextResponse.json({
      success: true,
      results: audioResults,
      message: `${audioResults.length}개 슬라이드 음성 생성 완료`
    });

  } catch (error) {
    console.error('TTS API 오류:', error);
    return NextResponse.json(
      { 
        error: '음성 생성 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}

// 사용 가능한 음성 목록 조회
export async function GET() {
  try {
    const response = await fetch(`${ELEVENLABS_API_URL}/voices`, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`음성 목록 조회 실패: ${response.status}`);
    }

    const voices = await response.json();
    
    return NextResponse.json({
      success: true,
      voices: voices.voices
    });

  } catch (error) {
    console.error('음성 목록 조회 오류:', error);
    return NextResponse.json(
      { 
        error: '음성 목록 조회 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
} 