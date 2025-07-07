import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    // 환경 변수 체크를 먼저 수행
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is missing');
      return NextResponse.json(
        { error: 'OpenAI API 키가 설정되지 않았습니다. 환경 변수를 확인해주세요.' },
        { status: 500 }
      );
    }

    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: '텍스트가 제공되지 않았습니다.' },
        { status: 400 }
      );
    }

    // API 키가 있을 때만 OpenAI 클라이언트 초기화
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // 꼭 3.5 turbo 사용!
      messages: [
        {
          role: 'system',
          content: `당신은 교육용 동영상 제작을 위한 요약 전문가입니다. 
          주어진 텍스트를 정확히 6개의 핵심 포인트로 요약해주세요.
          각 포인트는 5초 분량의 슬라이드로 제작될 예정입니다.
          
          요구사항:
          - 정확히 6개의 bullet point로 요약
          - 각 포인트는 5초 내에 읽을 수 있도록 간결하게 (30-50자)
          - 교육적 가치가 높은 내용 우선
          - 논리적 순서로 배치
          - 한국어로 작성
          - 모든 텍스트는 "~입니다" 말투로 작성 (설명하고 가르쳐주는 뉘앙스)
          - 정중하고 교육적인 톤 유지
          
          응답 형식 (반드시 JSON 형태):
          {
            "summary": "전체 내용의 핵심 요약 (100자 이내, ~입니다 말투)",
            "slides": [
              {
                "title": "슬라이드 제목 (~입니다 말투)",
                "content": "슬라이드 내용 (30-50자, ~입니다 말투)",
                "duration": 5
              }
            ]
          }`
        },
        {
          role: 'user',
          content: `다음 텍스트를 5초씩 6개 슬라이드로 요약해주세요:\n\n${text}`
        }
      ],
      max_tokens: 1500,
      temperature: 0.3
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: 'OpenAI 응답이 비어있습니다.' },
        { status: 500 }
      );
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      console.error('JSON 파싱 오류:', parseError);
      console.error('OpenAI 응답:', content);
      return NextResponse.json(
        { error: 'OpenAI 응답을 파싱할 수 없습니다.' },
        { status: 500 }
      );
    }
    
    // 슬라이드가 정확히 6개인지 확인
    if (!parsed.slides || parsed.slides.length !== 6) {
      return NextResponse.json(
        { error: '슬라이드가 6개가 생성되지 않았습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      summary: parsed.summary,
      slides: parsed.slides,
      error: null
    });

  } catch (error) {
    console.error('요약 API 오류:', error);
    
    // OpenAI API 관련 오류 처리
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'OpenAI API 키가 올바르지 않습니다.' },
          { status: 401 }
        );
      }
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'API 사용량 한도를 초과했습니다. 잠시 후 다시 시도해주세요.' },
          { status: 429 }
        );
      }
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 