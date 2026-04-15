import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';

// Configuration perfectly mapped to your requested apps and design updates.
const BUBBLES_CONFIG = [
  // 1. Spotify - Pill, No badge
  { id: 1, size: 116, x: -14, y: -110, zIndex: 10, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Spotify_logo_without_text.svg/3840px-Spotify_logo_without_text.svg.png', fill: true, isPill: true, pillTitle: 'Playing', pillSubtitle: 'Blinding Lights' },
  // 2. ChatGPT - (Ready) - Pill, Badge: 3
  { id: 2, size: 84, x: 96, y: -2, zIndex: 9, img: 'https://store-images.s-microsoft.com/image/apps.14785.14423064005243201.42399137-369b-40bb-b5be-ac2f079c41bf.b1d6d110-9d93-441f-ac20-2e04fd7dfe3c', fill: true, isPill: true, pillTitle: 'Ready', pillSubtitle: 'How can I help?', badge: 3 },
  // 3. Samsung Notes
  { id: 3, size: 92, x: -96, y: -8, zIndex: 8, img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQBqnQslAlWPFfgsydtmEu6W87s0MwRkC4SoA&s', fill: true },
  // 4. Samsung Health - Pill, No badge
  { id: 4, size: 64, x: -146, y: -80, zIndex: 3, img: 'https://play-lh.googleusercontent.com/27PLZbtQ--1B-EDSUI3NWqJ6jUxoAujMEhOolD3eA1nkN6EJv1PFq--sw6yOJP5zreNR', fill: true, isPill: true, pillTitle: 'Health', pillSubtitle: '10,243 steps' },
  // 5. Samsung Messages - Tony (Profile)
  { 
    id: 5, 
    size: 76, 
    x: -116, 
    y: -166, 
    zIndex: 4, 
    img: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400&h=400', 
    fill: true, 
    isPill: true, 
    pillTitle: 'Tony', 
    pillSubtitle: 'I love it!',
    subIcon: 'https://eu.community.samsung.com/t5/image/serverpage/image-id/3047454iBE0D8A28D91BBB07?v=v2'
  },
  // 6. Google Map
  { id: 6, size: 80, x: -36, y: -222, zIndex: 6, img: 'https://cdn.vox-cdn.com/thumbor/pOMbzDvdEWS8NIeUuhxp23wi_cU=/1400x1400/filters:format(png)/cdn.vox-cdn.com/uploads/chorus_asset/file/19700731/googlemaps.png', fill: true },
  // 7. Notes - (Ideas)
  { id: 7, size: 76, x: 64, y: -194, zIndex: 5, img: 'https://play-lh.googleusercontent.com/z_o9Zbkp-r2ZU6_Erc2zNnrJDaD0rSa2mxX90Ucg77VzdTaCJvPj_RWywsT1NcRwBNAZffOM66PYkuOhBqwRlg', fill: true, isPill: true, pillTitle: 'Notes', pillSubtitle: 'Ideas for app' },
  // 8. Gemini - Pill, No badge
  { id: 8, size: 92, x: 108, y: -106, zIndex: 7, img: 'https://static.vecteezy.com/system/resources/previews/055/687/055/non_2x/rectangle-gemini-google-icon-symbol-logo-free-png.png', fill: true, isPill: true, pillTitle: 'Draft Ready', pillSubtitle: 'Tap to review' },
  // 9. Samsung Messages - Michael (Profile)
  { 
    id: 9, 
    size: 52, 
    x: 168, 
    y: -38, 
    zIndex: 1, 
    img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400&h=400', 
    fill: true,
    isPill: true, 
    pillTitle: 'Michael',
    pillSubtitle: 'Incoming call...',
    subIcon: 'https://eu.community.samsung.com/t5/image/serverpage/image-id/3047454iBE0D8A28D91BBB07?v=v2'
  },
  // 10. Gmail
  { id: 10, size: 60, x: 20, y: -274, zIndex: 2, img: 'https://play-lh.googleusercontent.com/svYPOxOnLB4GNn0mEtyukPJxKbAyc3PthMo7x12BlMv-OjRhxUY8L2SK4tQYd7HwpfZ6K0XqEkIEiLWZzTW2_Zk', fill: true },
];

export default function App() {
  const [isPressed, setIsPressed] = useState(false);
  const [hoveredBubble, setHoveredBubble] = useState(null);

  const EXTRA_WIDTH = 135; 

  const { bubbles: bubblesWithPhysics, orb: orbPhysics, panOffset } = useMemo(() => {
    let positions = BUBBLES_CONFIG.map(b => ({
      ...b,
      targetX: isPressed ? b.x : 0,
      targetY: isPressed ? b.y : 0,
      targetWidth: (isPressed && hoveredBubble === b.id && b.isPill) ? b.size + EXTRA_WIDTH : b.size,
      targetScale: !isPressed ? 0.2 : (hoveredBubble === b.id ? (b.isPill ? 1.05 : 1.15) : 1),
      isExpanded: isPressed && hoveredBubble === b.id && b.isPill
    }));

    let orbNode = {
      id: 'orb',
      size: 80,
      targetX: 0,
      targetY: 0,
      targetWidth: 80,
      targetScale: isPressed ? 0.85 : 1,
      isPill: false
    };
    positions.push(orbNode);

    const activeBubble = isPressed && hoveredBubble ? BUBBLES_CONFIG.find(b => b.id === hoveredBubble) : null;
    
    // Physics Iterations
    if (activeBubble?.isPill) {
      // 1. Initial Push from Pill expansion
      for (let i = 0; i < positions.length; i++) {
        let p = positions[i];
        if (p.id === activeBubble.id) continue;

        const minX = activeBubble.x;
        const maxX = activeBubble.x + EXTRA_WIDTH;
        const closestX = Math.max(minX, Math.min(maxX, p.targetX));
        const closestY = activeBubble.y;

        let dx = p.targetX - closestX;
        let dy = p.targetY - closestY;

        // Custom Directional Bias for Spotify -> Gemini interaction
        // Prevent Gemini from being pushed down; force it Up and Right
        if (activeBubble.id === 1 && p.id === 8) {
          if (dy > -10) dy = -30; // Bias upward
          if (dx < 10) dx = 20;   // Bias rightward
        }

        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const safeDist = ((activeBubble.size / 2) * 1.05) + (p.size / 2) + 16; 
        const influenceZone = safeDist + 45; 
        const buffer = 20; 
        const isInPath = p.targetX > activeBubble.x - buffer;

        if (isInPath && dist < influenceZone) {
          const pushFactor = Math.pow((influenceZone - dist) / influenceZone, 1.2);
          const requiredClearance = Math.max(0, safeDist - dist);
          const totalPush = requiredClearance + (pushFactor * 25);
          const angle = Math.atan2(dy, dx);
          p.targetX += Math.cos(angle) * totalPush + (pushFactor * 12);
          p.targetY += Math.sin(angle) * totalPush;
        }
      }

      // 2. Cascading Relaxation loop
      const ITERATIONS = 6;
      const PADDING = 12;

      for (let iter = 0; iter < ITERATIONS; iter++) {
        for (let i = 0; i < positions.length; i++) {
          for (let j = i + 1; j < positions.length; j++) {
            let p1 = positions[i];
            let p2 = positions[j];

            if (p1.id === activeBubble.id || p2.id === activeBubble.id) {
              let pill = p1.id === activeBubble.id ? p1 : p2;
              let bub = p1.id === activeBubble.id ? p2 : p1;
              const minX = pill.x;
              const maxX = pill.x + EXTRA_WIDTH;
              const closestX = Math.max(minX, Math.min(maxX, bub.targetX));
              const closestY = pill.y;
              let dx = bub.targetX - closestX;
              let dy = bub.targetY - closestY;

              // Re-apply bias in relaxation loop to ensure Gemini stays up
              if (activeBubble.id === 1 && bub.id === 8) {
                if (dy > -5) dy = -20;
              }

              const dist = Math.sqrt(dx * dx + dy * dy) || 1;
              const minD = ((pill.size / 2) * 1.05) + (bub.size / 2) + 12;
              if (dist < minD) {
                const diff = minD - dist;
                const angle = Math.atan2(dy, dx);
                bub.targetX += Math.cos(angle) * diff;
                bub.targetY += Math.sin(angle) * diff;
              }
            } else {
              const dx = p2.targetX - p1.targetX;
              const dy = p2.targetY - p1.targetY;
              const dist = Math.sqrt(dx * dx + dy * dy) || 1;
              const minD = (p1.size / 2) + (p2.size / 2) + PADDING;
              if (dist < minD) {
                const diff = (minD - dist) / 2;
                const angle = Math.atan2(dy, dx);
                p1.targetX -= Math.cos(angle) * diff;
                p1.targetY -= Math.sin(angle) * diff;
                p2.targetX += Math.cos(angle) * diff;
                p2.targetY += Math.sin(angle) * diff;
              }
            }
          }
        }
      }
    }

    // 3. TARGETED GENTLE PANNING (Only for the hovered bubble)
    const CANVAS_WIDTH_HALF = 210;
    const CANVAS_HEIGHT_TOTAL = 420;
    const BOTTOM_OFFSET = 46; 
    const TOP_LIMIT = -(CANVAS_HEIGHT_TOTAL - BOTTOM_OFFSET); 
    const BOTTOM_LIMIT = BOTTOM_OFFSET;
    
    let panX = 0;
    let panY = 0;
    const padding = 20;

    const activeItem = positions.find(p => p.id === hoveredBubble);
    
    if (activeItem) {
      const halfSize = activeItem.size / 2;
      const left = activeItem.targetX - halfSize;
      const right = activeItem.targetX + (activeItem.isExpanded ? halfSize + EXTRA_WIDTH : halfSize);
      const top = activeItem.targetY - halfSize;
      const bottom = activeItem.targetY + halfSize;

      if (right > CANVAS_WIDTH_HALF) panX = CANVAS_WIDTH_HALF - right - padding;
      else if (left < -CANVAS_WIDTH_HALF) panX = -CANVAS_WIDTH_HALF - left + padding;

      if (bottom > BOTTOM_LIMIT) panY = BOTTOM_LIMIT - bottom - padding;
      else if (top < TOP_LIMIT) panY = TOP_LIMIT - top + padding;
    }

    const finalOrb = positions.find(p => p.id === 'orb');
    const finalBubbles = positions.filter(p => p.id !== 'orb');
    
    return { bubbles: finalBubbles, orb: finalOrb, panOffset: { x: panX, y: panY } };
  }, [isPressed, hoveredBubble]);

  useEffect(() => {
    if (!isPressed) {
      setHoveredBubble(null);
      return;
    }

    const handleMove = (e) => {
      const clientX = e.clientX ?? (e.touches && e.touches[0].clientX);
      const clientY = e.clientY ?? (e.touches && e.touches[0].clientY);
      if (clientX === undefined || clientY === undefined) return;
      const el = document.elementFromPoint(clientX, clientY);
      const bubbleEl = el?.closest('[data-bubble-id]');
      if (bubbleEl && bubbleEl.dataset.bubbleId) {
        setHoveredBubble(Number(bubbleEl.dataset.bubbleId));
      } else {
        setHoveredBubble(null);
      }
    };

    const handleRelease = () => {
      setIsPressed(false);
      setHoveredBubble(null);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('pointerup', handleRelease);
    window.addEventListener('pointercancel', handleRelease);
    window.addEventListener('touchend', handleRelease);
    
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('pointerup', handleRelease);
      window.removeEventListener('pointercancel', handleRelease);
      window.removeEventListener('touchend', handleRelease);
    };
  }, [isPressed]);

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center font-sans select-none overflow-hidden touch-none">
      <div className="w-[420px] h-[420px] bg-black rounded-3xl shadow-2xl border border-white/10 relative overflow-hidden">
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[80px] h-[80px]">
          
          <motion.div 
            className="absolute top-1/2 left-1/2 z-10 pointer-events-none"
            animate={{ x: panOffset.x, y: panOffset.y }}
            transition={{ type: "spring", stiffness: 100, damping: 22, mass: 0.6 }}
          >
            {bubblesWithPhysics.map((bubble, index) => {
              const subIconSize = bubble.size * 0.38;
              const subIconOffset = bubble.size * 0.60;

              return (
                <motion.div
                  key={bubble.id}
                  data-bubble-id={bubble.id} 
                  className={`absolute flex items-center shadow-xl ${isPressed ? 'pointer-events-auto' : 'pointer-events-none'}`}
                  style={{
                    marginLeft: -bubble.size / 2,
                    marginTop: -bubble.size / 2,
                    zIndex: hoveredBubble === bubble.id ? 50 : bubble.zIndex,
                  }}
                  initial={{ width: bubble.size, height: bubble.size, x: 0, y: 0, scale: 0.2, opacity: 0 }}
                  animate={{
                    width: bubble.targetWidth, height: bubble.size, x: bubble.targetX, y: bubble.targetY, scale: bubble.targetScale,
                    opacity: isPressed ? 1 : 0,
                    boxShadow: hoveredBubble === bubble.id ? '0 25px 50px -12px rgba(0,0,0,0.6)' : '0 15px 35px -5px rgba(0,0,0,0.3)'
                  }}
                  transition={{
                    type: "tween", ease: [0.25, 1, 0.5, 1], duration: 0.4,
                    delay: isPressed ? index * 0.02 : (BUBBLES_CONFIG.length - 1 - index) * 0.02,
                  }}
                >
                  
                  <div className="relative w-full h-full">
                    <div 
                      className="absolute inset-0 rounded-full overflow-hidden pointer-events-none"
                      style={{ backgroundColor: bubble.isPill ? '#2D2D2E' : 'transparent' }}
                    >
                      <div 
                        className="absolute top-0 left-0 flex items-center justify-center rounded-full pointer-events-none" 
                        style={{ width: bubble.size, height: bubble.size }}
                      >
                        <img 
                          src={bubble.img} 
                          alt={`App Icon ${bubble.id}`} 
                          className={`${bubble.fill ? 'w-[102%] h-[102%] object-cover rounded-full' : 'w-[65%] h-[65%] object-contain'} select-none`}
                          onError={(e) => { e.target.src = 'https://img.icons8.com/color/512/application-window.png'; }}
                        />
                      </div>

                      {bubble.isPill && (
                        <motion.div
                          className="absolute top-0 h-full flex flex-col justify-center whitespace-nowrap pointer-events-none"
                          style={{ width: EXTRA_WIDTH, left: bubble.size }}
                          initial={false}
                          animate={{ opacity: bubble.isExpanded ? 1 : 0 }}
                          transition={{ duration: 0.25 }}
                        >
                          <motion.div
                            initial={false}
                            animate={{ x: bubble.isExpanded ? 0 : -15 }}
                            transition={{ duration: 0.35, ease: 'easeOut' }}
                            className="flex flex-col justify-center items-start pl-4"
                          >
                            <div className="text-white font-semibold text-[15.5px] leading-tight mb-0.5 tracking-wide">
                              {bubble.pillTitle}
                            </div>
                            <div className="text-[#A1A1A6] font-medium text-[14px] leading-tight">
                              {bubble.pillSubtitle}
                            </div>
                          </motion.div>
                        </motion.div>
                      )}
                    </div>

                    {bubble.subIcon && (
                      <div 
                        className="absolute z-20 overflow-hidden bg-white rounded-full flex items-center justify-center shadow-lg border-[1.5px] border-black/10"
                        style={{ 
                          width: subIconSize, 
                          height: subIconSize,
                          left: subIconOffset,
                          top: subIconOffset
                        }}
                      >
                        <img 
                          src={bubble.subIcon} 
                          alt="Sub Icon" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    )}
                  </div>

                  {bubble.badge && (
                    <motion.div
                      className="absolute z-30 bg-[#FF3B30] text-white text-[12px] font-bold rounded-full flex items-center justify-center border-[2.5px] border-black pointer-events-none"
                      style={{ width: 24, height: 24, top: -2, left: bubble.size - 24 }}
                      initial={false}
                      animate={{ scale: isPressed ? 1 : 0, opacity: isPressed ? 1 : 0 }}
                      transition={{ type: "spring", damping: 20, stiffness: 350, delay: 0.2 }}
                    >
                      {bubble.badge}
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>

          <motion.div
            onPointerDown={(e) => { e.preventDefault(); setIsPressed(true); }}
            animate={{ 
              scale: isPressed ? 0.85 : 1, 
              x: orbPhysics.targetX + panOffset.x,
              y: orbPhysics.targetY + panOffset.y,
              backgroundColor: isPressed ? '#c8c2d4' : '#dad6e5'
            }}
            transition={{ 
              scale: { type: "spring", stiffness: 400, damping: 25 },
              x: { type: "spring", stiffness: 100, damping: 22, mass: 0.6 },
              y: { type: "spring", stiffness: 100, damping: 22, mass: 0.6 }
            }}
            className="w-full h-full rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.2)] flex items-center justify-center cursor-pointer z-20 relative overflow-hidden"
          >
            <div className="relative w-8 h-8 pointer-events-none">
              <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[4px] bg-white rounded-full" />
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[4px] bg-white rounded-full" />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}