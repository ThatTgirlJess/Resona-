/**
 * Avatar Wardrobe & Style Customizer Studio
 * Customize your interactive cartoonish avatar and equip special unlockables
 * earned through XP, levels, and voice challenges.
 */

import React, { useState } from 'react';
import { AvatarRenderer } from './AvatarRenderer';
import {
  AvatarCustomization,
  UNLOCKABLE_AVATAR_CATALOG,
  UnlockableAvatarItem,
  UserGamificationState,
} from '../../services/gamificationService';
import { VoiceMetrics } from '../../types/voice';
import {
  Sparkles,
  Lock,
  Check,
  Palette,
  Scissors,
  Smile,
  Shirt,
  Glasses,
  Flame,
  Award,
} from 'lucide-react';

interface AvatarCustomizerProps {
  gamification: UserGamificationState;
  onUpdateAvatar: (customization: Partial<AvatarCustomization>) => void;
  metrics: VoiceMetrics;
}

export const AvatarCustomizer: React.FC<AvatarCustomizerProps> = ({
  gamification,
  onUpdateAvatar,
  metrics,
}) => {
  const [activeCategory, setActiveCategory] = useState<'hair' | 'makeup' | 'clothing' | 'accessories' | 'skin'>('hair');

  const avatar = gamification.avatarCustomization;
  const userLevel = gamification.level;
  const unlockedItems = gamification.unlockedAvatarItems || [];

  // Skin tones
  const skinTones = [
    { label: 'Porcelain', color: '#ffedd5' },
    { label: 'Peach', color: '#fcd34d' },
    { label: 'Warm Honey', color: '#f59e0b' },
    { label: 'Caramel', color: '#d97706' },
    { label: 'Chestnut', color: '#92400e' },
    { label: 'Deep Espresso', color: '#451a03' },
  ];

  // Natural hair colors
  const naturalHairColors = [
    { label: 'Jet Black', color: '#171717' },
    { label: 'Dark Chocolate', color: '#332314' },
    { label: 'Chestnut Brown', color: '#593922' },
    { label: 'Honey Blonde', color: '#d4af37' },
    { label: 'Auburn Copper', color: '#9a3412' },
  ];

  // Hair styles
  const hairStyles = [
    { id: 'bob', label: 'Soft Bob & Bangs' },
    { id: 'long', label: 'Long Waves' },
    { id: 'pixie', label: 'Chic Pixie' },
    { id: 'fade', label: 'Short Fade' },
    { id: 'topknot', label: 'Top Knot Bun' },
    { id: 'curly-afro', label: 'Curly Afro' },
  ];

  // Base clothing options
  const baseClothing = [
    { id: 'hoodie', label: 'Cozy Hoodie' },
    { id: 'crewneck', label: 'Minimal Crewneck' },
  ];

  // Base clothing colors
  const clothingColors = [
    '#1e293b',
    '#0f766e',
    '#4338ca',
    '#831843',
    '#374151',
    '#15803d',
  ];

  // Filter unlockable items by current category
  const categoryItems = UNLOCKABLE_AVATAR_CATALOG.filter((item) => {
    if (activeCategory === 'hair') return item.type === 'hairColor';
    if (activeCategory === 'makeup') return item.type === 'makeup';
    if (activeCategory === 'clothing') return item.type === 'clothing';
    if (activeCategory === 'accessories') return item.type === 'accessory';
    return false;
  });

  const isItemUnlocked = (item: UnlockableAvatarItem) => {
    return unlockedItems.includes(item.id) || userLevel >= item.requiredLevel;
  };

  return (
    <div className="space-y-6">
      {/* Studio Banner */}
      <div className="rounded-2xl bg-linear-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
              Voice Avatar Studio
            </span>
            <span className="text-xs text-slate-400">
              Level {gamification.level} • {gamification.levelTitle}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            Customize Your Voice Companion
          </h2>
          <p className="text-xs text-slate-400 max-w-lg mt-1">
            Your avatar reacts in real-time as you vocalize! Unlock special fantasy hair colors,
            glamorous makeup, chic clothing, and studio accessories by completing voice drills.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950/60 border border-slate-800 px-3.5 py-2 rounded-xl text-xs text-slate-300">
          <Award className="w-4 h-4 text-amber-400" />
          <span>
            Unlocked Rewards: <strong className="text-teal-400">{unlockedItems.length + 1}</strong> / {UNLOCKABLE_AVATAR_CATALOG.length}
          </span>
        </div>
      </div>

      {/* Main Studio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Avatar Stage (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl flex flex-col items-center justify-between text-center relative overflow-hidden">
          {/* Subtle Stage Spotlight */}
          <div className="absolute inset-0 bg-radial from-indigo-500/10 via-transparent to-transparent pointer-events-none" />

          <div className="w-full flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Real-time Voice Reactive
            </span>
            <span className="text-[11px] font-mono text-slate-500">Mouth & eyes move when you speak</span>
          </div>

          {/* Avatar Canvas */}
          <div className="my-6 p-4 rounded-3xl bg-slate-950/80 border border-slate-800/80 shadow-2xl relative">
            <AvatarRenderer
              customization={avatar}
              metrics={metrics}
              size="xl"
              showReactivity={true}
            />

            {/* Vocal note popover if speaking */}
            {metrics.pitch > 60 && (
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-teal-500/20 border border-teal-500/40 text-[10px] font-mono text-teal-300">
                Singing: {Math.round(metrics.pitch)} Hz ({metrics.note})
              </div>
            )}
          </div>

          {/* Avatar Quick Bio / Current Gear */}
          <div className="w-full pt-4 border-t border-slate-800/80 text-xs text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Hairstyle:</span>
              <strong className="text-slate-200 capitalize">{avatar.hairStyle}</strong>
            </div>
            <div className="flex justify-between">
              <span>Current Outfit:</span>
              <strong className="text-slate-200 capitalize">{avatar.clothing.replace('cloth-', '').replace('-', ' ')}</strong>
            </div>
            <div className="flex justify-between">
              <span>Accessory:</span>
              <strong className="text-teal-300 capitalize">{avatar.accessory.replace('acc-', '').replace('-', ' ')}</strong>
            </div>
          </div>
        </div>

        {/* Right: Wardrobe & Customization Rack (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl flex flex-col justify-between">
          <div>
            {/* Category Navigation Tabs */}
            <div className="flex flex-wrap gap-1.5 pb-4 border-b border-slate-800 mb-5">
              {[
                { id: 'hair', label: 'Hair & Colors', icon: Scissors },
                { id: 'makeup', label: 'Makeup & Glow', icon: Smile },
                { id: 'clothing', label: 'Wardrobe', icon: Shirt },
                { id: 'accessories', label: 'Accessories', icon: Glasses },
                { id: 'skin', label: 'Complexion', icon: Palette },
              ].map((cat) => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      isActive
                        ? 'bg-teal-500 text-slate-950 shadow-md font-bold'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* TAB CONTENT: HAIR & COLORS */}
            {activeCategory === 'hair' && (
              <div className="space-y-5">
                {/* Hairstyle Selection */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5">
                    Hairstyles
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {hairStyles.map((style) => (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => onUpdateAvatar({ hairStyle: style.id })}
                        className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                          avatar.hairStyle === style.id
                            ? 'bg-teal-500/15 border-teal-500 text-teal-300 font-semibold shadow-xs'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Natural Colors */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5">
                    Natural Hair Tones
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {naturalHairColors.map((col) => (
                      <button
                        key={col.color}
                        type="button"
                        onClick={() => onUpdateAvatar({ hairColor: col.color })}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs transition-all ${
                          avatar.hairColor === col.color
                            ? 'border-teal-400 bg-slate-800 text-slate-100 font-medium'
                            : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-slate-700 shrink-0"
                          style={{ backgroundColor: col.color }}
                        />
                        <span>{col.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Unlockable Special Hair Colors */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <h4 className="text-xs font-semibold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5" /> Special Unlockable Colors
                    </h4>
                    <span className="text-[11px] text-slate-500">Earned via Levels & Drills</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {categoryItems.map((item) => {
                      const unlocked = isItemUnlocked(item);
                      const isEquipped = avatar.hairColor === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          disabled={!unlocked}
                          onClick={() => unlocked && onUpdateAvatar({ hairColor: item.id })}
                          className={`p-3 rounded-xl border text-left flex items-center justify-between text-xs transition-all ${
                            isEquipped
                              ? 'bg-teal-500/20 border-teal-400 text-teal-200 font-semibold'
                              : unlocked
                              ? 'bg-slate-950/70 border-slate-800 hover:border-teal-500/40 text-slate-300'
                              : 'bg-slate-950/30 border-slate-900 text-slate-600 cursor-not-allowed opacity-60'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className="w-5 h-5 rounded-full border border-white/20 shrink-0 shadow-sm"
                              style={{ backgroundColor: item.previewColor }}
                            />
                            <div>
                              <div className="font-medium text-slate-200">{item.name}</div>
                              <div className="text-[10px] text-slate-500">
                                {unlocked ? 'Unlocked' : `Requires Level ${item.requiredLevel}`}
                              </div>
                            </div>
                          </div>
                          {isEquipped ? (
                            <Check className="w-4 h-4 text-teal-400" />
                          ) : !unlocked ? (
                            <Lock className="w-3.5 h-3.5 text-slate-600" />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: MAKEUP & GLOW */}
            {activeCategory === 'makeup' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Makeup & Affirming Facial Accents
                  </h4>
                  <span className="text-[11px] text-slate-500">Feminizing & Masculinizing styling</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Default natural */}
                  <button
                    type="button"
                    onClick={() => onUpdateAvatar({ makeup: 'natural' })}
                    className={`p-3 rounded-xl border text-left text-xs transition-all ${
                      avatar.makeup === 'natural'
                        ? 'bg-teal-500/15 border-teal-500 text-teal-300 font-semibold'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-medium text-slate-200">Natural & Clean</div>
                    <div className="text-[10px] text-slate-500">Subtle natural flush</div>
                  </button>

                  {/* Special Makeup Items */}
                  {categoryItems.map((item) => {
                    const unlocked = isItemUnlocked(item);
                    const isEquipped = avatar.makeup === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={!unlocked}
                        onClick={() => unlocked && onUpdateAvatar({ makeup: item.id })}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between text-xs transition-all ${
                          isEquipped
                            ? 'bg-teal-500/20 border-teal-400 text-teal-200 font-semibold'
                            : unlocked
                            ? 'bg-slate-950/70 border-slate-800 hover:border-teal-500/40 text-slate-300'
                            : 'bg-slate-950/30 border-slate-900 text-slate-600 cursor-not-allowed opacity-60'
                        }`}
                      >
                        <div>
                          <div className="font-medium text-slate-200">{item.name}</div>
                          <div className="text-[10px] text-slate-500">
                            {unlocked ? 'Unlocked' : `Requires Level ${item.requiredLevel}`}
                          </div>
                        </div>
                        {isEquipped ? (
                          <Check className="w-4 h-4 text-teal-400" />
                        ) : !unlocked ? (
                          <Lock className="w-3.5 h-3.5 text-slate-600" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB CONTENT: WARDROBE */}
            {activeCategory === 'clothing' && (
              <div className="space-y-4">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Basic Outfits
                </h4>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {baseClothing.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => onUpdateAvatar({ clothing: c.id })}
                      className={`p-3 rounded-xl border text-left text-xs transition-all ${
                        avatar.clothing === c.id
                          ? 'bg-teal-500/15 border-teal-500 text-teal-300 font-semibold'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>

                {/* Clothing Color Swatches */}
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Fabric Color
                </h4>
                <div className="flex gap-2 mb-5">
                  {clothingColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => onUpdateAvatar({ clothingColor: color })}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        avatar.clothingColor === color ? 'border-teal-400 scale-110 shadow-sm' : 'border-slate-700'
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label="Pick clothing color"
                    />
                  ))}
                </div>

                {/* Special Unlockable Clothing */}
                <h4 className="text-xs font-semibold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider mb-2">
                  <Sparkles className="w-3.5 h-3.5" /> Special Unlockable Attire
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {categoryItems.map((item) => {
                    const unlocked = isItemUnlocked(item);
                    const isEquipped = avatar.clothing === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={!unlocked}
                        onClick={() => unlocked && onUpdateAvatar({ clothing: item.id })}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between text-xs transition-all ${
                          isEquipped
                            ? 'bg-teal-500/20 border-teal-400 text-teal-200 font-semibold'
                            : unlocked
                            ? 'bg-slate-950/70 border-slate-800 hover:border-teal-500/40 text-slate-300'
                            : 'bg-slate-950/30 border-slate-900 text-slate-600 cursor-not-allowed opacity-60'
                        }`}
                      >
                        <div>
                          <div className="font-medium text-slate-200">{item.name}</div>
                          <div className="text-[10px] text-slate-500">
                            {unlocked ? 'Unlocked' : `Requires Level ${item.requiredLevel}`}
                          </div>
                        </div>
                        {isEquipped ? (
                          <Check className="w-4 h-4 text-teal-400" />
                        ) : !unlocked ? (
                          <Lock className="w-3.5 h-3.5 text-slate-600" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB CONTENT: ACCESSORIES */}
            {activeCategory === 'accessories' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Accessories & Headwear
                  </h4>
                  <button
                    type="button"
                    onClick={() => onUpdateAvatar({ accessory: 'none' })}
                    className="text-xs text-slate-500 hover:text-slate-300 underline"
                  >
                    Remove Accessory
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {categoryItems.map((item) => {
                    const unlocked = isItemUnlocked(item);
                    const isEquipped = avatar.accessory === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={!unlocked}
                        onClick={() => unlocked && onUpdateAvatar({ accessory: item.id })}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between text-xs transition-all ${
                          isEquipped
                            ? 'bg-teal-500/20 border-teal-400 text-teal-200 font-semibold'
                            : unlocked
                            ? 'bg-slate-950/70 border-slate-800 hover:border-teal-500/40 text-slate-300'
                            : 'bg-slate-950/30 border-slate-900 text-slate-600 cursor-not-allowed opacity-60'
                        }`}
                      >
                        <div>
                          <div className="font-medium text-slate-200">{item.name}</div>
                          <div className="text-[10px] text-slate-500">
                            {unlocked ? 'Unlocked' : `Requires Level ${item.requiredLevel}`}
                          </div>
                        </div>
                        {isEquipped ? (
                          <Check className="w-4 h-4 text-teal-400" />
                        ) : !unlocked ? (
                          <Lock className="w-3.5 h-3.5 text-slate-600" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB CONTENT: SKIN / COMPLEXION */}
            {activeCategory === 'skin' && (
              <div className="space-y-4">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Skin Tone Palette
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {skinTones.map((tone) => (
                    <button
                      key={tone.color}
                      type="button"
                      onClick={() => onUpdateAvatar({ skinTone: tone.color })}
                      className={`p-3 rounded-xl border flex items-center gap-3 text-xs transition-all ${
                        avatar.skinTone === tone.color
                          ? 'border-teal-400 bg-teal-500/10 text-teal-200 font-semibold'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span
                        className="w-5 h-5 rounded-full border border-black/20 shrink-0"
                        style={{ backgroundColor: tone.color }}
                      />
                      <span>{tone.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Incentive Footer */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-400" />
              Practice daily drills to level up and unlock higher tier styles!
            </span>
            <span className="font-mono text-teal-400 font-semibold">
              Next unlock: Level {Math.min(userLevel + 1, 6)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
