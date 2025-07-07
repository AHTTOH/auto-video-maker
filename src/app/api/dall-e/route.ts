import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1';

// 읏맨 캐릭터 설명 프롬프트 템플릿
const WOOTMAN_PROMPTS = [
  "A cute cartoon character called 'Wootman' wearing a business suit with glasses, friendly smile, simple minimalist style, PNG transparent background",
  "A cute cartoon character called 'Wootman' wearing casual clothes with a cap, thumbs up pose, simple minimalist style, PNG transparent background", 
  "A cute cartoon character called 'Wootman' wearing a lab coat with safety goggles, holding a clipboard, simple minimalist style, PNG transparent background",
  "A cute cartoon character called 'Wootman' wearing a chef's hat and apron, holding a wooden spoon, simple minimalist style, PNG transparent background",
  "A cute cartoon character called 'Wootman' wearing a graduation cap and gown, holding a diploma, simple minimalist style, PNG transparent background",
  "A cute cartoon character called 'Wootman' wearing a superhero cape and mask, heroic pose, simple minimalist style, PNG transparent background"
];

interface DallERequest {
  slideCount: number;
  context?: string;
}

export async function POST(request: NextRequest) {
  try {
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API 키가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { slideCount, context }: DallERequest = body;

    if (!slideCount || slideCount < 1) {
      return NextResponse.json(
        { error: '슬라이드 개수가 필요합니다.' },
        { status: 400 }
      );
    }

    // 슬라이드 개수만큼 읏맨 이미지 생성
    const imageResults = [];
    
    for (let i = 0; i < slideCount; i++) {
      try {
        // 랜덤하게 읏맨 스타일 선택
        const randomPrompt = WOOTMAN_PROMPTS[Math.floor(Math.random() * WOOTMAN_PROMPTS.length)];
        
        // GPT-3.5를 사용해 컨텍스트에 맞는 읏맨 설명 생성
        let enhancedPrompt = randomPrompt;
        if (context) {
          const gptResponse = await fetch(`${OPENAI_API_URL}/chat/completions`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-3.5-turbo',
              messages: [
                {
                  role: 'system',
                  content: 'You are a creative assistant that generates image prompts for a cute cartoon character called "Wootman" based on educational content context. Always include "simple minimalist style, PNG transparent background" in your response.'
                },
                {
                  role: 'user',
                  content: `Based on this educational context: "${context}", create a single image prompt for Wootman character that would fit this topic. Keep it simple and professional. Start with "A cute cartoon character called 'Wootman'"`
                }
              ],
              max_tokens: 100,
              temperature: 0.8
            }),
          });

          if (gptResponse.ok) {
            const gptData = await gptResponse.json();
            enhancedPrompt = gptData.choices[0]?.message?.content || randomPrompt;
          }
        }

        // DALL-E 3로 이미지 생성
        const dalleResponse = await fetch(`${OPENAI_API_URL}/images/generations`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'dall-e-3',
            prompt: enhancedPrompt,
            n: 1,
            size: '1024x1024',
            quality: 'standard',
            response_format: 'url'
          }),
        });

        if (!dalleResponse.ok) {
          const errorText = await dalleResponse.text();
          console.error(`DALL-E API error for image ${i + 1}:`, errorText);
          throw new Error(`이미지 생성 실패: ${dalleResponse.status}`);
        }

        const dalleData = await dalleResponse.json();
        const imageUrl = dalleData.data[0]?.url;

        if (!imageUrl) {
          throw new Error('이미지 URL을 받지 못했습니다.');
        }

        // 이미지를 다운로드하여 Base64로 변환
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          throw new Error('이미지 다운로드 실패');
        }

        const imageBuffer = await imageResponse.arrayBuffer();
        const imageBase64 = Buffer.from(imageBuffer).toString('base64');

        imageResults.push({
          slideIndex: i,
          imageData: `data:image/png;base64,${imageBase64}`,
          prompt: enhancedPrompt
        });

      } catch (error) {
        console.error(`슬라이드 ${i + 1} 읏맨 이미지 생성 오류:`, error);
        // 개별 이미지 실패시에도 계속 진행
        imageResults.push({
          slideIndex: i,
          imageData: null,
          error: error instanceof Error ? error.message : '이미지 생성 실패'
        });
      }
    }

    return NextResponse.json({
      success: true,
      results: imageResults,
      message: `${imageResults.length}개 읏맨 이미지 생성 완료`
    });

  } catch (error) {
    console.error('DALL-E API 오류:', error);
    return NextResponse.json(
      { 
        error: '읏맨 이미지 생성 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
} 