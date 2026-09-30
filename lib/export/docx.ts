// Editable Word (.docx) export. Loaded only when user clicks "Download Word".
import { AlignmentType, BorderStyle, Document, Packer, Paragraph, TabStopType, TextRun } from 'docx';
import type { ResumeData } from '../types';
import { buildResume, type Section } from '../sections';

const DEFAULT_ACCENT: Record<string, string> = { classic: '1f3a8a', simple: '111827', modern: '0f766e', professional: '7c2d12' };

export async function makeDocxBlob(data: ResumeData, template: string, accent?: string): Promise<Blob> {
  const m = buildResume(data);
  const color = (accent || '').replace('#', '') || DEFAULT_ACCENT[template] || '1f3a8a';
  const font = template === 'classic' || template === 'professional' ? 'Times New Roman' : 'Arial';
  const centered = template === 'classic';
  const kids: Paragraph[] = [];

  kids.push(
    new Paragraph({
      alignment: centered ? AlignmentType.CENTER : AlignmentType.LEFT,
      children: [new TextRun({ text: centered ? m.name.toUpperCase() : m.name, bold: true, size: 40, color, font })],
    }),
  );
  if (m.headline)
    kids.push(new Paragraph({ alignment: centered ? AlignmentType.CENTER : AlignmentType.LEFT, children: [new TextRun({ text: m.headline, size: 22, font })] }));
  kids.push(
    new Paragraph({
      alignment: centered ? AlignmentType.CENTER : AlignmentType.LEFT,
      spacing: { after: 160 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 12, color, space: 4 } },
      children: [new TextRun({ text: m.contacts.join('  |  '), size: 19, font })],
    }),
  );

  for (const s of m.sections) {
    kids.push(
      new Paragraph({
        spacing: { before: 200, after: 80 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color, space: 2 } },
        children: [new TextRun({ text: s.title.toUpperCase(), bold: true, size: 22, color, font })],
      }),
    );
    kids.push(...body(s, font));
  }

  const doc = new Document({
    creator: m.name,
    title: `${m.name} - Resume`,
    styles: { default: { document: { run: { font, size: 21 } } } },
    sections: [{ properties: { page: { margin: { top: 720, bottom: 720, left: 850, right: 850 } } }, children: kids }],
  });
  return Packer.toBlob(doc);
}

function bullet(text: string, font: string) {
  return new Paragraph({ bullet: { level: 0 }, spacing: { after: 30 }, children: [new TextRun({ text, font })] });
}

function body(s: Section, font: string): Paragraph[] {
  switch (s.kind) {
    case 'text': {
      const out = [new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: s.text, font })] })];
      if (s.foot) out.push(new Paragraph({ spacing: { before: 300 }, children: [new TextRun({ text: s.foot, font })] }));
      return out;
    }
    case 'tags':
      return [new Paragraph({ children: [new TextRun({ text: s.items.join('   •   '), font })] })];
    case 'bullets':
      return s.items.map((i) => bullet(i, font));
    case 'entries': {
      const out: Paragraph[] = [];
      for (const e of s.entries) {
        out.push(
          new Paragraph({
            spacing: { before: 60 },
            tabStops: [{ type: TabStopType.RIGHT, position: 10200 }],
            children: [new TextRun({ text: e.title, bold: true, font }), ...(e.meta ? [new TextRun({ text: `\t${e.meta}`, font, color: '4b5563' })] : [])],
          }),
        );
        if (e.subtitle) out.push(new Paragraph({ children: [new TextRun({ text: e.subtitle, font, color: '374151' })] }));
        for (const b of e.bullets || []) out.push(bullet(b, font));
      }
      return out;
    }
    case 'kv':
      return s.rows.map(
        ([k, v]) =>
          new Paragraph({
            tabStops: [{ type: TabStopType.LEFT, position: 2200 }],
            children: [new TextRun({ text: k, bold: true, font }), new TextRun({ text: `\t: ${v}`, font })],
          }),
      );
  }
}
