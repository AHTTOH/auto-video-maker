import { NextRequest, NextResponse } from 'next/server';
import { writeFileSync, unlinkSync, existsSync, mkdirSync, copyFileSync, statSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { execSync } from 'child_process';
import { createVideo, createSlides } from '@/lib/api';

// 로컬 FFmpeg 경로 설정
const ffmpegPath = join(process.cwd(), 'ffmpeg-2025-07-07-git-d2828ab284-full_build', 'bin', 'ffmpeg.exe');
const ffprobePath = join(process.cwd(), 'ffmpeg-2025-07-07-git-d2828ab284-full_build', 'bin', 'ffprobe.exe');

export async function POST(request: NextRequest) {
  try {
    const { slides, wootmanImage } = await request.json();

    if (!slides || !Array.isArray(slides) || slides.length === 0) {
      return NextResponse.json(
        { error: '슬라이드 데이터가 필요합니다.' },
        { status: 400 }
      );
    }

    // FFmpeg 경로 확인
    console.log('FFmpeg 경로:', ffmpegPath);
    if (!existsSync(ffmpegPath)) {
      console.error('FFmpeg를 찾을 수 없습니다:', ffmpegPath);
      return NextResponse.json(
        { error: 'FFmpeg를 찾을 수 없습니다. FFmpeg 바이너리가 필요합니다.' },
        { status: 500 }
      );
    }

    console.log('FFprobe 경로:', ffprobePath);
    if (!existsSync(ffprobePath)) {
      console.error('FFprobe를 찾을 수 없습니다:', ffprobePath);
      return NextResponse.json(
        { error: 'FFprobe를 찾을 수 없습니다. FFprobe 바이너리가 필요합니다.' },
        { status: 500 }
      );
    }

    // 임시 파일 저장 디렉토리 생성
    const tempDir = join(process.cwd(), 'temp', 'video-generation');
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true });
    }
    console.log('임시 디렉토리:', tempDir);

    const videoId = randomUUID();
    const videoSegments: string[] = [];

    // 각 슬라이드에 대해 비디오 세그먼트 생성
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      const segmentId = `${videoId}_segment_${i}`;
      
      console.log(`슬라이드 ${i} 처리 시작:`, {
        title: slide.title,
        hasAudio: !!slide.audioData,
        duration: slide.duration
      });

      // 이미지 파일 저장
      const slideImagePath = join(tempDir, `${segmentId}_slide.png`);
      
      try {
        // Base64 데이터 검증
        if (!slide.slideImage || typeof slide.slideImage !== 'string') {
          throw new Error(`슬라이드 ${i}: 이미지 데이터가 없습니다.`);
        }

        const slideImageData = slide.slideImage.replace(/^data:image\/\w+;base64,/, '');
        if (!slideImageData) {
          throw new Error(`슬라이드 ${i}: Base64 이미지 데이터가 올바르지 않습니다.`);
        }

        writeFileSync(slideImagePath, Buffer.from(slideImageData, 'base64'));
        console.log(`슬라이드 ${i} 이미지 저장 완료:`, slideImagePath);

        // 이미지 파일이 실제로 생성되었는지 확인
        if (!existsSync(slideImagePath)) {
          throw new Error(`슬라이드 ${i}: 이미지 파일 생성에 실패했습니다.`);
        }
      } catch (error) {
        console.error(`슬라이드 ${i} 이미지 저장 실패:`, error);
        throw new Error(`슬라이드 ${i} 이미지 처리 중 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      }

      // 오디오 파일 저장
      let audioPath = null;
      let audioDuration = 0;
      if (slide.audioData) {
        try {
          audioPath = join(tempDir, `${segmentId}_audio.mp3`);
          const audioData = slide.audioData.replace(/^data:audio\/\w+;base64,/, '');
          writeFileSync(audioPath, Buffer.from(audioData, 'base64'));
          console.log(`슬라이드 ${i} 오디오 저장 완료:`, audioPath);
          
          // 오디오 길이 측정
          try {
            console.log('FFprobe 사용:', ffprobePath);
            const ffprobeOutput = execSync(`"${ffprobePath}" -v quiet -show_entries format=duration -of csv=p=0 "${audioPath}"`, { encoding: 'utf-8' });
            audioDuration = parseFloat(ffprobeOutput.trim());
            console.log(`슬라이드 ${i} 오디오 길이:`, audioDuration);
          } catch (error) {
            console.warn(`슬라이드 ${i} 오디오 길이 측정 실패:`, error);
            audioDuration = slide.duration || 5; // 기본값
          }
        } catch (error) {
          console.error(`슬라이드 ${i} 오디오 저장 실패:`, error);
          // 오디오 처리 실패 시 오디오 없이 계속 진행
          audioDuration = slide.duration || 5;
        }
      } else {
        audioDuration = slide.duration || 5; // 기본값
      }

      // 각 비디오 세그먼트 길이 = 오디오 길이 + 1초
      const videoDuration = audioDuration + 1;
      console.log(`슬라이드 ${i} 비디오 길이:`, videoDuration);

      // 비디오 세그먼트 생성
      const outputPath = join(tempDir, `${segmentId}.mp4`);
      
      // Windows 경로 처리를 위한 정규화
      const normalizedSlideImagePath = slideImagePath.replace(/\\/g, '/');
      const normalizedAudioPath = audioPath ? audioPath.replace(/\\/g, '/') : null;
      const normalizedOutputPath = outputPath.replace(/\\/g, '/');
      
      let ffmpegCommand = `"${ffmpegPath}" -loop 1 -i "${normalizedSlideImagePath}" -t ${videoDuration}`;
      
      // 오디오 추가
      if (normalizedAudioPath && existsSync(audioPath!)) {
        ffmpegCommand += ` -i "${normalizedAudioPath}" -c:a aac -c:v libx264 -pix_fmt yuv420p -shortest`;
      } else {
        ffmpegCommand += ` -c:v libx264 -pix_fmt yuv420p`;
      }

      ffmpegCommand += ` -y "${normalizedOutputPath}"`;

      console.log(`슬라이드 ${i} FFmpeg 명령어:`, ffmpegCommand);

      try {
        execSync(ffmpegCommand, { 
          stdio: ['pipe', 'pipe', 'pipe'],
          encoding: 'utf-8'
        });
        
        // 출력 파일이 실제로 생성되었는지 확인
        if (!existsSync(outputPath)) {
          throw new Error(`비디오 파일이 생성되지 않았습니다: ${outputPath}`);
        }
        
        videoSegments.push(outputPath);
        console.log(`슬라이드 ${i} 비디오 세그먼트 생성 완료:`, outputPath);
        
      } catch (error) {
        console.error(`슬라이드 ${i} FFmpeg 실행 오류:`, error);
        
        // 상세한 오류 정보 수집
        let errorDetails = '';
        if (error instanceof Error) {
          errorDetails = error.message;
          if ('stdout' in error) errorDetails += `\nSTDOUT: ${error.stdout}`;
          if ('stderr' in error) errorDetails += `\nSTDERR: ${error.stderr}`;
        }
        
        throw new Error(`비디오 세그먼트 ${i} 생성 중 오류가 발생했습니다.\n명령어: ${ffmpegCommand}\n오류 세부사항: ${errorDetails}`);
      }

      // 임시 파일 정리
      try {
        unlinkSync(slideImagePath);
        if (audioPath && existsSync(audioPath)) unlinkSync(audioPath);
        console.log(`슬라이드 ${i} 임시 파일 정리 완료`);
      } catch (error) {
        console.warn(`슬라이드 ${i} 임시 파일 정리 실패:`, error);
      }
    }

    console.log('모든 비디오 세그먼트 생성 완료:', videoSegments.length);

    // 모든 비디오 세그먼트를 하나로 합치기
    const finalVideoPath = join(tempDir, `${videoId}_final.mp4`);
    const concatListPath = join(tempDir, `${videoId}_concat.txt`);
    
    // concat 리스트 파일 생성 (Windows 경로 정규화)
    const concatList = videoSegments.map(path => `file '${path.replace(/\\/g, '/')}'`).join('\n');
    writeFileSync(concatListPath, concatList);
    console.log('Concat 리스트 파일 생성:', concatListPath);

    // 비디오 합치기
    const normalizedConcatListPath = concatListPath.replace(/\\/g, '/');
    const normalizedFinalVideoPath = finalVideoPath.replace(/\\/g, '/');
    const concatCommand = `"${ffmpegPath}" -f concat -safe 0 -i "${normalizedConcatListPath}" -c copy -y "${normalizedFinalVideoPath}"`;
    
    console.log('비디오 합치기 명령어:', concatCommand);
    
    try {
      execSync(concatCommand, { 
        stdio: ['pipe', 'pipe', 'pipe'],
        encoding: 'utf-8'
      });
      console.log('비디오 합치기 완료:', finalVideoPath);
    } catch (error) {
      console.error('비디오 합치기 실패:', error);
      
      let errorDetails = '';
      if (error instanceof Error) {
        errorDetails = error.message;
        if ('stdout' in error) errorDetails += `\nSTDOUT: ${error.stdout}`;
        if ('stderr' in error) errorDetails += `\nSTDERR: ${error.stderr}`;
      }
      
      throw new Error(`비디오 합치기 중 오류가 발생했습니다.\n명령어: ${concatCommand}\n오류 세부사항: ${errorDetails}`);
    }

    // 최종 비디오 파일을 public 디렉토리로 이동
    const publicVideoPath = join(process.cwd(), 'public', 'generated-videos', `${videoId}.mp4`);
    const publicVideoDir = join(process.cwd(), 'public', 'generated-videos');
    
    if (!existsSync(publicVideoDir)) {
      mkdirSync(publicVideoDir, { recursive: true });
    }

    // 파일 복사 (크로스 플랫폼 지원)
    copyFileSync(finalVideoPath, publicVideoPath);
    console.log('최종 비디오 파일 복사 완료:', publicVideoPath);

    // 비디오 파일 정보 수집
    const videoStats = statSync(publicVideoPath);
    const totalDuration = slides.reduce((sum: number, slide: any) => {
      return sum + (slide.audioDuration || slide.duration || 5) + 1;
    }, 0);

    // 데이터베이스에 비디오 정보 저장
    try {
      const videoTitle = slides.length > 0 ? slides[0].title : '생성된 영상';
      
      const { data: video, error: videoError } = await createVideo({
        title: videoTitle,
        description: `${slides.length}개의 슬라이드로 구성된 영상`,
        duration_sec: totalDuration,
        file_size: videoStats.size,
        storage_path: `/generated-videos/${videoId}.mp4`,
        status: 'completed',
        tags: slides.map((slide: any) => slide.title).filter((title: string) => title)
      });

      if (videoError) {
        console.error('비디오 정보 저장 실패:', videoError);
      } else if (video) {
        console.log('비디오 정보 저장 완료:', video.id);

        // 슬라이드 정보 저장
        const slidesData = slides.map((slide: any, index: number) => ({
          order_idx: index,
          title: slide.title || `슬라이드 ${index + 1}`,
          content: slide.content || slide.title || '',
          image_path: `/generated-videos/${videoId}_slide_${index}.png`, // 실제로는 이미지를 별도 저장해야 함
          duration_sec: (slide.audioDuration || slide.duration || 5) + 1
        }));

        const { error: slidesError } = await createSlides(video.id, slidesData);
        
        if (slidesError) {
          console.error('슬라이드 정보 저장 실패:', slidesError);
        } else {
          console.log('슬라이드 정보 저장 완료');
        }
      }
    } catch (dbError) {
      console.error('데이터베이스 저장 중 오류:', dbError);
      // 데이터베이스 저장 실패해도 비디오 생성은 성공으로 처리
    }

    // 임시 파일 정리
    try {
      videoSegments.forEach(path => {
        if (existsSync(path)) unlinkSync(path);
      });
      if (existsSync(concatListPath)) unlinkSync(concatListPath);
      if (existsSync(finalVideoPath)) unlinkSync(finalVideoPath);
      console.log('모든 임시 파일 정리 완료');
    } catch (error) {
      console.warn('임시 파일 정리 실패:', error);
    }

    return NextResponse.json({
      success: true,
      videoUrl: `/generated-videos/${videoId}.mp4`,
      message: '영상이 성공적으로 생성되었습니다!'
    });

  } catch (error) {
    console.error('영상 생성 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : '영상 생성 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
} 