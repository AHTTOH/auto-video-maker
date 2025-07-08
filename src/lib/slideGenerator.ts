export interface SlideData {
  title: string;
  content: string;
  duration: number;
}

export interface SlideGenerationOptions {
  width?: number;
  height?: number;
  backgroundColor?: string;
  textColor?: string;
  fontFamily?: string;
  titleFontSize?: number;
  contentFontSize?: number;
  padding?: number;
}

/**
 * 칠판 스타일의 슬라이드 이미지를 Canvas로 생성
 */
export async function generateBlackboardSlide(
  slide: SlideData,
  slideNumber: number,
  totalSlides: number,
  options: SlideGenerationOptions = {}
): Promise<string> {
  const {
    width = 1080,
    height = 1920,
    backgroundColor = '#2D5016', // 칠판 초록색
    textColor = '#FFFFFF',
    fontFamily = 'Noto Sans KR, Arial, sans-serif',
    titleFontSize = 72,
    contentFontSize = 56,
    padding = 80
  } = options;

  // Canvas 생성
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas context를 생성할 수 없습니다.');
  }

  // 나무 테두리 먼저 그리기
  addWoodenFrame(ctx, width, height);
  
  // 칠판 영역 계산 (프레임 안쪽)
  const frameWidth = 60;
  const boardX = frameWidth;
  const boardY = frameWidth;
  const boardWidth = width - frameWidth * 2;
  const boardHeight = height - frameWidth * 2;
  
  // 칠판 배경 그리기 (프레임 안쪽만)
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(boardX, boardY, boardWidth, boardHeight);

  // 칠판 질감 효과 (프레임 안쪽만)
  ctx.save();
  ctx.beginPath();
  ctx.rect(boardX, boardY, boardWidth, boardHeight);
  ctx.clip();
  addChalkboardTexture(ctx, width, height);
  ctx.restore();

  // 텍스트 설정
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 슬라이드 번호 (우상단, 칠판 영역 내)
  ctx.font = `${contentFontSize * 0.6}px ${fontFamily}`;
  ctx.textAlign = 'right';
  ctx.fillText(`${slideNumber}/${totalSlides}`, boardX + boardWidth - padding / 2, boardY + padding / 2);

  // 제목 그리기 (칠판 영역 내) - 상단 스피커 공간 확보를 위해 더 위쪽으로 이동
  ctx.font = `bold ${titleFontSize}px ${fontFamily}`;
  ctx.textAlign = 'center';
  
  const titleY = boardY + boardHeight * 0.2;
  const wrappedTitle = wrapText(ctx, slide.title, boardWidth - padding * 2, titleFontSize * 1.2);
  drawWrappedText(ctx, wrappedTitle, boardX + boardWidth / 2, titleY, titleFontSize * 1.2);

  // 구분선 그리기 (분필 효과, 칠판 영역 내)
  drawChalkLine(ctx, boardX + padding, boardY + boardHeight * 0.28, boardX + boardWidth - padding, boardY + boardHeight * 0.28);

  // 내용 그리기 (칠판 영역 내) - 전체적으로 위쪽으로 이동
  ctx.font = `${contentFontSize}px ${fontFamily}`;
  const contentY = boardY + boardHeight * 0.45;
  const wrappedContent = wrapText(ctx, slide.content, boardWidth - padding * 2, contentFontSize * 1.4);
  drawWrappedText(ctx, wrappedContent, boardX + boardWidth / 2, contentY, contentFontSize * 1.4);

  // 하단에 시간 표시 (칠판 영역 내)
  ctx.font = `${contentFontSize * 0.7}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.fillText(`${slide.duration}초`, boardX + boardWidth / 2, boardY + boardHeight - padding / 2);

  // Canvas를 데이터 URL로 변환
  return canvas.toDataURL('image/png');
}

/**
 * 칠판 질감 효과 추가 (투명도 개선)
 */
function addChalkboardTexture(ctx: CanvasRenderingContext2D, width: number, height: number) {
  // 매우 미세한 노이즈 효과 (투명도 극대화)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.01)';
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 1;
    ctx.fillRect(x, y, size, size);
  }
}

/**
 * 나무 테두리 효과 추가
 */
function addWoodenFrame(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const frameWidth = 60;
  
  // 나무 색상 그라데이션
  const gradient = ctx.createLinearGradient(0, 0, frameWidth, frameWidth);
  gradient.addColorStop(0, '#8B4513'); // 진한 갈색
  gradient.addColorStop(0.3, '#A0522D'); // 중간 갈색  
  gradient.addColorStop(0.7, '#CD853F'); // 밝은 갈색
  gradient.addColorStop(1, '#DEB887'); // 베이지
  
  // 프레임 그리기
  ctx.fillStyle = gradient;
  
  // 상단 프레임
  ctx.fillRect(0, 0, width, frameWidth);
  // 하단 프레임
  ctx.fillRect(0, height - frameWidth, width, frameWidth);
  // 좌측 프레임
  ctx.fillRect(0, 0, frameWidth, height);
  // 우측 프레임
  ctx.fillRect(width - frameWidth, 0, frameWidth, height);
  
  // 나무 결 효과
  ctx.strokeStyle = 'rgba(139, 69, 19, 0.3)';
  ctx.lineWidth = 2;
  
  // 세로 나무결
  for (let i = 0; i < 10; i++) {
    const x = Math.random() * width;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + Math.random() * 20 - 10, height);
    ctx.stroke();
  }
  
  // 나무 매듭 효과
  for (let i = 0; i < 5; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const radius = Math.random() * 15 + 5;
    
    ctx.fillStyle = 'rgba(101, 67, 33, 0.2)';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * 분필 스타일의 선 그리기
 */
function drawChalkLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  
  // 약간의 흔들림 효과
  const segments = 20;
  for (let i = 1; i <= segments; i++) {
    const x = x1 + (x2 - x1) * (i / segments);
    const y = y1 + (y2 - y1) * (i / segments) + (Math.random() - 0.5) * 2;
    ctx.lineTo(x, y);
  }
  
  ctx.stroke();
}

/**
 * 텍스트를 지정된 폭에 맞게 줄바꿈 (한국어 지원)
 */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, lineHeight: number): string[] {
  const lines: string[] = [];
  let currentLine = '';

  // 한국어와 영어를 모두 고려한 줄바꿈
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const testLine = currentLine + char;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine) {
      // 현재 줄이 너무 길면 줄바꿈
      lines.push(currentLine.trim());
      currentLine = char;
    } else {
      currentLine = testLine;
    }

    // 공백이나 구두점에서 자연스럽게 줄바꿈할 수 있도록
    if (char === ' ' || char === ',' || char === '.' || char === '!' || char === '?') {
      const nextPartLength = text.slice(i + 1).split(/[\s,.!?]/, 1)[0].length;
      const nextPartWidth = ctx.measureText(currentLine + text.slice(i + 1, i + 1 + nextPartLength)).width;
      
      if (nextPartWidth > maxWidth) {
        lines.push(currentLine.trim());
        currentLine = '';
      }
    }
  }

  if (currentLine.trim()) {
    lines.push(currentLine.trim());
  }

  return lines;
}

/**
 * 줄바꿈된 텍스트를 그리기
 */
function drawWrappedText(ctx: CanvasRenderingContext2D, lines: string[], x: number, y: number, lineHeight: number) {
  const totalHeight = lines.length * lineHeight;
  const startY = y - totalHeight / 2;

  lines.forEach((line, index) => {
    ctx.fillText(line, x, startY + index * lineHeight);
  });
}

/**
 * 모든 슬라이드를 이미지로 생성하고 웹페이지에 표시할 데이터 반환
 */
export async function generateSlidesForDisplay(slides: SlideData[]): Promise<string[]> {
  try {
    const slideImages: string[] = [];

    // 각 슬라이드를 이미지로 변환
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      const imageData = await generateBlackboardSlide(slide, i + 1, slides.length);
      slideImages.push(imageData);
    }

    return slideImages;

  } catch (error) {
    console.error('슬라이드 생성 중 오류:', error);
    throw error;
  }
}

/**
 * 모든 슬라이드를 이미지로 생성하고 ZIP 파일로 다운로드 (기존 함수 유지)
 */
export async function generateAndDownloadSlides(slides: SlideData[]): Promise<void> {
  try {
    const images: { name: string; data: string }[] = [];

    // 각 슬라이드를 이미지로 변환
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      const imageData = await generateBlackboardSlide(slide, i + 1, slides.length);
      images.push({
        name: `slide_${i + 1}_${slide.title.replace(/[^a-zA-Z0-9가-힣]/g, '_')}.png`,
        data: imageData
      });
    }

    // 개별 이미지 다운로드 (브라우저에서는 ZIP 생성이 복잡하므로)
    for (const image of images) {
      downloadImage(image.data, image.name);
      // 다운로드 간격을 두어 브라우저 제한 방지
      await new Promise(resolve => setTimeout(resolve, 500));
    }

  } catch (error) {
    console.error('슬라이드 생성 중 오류:', error);
    throw error;
  }
}

/**
 * 이미지 다운로드
 */
function downloadImage(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * 단일 슬라이드 미리보기 생성
 */
export async function generateSlidePreview(slide: SlideData, slideNumber: number, totalSlides: number): Promise<string> {
  return generateBlackboardSlide(slide, slideNumber, totalSlides, {
    width: 540, // 미리보기용 작은 크기
    height: 960,
    titleFontSize: 36,
    contentFontSize: 28,
    padding: 40
  });
}

/**
 * 칠판 스타일의 슬라이드 이미지를 Canvas로 생성 (읏맨 이미지 포함)
 */
export async function generateBlackboardSlideWithWootman(
  slide: SlideData,
  slideNumber: number,
  totalSlides: number,
  wootmanImageData?: string,
  options: SlideGenerationOptions = {}
): Promise<string> {
  // 기본 슬라이드 생성
  const baseSlideImage = await generateBlackboardSlide(slide, slideNumber, totalSlides, options);
  
  // 읏맨 이미지가 없으면 기본 슬라이드 반환
  if (!wootmanImageData) {
    return baseSlideImage;
  }

  const {
    width = 1080,
    height = 1920
  } = options;

  // 새 Canvas 생성하여 합성
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas context를 생성할 수 없습니다.');
  }

  // 기본 슬라이드 이미지 로드 및 그리기
  const baseImage = new Image();
  await new Promise((resolve, reject) => {
    baseImage.onload = resolve;
    baseImage.onerror = reject;
    baseImage.src = baseSlideImage;
  });

  ctx.drawImage(baseImage, 0, 0, width, height);

  // 읏맨 이미지 로드 및 오버레이
  const wootmanImage = new Image();
  await new Promise((resolve, reject) => {
    wootmanImage.onload = resolve;
    wootmanImage.onerror = reject;
    wootmanImage.src = wootmanImageData;
  });

  // 읏맨 이미지 크기 계산 (칠판 중앙 하단에 크게 배치)
  const frameWidth = 60;
  const wootmanSize = 350; // 읏맨 이미지 크기 (더 크게)
  const wootmanX = (width - wootmanSize) / 2; // 중앙 정렬
  const wootmanY = height - frameWidth - wootmanSize - 50; // 하단에서 약간 위로

  // 읏맨 이미지 그리기 (투명도 처리)
  ctx.save();
  ctx.globalAlpha = 0.95; // 약간의 투명도 적용
  ctx.drawImage(wootmanImage, wootmanX, wootmanY, wootmanSize, wootmanSize);
  ctx.restore();

  return canvas.toDataURL('image/png');
}

/**
 * 여러 슬라이드를 읏맨 이미지와 함께 생성
 */
export async function generateSlidesWithWootman(
  slides: SlideData[],
  wootmanResults: { slideIndex: number; imageData: string | null }[],
  options: SlideGenerationOptions = {}
): Promise<string[]> {
  const slideImages: string[] = [];

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const wootmanResult = wootmanResults.find(w => w.slideIndex === i);
    const wootmanImageData = wootmanResult?.imageData || undefined;

    try {
      const slideImage = await generateBlackboardSlideWithWootman(
        slide,
        i + 1,
        slides.length,
        wootmanImageData,
        options
      );
      slideImages.push(slideImage);
    } catch (error) {
      console.error(`슬라이드 ${i + 1} 생성 오류:`, error);
      // 에러 발생시 기본 슬라이드 생성
      const fallbackSlide = await generateBlackboardSlide(slide, i + 1, slides.length, options);
      slideImages.push(fallbackSlide);
    }
  }

  return slideImages;
} 