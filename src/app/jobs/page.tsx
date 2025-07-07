'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Grid, List, SortAsc, SortDesc } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { VideoCard } from '@/components/videos/VideoCard';
import { getVideos } from '@/lib/api';
import { Video } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

type SortOption = 'created_desc' | 'created_asc' | 'title_asc' | 'title_desc' | 'duration_asc' | 'duration_desc';
type StatusFilter = 'all' | 'completed' | 'processing' | 'failed';

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('created_desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { toast } = useToast();

  // 비디오 목록 로드
  useEffect(() => {
    async function loadVideos() {
      try {
        setIsLoading(true);
        const { data, error } = await getVideos();
        
        if (error) {
          toast({
            title: '로딩 실패',
            description: '영상 목록을 불러오는 중 오류가 발생했습니다.',
            variant: 'destructive',
          });
        } else {
          setVideos(data || []);
        }
      } catch (error) {
        console.error('Failed to load videos:', error);
        toast({
          title: '로딩 실패',
          description: '영상 목록을 불러오는 중 오류가 발생했습니다.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadVideos();
  }, [toast]);

  // 필터링 및 정렬
  useEffect(() => {
    let filtered = [...videos];

    // 검색 필터
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(video => 
        video.title.toLowerCase().includes(query) ||
        video.description?.toLowerCase().includes(query) ||
        video.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // 상태 필터
    if (statusFilter !== 'all') {
      filtered = filtered.filter(video => video.status === statusFilter);
    }

    // 정렬
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'created_desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'created_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'title_asc':
          return a.title.localeCompare(b.title);
        case 'title_desc':
          return b.title.localeCompare(a.title);
        case 'duration_asc':
          return a.duration_sec - b.duration_sec;
        case 'duration_desc':
          return b.duration_sec - a.duration_sec;
        default:
          return 0;
      }
    });

    setFilteredVideos(filtered);
  }, [videos, searchQuery, statusFilter, sortBy]);

  // 비디오 삭제 핸들러
  const handleVideoDelete = (videoId: string) => {
    setVideos(prev => prev.filter(v => v.id !== videoId));
  };

  // 통계 계산
  const stats = {
    total: videos.length,
    completed: videos.filter(v => v.status === 'completed').length,
    processing: videos.filter(v => v.status === 'processing').length,
    failed: videos.filter(v => v.status === 'failed').length,
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 font-pretendard">내 영상</h1>
            <p className="text-neutral-600 font-pretendard">
              생성된 영상들을 관리하고 다운로드할 수 있습니다
            </p>
          </div>
          
          {/* 뷰 모드 토글 */}
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 통계 */}
        <div className="flex flex-wrap gap-4">
          <Badge variant="outline" className="px-3 py-1">
            <span className="font-pretendard">전체 {stats.total}개</span>
          </Badge>
          <Badge variant="outline" className="px-3 py-1 bg-green-50 text-green-700 border-green-200">
            <span className="font-pretendard">완료 {stats.completed}개</span>
          </Badge>
          {stats.processing > 0 && (
            <Badge variant="outline" className="px-3 py-1 bg-yellow-50 text-yellow-700 border-yellow-200">
              <span className="font-pretendard">처리중 {stats.processing}개</span>
            </Badge>
          )}
          {stats.failed > 0 && (
            <Badge variant="outline" className="px-3 py-1 bg-red-50 text-red-700 border-red-200">
              <span className="font-pretendard">실패 {stats.failed}개</span>
            </Badge>
          )}
        </div>
      </div>

      {/* 필터 및 검색 */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* 검색 */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
          <Input
            placeholder="영상 제목, 설명, 태그로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 font-pretendard"
          />
        </div>

        {/* 필터 */}
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
            <SelectTrigger className="w-32">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="completed">완료</SelectItem>
              <SelectItem value="processing">처리중</SelectItem>
              <SelectItem value="failed">실패</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
            <SelectTrigger className="w-48">
              {sortBy.includes('desc') ? <SortDesc className="h-4 w-4 mr-2" /> : <SortAsc className="h-4 w-4 mr-2" />}
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_desc">최신순</SelectItem>
              <SelectItem value="created_asc">오래된순</SelectItem>
              <SelectItem value="title_asc">제목 오름차순</SelectItem>
              <SelectItem value="title_desc">제목 내림차순</SelectItem>
              <SelectItem value="duration_asc">짧은 영상부터</SelectItem>
              <SelectItem value="duration_desc">긴 영상부터</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 영상 목록 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent"></div>
            <span className="text-neutral-600 font-pretendard">영상 목록을 불러오는 중...</span>
          </div>
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="text-center py-12">
          {searchQuery || statusFilter !== 'all' ? (
            <div className="space-y-2">
              <p className="text-lg text-neutral-600 font-pretendard">검색 결과가 없습니다</p>
              <p className="text-sm text-neutral-500 font-pretendard">
                다른 검색어나 필터를 시도해보세요
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-lg text-neutral-600 font-pretendard">아직 생성된 영상이 없습니다</p>
              <Button asChild>
                <a href="/" className="font-pretendard">첫 번째 영상 만들기</a>
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
        }>
          {filteredVideos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onDelete={handleVideoDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
} 