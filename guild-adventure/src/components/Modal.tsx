'use client';

import { ReactNode } from 'react';

interface ModalProps {
  /** モーダルのタイトル（オプション） */
  title?: string;
  /** モーダルを閉じるコールバック */
  onClose: () => void;
  /** モーダルの最大幅クラス（デフォルト: max-w-md） */
  maxWidth?: string;
  /** モーダルの内容 */
  children: ReactNode;
}

/**
 * 共通モーダルコンポーネント
 * オーバーレイ + コンテナ + 閉じるボタンを共通化
 */
export function Modal({ 
  title, 
  onClose, 
  maxWidth = 'max-w-md',
  children 
}: ModalProps) {
  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" 
      onClick={onClose}
    >
      <div 
        className={`bg-slate-900 rounded-lg border border-slate-600 ${maxWidth} w-full max-h-[80vh] overflow-y-auto`}
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-4 flex justify-between items-center">
            <h2 className="text-xl font-bold">{title}</h2>
            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-white text-2xl leading-none"
            >
              ×
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
