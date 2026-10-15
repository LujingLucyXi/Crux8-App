import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';

/**
 * Shows a fixed-size (1080x1920) card scaled to its container width.
 * The inner node keeps its layout size, so html-to-image captures it at
 * full 1080x1920 regardless of the display scale.
 */
export function ShareableCardFrame({
  children,
  nodeRef,
}: {
  children: ReactNode;
  nodeRef: RefObject<HTMLDivElement | null>;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const scale = w > 0 ? w / 1080 : 0;
  return (
    <div
      ref={wrapRef}
      style={{
        width: '100%',
        height: w > 0 ? 1920 * scale : 0,
        overflow: 'hidden',
        position: 'relative',
        borderRadius: 24,
      }}
    >
      {w > 0 && (
        <div
          ref={nodeRef}
          style={{
            width: 1080,
            height: 1920,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
