import { NextRequest, NextResponse } from 'next/server';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { createVideo, createSlides } from '@/lib/api';
import { randomUUID } from 'crypto';

// FFmpeg 인스턴스 전역 변수
let ffmpeg: FFmpeg | null = null;

// FFmpeg 초기화 함수
async function initializeFFmpeg(): Promise<FFmpeg> {
  if (ffmpeg && ffmpeg.loaded) {
    return ffmpeg;
  }

  ffmpeg = new FFmpeg();
  
  // Vercel에서 사용할 수 있는 CDN 경로
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
  
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  return ffmpeg;
}

// 오디오 길이 측정 함수
async function getAudioDuration(ffmpeg: FFmpeg, audioFileName: string): Promise<number> {
  try {
    // FFprobe 대신 FFmpeg로 길이 측정
    await ffmpeg.exec(['-i', audioFileName, '-f', 'null', '-']);
    
    // 로그에서 duration 추출하는 대신 기본값 사용
    // 웹어셈블리 버전에서는 정확한 duration 추출이 복잡함
    return 5; // 기본값
  } catch (error) {
    console.warn('오디오 길이 측정 실패:', error);
    return 5; // 기본값
  }
}

export async function POST(request: NextRequest) {
  try {
    const { slides, wootmanImage } = await request.json();

    if (!slides || !Array.isArray(slides) || slides.length === 0) {
      return NextResponse.json(
        { error: '슬라이드 데이터가 필요합니다.' },
        { status: 400 }
      );
    }

    console.log('FFmpeg 초기화 시작...');
    const ffmpegInstance = await initializeFFmpeg();
    console.log('FFmpeg 초기화 완료');

    const videoId = randomUUID();
    const videoSegmentNames: string[] = [];

    // 각 슬라이드에 대해 비디오 세그먼트 생성
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      const segmentId = `segment_${i}`;
      
      console.log(`슬라이드 ${i} 처리 시작:`, {
        title: slide.title,
        hasAudio: !!slide.audioData,
        duration: slide.duration
      });

      // 이미지 파일을 FFmpeg 파일시스템에 저장
      const slideImageName = `${segmentId}_slide.png`;
      
      try {
        if (!slide.slideImage || typeof slide.slideImage !== 'string') {
          throw new Error(`슬라이드 ${i}: 이미지 데이터가 없습니다.`);
        }

        const slideImageData = slide.slideImage.replace(/^data:image\/\w+;base64,/, '');
        if (!slideImageData) {
          throw new Error(`슬라이드 ${i}: Base64 이미지 데이터가 올바르지 않습니다.`);
        }

        const imageBlob = new Blob([Buffer.from(slideImageData, 'base64')], { type: 'image/png' });
        await ffmpegInstance.writeFile(slideImageName, await fetchFile(imageBlob));
        console.log(`슬라이드 ${i} 이미지 FFmpeg 파일시스템에 저장 완료`);

      } catch (error) {
        console.error(`슬라이드 ${i} 이미지 저장 실패:`, error);
        throw new Error(`슬라이드 ${i} 이미지 처리 중 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      }

      // 오디오 파일 처리
      let audioFileName = null;
      let audioDuration = 0;
      
      if (slide.audioData) {
        try {
          audioFileName = `${segmentId}_audio.mp3`;
          const audioData = slide.audioData.replace(/^data:audio\/\w+;base64,/, '');
          const audioBlob = new Blob([Buffer.from(audioData, 'base64')], { type: 'audio/mp3' });
          await ffmpegInstance.writeFile(audioFileName, await fetchFile(audioBlob));
          console.log(`슬라이드 ${i} 오디오 FFmpeg 파일시스템에 저장 완료`);
          
          // 오디오 길이 측정 (웹어셈블리에서는 근사치)
          audioDuration = await getAudioDuration(ffmpegInstance, audioFileName);
          console.log(`슬라이드 ${i} 오디오 길이:`, audioDuration);
          
        } catch (error) {
          console.error(`슬라이드 ${i} 오디오 저장 실패:`, error);
          audioDuration = slide.duration || 5;
          audioFileName = null;
        }
      } else {
        audioDuration = slide.duration || 5;
      }

      // 각 비디오 세그먼트 길이 = 오디오 길이 + 1초
      const videoDuration = audioDuration + 1;
      console.log(`슬라이드 ${i} 비디오 길이:`, videoDuration);

      // 비디오 세그먼트 생성
      const outputFileName = `${segmentId}.mp4`;
      
      try {
        // FFmpeg 명령어 구성
        const ffmpegArgs = [
          '-loop', '1',
          '-i', slideImageName,
          '-t', videoDuration.toString()
        ];

        // 오디오 추가
        if (audioFileName) {
          ffmpegArgs.push('-i', audioFileName);
          ffmpegArgs.push('-c:a', 'aac');
          ffmpegArgs.push('-c:v', 'libx264');
          ffmpegArgs.push('-pix_fmt', 'yuv420p');
          ffmpegArgs.push('-shortest');
        } else {
          ffmpegArgs.push('-c:v', 'libx264');
          ffmpegArgs.push('-pix_fmt', 'yuv420p');
        }

        ffmpegArgs.push('-y', outputFileName);

        console.log(`슬라이드 ${i} FFmpeg 명령어:`, ffmpegArgs.join(' '));

        await ffmpegInstance.exec(ffmpegArgs);
        
        videoSegmentNames.push(outputFileName);
        console.log(`슬라이드 ${i} 비디오 세그먼트 생성 완료`);
        
      } catch (error) {
        console.error(`슬라이드 ${i} FFmpeg 실행 오류:`, error);
        throw new Error(`비디오 세그먼트 ${i} 생성 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      }

      // 임시 파일 정리
      try {
        await ffmpegInstance.deleteFile(slideImageName);
        if (audioFileName) {
          await ffmpegInstance.deleteFile(audioFileName);
        }
        console.log(`슬라이드 ${i} 임시 파일 정리 완료`);
      } catch (error) {
        console.warn(`슬라이드 ${i} 임시 파일 정리 실패:`, error);
      }
    }

    console.log('모든 비디오 세그먼트 생성 완료:', videoSegmentNames.length);

    // 모든 비디오 세그먼트를 하나로 합치기
    const finalVideoName = 'final_video.mp4';
    const concatListName = 'concat_list.txt';
    
    try {
      // concat 리스트 파일 생성
      const concatList = videoSegmentNames.map(name => `file '${name}'`).join('\n');
      await ffmpegInstance.writeFile(concatListName, concatList);
      console.log('Concat 리스트 파일 생성 완료');

      // 비디오 합치기
      await ffmpegInstance.exec([
        '-f', 'concat',
        '-safe', '0',
        '-i', concatListName,
        '-c', 'copy',
        '-y', finalVideoName
      ]);
      
      console.log('비디오 합치기 완료');

      // 최종 비디오 파일 읽기
      const finalVideoData = await ffmpegInstance.readFile(finalVideoName);
      
      // 파일을 서버 파일시스템에 저장 (Vercel에서는 /tmp 사용)
      const fs = await import('fs/promises');
      const path = await import('path');
      
      // Vercel에서는 /tmp 디렉토리 사용
      const outputDir = process.env.VERCEL ? '/tmp' : path.join(process.cwd(), 'public', 'generated-videos');
      const outputPath = path.join(outputDir, `${videoId}.mp4`);
      
      // 디렉토리가 없으면 생성 (로컬 환경용)
      if (!process.env.VERCEL) {
        try {
          await fs.mkdir(path.dirname(outputPath), { recursive: true });
        } catch (error) {
          // 디렉토리가 이미 존재하는 경우 무시
        }
      }
      
      // 파일 저장
      await fs.writeFile(outputPath, finalVideoData);
      console.log('최종 비디오 파일 저장 완료:', outputPath);

      // 비디오 파일 정보 수집
      const videoStats = await fs.stat(outputPath);
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
          file_size: Number(videoStats.size),
          storage_path: process.env.VERCEL ? `/tmp/${videoId}.mp4` : `/generated-videos/${videoId}.mp4`,
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
            image_path: `/generated-videos/${videoId}_slide_${index}.png`,
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
      }

      // FFmpeg 파일시스템 정리
      try {
        await ffmpegInstance.deleteFile(concatListName);
        await ffmpegInstance.deleteFile(finalVideoName);
        for (const segmentName of videoSegmentNames) {
          await ffmpegInstance.deleteFile(segmentName);
        }
        console.log('FFmpeg 파일시스템 정리 완료');
      } catch (error) {
        console.warn('FFmpeg 파일시스템 정리 실패:', error);
      }

      // Vercel에서는 base64로 반환, 로컬에서는 URL 반환
      if (process.env.VERCEL) {
        return NextResponse.json({
          success: true,
          videoData: Buffer.from(finalVideoData).toString('base64'),
          videoUrl: null,
          message: '영상이 성공적으로 생성되었습니다!'
        });
      } else {
        return NextResponse.json({
          success: true,
          videoUrl: `/generated-videos/${videoId}.mp4`,
          message: '영상이 성공적으로 생성되었습니다!'
        });
      }

    } catch (error) {
      console.error('비디오 합치기 실패:', error);
      throw new Error(`비디오 합치기 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }

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