'use client';

import { FriendFullStatus } from '@/lib/firebase';
import { getStatusDisplay } from '@/lib/utils/status';

interface Player {
  username: string;
  ready: boolean;
  characters: any[];
}

interface InviteModalProps {
  code: string;
  players: Record<string, Player>;
  friends: string[];
  friendStatuses: Record<string, FriendFullStatus>;
  inviteSent: string[];
  onInvite: (friendName: string) => void;
  onClose: () => void;
}

export default function InviteModal({
  code,
  players,
  friends,
  friendStatuses,
  inviteSent,
  onInvite,
  onClose,
}: InviteModalProps) {
  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" 
      onClick={onClose}
    >
      <div 
        className="bg-slate-800 rounded-lg p-6 max-w-sm w-full border border-slate-600" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">👥 フレンドを招待</h2>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>
        
        <div className="bg-slate-700 rounded-lg p-3 mb-4 text-center">
          <p className="text-sm text-slate-400">ルームコード</p>
          <p className="text-2xl font-bold tracking-widest">{code}</p>
        </div>
        
        {friends.length === 0 ? (
          <div className="text-center py-6 text-slate-400">
            フレンドがいません
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {friends.map((friend) => {
              const status = getStatusDisplay(friendStatuses[friend]);
              const isInRoom = players[friend];
              
              return (
                <div 
                  key={friend} 
                  className="flex items-center justify-between bg-slate-700 rounded-lg p-3"
                >
                  <div>
                    <span className="font-semibold">{friend}</span>
                    <div className={`text-xs ${status.color}`}>
                      {status.emoji} {status.text}
                    </div>
                  </div>
                  {isInRoom ? (
                    <span className="text-green-400 text-sm">参加中</span>
                  ) : inviteSent.includes(friend) ? (
                    <span className="text-green-400 text-sm">✓ 送信済み</span>
                  ) : (
                    <button
                      onClick={() => onInvite(friend)}
                      className="bg-purple-600 hover:bg-purple-500 px-3 py-1 rounded text-sm"
                    >
                      招待
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
