import React, { useEffect, useRef, useState } from 'react';
import { Eye, Zap, Layers, ShieldCheck, Activity } from 'lucide-react';

export type AvatarState = 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING' | 'SLEEPING';

interface ArcReactorHoloProps {
  state: AvatarState;
  audioLevel?: number; // 0 to 1
  isMuted?: boolean;
}

export const ArcReactorHolo: React.FC<ArcReactorHoloProps> = ({
  state,
  audioLevel = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [viewMode, setViewMode] = useState<'MARK42' | 'CORE' | 'TACTICAL'>('MARK42');
  const mousePos = useRef<{ x: number; y: number; targetX: number; targetY: number }>({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
  });

  // Mouse move parallax
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    mousePos.current.targetX = nx * 18;
    mousePos.current.targetY = ny * 14;
  };

  const handleMouseLeave = () => {
    mousePos.current.targetX = 0;
    mousePos.current.targetY = 0;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Load Mark 42 Holographic HUD Image
    const mark42Img = new Image();
    mark42Img.src = '/assets/aistudio/MARK42_82053a0f.png';
    let imgLoaded = false;
    mark42Img.onload = () => {
      imgLoaded = true;
    };

    let animId: number;
    let t = 0;
    let blink = 0;
    let blinkTimer = 0;

    // Cyber particle system
    const particles = Array.from({ length: 30 }, () => ({
      x: Math.random() * 800,
      y: Math.random() * 600,
      size: Math.random() * 2 + 0.8,
      speedY: Math.random() * 0.8 + 0.2,
      speedX: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.6 + 0.2,
    }));

    const render = () => {
      t += 0.024;
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      // Mouse parallax smooth lerp
      mousePos.current.x += (mousePos.current.targetX - mousePos.current.x) * 0.08;
      mousePos.current.y += (mousePos.current.targetY - mousePos.current.y) * 0.08;
      const px = mousePos.current.x;
      const py = mousePos.current.y;

      ctx.clearRect(0, 0, w, h);

      // Status attributes
      const isSleeping = state === 'SLEEPING';
      const isSpeaking = state === 'SPEAKING';
      const isListening = state === 'LISTENING';
      const isThinking = state === 'THINKING';

      // Blinking logic
      blinkTimer++;
      if (isSleeping) {
        blink = 1.0;
      } else if (blinkTimer > 170 + Math.sin(t) * 40) {
        blink = Math.sin((blinkTimer - 170) * 0.35);
        if (blinkTimer > 180) {
          blink = 0;
          blinkTimer = 0;
        }
      } else {
        blink = 0;
      }

      // Energy amplitude
      const voiceVol = Math.max(audioLevel * 1.6, isSpeaking ? 0.45 : isListening ? 0.3 : 0.08);
      const pulseEnergy = isListening
        ? 1.25 + Math.sin(t * 8) * 0.25
        : isSpeaking
        ? 1.35 + voiceVol * 0.7
        : isThinking
        ? 1.1 + Math.sin(t * 5) * 0.2
        : isSleeping
        ? 0.4
        : 1.0 + Math.sin(t * 2) * 0.08;

      // Primary color tint
      const coreHue = isSleeping
        ? 'rgba(70, 110, 130,'
        : isThinking
        ? 'rgba(255, 170, 0,'
        : isListening
        ? 'rgba(0, 255, 136,'
        : 'rgba(0, 212, 255,';

      // Floating / Breathing motion
      const floatY = Math.sin(t * 1.4) * 6 + py;
      const floatX = px;
      const breathScale = 1.0 + Math.sin(t * 1.1) * 0.012;

      // ─────────────────────────────────────────────────────────────
      // 1. BACKGROUND HOLOGRAPHIC AMBIENT GLOW & PARTICLES
      // ─────────────────────────────────────────────────────────────
      // Radial backdrop aura
      const auraGrad = ctx.createRadialGradient(cx + floatX, cy + floatY, 20, cx, cy, Math.min(w, h) * 0.48);
      auraGrad.addColorStop(0, `${coreHue} ${0.15 * pulseEnergy})`);
      auraGrad.addColorStop(0.5, `${coreHue} 0.04)`);
      auraGrad.addColorStop(1, 'rgba(0,6,10,0)');
      ctx.fillStyle = auraGrad;
      ctx.fillRect(0, 0, w, h);

      // Drifting hologram dust particles
      particles.forEach((p) => {
        p.y -= p.speedY;
        p.x += p.speedX;
        if (p.y < 0) p.y = h;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;

        ctx.fillStyle = `${coreHue} ${p.alpha * (isSpeaking ? 1.4 : 0.8)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // ─────────────────────────────────────────────────────────────
      // 2. MARK 42 HOLOGRAPHIC ARMOR HUD PROJECTION
      // ─────────────────────────────────────────────────────────────
      ctx.save();
      ctx.translate(cx + floatX, cy + floatY);
      ctx.scale(breathScale, breathScale);

      if (imgLoaded && mark42Img.complete && mark42Img.naturalWidth > 0) {
        // Draw Mark 42 Hologram image centered with aspect ratio preserve
        const imgAspect = mark42Img.naturalWidth / mark42Img.naturalHeight;
        let drawW = w * 0.95;
        let drawH = drawW / imgAspect;

        if (drawH > h * 0.95) {
          drawH = h * 0.95;
          drawW = drawH * imgAspect;
        }

        // Slight chromatic aberration on speech peaks
        if (isSpeaking && Math.random() < 0.25) {
          ctx.save();
          ctx.globalAlpha = 0.35;
          ctx.drawImage(mark42Img, -drawW / 2 - 3, -drawH / 2, drawW, drawH);
          ctx.restore();
        }

        ctx.globalAlpha = isSleeping ? 0.45 : isSpeaking ? 0.98 : 0.92;
        ctx.drawImage(mark42Img, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.globalAlpha = 1.0;

        // Specific relative points mapped from MARK42 image geometry:
        // Center chest Arc Reactor is at relative coordinates (0, drawH * 0.17)
        // Head eyes are at relative coordinates (0, -drawH * 0.21)
        const reactorCenterX = 0;
        const reactorCenterY = drawH * 0.178;
        const headEyesY = -drawH * 0.218;

        // ─────────────────────────────────────────────────────────────
        // 3. LIVING EYE VISOR FLARES (Luminous Cyan / State Responsive)
        // ─────────────────────────────────────────────────────────────
        const eyeSpread = drawW * 0.038;
        const eyeW = drawW * 0.024;
        const eyeH = drawH * 0.016 * (1 - blink);

        if (eyeH > 0.8) {
          [-eyeSpread, eyeSpread].forEach((eyeX, idx) => {
            const eyeFlare = ctx.createRadialGradient(eyeX, headEyesY, 1, eyeX, headEyesY, eyeW * 2.5 * pulseEnergy);
            eyeFlare.addColorStop(0, '#ffffff');
            eyeFlare.addColorStop(0.3, isThinking ? 'rgba(255,200,50,0.95)' : isListening ? 'rgba(0,255,170,0.95)' : 'rgba(0,230,255,0.98)');
            eyeFlare.addColorStop(0.7, `${coreHue} ${0.65 * pulseEnergy})`);
            eyeFlare.addColorStop(1, 'rgba(0,0,0,0)');

            ctx.fillStyle = eyeFlare;
            ctx.beginPath();
            ctx.ellipse(eyeX, headEyesY, eyeW * 1.8 * pulseEnergy, Math.max(eyeH * 1.6, 1.2), idx === 0 ? -0.1 : 0.1, 0, Math.PI * 2);
            ctx.fill();

            // Eye lens core highlight
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(eyeX, headEyesY, eyeW * 0.6, Math.max(eyeH * 0.5, 0.6), 0, 0, Math.PI * 2);
            ctx.fill();
          });
        }

        // ─────────────────────────────────────────────────────────────
        // 4. ANIMATED CHEST ARC REACTOR OVERLAYS & ROTATING RINGS
        // ─────────────────────────────────────────────────────────────
        ctx.save();
        ctx.translate(reactorCenterX, reactorCenterY);

        const reactorRadius = drawW * 0.098;

        // Outer clockwise calibrated degree dial
        ctx.save();
        ctx.rotate(t * 0.35);
        ctx.strokeStyle = `${coreHue} ${0.65 * pulseEnergy})`;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(0, 0, reactorRadius + 14, 0, Math.PI * 2);
        ctx.stroke();

        // 24 calibrated radial notches
        for (let i = 0; i < 24; i++) {
          const ang = (i * Math.PI) / 12;
          const isMajor = i % 3 === 0;
          const r1 = reactorRadius + 14;
          const r2 = r1 - (isMajor ? 8 : 4);
          ctx.strokeStyle = isMajor ? '#ffffff' : `${coreHue} 0.5)`;
          ctx.lineWidth = isMajor ? 1.8 : 1;
          ctx.beginPath();
          ctx.moveTo(Math.cos(ang) * r1, Math.sin(ang) * r1);
          ctx.lineTo(Math.cos(ang) * r2, Math.sin(ang) * r2);
          ctx.stroke();
        }
        ctx.restore();

        // Counter-clockwise segmented arc shields
        ctx.save();
        ctx.rotate(-t * 0.5);
        ctx.strokeStyle = isThinking ? 'rgba(255,170,0,0.85)' : 'rgba(0,212,255,0.85)';
        ctx.lineWidth = 3;
        for (let i = 0; i < 4; i++) {
          const start = (i * Math.PI) / 2 + 0.15;
          const end = start + Math.PI / 2 - 0.3;
          ctx.beginPath();
          ctx.arc(0, 0, reactorRadius + 2, start, end);
          ctx.stroke();
        }
        ctx.restore();

        // Core pulsating tritium plasma center
        const coreGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, reactorRadius * 0.65 * pulseEnergy);
        coreGrad.addColorStop(0, '#ffffff');
        coreGrad.addColorStop(0.25, `${coreHue} 0.95)`);
        coreGrad.addColorStop(0.7, `${coreHue} 0.35)`);
        coreGrad.addColorStop(1, 'rgba(0,6,10,0)');

        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(0, 0, reactorRadius * 0.65 * pulseEnergy, 0, Math.PI * 2);
        ctx.fill();

        // Acoustic soundwave ripples radiating outward from chest when speaking
        if (isSpeaking || isListening) {
          const waveRadius = (reactorRadius + 16 + (t * 70) % 55);
          const waveAlpha = Math.max(0, 1 - (waveRadius - reactorRadius) / 55);
          ctx.strokeStyle = `${coreHue} ${waveAlpha * 0.75})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, 0, waveRadius, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.restore();

        // ─────────────────────────────────────────────────────────────
        // 5. TARGETING RETICLE & HOLOGRAPHIC HUD SATELLITE (Right Side)
        // ─────────────────────────────────────────────────────────────
        const reticleX = drawW * 0.31;
        const reticleY = -drawH * 0.16;
        const reticleR = drawW * 0.088;

        ctx.save();
        ctx.translate(reticleX, reticleY);

        // Rotating radar reticle
        ctx.save();
        ctx.rotate(t * 0.25);
        ctx.strokeStyle = `${coreHue} 0.55)`;
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.arc(0, 0, reticleR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Crosshairs
        ctx.strokeStyle = `${coreHue} 0.35)`;
        ctx.beginPath();
        ctx.moveTo(-reticleR - 10, 0);
        ctx.lineTo(reticleR + 10, 0);
        ctx.moveTo(0, -reticleR - 10);
        ctx.lineTo(0, reticleR + 10);
        ctx.stroke();
        ctx.restore();

        // Sweeping radar beam
        ctx.save();
        ctx.rotate(-t * 1.2);
        const sweepGrad = ctx.createLinearGradient(0, 0, reticleR, 0);
        sweepGrad.addColorStop(0, 'rgba(0,212,255,0)');
        sweepGrad.addColorStop(1, `${coreHue} 0.45)`);
        ctx.strokeStyle = sweepGrad;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(reticleR, 0);
        ctx.stroke();
        ctx.restore();

        // Target lock text
        ctx.fillStyle = `${coreHue} 0.7)`;
        ctx.font = '8px monospace';
        ctx.fillText('TARGET LOCK: ROMILDO', -reticleR + 5, reticleR + 14);
        ctx.fillText(`TELEMETRY: ${(3.15 + Math.sin(t) * 0.05).toFixed(2)} GJ/s`, -reticleR + 5, reticleR + 24);

        ctx.restore();
      }

      ctx.restore();

      // ─────────────────────────────────────────────────────────────
      // 6. SWEEPING LASER SCANLINE PASS OVER HOLOGRAM
      // ─────────────────────────────────────────────────────────────
      const scanY = (t * 85) % h;
      const scanGrad = ctx.createLinearGradient(0, scanY - 15, 0, scanY + 15);
      scanGrad.addColorStop(0, 'rgba(0, 212, 255, 0)');
      scanGrad.addColorStop(0.5, `${coreHue} ${0.28 * pulseEnergy})`);
      scanGrad.addColorStop(1, 'rgba(0, 212, 255, 0)');

      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, scanY - 15, w, 30);

      // Fine bright laser line
      ctx.strokeStyle = `${coreHue} 0.65)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, scanY);
      ctx.lineTo(w, scanY);
      ctx.stroke();

      // ─────────────────────────────────────────────────────────────
      // 7. BOTTOM ACOUSTIC SPECTRUM FREQUENCY BARS
      // ─────────────────────────────────────────────────────────────
      ctx.save();
      ctx.translate(cx, h - 22);
      const barCount = 36;
      const barW = 3.5;
      const spacing = 7;
      const startX = -((barCount * spacing) / 2);

      for (let b = 0; b < barCount; b++) {
        const distFromCenter = 1 - Math.abs(b - barCount / 2) / (barCount / 2);
        let barH = 3;
        if (isSpeaking || isListening) {
          const wave = Math.sin(t * 14 + b * 0.45) * 0.5 + 0.5;
          const level = Math.max(audioLevel, isSpeaking ? 0.45 : 0.25);
          barH = Math.max(3, wave * level * 30 * distFromCenter);
        } else if (isThinking) {
          barH = Math.max(3, (Math.sin(t * 9 + b * 0.7) * 0.5 + 0.5) * 14 * distFromCenter);
        } else {
          barH = 2 + Math.sin(t * 2 + b * 0.3) * 1.5;
        }

        const bx = startX + b * spacing;
        ctx.fillStyle = isSpeaking
          ? 'rgba(0, 212, 255, 0.9)'
          : isListening
          ? 'rgba(0, 255, 136, 0.9)'
          : isThinking
          ? 'rgba(255, 170, 0, 0.8)'
          : 'rgba(0, 212, 255, 0.35)';
        ctx.fillRect(bx, -barH, barW, barH);
      }
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [state, audioLevel, viewMode]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden bg-[#00060a] select-none cursor-crosshair"
    >
      {/* Background Cyber HUD Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage: `
            radial-gradient(circle at center, rgba(0, 212, 255, 0.15) 0%, transparent 75%),
            linear-gradient(rgba(0, 212, 255, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 212, 255, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 35px 35px, 35px 35px',
        }}
      />

      {/* Hologram Canvas */}
      <canvas
        ref={canvasRef}
        width={760}
        height={540}
        className="w-full h-full object-contain z-10"
      />

      {/* Top Hologram Header Badge */}
      <div className="absolute top-3 left-4 z-20 flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-[#00d4ff] shadow-[0_0_10px_#00d4ff] animate-ping" />
        <span className="text-xs tracking-[0.25em] font-mono font-bold text-[#00d4ff] uppercase">
          HOLOGRAMA MARK 42 // REATOR ARK
        </span>
        <span className="text-[10px] font-mono text-[#3a8a9a] border-l border-[#0d3347] pl-2 hidden sm:inline">
          OPERADOR: SR. ROMILDO
        </span>
      </div>

      <div className="absolute top-3 right-4 z-20 flex items-center gap-2 text-[10px] font-mono text-[#3a8a9a]">
        <span>ESTADO:</span>
        <span
          className={`font-bold uppercase tracking-wider ${
            state === 'SPEAKING'
              ? 'text-[#00d4ff] animate-pulse'
              : state === 'LISTENING'
              ? 'text-[#00ff88] animate-pulse'
              : state === 'THINKING'
              ? 'text-[#ffaa00] animate-pulse'
              : state === 'SLEEPING'
              ? 'text-[#5e6a7e]'
              : 'text-[#8ffcff]'
          }`}
        >
          [{state === 'SPEAKING' ? 'FALANDO' : state === 'LISTENING' ? 'OUVINDO' : state === 'THINKING' ? 'PENSANDO' : state === 'SLEEPING' ? 'EM ESPERA' : 'PRONTO'}]
        </span>
      </div>

      {/* Mode Switcher Buttons */}
      <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-4 z-20 flex items-center gap-1 bg-[#010d14]/85 p-1 rounded-lg border border-[#0d3347] backdrop-blur-sm">
        <button
          onClick={() => setViewMode('MARK42')}
          className={`px-2 sm:px-2.5 py-1 text-[10px] font-mono tracking-wider rounded transition-colors ${
            viewMode === 'MARK42'
              ? 'bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/50 font-bold'
              : 'text-[#3a8a9a] hover:text-[#8ffcff]'
          }`}
          title="Visão Mark 42 Holográfica"
        >
          <Layers className="w-3.5 h-3.5 inline mr-0.5 sm:mr-1" />
          <span className="hidden xs:inline">MARK 42</span>
        </button>
        <button
          onClick={() => setViewMode('CORE')}
          className={`px-2 sm:px-2.5 py-1 text-[10px] font-mono tracking-wider rounded transition-colors ${
            viewMode === 'CORE'
              ? 'bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/50 font-bold'
              : 'text-[#3a8a9a] hover:text-[#8ffcff]'
          }`}
          title="Núcleo do Reator"
        >
          <Zap className="w-3.5 h-3.5 inline mr-0.5 sm:mr-1" />
          <span className="hidden xs:inline">REATOR</span>
        </button>
        <button
          onClick={() => setViewMode('TACTICAL')}
          className={`px-2 sm:px-2.5 py-1 text-[10px] font-mono tracking-wider rounded transition-colors ${
            viewMode === 'TACTICAL'
              ? 'bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/50 font-bold'
              : 'text-[#3a8a9a] hover:text-[#8ffcff]'
          }`}
          title="Telemetria Tática"
        >
          <ShieldCheck className="w-3.5 h-3.5 inline mr-0.5 sm:mr-1" />
          <span className="hidden xs:inline">TÁTICO</span>
        </button>
      </div>
    </div>
  );
};
