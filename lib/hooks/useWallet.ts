'use client';

import { useState } from 'react';
import { getUserId } from '@/lib/utils/userSession';
import { ITEM_PRICES } from '@/lib/supabase/distributionEngine';

export interface WalletState {
  balance: number;
  pendingBalance: number;
  totalEarned: number;
  isLoading: boolean;
  isFrozen: boolean;
}

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>({
    balance: 24500, // mock default
    pendingBalance: 0,
    totalEarned: 0,
    isLoading: false,
    isFrozen: false,
  });

  const sendGift = async (
    receiverId: string,
    directorId: string | null,
    roomId: string,
    itemType: string,
    itemAmount: number = 1
  ) => {
    const userId = getUserId();
    const idempotencyKey = `${userId}-${itemType}-${Date.now()}`;

    // Optimistic UI update
    const pricePerItem = ITEM_PRICES[itemType] ?? 1000;
    const itemPrice = pricePerItem * itemAmount;
    setWallet(prev => ({ ...prev, balance: prev.balance - itemPrice }));

    try {
      const res = await fetch('/api/payment/send-gift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: userId,
          receiverId,
          directorId,
          roomId,
          itemType,
          itemAmount,
          idempotencyKey,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        // Rollback optimistic update
        setWallet(prev => ({ ...prev, balance: prev.balance + itemPrice }));
        return { success: false, error: data.error };
      }

      if (data.senderNewBalance !== undefined) {
        setWallet(prev => ({ ...prev, balance: data.senderNewBalance }));
      }

      return { success: true, data };
    } catch {
      // Rollback on network error
      setWallet(prev => ({ ...prev, balance: prev.balance + itemPrice }));
      return { success: false, error: '네트워크 오류' };
    }
  };

  const chargeCredits = async (
    amountKRW: number,
    pgProvider: string = 'mock'
  ) => {
    const userId = getUserId();
    const idempotencyKey = `charge-${userId}-${Date.now()}`;

    try {
      const res = await fetch('/api/payment/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          amountKRW,
          pgProvider,
          idempotencyKey,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setWallet(prev => ({ ...prev, balance: data.newBalance }));
        return { success: true, creditsAdded: data.creditsAdded };
      }

      return { success: false, error: data.error };
    } catch {
      return { success: false, error: '충전 실패' };
    }
  };

  return { wallet, sendGift, chargeCredits };
}
