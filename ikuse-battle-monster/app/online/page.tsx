"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createRoom, joinRoom, watchRoom, startGame, generateUserId, RoomData } from "@/lib/online/room";
import Link from "next/link";

export default function OnlineLobby() {
  const router = useRouter();
  const [inputCode, setInputCode] = useState("");
  const [userId] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("onlineUserId");
      if (stored) return stored;
      const newId = generateUserId();
      sessionStorage.setItem("onlineUserId", newId);
      return newId;
    }
    return generateUserId();
  });
  
  const [status, setStatus] = useState<"idle" | "creating" | "waiting" | "joining" | "ready" | "error">("idle");
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  
  // ルーム監視
  useEffect(() => {
    if (!roomCode) return;
    
    const unsub = watchRoom(roomCode, (room: RoomData | null) => {
      if (!room) {
        setStatus("error");
        setError("ルームが削除されました");
        return;
      }
      
      // ゲスト参加を検知
      if (isHost && room.guestId) {
        setStatus("ready");
      }
      
      // ゲーム開始を検知
      if (room.status === "playing") {
        router.push(`/online/battle?room=${roomCode}`);
      }
    });
    
    return () => unsub();
  }, [roomCode, isHost, router]);
  
  const handleCreate = async () => {
    try {
      setStatus("creating");
      setError(null);
      const code = await createRoom(userId);
      setRoomCode(code);
      setIsHost(true);
      setStatus("waiting");
    } catch (err) {
      setStatus("error");
      setError(`ルーム作成失敗: ${err}`);
    }
  };
  
  const handleJoin = async () => {
    if (inputCode.length !== 6) return;
    
    try {
      setStatus("joining");
      setError(null);
      const result = await joinRoom(inputCode.toUpperCase(), userId);
      
      if (!result.success) {
        setStatus("error");
        setError(result.error || "参加に失敗しました");
        return;
      }
      
      setRoomCode(inputCode.toUpperCase());
      setIsHost(false);
      router.push(`/online/battle?room=${inputCode.toUpperCase()}`);
    } catch (err) {
      setStatus("error");
      setError(`参加失敗: ${err}`);
    }
  };
  
  const handleStart = async () => {
    if (!roomCode) return;
    
    try {
      const success = await startGame(roomCode);
      if (success) {
        router.push(`/online/battle?room=${roomCode}`);
      }
    } catch (err) {
      setError(`開始失敗: ${err}`);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-md mx-auto">
        <Link 
          href="/"
          className="text-blue-400 hover:text-blue-300 mb-4 inline-block"
        >
          ← ホームに戻る
        </Link>
        
        <h1 className="text-3xl font-bold mb-8 text-center">
          🌐 オンライン対戦
        </h1>
        
        {/* エラー表示 */}
        {error && (
          <div className="bg-red-900 border border-red-500 p-4 rounded mb-4">
            ❌ {error}
          </div>
        )}
        
        {/* 初期状態 */}
        {status === "idle" && (
          <div className="space-y-6">
            {/* ルーム作成 */}
            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-xl font-bold mb-4">ルームを作成</h2>
              <p className="text-gray-400 mb-4">
                ルームを作成して、友達にコードを共有しよう
              </p>
              <button
                onClick={handleCreate}
                className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-lg font-bold"
              >
                ルームを作成する
              </button>
            </div>
            
            {/* ルーム参加 */}
            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-xl font-bold mb-4">ルームに参加</h2>
              <p className="text-gray-400 mb-4">
                6桁のルームコードを入力してください
              </p>
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                maxLength={6}
                className="w-full bg-gray-700 p-3 rounded text-center text-2xl tracking-widest mb-4"
              />
              <button
                onClick={handleJoin}
                disabled={inputCode.length !== 6}
                className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-600 py-3 rounded-lg font-bold"
              >
                参加する
              </button>
            </div>
          </div>
        )}
        
        {/* 作成中 */}
        {status === "creating" && (
          <div className="text-center py-8">
            <div className="animate-spin text-4xl mb-4">⏳</div>
            <p>ルームを作成中...</p>
          </div>
        )}
        
        {/* 待機中（ホスト） */}
        {status === "waiting" && (
          <div className="bg-gray-800 p-6 rounded-lg text-center">
            <h2 className="text-xl font-bold mb-4">対戦相手を待っています</h2>
            
            <div className="bg-gray-900 p-4 rounded-lg mb-4">
              <p className="text-gray-400 text-sm mb-2">ルームコード</p>
              <p className="text-4xl font-mono font-bold tracking-widest text-yellow-400">
                {roomCode}
              </p>
            </div>
            
            <p className="text-gray-400 text-sm">
              このコードを対戦相手に伝えてください
            </p>
            
            <div className="mt-6 animate-pulse">
              <span className="text-2xl">👀</span>
              <p className="text-gray-500 mt-2">待機中...</p>
            </div>
          </div>
        )}
        
        {/* Ready（ホスト） - 相手が参加 */}
        {status === "ready" && isHost && (
          <div className="bg-gray-800 p-6 rounded-lg text-center">
            <h2 className="text-xl font-bold mb-4 text-green-400">
              ✅ 対戦相手が見つかりました！
            </h2>
            
            <div className="bg-gray-900 p-4 rounded-lg mb-4">
              <p className="text-gray-400 text-sm mb-2">ルームコード</p>
              <p className="text-2xl font-mono font-bold tracking-widest">
                {roomCode}
              </p>
            </div>
            
            <button
              onClick={handleStart}
              className="w-full bg-yellow-500 hover:bg-yellow-400 text-black py-3 rounded-lg font-bold text-xl"
            >
              ⚔️ バトル開始！
            </button>
          </div>
        )}
        
        {/* 参加中 */}
        {status === "joining" && (
          <div className="text-center py-8">
            <div className="animate-spin text-4xl mb-4">⏳</div>
            <p>参加中...</p>
          </div>
        )}
      </div>
    </div>
  );
}
