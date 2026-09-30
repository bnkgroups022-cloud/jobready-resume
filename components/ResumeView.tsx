'use client';
import type { ResumeData } from '@/lib/types';
import { buildResume, SIDEBAR_KEYS, type Section } from '@/lib/sections';

// A4 at 96dpi = 794 x 1123 px. The sheet is always rendered at this size and
// scaled down on small screens by <ScaledSheet>.
export const SHEET_W = 794;

type Props = { data: ResumeData; template: string; accent?: string };

export default function ResumeView({ data, template, accent }: Props) {
  const m = buildResume(data);
  const color = accent || DEFAULT_ACCENT[template] || '#1f3a8a';

  if (template === 'modern') {
    const side = m.sections.filter((s) => SIDEBAR_KEYS.includes(s.key));
    const main = m.sections.filter((s) => !SIDEBAR_KEYS.includes(s.key));
    return (
      <div className="resume-sheet" style={{ display: 'flex', fontFamily: 'Arial, Helvetica, sans-serif' }}>
        <aside style={{ width: 250, background: color, color: '#fff', padding: '36px 22px', minHeight: 1123 }}>
          <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.2 }}>{m.name}</div>
          <div style={{ fontSize: 13, opacity: 0.9, marginTop: 6 }}>{m.headline}</div>
          <SideTitle>Contact</SideTitle>
          {m.contacts.map((c) => (
            <div key={c} style={{ fontSize: 11.5, marginBottom: 5, wordBreak: 'break-word' }}>{c}</div>
          ))}
          {side.map((s) => (
            <div key={s.key}>
              <SideTitle>{s.title}</SideTitle>
              <SectionBody s={s} color="#fff" compact />
            </div>
          ))}
        </aside>
        <main style={{ flex: 1, padding: '36px 30px' }}>
          {main.map((s) => (
            <div key={s.key} style={{ marginBottom: 16 }}>
              <h3 style={{ color, fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, borderBottom: `2px solid ${color}`, paddingBottom: 3, marginBottom: 8 }}>{s.title}</h3>
              <SectionBody s={s} color={color} />
            </div>
          ))}
        </main>
      </div>
    );
  }

  if (template === 'professional') {
    return (
      <div className="resume-sheet" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
        <header style={{ background: color, color: '#fff', padding: '30px 40px' }}>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: 0.5 }}>{m.name}</div>
          <div style={{ fontSize: 14, marginTop: 4, opacity: 0.95 }}>{m.headline}</div>
          <div style={{ fontSize: 11.5, marginTop: 10, opacity: 0.95 }}>{m.contacts.join('   |   ')}</div>
        </header>
        <div style={{ padding: '22px 40px' }}>
          {m.sections.map((s) => (
            <div key={s.key} style={{ marginBottom: 14 }}>
              <h3 style={{ color, fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
                {s.title}
                <span style={{ flex: 1, height: 1, background: '#d1d5db' }} />
              </h3>
              <SectionBody s={s} color={color} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const simple = template === 'simple';
  return (
    <div className="resume-sheet" style={{ fontFamily: simple ? 'Arial, Helvetica, sans-serif' : '"Times New Roman", Georgia, serif', padding: '40px 46px' }}>
      <header style={{ textAlign: simple ? 'left' : 'center', marginBottom: 14, borderBottom: simple ? `3px solid ${color}` : 'none', paddingBottom: simple ? 10 : 0 }}>
        <div style={{ fontSize: simple ? 26 : 28, fontWeight: 700, color: simple ? '#111' : color, letterSpacing: simple ? 0 : 1, textTransform: simple ? 'none' : 'uppercase' }}>{m.name}</div>
        <div style={{ fontSize: 13, color: '#374151', marginTop: 3 }}>{m.headline}</div>
        <div style={{ fontSize: 11.5, color: '#374151', marginTop: 5 }}>{m.contacts.join('  •  ')}</div>
      </header>
      {m.sections.map((s) => (
        <div key={s.key} style={{ marginBottom: 13 }}>
          <h3
            style={
              simple
                ? { fontSize: 13.5, fontWeight: 700, background: '#f3f4f6', padding: '3px 8px', marginBottom: 6, color: '#111' }
                : { fontSize: 14, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: 1, borderBottom: `1.5px solid ${color}`, paddingBottom: 2, marginBottom: 6 }
            }
          >
            {s.title}
          </h3>
          <SectionBody s={s} color={color} />
        </div>
      ))}
    </div>
  );
}

export const DEFAULT_ACCENT: Record<string, string> = {
  classic: '#1f3a8a',
  simple: '#111827',
  modern: '#0f766e',
  professional: '#7c2d12',
};

function SideTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 12.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 20, marginBottom: 8, borderBottom: '1px solid rgba(255,255,255,.4)', paddingBottom: 3 }}>
      {children}
    </div>
  );
}

function SectionBody({ s, color, compact }: { s: Section; color: string; compact?: boolean }) {
  const text = compact ? '#fff' : '#1f2937';
  const fs = compact ? 11.5 : 12.5;
  switch (s.kind) {
    case 'text':
      return (
        <div style={{ fontSize: fs, color: text, lineHeight: 1.5 }}>
          <p>{s.text}</p>
          {s.foot && <p style={{ marginTop: 18, whiteSpace: 'pre-wrap' }}>{s.foot}</p>}
        </div>
      );
    case 'tags':
      return compact ? (
        <ul style={{ fontSize: fs, lineHeight: 1.6, paddingLeft: 14, listStyle: 'disc' }}>
          {s.items.map((i) => <li key={i}>{i}</li>)}
        </ul>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 18px', fontSize: fs, color: text }}>
          {s.items.map((i) => (
            <span key={i}>
              <span style={{ color, marginRight: 5 }}>▸</span>
              {i}
            </span>
          ))}
        </div>
      );
    case 'bullets':
      return (
        <ul style={{ fontSize: fs, color: text, lineHeight: 1.55, paddingLeft: 18, listStyle: 'disc' }}>
          {s.items.map((i, k) => <li key={k}>{i}</li>)}
        </ul>
      );
    case 'entries':
      return (
        <div>
          {s.entries.map((e, k) => (
            <div key={k} style={{ marginBottom: 8, fontSize: fs, color: text }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <b>{e.title}</b>
                {e.meta && <span style={{ color: '#4b5563', whiteSpace: 'nowrap' }}>{e.meta}</span>}
              </div>
              {e.subtitle && <div style={{ color: '#374151' }}>{e.subtitle}</div>}
              {e.bullets && e.bullets.length > 0 && (
                <ul style={{ paddingLeft: 18, listStyle: 'disc', lineHeight: 1.5, marginTop: 2 }}>
                  {e.bullets.map((b, j) => <li key={j}>{b}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>
      );
    case 'kv':
      if (compact)
        return (
          <div style={{ fontSize: fs, color: text }}>
            {s.rows.map(([k, v]) => (
              <div key={k} style={{ marginBottom: 5 }}>
                <div style={{ opacity: 0.8, fontSize: 10.5 }}>{k}</div>
                <div>{v}</div>
              </div>
            ))}
          </div>
        );
      return (
        <table style={{ fontSize: fs, color: text, borderCollapse: 'collapse' }}>
          <tbody>
            {s.rows.map(([k, v]) => (
              <tr key={k}>
                <td style={{ padding: '1px 12px 1px 0', fontWeight: 600, verticalAlign: 'top', whiteSpace: compact ? 'normal' : 'nowrap' }}>{k}</td>
                <td style={{ padding: '1px 0', verticalAlign: 'top' }}>{compact ? '' : ': '}{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
  }
}
