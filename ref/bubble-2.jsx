import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';

// Configuration: Pixel-perfect coordinates for the asymmetrical cloud.
const BUBBLES_CONFIG = [
  // CORE LAYER
  { id: 1, size: 126, x: 15, y: -150, zIndex: 20, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Spotify_logo_without_text.svg/3840px-Spotify_logo_without_text.svg.png', fill: true, isPill: true, pillTitle: 'Playing', pillSubtitle: 'Blinding Lights' },
  { id: 3, size: 165, x: -130, y: -185, zIndex: 15, img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400&h=400', fill: true, subIcon: 'https://eu.community.samsung.com/t5/image/serverpage/image-id/3047454iBE0D8A28D91BBB07?v=v2' },
  { id: 9, size: 142, x: 155, y: -185, zIndex: 14, img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR_S27L6jR2Tf9v7R3f2mE4XpE_5A6L_n8W4w&s', fill: true },

  // BOTTOM ROW
  { id: 4, size: 73, x: -150, y: -45, zIndex: 12, img: 'https://play-lh.googleusercontent.com/27PLZbtQ--1B-EDSUI3NWqJ6jUxoAujMEhOolD3eA1nkN6EJv1PFq--sw6yOJP5zreNR', fill: true, isPill: true, pillTitle: 'Health', pillSubtitle: '10,243 steps' },
  { id: 2, size: 86, x: -60, y: -65, zIndex: 13, img: 'https://store-images.s-microsoft.com/image/apps.14785.14423064005243201.42399137-369b-40bb-b5be-ac2f079c41bf.b1d6d110-9d93-441f-ac20-2e04fd7dfe3c', fill: true, isPill: true, pillTitle: 'Ready', pillSubtitle: 'How can I help?', badge: 3 },
  { id: 8, size: 53, x: 25, y: -45, zIndex: 14, img: 'https://static.vecteezy.com/system/resources/previews/055/687/055/non_2x/rectangle-gemini-google-icon-symbol-logo-free-png.png', fill: true },
  { id: 5, size: 87, x: 165, y: -60, zIndex: 16, img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400&h=400', fill: true, subIcon: 'https://eu.community.samsung.com/t5/image/serverpage/image-id/3047454iBE0D8A28D91BBB07?v=v2' },

  // UPPER HORIZON
  { id: 6, size: 125, x: 10, y: -274, zIndex: 10, img: 'https://cdn.vox-cdn.com/thumbor/pOMbzDvdEWS8NIeUuhxp23wi_cU=/1400x1400/filters:format(png)/cdn.vox-cdn.com/uploads/chorus_asset/file/19700731/googlemaps.png', fill: true },
  { id: 10, size: 111, x: -75, y: -330, zIndex: 12, img: 'https://downloadr2.apkmirror.com/wp-content/uploads/2024/12/38/676ed91c8e506_com.sec.android.daemonapp.png', fill: true },
  { id: 7, size: 111, x: 115, y: -320, zIndex: 11, img: 'https://play-lh.googleusercontent.com/z_o9Zbkp-r2ZU6_Erc2zNnrJDaD0rSa2mxX90Ucg77VzdTaCJvPj_RWywsT1NcRwBNAZffOM66PYkuOhBqwRlg', fill: true, isPill: true, pillTitle: 'Notes', pillSubtitle: 'Ideas for app' },
];

export default function App() {
  const [isPressed, setIsPressed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0, nx: 0, ny: 0, active: false });
  
  const containerRef = useRef(null);
  const prevHoveredRef = useRef(null); // Hysteresis ref to prevent hover flickering

  const EXTRA_WIDTH = 135; 
  const MIN_Y = -370;
  const MAX_Y = 0;

  const { bubbles, orb, panOffset, hoveredId } = useMemo(() => {
    // 1. Proportional Camera Panning (The mouse physically drags the camera)
    // nx and ny are normalized coordinates (-1 to 1) from the center of the canvas
    const nx = mousePos.active ? mousePos.nx : 0;
    const ny = mousePos.active ? mousePos.ny : 0;

    // The camera pans up to 75px in the opposite direction of the mouse
    const targetPanX = -nx * 75;
    const targetPanY = -ny * 75;

    // Convert mouse position to internal cluster coordinates
    const clusterMx = mousePos.x - targetPanX;
    const clusterMy = mousePos.y - targetPanY;

    // 2. Map static coordinates through the Magnifier
    let processedBubbles = BUBBLES_CONFIG.map(b => {
      const defaultDepth = 0.7 + (0.5 * (b.y - MIN_Y) / (MAX_Y - MIN_Y));
      let depthScale = defaultDepth;
      let dx = 0, dy = 0;
      let visualSize = b.size * defaultDepth;

      if (isPressed && mousePos.active) {
        const dist = Math.sqrt(Math.pow(b.x - clusterMx, 2) + Math.pow(b.y - clusterMy, 2));
        const maxDist = 260; // Spread of the magnifying glass
        
        const factor = Math.max(0, 1 - dist / maxDist);
        const smoothFactor = factor * factor * (3 - 2 * factor); // Smoothstep curve
        
        // Target visual size maxes out perfectly at 110px
        const minVisualSize = b.size * defaultDepth * 0.85; // Slight shrink outside magnifier
        const maxVisualSize = 110; 
        
        visualSize = minVisualSize + (maxVisualSize - minVisualSize) * smoothFactor;
        depthScale = visualSize / b.size;

        // Subtle deterministic nudge outward from cursor to prevent overlaps
        if (factor > 0) {
          const angle = Math.atan2(b.y - clusterMy, b.x - clusterMx);
          const push = smoothFactor * 12; // Gentle part-the-sea effect
          dx = Math.cos(angle) * push;
          dy = Math.sin(angle) * push;
        }
      }

      return {
        ...b,
        targetX: isPressed ? b.x + dx : 0,
        targetY: isPressed ? b.y + dy : 0,
        baseVisualSize: visualSize,
        targetScale: !isPressed ? 0.2 : depthScale,
        currentDepthScale: depthScale
      };
    });

    // 3. Stable Hit Testing (No feedback loops)
    let bestHit = null;
    let maxZ = -1;

    if (isPressed && mousePos.active) {
      for (let b of processedBubbles) {
        const dx = clusterMx - b.targetX;
        const dy = clusterMy - b.targetY;
        const hitRadius = b.baseVisualSize / 2;

        let isHit = false;
        
        // Hysteresis: If it was hovered in the last frame and expanded into a pill, check the wide rectangle
        if (prevHoveredRef.current === b.id && b.isPill) {
          const scaledExtra = EXTRA_WIDTH * b.currentDepthScale;
          // Generous safe margin (15px) so the cursor doesn't easily slip off the pill
          if (dx >= -hitRadius - 15 && dx <= hitRadius + scaledExtra + 15 && Math.abs(dy) <= hitRadius + 15) {
            isHit = true;
          }
        } else {
          // Standard circular hit test
          if (Math.sqrt(dx*dx + dy*dy) <= hitRadius + 5) {
            isHit = true;
          }
        }

        if (isHit && b.zIndex > maxZ) {
          maxZ = b.zIndex;
          bestHit = b.id;
        }
      }
    }

    prevHoveredRef.current = bestHit; // Save for next frame hysteresis

    // 4. Apply expansion geometry
    processedBubbles = processedBubbles.map(b => {
      const isHovered = bestHit === b.id;
      const isExpanded = isPressed && isHovered && b.isPill;
      return {
        ...b,
        isExpanded,
        targetWidth: isExpanded ? b.size + EXTRA_WIDTH : b.size,
        targetScale: isHovered ? b.targetScale * 1.05 : b.targetScale // Tiny 5% bump when actively hovered
      };
    });

    const orbNode = { id: 'orb', size: 80, targetX: 0, targetY: 0, targetWidth: 80, targetScale: isPressed ? 0.85 : 1, isPill: false };

    return { 
      bubbles: processedBubbles, 
      orb: orbNode, 
      panOffset: { x: targetPanX, y: targetPanY }, 
      hoveredId: bestHit 
    };
  }, [isPressed, mousePos]);

  useEffect(() => {
    if (!isPressed) { 
      setMousePos(prev => ({ ...prev, active: false }));
      return; 
    }

    const handleMove = (e) => {
      if (!containerRef.current) return;
      const clientX = e.clientX ?? (e.touches && e.touches[0].clientX);
      const clientY = e.clientY ?? (e.touches && e.touches[0].clientY);
      if (clientX === undefined || clientY === undefined) return;

      const rect = containerRef.current.getBoundingClientRect();
      const containerX = clientX - rect.left;
      const containerY = clientY - rect.top;

      // Normalize mouse coordinates (-1 to 1) from the center of the 420x420 container
      const nx = Math.max(-1, Math.min(1, (containerX - 210) / 210));
      const ny = Math.max(-1, Math.min(1, (containerY - 210) / 210));

      // Calculate raw mouse position relative to the cluster's base origin (the Orb)
      const mx = containerX - 210;
      const my = containerY - 356; // Orb sits 64px from the bottom (420 - 64 = 356)

      setMousePos({ x: mx, y: my, nx, ny, active: true });
    };

    const handleRelease = () => setIsPressed(false);
    
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
      <div 
        ref={containerRef}
        className="canvas-container w-[420px] h-[420px] bg-black rounded-3xl shadow-2xl border border-white/10 relative overflow-hidden"
      >
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[80px] h-[80px]">
          <motion.div 
            className="absolute top-1/2 left-1/2 z-10 pointer-events-none"
            animate={{ x: panOffset.x, y: panOffset.y }}
            transition={{ type: "tween", ease: "easeOut", duration: mousePos.active ? 0.3 : 1.0 }} 
          >
            {bubbles.map((bubble, index) => {
              const subIconSize = bubble.size * 0.38;
              const subIconOffset = bubble.size * 0.60;
              const staggerDelay = index * 0.025; 
              
              // Snappy follow when active, elegant graceful float when opening
              const animSpeed = mousePos.active ? 0.25 : 0.45;

              return (
                <motion.div
                  key={bubble.id}
                  data-bubble-id={bubble.id} 
                  className={`absolute flex items-center shadow-xl ${isPressed ? 'pointer-events-auto' : 'pointer-events-none'}`}
                  style={{
                    marginLeft: -bubble.size / 2, 
                    marginTop: -bubble.size / 2,
                    zIndex: hoveredId === bubble.id ? 50 : bubble.zIndex,
                    transformOrigin: `${bubble.size / 2}px ${bubble.size / 2}px` 
                  }}
                  initial={{ width: bubble.size, height: bubble.size, x: 0, y: 0, scale: 0.2, opacity: 0 }}
                  animate={{
                    width: bubble.targetWidth, height: bubble.size, x: bubble.targetX, y: bubble.targetY, scale: bubble.targetScale,
                    opacity: isPressed ? 1 : 0,
                    boxShadow: hoveredId === bubble.id ? '0 25px 50px -12px rgba(0,0,0,0.6)' : '0 15px 35px -5px rgba(0,0,0,0.3)'
                  }}
                  transition={{ 
                    x: { type: "tween", ease: "easeOut", duration: animSpeed, delay: mousePos.active ? 0 : staggerDelay },
                    y: { type: "tween", ease: "easeOut", duration: animSpeed, delay: mousePos.active ? 0 : staggerDelay },
                    width: { type: "tween", ease: [0.16, 1, 0.3, 1], duration: 0.6 },
                    scale: { type: "tween", ease: "easeOut", duration: animSpeed, delay: mousePos.active ? 0 : staggerDelay },
                    opacity: { duration: 0.45, delay: staggerDelay },
                    boxShadow: { duration: 0.3 }
                  }}
                >
                  <div className="relative w-full h-full">
                    <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none" style={{ backgroundColor: bubble.isPill ? '#2D2D2E' : 'transparent' }}>
                      <div className="absolute top-0 left-0 flex items-center justify-center rounded-full pointer-events-none" style={{ width: bubble.size, height: bubble.size }}>
                        <img src={bubble.img} className={`${bubble.fill ? 'w-[102%] h-[102%] object-cover rounded-full' : 'w-[65%] h-[65%] object-contain'} select-none`} />
                      </div>
                      {bubble.isPill && (
                        <motion.div className="absolute top-0 h-full flex flex-col justify-center whitespace-nowrap pointer-events-none" style={{ width: EXTRA_WIDTH, left: bubble.size }} initial={false} animate={{ opacity: bubble.isExpanded ? 1 : 0 }} transition={{ duration: 0.3 }}>
                          <motion.div initial={false} animate={{ x: bubble.isExpanded ? 0 : -15 }} transition={{ duration: 0.4, ease: 'easeOut' }} className="flex flex-col justify-center items-start pl-4">
                            <div className="text-white font-semibold text-[15.5px] leading-tight mb-0.5 tracking-wide">{bubble.pillTitle}</div>
                            <div className="text-[#A1A1A6] font-medium text-[14px] leading-tight">{bubble.pillSubtitle}</div>
                          </motion.div>
                        </motion.div>
                      )}
                    </div>
                    {bubble.subIcon && (
                      <div className="absolute z-20 overflow-hidden bg-white rounded-full flex items-center justify-center shadow-lg border-[1.5px] border-black/10" style={{ width: subIconSize, height: subIconSize, left: subIconOffset, top: subIconOffset }}>
                        <img src={bubble.subIcon} className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                  {bubble.badge && (
                    <motion.div className="absolute z-30 bg-[#FF3B30] text-white text-[12px] font-bold rounded-full flex items-center justify-center border-[2.5px] border-black pointer-events-none" style={{ width: 24, height: 24, top: -2, left: bubble.size - 24 }} animate={{ scale: isPressed ? 1 : 0, opacity: isPressed ? 1 : 0 }} transition={{ type: "spring", damping: 20, stiffness: 350, delay: 0.2 }}>{bubble.badge}</motion.div>
                  )}
                </motion.div>
              );
            })}

            <motion.div 
              onPointerDown={(e) => { 
                e.preventDefault(); 
                setIsPressed(true); 
                setMousePos({ x: 0, y: 0, nx: 0, ny: 0, active: false }); 
              }} 
              animate={{ 
                scale: isPressed ? 0.85 : 1, 
                x: orb.targetX, 
                y: orb.targetY, 
                backgroundColor: isPressed ? '#c8c2d4' : '#dad6e5' 
              }} 
              transition={{ type: "tween", ease: [0.16, 1, 0.3, 1], duration: isPressed ? 0.45 : 1.0 }} 
              className="absolute left-0 top-0 w-[80px] h-[80px] -ml-[40px] -mt-[40px] rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.2)] flex items-center justify-center cursor-pointer z-20 relative overflow-hidden pointer-events-auto"
            >
              <div className="relative w-8 h-8 pointer-events-none">
                <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[4px] bg-white rounded-full" />
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[4px] bg-white rounded-full" />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}