'use client';

import { FriendFullStatus, RoomCharacter } from '@/lib/firebase';
import { getStatusDisplays } from '@/lib/utils/status';
import { Modal } from '../Modal';

interface Player {
  username: string;
  ready: boolean;
  characters: RoomCharacter[];
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
    <Modal title="👥 フレンドを招待" onClose={onClose} maxWidth="max-w-sm">
      <div className="p-4 space-y-4">
        <div className="bg-slate-700 rounded-lg p-3 text-center">
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
              const statuses = getStatusDisplays(friendStatuses[friend]);
              const isInRoom = players[friend];
              
              return (
                <div 
                  key={friend} 
                  className="flex items-center justify-between bg-slate-700 rounded-lg p-3"
                >
                  <div>
                    <span className="font-semibold">{friend}</span>
                    {statuses.map((status, idx) => (
                      <div key={idx}>
                        <div className={`text-xs ${status.color}`}>
                          {status.emoji} {status.text}
                        </div>
                        {status.detail && (
                          <div className="text-xs text-slate-400 ml-4">{status.detail}</div>
                        )}
                      </div>
                    ))}
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
    </Modal>
  );
}
