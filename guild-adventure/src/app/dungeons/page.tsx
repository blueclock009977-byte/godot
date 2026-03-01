'use client';

import { useGameStore } from '@/store/gameStore';
import { PageHeader } from '@/components/PageHeader';
import { PageLayout } from '@/components/PageLayout';
import { LoadingScreen } from '@/components/LoadingScreen';
import { DungeonList } from '@/components/DungeonList';

export default function DungeonsPage() {
  const { isLoggedIn, isLoading } = useGameStore();
  
  // ローディング中またはログイン前
  if (!isLoggedIn || isLoading) {
    return <LoadingScreen />;
  }
  
  return (
    <PageLayout>
      <PageHeader title="🗺️ ダンジョン一覧" />
      
      <p className="text-sm text-slate-400 mb-4">
        各ダンジョンの「詳細」をタップして、出現モンスターの情報を確認できます。
      </p>
      
      <DungeonList />
    </PageLayout>
  );
}
