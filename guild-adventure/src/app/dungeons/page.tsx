'use client';

import { PageHeader } from '@/components/PageHeader';
import { PageLayout } from '@/components/PageLayout';
import { DungeonList } from '@/components/DungeonList';

export default function DungeonsPage() {
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
