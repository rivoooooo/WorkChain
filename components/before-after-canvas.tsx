'use client';

import React, { useRef, useEffect, useState } from 'react';

interface BeforeAfterCanvasProps {
  beforeSrc?: string;
  afterSrc?: string;
  className?: string;
}

export function BeforeAfterCanvas({
  beforeSrc = '/before.webp',
  afterSrc = '/after.webp',
  className = ''
}: BeforeAfterCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let isHovering = false;

    // Target and current mouse position for smooth lerp
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    // Blob radius & animation phase for organic liquid motion
    let currentRadius = 0;
    let targetRadius = 0;
    let phase = 0;

    // Load images
    const imgBefore = new Image();
    const imgAfter = new Image();
    let beforeLoaded = false;
    let afterLoaded = false;

    const checkLoaded = () => {
      if (beforeLoaded && afterLoaded) {
        setIsLoaded(true);
        resizeCanvas();
      }
    };

    imgBefore.onload = () => {
      beforeLoaded = true;
      checkLoaded();
    };
    imgAfter.onload = () => {
      afterLoaded = true;
      checkLoaded();
    };

    imgBefore.src = beforeSrc;
    imgAfter.src = afterSrc;

    // Resize canvas to match container's display size
    const resizeCanvas = () => {
      if (!container || !canvas) return;
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      // Center initial position
      if (targetX === 0 && targetY === 0) {
        targetX = canvas.width / 2;
        targetY = canvas.height / 2;
        currentX = targetX;
        currentY = targetY;
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });
    resizeObserver.observe(container);

    // Draw an irregular organic liquid blob path
    const drawOrganicBlob = (
      context: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      baseRadius: number,
      currentPhase: number
    ) => {
      const points = 10;
      context.beginPath();

      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2;
        // Generate organic distortion using multi-frequency sine modulation
        const distortion =
          Math.sin(angle * 3 + currentPhase) * 12 +
          Math.cos(angle * 2 - currentPhase * 1.5) * 8 +
          Math.sin(angle * 5 + currentPhase * 0.8) * 6;

        const r = Math.max(10, baseRadius + distortion);
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;

        if (i === 0) {
          context.moveTo(x, y);
        } else {
          // Smooth curve using quadratic control point
          const prevAngle = ((i - 1) / points) * Math.PI * 2;
          const prevDistortion =
            Math.sin(prevAngle * 3 + currentPhase) * 12 +
            Math.cos(prevAngle * 2 - currentPhase * 1.5) * 8 +
            Math.sin(prevAngle * 5 + currentPhase * 0.8) * 6;
          const prevR = Math.max(10, baseRadius + prevDistortion);
          const prevX = cx + Math.cos(prevAngle) * prevR;
          const prevY = cy + Math.sin(prevAngle) * prevR;

          const cpX = (prevX + x) / 2;
          const cpY = (prevY + y) / 2;
          context.quadraticCurveTo(prevX, prevY, cpX, cpY);
        }
      }
      context.closePath();
    };

    // Helper: Draw image with cover fit
    const drawImageCover = (
      context: CanvasRenderingContext2D,
      img: HTMLImageElement
    ) => {
      const cWidth = canvas.width;
      const cHeight = canvas.height;
      const iWidth = img.naturalWidth || cWidth;
      const iHeight = img.naturalHeight || cHeight;

      const scale = Math.max(cWidth / iWidth, cHeight / iHeight);
      const x = (cWidth - iWidth * scale) / 2;
      const y = (cHeight - iHeight * scale) / 2;

      context.drawImage(img, x, y, iWidth * scale, iHeight * scale);
    };

    // Animation Loop
    const render = () => {
      phase += 0.03;

      // Smooth position lerp
      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;

      // Smooth radius lerp
      targetRadius = isHovering ? Math.min(canvas.width, canvas.height) * 0.22 : 0;
      currentRadius += (targetRadius - currentRadius) * 0.1;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (beforeLoaded) {
        // 1. Draw Before image as base layer
        drawImageCover(ctx, imgBefore);
      }

      // 2. Draw After image inside the irregular reveal blob
      if (afterLoaded && currentRadius > 2) {
        ctx.save();

        // Create irregular mask
        drawOrganicBlob(ctx, currentX, currentY, currentRadius, phase);
        ctx.clip();

        // Draw After image inside mask
        drawImageCover(ctx, imgAfter);

        // Soft stroke on the organic edge for high quality liquid outline
        ctx.lineWidth = 4 * (window.devicePixelRatio || 1);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.stroke();

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // Mouse & Touch Event Handlers
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      targetX = (e.clientX - rect.left) * dpr;
      targetY = (e.clientY - rect.top) * dpr;
      isHovering = true;
    };

    const handleMouseEnter = () => {
      isHovering = true;
    };

    const handleMouseLeave = () => {
      isHovering = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const rect = container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        targetX = (e.touches[0].clientX - rect.left) * dpr;
        targetY = (e.touches[0].clientY - rect.top) * dpr;
        isHovering = true;
      }
    };

    const handleTouchEnd = () => {
      isHovering = false;
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [beforeSrc, afterSrc]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden select-none cursor-crosshair ${className}`}
    >
      {/* Canvas Element */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block object-cover"
      />

      {/* Fallback CSS image before JS/Canvas loads */}
      {!isLoaded && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={beforeSrc}
          alt="WorkChain Hero Visual"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
    </div>
  );
}
