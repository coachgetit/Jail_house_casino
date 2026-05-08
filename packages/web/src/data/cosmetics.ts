export interface TokenPack {
  id: string;
  label: string;
  tokens: number;
  price: string;
  highlight?: boolean;
}

export interface CosmeticItem {
  id: string;
  label: string;
  cost: number;        // 0 = free (owned by default)
  preview: string;     // CSS value applied to a swatch
}

export const TOKEN_PACKS: TokenPack[] = [
  { id: 'starter',    label: 'Starter Pack',     tokens: 100,  price: '$0.99' },
  { id: 'value',      label: 'Value Pack',        tokens: 500,  price: '$3.99', highlight: true },
  { id: 'highroller', label: 'High Roller Pack',  tokens: 1200, price: '$7.99' },
];

export const CARD_BACKS: CosmeticItem[] = [
  { id: 'classic',  label: 'Classic',   cost: 0,   preview: 'repeating-linear-gradient(45deg,#1a2a4a 0 6px,#0f1e38 6px 12px)' },
  { id: 'crimson',  label: 'Crimson',   cost: 50,  preview: 'repeating-linear-gradient(45deg,#6b0f1a 0 6px,#3d0b10 6px 12px)' },
  { id: 'emerald',  label: 'Emerald',   cost: 50,  preview: 'repeating-linear-gradient(45deg,#0b4d2e 0 6px,#073320 6px 12px)' },
  { id: 'midnight', label: 'Midnight',  cost: 75,  preview: 'linear-gradient(135deg,#0a0a1a 0%,#1a1a3a 50%,#0a0a1a 100%)' },
  { id: 'golden',   label: 'Golden',    cost: 100, preview: 'repeating-linear-gradient(45deg,#7a5c00 0 6px,#4a3800 6px 12px)' },
  { id: 'carbon',   label: 'Carbon',    cost: 75,  preview: 'repeating-linear-gradient(45deg,#2a2a2a 0 6px,#1a1a1a 6px 12px)' },
];

export const FELT_COLORS: CosmeticItem[] = [
  { id: 'green',    label: 'Classic Green', cost: 0,  preview: 'radial-gradient(ellipse at center,#1a5c2e 60%,#0f3d1e 100%)' },
  { id: 'blue',     label: 'Royal Blue',    cost: 50, preview: 'radial-gradient(ellipse at center,#1a2f5c 60%,#0f1e3d 100%)' },
  { id: 'burgundy', label: 'Burgundy',      cost: 50, preview: 'radial-gradient(ellipse at center,#5c1a2e 60%,#3d0f1e 100%)' },
  { id: 'black',    label: 'Black Satin',   cost: 75, preview: 'radial-gradient(ellipse at center,#1a1a1a 60%,#0a0a0a 100%)' },
  { id: 'navy',     label: 'Navy',          cost: 50, preview: 'radial-gradient(ellipse at center,#0f1e3a 60%,#070e22 100%)' },
  { id: 'purple',   label: 'Deep Purple',   cost: 75, preview: 'radial-gradient(ellipse at center,#2e1a5c 60%,#1e0f3d 100%)' },
];

export const AVATAR_FRAMES: CosmeticItem[] = [
  { id: 'none',     label: 'None',      cost: 0,   preview: '2px solid #555' },
  { id: 'gold',     label: 'Gold',      cost: 100, preview: '3px solid #c9a227' },
  { id: 'diamond',  label: 'Diamond',   cost: 150, preview: '3px solid #a8d8ea' },
  { id: 'fire',     label: 'Fire',      cost: 125, preview: '3px solid #ff6b35' },
  { id: 'platinum', label: 'Platinum',  cost: 100, preview: '3px solid #e0e0e0' },
];

export const FREE_ITEMS = {
  cardBack: 'classic',
  felt: 'green',
  frame: 'none',
};
