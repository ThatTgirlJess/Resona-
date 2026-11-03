/**
 * Interactive Cartoonish Vocal Avatar Renderer
 * Clean, charming, expressive SVG character that animates in real-time
 * when the user vocalizes (mouth opens to volume, eyes react to pitch accuracy).
 */

import React, { useEffect, useState } from 'react';
import { AvatarCustomization } from '../../services/gamificationService';
import { VoiceMetrics } from '../../types/voice';

interface AvatarRendererProps {
  customization: AvatarCustomization;
  metrics?: VoiceMetrics;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showReactivity?: boolean;
}

export const AvatarRenderer: React.FC<AvatarRendererProps> = ({
  customization,
  metrics,
  size = 'md',
  showReactivity = true,
}) => {
  const [blink, setBlink] = useState(false);

  // Blinking timer
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 160);
    }, 3800);
    return () => clearInterval(blinkInterval);
  }, []);

  const isSpeaking = showReactivity && (metrics?.pitch || 0) > 60 && (metrics?.volumeDb || -100) > -55;
  const inTarget = showReactivity && Boolean(metrics?.inTargetZone);

  // Dimension scaling
  const dimensions = {
    sm: { width: 56, height: 56, viewBox: '0 0 120 120' },
    md: { width: 100, height: 100, viewBox: '0 0 120 120' },
    lg: { width: 180, height: 180, viewBox: '0 0 120 120' },
    xl: { width: 260, height: 260, viewBox: '0 0 120 120' },
  }[size];

  // Map hair color
  const getHairColor = (code: string) => {
    if (code === 'hair-hologram-teal') return '#2dd4bf';
    if (code === 'hair-lavender-mist') return '#c084fc';
    if (code === 'hair-sunset-coral') return '#fb7185';
    if (code === 'hair-silver-starlight') return '#e2e8f0';
    if (code === 'hair-rose-gold') return '#f43f5e';
    return code; // direct hex if custom
  };

  const actualHairColor = getHairColor(customization.hairColor || '#332314');
  const skin = customization.skinTone || '#fcd34d';

  // Clothing color
  const getClothingColor = (clothingId: string) => {
    if (clothingId === 'cloth-celestial-bomber') return '#312e81';
    if (clothingId === 'cloth-velvet-suit') return '#581c87';
    if (clothingId === 'cloth-cyber-leather') return '#09090b';
    if (clothingId === 'cloth-pastel-knit') return '#38bdf8';
    return customization.clothingColor || '#1e293b';
  };
  const clothColor = getClothingColor(customization.clothing);

  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ width: dimensions.width, height: dimensions.height }}
    >
      <svg
        viewBox={dimensions.viewBox}
        className={`w-full h-full transition-transform duration-150 ${
          isSpeaking ? 'scale-105' : 'scale-100'
        }`}
      >
        <defs>
          {/* Subtle gradient for head depth */}
          <radialGradient id="headShading" cx="50%" cy="40%" r="55%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.12" />
          </radialGradient>

          {/* Hair shine */}
          <linearGradient id="hairGleam" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.2" />
          </linearGradient>

          {/* Glow filter for unlockable special items */}
          <filter id="specialGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#2dd4bf" floodOpacity="0.6" />
          </filter>
        </defs>

        {/* 1. Body & Clothing */}
        <g id="clothing">
          {/* Neck */}
          <path d="M 52 75 L 68 75 L 70 88 L 50 88 Z" fill={skin} />
          {/* Neck shadow */}
          <path d="M 52 75 Q 60 80 68 75 L 68 78 Q 60 83 52 78 Z" fill="rgba(0,0,0,0.12)" />

          {/* Torso / Clothes */}
          {customization.clothing === 'cloth-velvet-suit' ? (
            // Blazer with collar
            <g>
              <path d="M 28 120 L 32 92 C 34 84, 45 82, 52 85 L 60 98 L 68 85 C 75 82, 86 84, 88 92 L 92 120 Z" fill={clothColor} />
              {/* Lapels */}
              <path d="M 44 84 L 60 106 L 50 120 L 36 94 Z" fill="#701a75" />
              <path d="M 76 84 L 60 106 L 70 120 L 84 94 Z" fill="#701a75" />
              <path d="M 54 85 L 60 96 L 66 85 Z" fill="#f8fafc" />
            </g>
          ) : customization.clothing === 'cloth-cyber-leather' ? (
            // Cyber leather jacket with neon trim
            <g>
              <path d="M 26 120 L 30 90 C 33 83, 44 80, 50 84 L 60 96 L 70 84 C 76 80, 87 83, 90 90 L 94 120 Z" fill="#18181b" />
              <path d="M 46 84 L 60 104 L 74 84" stroke="#2dd4bf" strokeWidth="2.5" fill="none" />
              <circle cx="58" cy="110" r="1.5" fill="#f59e0b" />
            </g>
          ) : customization.clothing === 'cloth-pastel-knit' ? (
            // Cozy cloud knit
            <g>
              <path d="M 26 120 L 30 90 C 34 82, 45 80, 60 80 C 75 80, 86 82, 90 90 L 94 120 Z" fill={clothColor} />
              <ellipse cx="60" cy="85" rx="14" ry="4" fill="#bae6fd" />
              {/* Cloud pattern */}
              <circle cx="48" cy="102" r="4" fill="#ffffff" opacity="0.6" />
              <circle cx="54" cy="100" r="5" fill="#ffffff" opacity="0.6" />
              <circle cx="60" cy="103" r="4" fill="#ffffff" opacity="0.6" />
            </g>
          ) : (
            // Default Hoodie / Crewneck
            <g>
              <path d="M 26 120 L 30 90 C 34 82, 45 80, 60 80 C 75 80, 86 82, 90 90 L 94 120 Z" fill={clothColor} />
              {/* Collar curve */}
              <path d="M 46 82 Q 60 92 74 82" stroke="rgba(255,255,255,0.2)" strokeWidth="3" fill="none" />
              {/* Hoodie strings */}
              <line x1="56" y1="87" x2="56" y2="102" stroke="#e2e8f0" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="64" y1="87" x2="64" y2="102" stroke="#e2e8f0" strokeWidth="1.5" strokeLinecap="round" />
            </g>
          )}
        </g>

        {/* 2. Head & Ears */}
        <g id="head">
          {/* Ears */}
          <circle cx="34" cy="54" r="7" fill={skin} />
          <circle cx="86" cy="54" r="7" fill={skin} />
          <circle cx="34" cy="54" r="4" fill="rgba(0,0,0,0.08)" />
          <circle cx="86" cy="54" r="4" fill="rgba(0,0,0,0.08)" />

          {/* Earring accessories */}
          {customization.accessory === 'acc-hoop-earrings' && (
            <g>
              <circle cx="33" cy="61" r="5" fill="none" stroke="#fbbf24" strokeWidth="1.8" />
              <circle cx="87" cy="61" r="5" fill="none" stroke="#fbbf24" strokeWidth="1.8" />
            </g>
          )}

          {/* Head base */}
          <ellipse cx="60" cy="52" rx="27" ry="30" fill={skin} />
          <ellipse cx="60" cy="52" rx="27" ry="30" fill="url(#headShading)" />
        </g>

        {/* 3. Hair (Back layer for long styles) */}
        {customization.hairStyle === 'long' && (
          <path
            d="M 32 45 C 24 60, 24 88, 30 102 C 34 104, 40 98, 38 88 C 36 78, 36 50, 42 42 Z
               M 88 45 C 96 60, 96 88, 90 102 C 86 104, 80 98, 82 88 C 84 78, 84 50, 78 42 Z"
            fill={actualHairColor}
          />
        )}

        {/* 4. Facial Features (Brows, Eyes, Cheeks, Makeup, Nose, Mouth) */}
        <g id="face">
          {/* Eyebrows */}
          <path
            d={
              isSpeaking
                ? 'M 44 38 Q 50 34 55 38  M 65 38 Q 70 34 76 38' // Expressive raised brows
                : 'M 44 40 Q 50 37 55 40  M 65 40 Q 70 37 76 40' // Relaxed natural brows
            }
            stroke={actualHairColor}
            strokeWidth="2.4"
            strokeLinecap="round"
            fill="none"
          />

          {/* Makeup - Winged Liner */}
          {customization.makeup === 'mu-gloss-wings' && (
            <g>
              <path d="M 40 45 L 43 44" stroke="#09090b" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M 80 45 L 77 44" stroke="#09090b" strokeWidth="1.5" strokeLinecap="round" />
            </g>
          )}

          {/* Eyes */}
          {blink ? (
            // Blinking closed eye slits
            <g stroke="#1e293b" strokeWidth="2.2" strokeLinecap="round" fill="none">
              <path d="M 45 47 Q 49 50 53 47" />
              <path d="M 67 47 Q 71 50 75 47" />
            </g>
          ) : inTarget ? (
            // Happy Sparkle Star Eyes when hitting target resonance/pitch!
            <g fill="#2dd4bf">
              <circle cx="49" cy="46" r="4.2" />
              <circle cx="71" cy="46" r="4.2" />
              <polygon points="49,41 50.5,45 54,46 50.5,47 49,51 47.5,47 44,46 47.5,45" fill="#ffffff" />
              <polygon points="71,41 72.5,45 76,46 72.5,47 71,51 69.5,47 66,46 69.5,45" fill="#ffffff" />
            </g>
          ) : (
            // Standard expressive cartoon eyes
            <g>
              <ellipse cx="49" cy="46" rx="4.5" ry="5.5" fill="#1e293b" />
              <ellipse cx="71" cy="46" rx="4.5" ry="5.5" fill="#1e293b" />
              {/* Highlights */}
              <circle cx="47.5" cy="44" r="1.8" fill="#ffffff" />
              <circle cx="69.5" cy="44" r="1.8" fill="#ffffff" />
              <circle cx="50.5" cy="48" r="0.8" fill="#ffffff" />
              <circle cx="72.5" cy="48" r="0.8" fill="#ffffff" />
            </g>
          )}

          {/* Cheeks / Blush */}
          <ellipse cx="42" cy="54" rx="4" ry="2" fill="#fb7185" opacity="0.45" />
          <ellipse cx="78" cy="54" rx="4" ry="2" fill="#fb7185" opacity="0.45" />

          {/* Makeup - Stardust Freckles */}
          {customization.makeup === 'mu-stardust-freckles' && (
            <g fill="#f59e0b">
              <circle cx="43" cy="53" r="0.8" />
              <circle cx="45" cy="55" r="0.7" />
              <circle cx="75" cy="55" r="0.7" />
              <circle cx="77" cy="53" r="0.8" />
              <circle cx="60" cy="55" r="0.6" fill="#38bdf8" />
            </g>
          )}

          {/* Makeup - Groomed Stubble Contour */}
          {customization.makeup === 'mu-groomed-shadow' && (
            <path
              d="M 44 60 C 44 72, 76 72, 76 60 C 76 66, 70 76, 60 76 C 50 76, 44 66, 44 60 Z"
              fill="rgba(0,0,0,0.14)"
            />
          )}

          {/* Nose */}
          <path d="M 59 51 Q 61 54 58 55" stroke="rgba(0,0,0,0.25)" strokeWidth="1.5" strokeLinecap="round" fill="none" />

          {/* Interactive Mouth (Animates to audio volume and pitch!) */}
          {isSpeaking ? (
            // Singing / Speaking open mouth
            <g>
              <ellipse
                cx="60"
                cy={64}
                rx={inTarget ? 7 : 5.5}
                ry={inTarget ? 6.5 : 5}
                fill="#881337"
              />
              {/* Teeth bar */}
              <rect x="55" y="60" width="10" height="2.5" rx="1" fill="#ffffff" />
              {/* Tongue */}
              <ellipse cx="60" cy="67" rx="4" ry="2" fill="#f43f5e" />
            </g>
          ) : (
            // Closed pleasant smile / neutral
            <g>
              {customization.makeup === 'mu-bold-amethyst' ? (
                // Bold Lip Color
                <path d="M 53 64 Q 60 68 67 64" stroke="#7e22ce" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              ) : customization.makeup === 'mu-gloss-wings' ? (
                // Glossy Peach Lip
                <path d="M 53 64 Q 60 68 67 64" stroke="#fb7185" strokeWidth="2.4" strokeLinecap="round" fill="none" />
              ) : (
                // Natural smile
                <path d="M 54 64 Q 60 67 66 64" stroke="#881337" strokeWidth="1.8" strokeLinecap="round" fill="none" />
              )}
            </g>
          )}
        </g>

        {/* 5. Front Hair Styles */}
        <g id="hairFront">
          {customization.hairStyle === 'pixie' ? (
            // Pixie Cut
            <path
              d="M 32 46 C 30 28, 48 20, 60 20 C 74 20, 90 28, 88 46 C 82 36, 75 32, 60 32 C 45 32, 38 36, 32 46 Z
                 M 40 34 C 48 38, 54 36, 62 33 C 54 30, 46 32, 40 34 Z"
              fill={actualHairColor}
            />
          ) : customization.hairStyle === 'fade' ? (
            // Short Fade Crop
            <path
              d="M 34 44 C 34 26, 48 22, 60 22 C 72 22, 86 26, 86 44 C 84 34, 76 28, 60 28 C 44 28, 36 34, 34 44 Z"
              fill={actualHairColor}
            />
          ) : customization.hairStyle === 'topknot' ? (
            // Top Knot Bun
            <g>
              <ellipse cx="60" cy="17" rx="10" ry="8" fill={actualHairColor} />
              <path
                d="M 33 46 C 31 28, 48 22, 60 22 C 72 22, 89 28, 87 46 C 81 35, 72 32, 60 32 C 48 32, 39 35, 33 46 Z"
                fill={actualHairColor}
              />
            </g>
          ) : customization.hairStyle === 'curly-afro' ? (
            // Curly Afro Volume
            <g fill={actualHairColor}>
              <circle cx="40" cy="30" r="12" />
              <circle cx="55" cy="23" r="13" />
              <circle cx="70" cy="24" r="13" />
              <circle cx="82" cy="32" r="12" />
              <circle cx="86" cy="46" r="10" />
              <circle cx="34" cy="46" r="10" />
            </g>
          ) : (
            // Default Stylish Bob with soft bangs
            <path
              d="M 32 48 C 30 26, 46 20, 60 20 C 74 20, 90 26, 88 48 C 84 62, 85 70, 80 72 C 76 68, 79 50, 78 40 C 68 40, 64 36, 60 35 C 56 36, 52 40, 42 40 C 41 50, 44 68, 40 72 C 35 70, 36 62, 32 48 Z"
              fill={actualHairColor}
            />
          )}

          {/* Hair Highlight Glint */}
          <ellipse cx="50" cy="26" rx="8" ry="2.5" fill="#ffffff" opacity="0.25" transform="rotate(-15 50 26)" />
        </g>

        {/* 6. Accessories */}
        <g id="accessories">
          {/* Studio Pro Headset */}
          {customization.accessory === 'acc-studio-headset' && (
            <g>
              {/* Headband */}
              <path d="M 32 48 C 30 20, 90 20, 88 48" fill="none" stroke="#0f172a" strokeWidth="5" strokeLinecap="round" />
              <path d="M 32 48 C 30 20, 90 20, 88 48" fill="none" stroke="#2dd4bf" strokeWidth="1.5" strokeLinecap="round" />
              {/* Ear Cups */}
              <rect x="28" y="44" width="7" height="16" rx="3.5" fill="#1e293b" />
              <rect x="85" y="44" width="7" height="16" rx="3.5" fill="#1e293b" />
              {/* Mic Boom */}
              <path d="M 32 56 Q 36 72 52 70" fill="none" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="53" cy="70" r="2.8" fill="#2dd4bf" className="animate-pulse" />
            </g>
          )}

          {/* Laurel Tiara */}
          {customization.accessory === 'acc-laurel-crown' && (
            <g fill="#fbbf24" stroke="#d97706" strokeWidth="0.5">
              <ellipse cx="60" cy="27" rx="3" ry="5" />
              <ellipse cx="52" cy="29" rx="2.5" ry="4" transform="rotate(-20 52 29)" />
              <ellipse cx="68" cy="29" rx="2.5" ry="4" transform="rotate(20 68 29)" />
              <ellipse cx="44" cy="33" rx="2.5" ry="4" transform="rotate(-35 44 33)" />
              <ellipse cx="76" cy="33" rx="2.5" ry="4" transform="rotate(35 76 33)" />
            </g>
          )}

          {/* Cyberpunk Visor Shades */}
          {customization.accessory === 'acc-cyber-shades' && (
            <g>
              <polygon points="38,42 82,42 80,51 40,51" fill="#06b6d4" opacity="0.85" filter="url(#specialGlow)" />
              <line x1="39" y1="46" x2="81" y2="46" stroke="#ffffff" strokeWidth="1" opacity="0.6" />
            </g>
          )}
        </g>

        {/* Floating Musical Notes when Singing In Target */}
        {inTarget && (
          <g fill="#2dd4bf" className="animate-bounce">
            <text x="88" y="32" fontSize="11" fontFamily="sans-serif">♪</text>
            <text x="20" y="36" fontSize="9" fontFamily="sans-serif">♫</text>
          </g>
        )}
      </svg>
    </div>
  );
};
