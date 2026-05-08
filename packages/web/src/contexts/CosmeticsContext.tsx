import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { CARD_BACKS, FELT_COLORS, AVATAR_FRAMES, FREE_ITEMS } from '../data/cosmetics';

function load<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback; }
  catch { return fallback; }
}
function save(key: string, val: unknown) {
  localStorage.setItem(key, JSON.stringify(val));
}

interface CosmeticsState {
  ownedCardBacks: string[];
  ownedFelts: string[];
  ownedFrames: string[];
  activeCardBack: string;
  activeFelt: string;
  activeFrame: string;
}

interface CosmeticsCtx extends CosmeticsState {
  cardBackStyle: string;
  feltStyle: string;
  frameStyle: string;
  setActiveCardBack: (id: string) => void;
  setActiveFelt: (id: string) => void;
  setActiveFrame: (id: string) => void;
  unlockItem: (category: 'cardBack' | 'felt' | 'frame', id: string) => void;
}

const Ctx = createContext<CosmeticsCtx | null>(null);

const defaultOwned = {
  ownedCardBacks: [FREE_ITEMS.cardBack],
  ownedFelts:     [FREE_ITEMS.felt],
  ownedFrames:    [FREE_ITEMS.frame],
};

export function CosmeticsProvider({ children }: { children: ReactNode }) {
  const [owned, setOwned] = useState<typeof defaultOwned>(() => ({
    ownedCardBacks: load('casino-owned-cardbacks', defaultOwned.ownedCardBacks),
    ownedFelts:     load('casino-owned-felts',     defaultOwned.ownedFelts),
    ownedFrames:    load('casino-owned-frames',     defaultOwned.ownedFrames),
  }));
  const [activeCardBack, setActiveCardBackRaw] = useState<string>(
    () => load('casino-active-cardback', FREE_ITEMS.cardBack)
  );
  const [activeFelt, setActiveFeltRaw] = useState<string>(
    () => load('casino-active-felt', FREE_ITEMS.felt)
  );
  const [activeFrame, setActiveFrameRaw] = useState<string>(
    () => load('casino-active-frame', FREE_ITEMS.frame)
  );

  const setActiveCardBack = useCallback((id: string) => {
    setActiveCardBackRaw(id);
    save('casino-active-cardback', id);
  }, []);
  const setActiveFelt = useCallback((id: string) => {
    setActiveFeltRaw(id);
    save('casino-active-felt', id);
  }, []);
  const setActiveFrame = useCallback((id: string) => {
    setActiveFrameRaw(id);
    save('casino-active-frame', id);
  }, []);

  const unlockItem = useCallback((category: 'cardBack' | 'felt' | 'frame', id: string) => {
    setOwned(prev => {
      const next = { ...prev };
      if (category === 'cardBack' && !prev.ownedCardBacks.includes(id)) {
        next.ownedCardBacks = [...prev.ownedCardBacks, id];
        save('casino-owned-cardbacks', next.ownedCardBacks);
      } else if (category === 'felt' && !prev.ownedFelts.includes(id)) {
        next.ownedFelts = [...prev.ownedFelts, id];
        save('casino-owned-felts', next.ownedFelts);
      } else if (category === 'frame' && !prev.ownedFrames.includes(id)) {
        next.ownedFrames = [...prev.ownedFrames, id];
        save('casino-owned-frames', next.ownedFrames);
      }
      return next;
    });
  }, []);

  const cardBackStyle = CARD_BACKS.find(c => c.id === activeCardBack)?.preview
    ?? CARD_BACKS[0].preview;
  const feltStyle = FELT_COLORS.find(c => c.id === activeFelt)?.preview
    ?? FELT_COLORS[0].preview;
  const frameStyle = AVATAR_FRAMES.find(c => c.id === activeFrame)?.preview
    ?? AVATAR_FRAMES[0].preview;

  return (
    <Ctx.Provider value={{
      ...owned,
      activeCardBack, activeFelt, activeFrame,
      cardBackStyle, feltStyle, frameStyle,
      setActiveCardBack, setActiveFelt, setActiveFrame,
      unlockItem,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCosmetics() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCosmetics must be used inside CosmeticsProvider');
  return ctx;
}
