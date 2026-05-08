import { useState, useCallback, useRef } from 'react';
import { useCosmetics } from '../contexts/CosmeticsContext';
import type { CosmeticItem } from '../data/cosmetics';

const BACKEND = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3001';

type Category = 'cardBack' | 'felt' | 'frame';

interface UseShopResult {
  buying: boolean;
  error: string | null;
  buyTokenPack: (packId: string, tokens: number, onSuccess: (tokens: number) => void) => Promise<void>;
  buyCosmetic: (category: Category, item: CosmeticItem, tokens: number, onSpend: (cost: number) => void) => void;
}

export function useShop(): UseShopResult {
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { unlockItem } = useCosmetics();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const buyTokenPack = useCallback(async (
    packId: string,
    _tokens: number,
    onSuccess: (tokens: number) => void,
  ) => {
    setBuying(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND}/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packId,
          successUrl: window.location.href,
          cancelUrl:  window.location.href,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Server error');

      // Open Stripe Checkout in the default browser (Electron uses openExternal)
      const openUrl = (window as any).electronAPI?.openExternal
        ? (window as any).electronAPI.openExternal(data.url)
        : window.open(data.url, '_blank');

      // Poll for payment completion
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        try {
          const pr = await fetch(`${BACKEND}/order-status/${data.sessionId}`);
          const pd = await pr.json();
          if (pd.status === 'paid') {
            clearInterval(pollRef.current!);
            pollRef.current = null;
            onSuccess(pd.tokens);
            setBuying(false);
          }
        } catch { /* network blip, keep polling */ }
      }, 3000);

    } catch (err: any) {
      setError(err.message ?? 'Unknown error');
      setBuying(false);
    }
  }, []);

  const buyCosmetic = useCallback((
    category: Category,
    item: CosmeticItem,
    tokens: number,
    onSpend: (cost: number) => void,
  ) => {
    if (tokens < item.cost) {
      setError('Not enough tokens');
      return;
    }
    setError(null);
    onSpend(item.cost);
    unlockItem(category, item.id);
  }, [unlockItem]);

  return { buying, error, buyTokenPack, buyCosmetic };
}
