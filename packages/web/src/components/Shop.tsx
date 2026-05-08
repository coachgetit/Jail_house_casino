import { useState } from 'react';
import { useCosmetics } from '../contexts/CosmeticsContext';
import { useShop } from '../hooks/useShop';
import {
  TOKEN_PACKS, CARD_BACKS, FELT_COLORS, AVATAR_FRAMES,
  type CosmeticItem,
} from '../data/cosmetics';

type Tab = 'tokens' | 'cardbacks' | 'felts' | 'frames';

interface Props {
  tokens: number;
  onClose: () => void;
  onEarnTokens: (amount: number) => void;
  onSpendTokens: (amount: number) => void;
}

export function Shop({ tokens, onClose, onEarnTokens, onSpendTokens }: Props) {
  const [tab, setTab] = useState<Tab>('tokens');
  const {
    ownedCardBacks, ownedFelts, ownedFrames,
    activeCardBack, activeFelt, activeFrame,

    setActiveCardBack, setActiveFelt, setActiveFrame,
  } = useCosmetics();
  const { buying, error, buyTokenPack, buyCosmetic } = useShop();

  function CosmeticGrid({
    items, owned, active, onBuy, onEquip,
    previewKey,
  }: {
    items: CosmeticItem[];
    owned: string[];
    active: string;
    onBuy: (item: CosmeticItem) => void;
    onEquip: (id: string) => void;
    previewKey: 'background' | 'border';
  }) {
    return (
      <div className="shop-grid">
        {items.map(item => {
          const isOwned = owned.includes(item.id);
          const isActive = active === item.id;
          return (
            <div key={item.id} className={`shop-item${isActive ? ' shop-item--active' : ''}`}>
              <div
                className="shop-item-preview"
                style={{ [previewKey]: item.preview }}
              />
              <div className="shop-item-label">{item.label}</div>
              {item.cost > 0 && !isOwned && (
                <div className="shop-item-cost">🪙 {item.cost}</div>
              )}
              {isOwned ? (
                <button
                  className={`btn btn-sm${isActive ? ' btn-amber' : ' btn-indigo'}`}
                  onClick={() => onEquip(item.id)}
                  disabled={isActive}
                >
                  {isActive ? 'Equipped' : 'Equip'}
                </button>
              ) : (
                <button
                  className="btn btn-sm btn-green"
                  onClick={() => onBuy(item)}
                  disabled={tokens < item.cost}
                >
                  Buy
                </button>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="shop-overlay" onClick={onClose}>
      <div className="shop-modal" onClick={e => e.stopPropagation()}>
        <div className="shop-header">
          <h2 className="shop-title">Shop</h2>
          <span className="shop-tokens">🪙 {tokens}</span>
          <button className="shop-close" onClick={onClose}>✕</button>
        </div>

        <div className="shop-tabs">
          {([
            ['tokens',   '💰 Tokens'],
            ['cardbacks','🃏 Card Backs'],
            ['felts',    '🟢 Felt'],
            ['frames',   '🖼 Frames'],
          ] as [Tab, string][]).map(([t, label]) => (
            <button
              key={t}
              className={`shop-tab${tab === t ? ' shop-tab--active' : ''}`}
              onClick={() => setTab(t)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="shop-body">
          {error && <p className="shop-error">{error}</p>}

          {tab === 'tokens' && (
            <div className="token-packs">
              {TOKEN_PACKS.map(pack => (
                <div key={pack.id} className={`token-pack${pack.highlight ? ' token-pack--highlight' : ''}`}>
                  {pack.highlight && <div className="token-pack-badge">Best Value</div>}
                  <div className="token-pack-amount">🪙 {pack.tokens}</div>
                  <div className="token-pack-label">{pack.label}</div>
                  <div className="token-pack-price">{pack.price}</div>
                  <button
                    className="btn btn-green btn-wide"
                    disabled={buying}
                    onClick={() => buyTokenPack(pack.id, pack.tokens, onEarnTokens)}
                  >
                    {buying ? 'Opening Checkout…' : 'Buy'}
                  </button>
                </div>
              ))}
              {buying && (
                <p className="shop-poll-msg">
                  Complete payment in the browser window — this screen will update automatically.
                </p>
              )}
            </div>
          )}

          {tab === 'cardbacks' && (
            <CosmeticGrid
              items={CARD_BACKS}
              owned={ownedCardBacks}
              active={activeCardBack}
              onEquip={setActiveCardBack}
              onBuy={item => buyCosmetic('cardBack', item, tokens, onSpendTokens)}
              previewKey="background"
            />
          )}

          {tab === 'felts' && (
            <CosmeticGrid
              items={FELT_COLORS}
              owned={ownedFelts}
              active={activeFelt}
              onEquip={setActiveFelt}
              onBuy={item => buyCosmetic('felt', item, tokens, onSpendTokens)}
              previewKey="background"
            />
          )}

          {tab === 'frames' && (
            <CosmeticGrid
              items={AVATAR_FRAMES}
              owned={ownedFrames}
              active={activeFrame}
              onEquip={setActiveFrame}
              onBuy={item => buyCosmetic('frame', item, tokens, onSpendTokens)}
              previewKey="border"
            />
          )}
        </div>
      </div>
    </div>
  );
}
