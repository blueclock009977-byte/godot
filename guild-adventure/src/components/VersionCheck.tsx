'use client';

import { useEffect, useState } from 'react';
import { getMinVersion } from '@/lib/firebase';
import { APP_VERSION, compareVersions } from '@/lib/version';

export function VersionCheck() {
  const [needsUpdate, setNeedsUpdate] = useState(false);

  useEffect(() => {
    const checkVersion = async () => {
      const minVersion = await getMinVersion();
      if (minVersion && compareVersions(APP_VERSION, minVersion) < 0) {
        setNeedsUpdate(true);
      }
    };
    checkVersion();
  }, []);

  if (!needsUpdate) return null;

  const handleReload = () => {
    // キャッシュを無効化してリロード
    window.location.reload();
  };

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-600 text-white p-3 z-50 text-center">
      <span>🔄 新しいバージョンがあります！</span>
      <button
        onClick={handleReload}
        className="ml-4 bg-white text-red-600 px-3 py-1 rounded font-semibold text-sm"
      >
        今すぐ更新
      </button>
    </div>
  );
}
