import { NextRequest, NextResponse } from 'next/server';
import { createVideo, createSlides } from '@/lib/api';
import { randomUUID } from 'crypto';

// 환경 감지 함수
function isVercel(): boolean {
  return process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
}

// 로컬 환경용 FFmpeg (기존 코드 유지)
async function generateVideoLocally(slides: any[], wootmanImage: string | null) {
  const { spawn } = await import('child_process');
  const fs = await import('fs/promises');
  const path = await import('path');
  
  const videoId = randomUUID();
  const tempDir = path.join(process.cwd(), 'temp', 'video-generation');
  const outputDir = path.join(process.cwd(), 'public', 'generated-videos');

  try {
    // 디렉토리 생성
    await fs.mkdir(tempDir, { recursive: true });
    await fs.mkdir(outputDir, { recursive: true });

    const videoSegments: string[] = [];

    // 각 슬라이드 처리
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      const segmentId = `${videoId}_segment_${i}`;
      
      // 이미지 저장
      const slideImagePath = path.join(tempDir, `${segmentId}_slide.png`);
      const slideImageData = slide.slideImage.replace(/^data:image\/\w+;base64,/, '');
      await fs.writeFile(slideImagePath, Buffer.from(slideImageData, 'base64'));

      // 오디오 저장 (있는 경우)
      let audioPath: string | null = null;
      let audioDuration = slide.duration || 5;
      
      if (slide.audioData) {
        audioPath = path.join(tempDir, `${segmentId}_audio.mp3`);
        const audioData = slide.audioData.replace(/^data:audio\/\w+;base64,/, '');
        await fs.writeFile(audioPath, Buffer.from(audioData, 'base64'));
        
        // 오디오 길이 측정
        try {
          const ffprobePath = process.env.FFPROBE_PATH || 'ffprobe';
          const { execSync } = await import('child_process');
          const output = execSync(`"${ffprobePath}" -v quiet -show_entries format=duration -of csv=p=0 "${audioPath}"`, { encoding: 'utf8' });
          audioDuration = parseFloat(output.trim());
        } catch (error) {
          console.warn(`슬라이드 ${i} 오디오 길이 측정 실패:`, error);
        }
      }

      // 비디오 세그먼트 생성
      const segmentPath = path.join(tempDir, `${segmentId}.mp4`);
      const videoDuration = audioDuration + 1;

      const ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';
      let ffmpegArgs = [
        '-loop', '1',
        '-i', slideImagePath,
        '-t', videoDuration.toString()
      ];

      if (audioPath) {
        ffmpegArgs.push('-i', audioPath);
        ffmpegArgs.push('-c:a', 'aac');
        ffmpegArgs.push('-c:v', 'libx264');
        ffmpegArgs.push('-pix_fmt', 'yuv420p');
        ffmpegArgs.push('-shortest');
      } else {
        ffmpegArgs.push('-c:v', 'libx264');
        ffmpegArgs.push('-pix_fmt', 'yuv420p');
      }

      ffmpegArgs.push('-y', segmentPath);

      await new Promise((resolve, reject) => {
        const ffmpeg = spawn(ffmpegPath, ffmpegArgs);
        ffmpeg.on('close', (code) => {
          if (code === 0) resolve(void 0);
          else reject(new Error(`FFmpeg exited with code ${code}`));
        });
        ffmpeg.on('error', reject);
      });

      videoSegments.push(segmentPath);

      // 임시 파일 정리
      await fs.unlink(slideImagePath);
      if (audioPath) await fs.unlink(audioPath);
    }

    // 비디오 합치기
    const concatListPath = path.join(tempDir, `${videoId}_concat.txt`);
    const concatContent = videoSegments.map(p => `file '${p}'`).join('\n');
    await fs.writeFile(concatListPath, concatContent);

    const finalVideoPath = path.join(outputDir, `${videoId}.mp4`);
    
    await new Promise((resolve, reject) => {
      const ffmpeg = spawn(process.env.FFMPEG_PATH || 'ffmpeg', [
        '-f', 'concat',
        '-safe', '0',
        '-i', concatListPath,
        '-c', 'copy',
        '-y', finalVideoPath
      ]);
      ffmpeg.on('close', (code) => {
        if (code === 0) resolve(void 0);
        else reject(new Error(`FFmpeg concat failed with code ${code}`));
      });
      ffmpeg.on('error', reject);
    });

    // 임시 파일 정리
    await Promise.all([
      fs.unlink(concatListPath),
      ...videoSegments.map(p => fs.unlink(p))
    ]);

    return {
      success: true,
      videoData: null,
      videoUrl: `/generated-videos/${videoId}.mp4`,
      message: '영상이 성공적으로 생성되었습니다!'
    };

  } catch (error) {
    throw error;
  }
}

// Vercel 환경용 (비디오 생성 불가, 데이터만 반환)
async function generateVideoForVercel(slides: any[], wootmanImage: string | null) {
  // Vercel에서는 실제 비디오 생성 대신 데이터만 준비
  const videoId = randomUUID();
  
  // 슬라이드 데이터 준비
  const slideData = slides.map((slide, index) => ({
    index,
    title: slide.title,
    content: slide.content || slide.title,
    slideImage: slide.slideImage,
    audioData: slide.audioData,
    duration: slide.duration || 5
  }));

  // 임시로 간단한 비디오 데이터 생성 (실제로는 클라이언트에서 처리)
  const mockVideoData = Buffer.from(JSON.stringify({
    videoId,
    slides: slideData,
    message: 'Vercel 환경에서는 클라이언트에서 비디오 생성이 필요합니다.'
  })).toString('base64');

  return {
    success: true,
    videoData: mockVideoData,
    videoUrl: null,
    message: 'Vercel 환경: 슬라이드 데이터가 준비되었습니다.'
  };
}

export async function POST(request: NextRequest) {
  try {
    const { slides, wootmanImage } = await request.json();

    if (!slides || !Array.isArray(slides) || slides.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          videoData: null,
          videoUrl: null,
          message: '영상 생성에 실패했습니다.',
          error: '슬라이드 데이터가 필요합니다.' 
        },
        { status: 400 }
      );
    }

    console.log('영상 생성 시작:', { 
      환경: isVercel() ? 'Vercel' : 'Local',
      슬라이드수: slides.length 
    });

    let result;
    
    if (isVercel()) {
      // Vercel 환경에서는 데이터만 반환
      result = await generateVideoForVercel(slides, wootmanImage);
    } else {
      // 로컬 환경에서는 실제 비디오 생성
      result = await generateVideoLocally(slides, wootmanImage);
    }

    // 데이터베이스에 비디오 정보 저장 (성공한 경우에만)
    if (result.success) {
      try {
        const videoTitle = slides.length > 0 ? slides[0].title : '생성된 영상';
        const totalDuration = slides.reduce((sum: number, slide: any) => {
          return sum + (slide.duration || 5) + 1;
        }, 0);

        const { data: video } = await createVideo({
          title: videoTitle,
          description: `${slides.length}개의 슬라이드로 구성된 영상`,
          duration_sec: totalDuration,
          file_size: 0, // Vercel에서는 실제 파일 크기를 알 수 없음
          storage_path: result.videoUrl || '/tmp/placeholder',
          status: 'completed',
          tags: slides.map((slide: any) => slide.title).filter((title: string) => title)
        });

        if (video) {
          const slidesData = slides.map((slide: any, index: number) => ({
            order_idx: index,
            title: slide.title || `슬라이드 ${index + 1}`,
            content: slide.content || slide.title || '',
            image_path: `/temp/slide_${index}.png`,
            duration_sec: (slide.duration || 5) + 1
          }));

          await createSlides(video.id, slidesData);
        }
      } catch (dbError) {
        console.error('데이터베이스 저장 중 오류:', dbError);
      }
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('영상 생성 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        videoData: null,
        videoUrl: null,
        message: '영상 생성에 실패했습니다.',
        error: error instanceof Error ? error.message : '영상 생성 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
} 