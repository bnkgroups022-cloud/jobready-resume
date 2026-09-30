'use client';
import { useEffect, useRef, useState } from 'react';
import { SHEET_W } from './ResumeView';

// Shows an A4 sheet scaled to fit the screen width (mobile friendly).
export default function ScaledSheet({ children }: { children: React.ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [h, setH] = useState(1123);

  useEffect(() => {
    const update = () => {
      if (outer.current) setScale(Math.min(1, outer.current.clientWidth / SHEET_W));
      if (inner.current) setH(inner.current.offsetHeight);
    };
    update();
    const ro = new ResizeObserver(update);
    if (outer.current) ro.observe(outer.current);
    if (inner.current) ro.observe(inner.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={outer} className="w-full overflow-hidden">
      <div style={{ height: h * scale, width: SHEET_W * scale }} className="mx-auto">
        <div ref={inner} style={{ width: SHEET_W, transform: `scale(${scale})`, transformOrigin: 'top left' }} className="shadow-lg ring-1 ring-slate-200">
          {children}
        </div>
      </div>
    </div>
  );
}
