import { NextRequest, NextResponse } from 'next/server';
import { writeFileSync, unlinkSync, existsSync, mkdirSync, copyFileSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { execSync } from 'child_process';

const ffmpeg = require('ffmpeg-static');

export async function POST(request: NextRequest) {
  try {
    const { slides, wootmanImage } = await request.json();

    if (!slides || !Array.isArray(slides) || slides.length === 0) {
      return NextResponse.json(
        { error: '슬라이드 데이터가 필요합니다.' },
        { status: 400 }
      );
    }

    // 임시 파일 저장 디렉토리 생성
    const tempDir = join(process.cwd(), 'temp', 'video-generation');
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true });
    }

    const videoId = randomUUID();
    const videoSegments: string[] = [];

    // 각 슬라이드에 대해 비디오 세그먼트 생성
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      const segmentId = `${videoId}_segment_${i}`;
      
      // 이미지 파일 저장
      const slideImagePath = join(tempDir, `${segmentId}_slide.png`);
      const slideImageData = slide.slideImage.replace(/^data:image\/\w+;base64,/, '');
      writeFileSync(slideImagePath, Buffer.from(slideImageData, 'base64'));

      // 읏맨 이미지 파일 저장 (있는 경우)
      let wootmanImagePath = null;
      if (wootmanImage) {
        wootmanImagePath = join(tempDir, `${segmentId}_wootman.png`);
        const wootmanImageData = wootmanImage.replace(/^data:image\/\w+;base64,/, '');
        writeFileSync(wootmanImagePath, Buffer.from(wootmanImageData, 'base64'));
      }

      // 오디오 파일 저장
      let audioPath = null;
      let audioDuration = 0;
      if (slide.audioData) {
        audioPath = join(tempDir, `${segmentId}_audio.mp3`);
        const audioData = slide.audioData.replace(/^data:audio\/\w+;base64,/, '');
        writeFileSync(audioPath, Buffer.from(audioData, 'base64'));
        
        // 오디오 길이 측정
        try {
          const ffprobePath = ffmpeg.replace('ffmpeg', 'ffprobe');
          const ffprobeOutput = execSync(`"${ffprobePath}" -v quiet -show_entries format=duration -of csv=p=0 "${audioPath}"`, { encoding: 'utf-8' });
          audioDuration = parseFloat(ffprobeOutput.trim());
        } catch (error) {
          console.warn('오디오 길이 측정 실패:', error);
          audioDuration = slide.duration || 5; // 기본값
        }
      } else {
        audioDuration = slide.duration || 5; // 기본값
      }

      // 각 비디오 세그먼트 길이 = 오디오 길이 + 1초
      const videoDuration = audioDuration + 1;

      // 비디오 세그먼트 생성
      const outputPath = join(tempDir, `${segmentId}.mp4`);
      
      let ffmpegCommand = `"${ffmpeg}" -loop 1 -i "${slideImagePath}" -t ${videoDuration}`;
      
      // 읏맨 이미지 오버레이 추가
      if (wootmanImagePath) {
        ffmpegCommand += ` -i "${wootmanImagePath}" -filter_complex "[0:v][1:v] overlay=W-w-50:H-h-50"`;
      }

      // 오디오 추가
      if (audioPath) {
        ffmpegCommand += ` -i "${audioPath}" -c:a aac -c:v libx264 -pix_fmt yuv420p -shortest`;
      } else {
        ffmpegCommand += ` -c:v libx264 -pix_fmt yuv420p`;
      }

      ffmpegCommand += ` -y "${outputPath}"`;

      try {
        execSync(ffmpegCommand, { stdio: 'inherit' });
        videoSegments.push(outputPath);
      } catch (error) {
        console.error(`비디오 세그먼트 ${i} 생성 실패:`, error);
        throw new Error(`비디오 세그먼트 ${i} 생성 중 오류가 발생했습니다.`);
      }

      // 임시 파일 정리
      try {
        unlinkSync(slideImagePath);
        if (wootmanImagePath) unlinkSync(wootmanImagePath);
        if (audioPath) unlinkSync(audioPath);
      } catch (error) {
        console.warn('임시 파일 정리 실패:', error);
      }
    }

    // 모든 비디오 세그먼트를 하나로 합치기
    const finalVideoPath = join(tempDir, `${videoId}_final.mp4`);
    const concatListPath = join(tempDir, `${videoId}_concat.txt`);
    
    // concat 리스트 파일 생성
    const concatList = videoSegments.map(path => `file '${path}'`).join('\n');
    writeFileSync(concatListPath, concatList);

    // 비디오 합치기
    const concatCommand = `"${ffmpeg}" -f concat -safe 0 -i "${concatListPath}" -c copy -y "${finalVideoPath}"`;
    
    try {
      execSync(concatCommand, { stdio: 'inherit' });
    } catch (error) {
      console.error('비디오 합치기 실패:', error);
      throw new Error('비디오 합치기 중 오류가 발생했습니다.');
    }

    // 최종 비디오 파일을 public 디렉토리로 이동
    const publicVideoPath = join(process.cwd(), 'public', 'generated-videos', `${videoId}.mp4`);
    const publicVideoDir = join(process.cwd(), 'public', 'generated-videos');
    
    if (!existsSync(publicVideoDir)) {
      mkdirSync(publicVideoDir, { recursive: true });
    }

    // 파일 복사 (크로스 플랫폼 지원)
    copyFileSync(finalVideoPath, publicVideoPath);

    // 임시 파일 정리
    try {
      videoSegments.forEach(path => {
        if (existsSync(path)) unlinkSync(path);
      });
      if (existsSync(concatListPath)) unlinkSync(concatListPath);
      if (existsSync(finalVideoPath)) unlinkSync(finalVideoPath);
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