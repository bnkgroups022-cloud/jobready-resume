// Real text PDF (selectable, ATS-friendly) using @react-pdf/renderer.
// Loaded only when the user clicks "Download PDF".
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';
import type { ResumeData } from '../types';
import { buildResume, SIDEBAR_KEYS, type Section } from '../sections';

const DEFAULT_ACCENT: Record<string, string> = { classic: '#1f3a8a', simple: '#111827', modern: '#0f766e', professional: '#7c2d12' };

const st = StyleSheet.create({
  page: { fontSize: 9.5, color: '#1f2937', lineHeight: 1.4 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  bulletRow: { flexDirection: 'row', marginBottom: 1.5 },
  bulletDot: { width: 10 },
  bulletText: { flex: 1 },
});

function Body({ s, color, compact, font }: { s: Section; color: string; compact?: boolean; font: string }) {
  const txt = compact ? '#ffffff' : '#1f2937';
  const muted = compact ? '#e5e7eb' : '#4b5563';
  const bold = font === 'Times-Roman' ? 'Times-Bold' : 'Helvetica-Bold';
  switch (s.kind) {
    case 'text':
      return (
        <View>
          <Text style={{ color: txt }}>{s.text}</Text>
          {s.foot ? <Text style={{ color: txt, marginTop: 14 }}>{s.foot}</Text> : null}
        </View>
      );
    case 'tags':
      if (compact)
        return (
          <View>
            {s.items.map((i, k) => (
              <View key={k} style={st.bulletRow}><Text style={[st.bulletDot, { color: txt }]}>•</Text><Text style={[st.bulletText, { color: txt }]}>{i}</Text></View>
            ))}
          </View>
        );
      return (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {s.items.map((i, k) => (
            <Text key={k} style={{ color: txt, marginRight: 14, marginBottom: 2 }}>
              <Text style={{ color }}>• </Text>{i}
            </Text>
          ))}
        </View>
      );
    case 'bullets':
      return (
        <View>
          {s.items.map((i, k) => (
            <View key={k} style={st.bulletRow}><Text style={[st.bulletDot, { color: txt }]}>•</Text><Text style={[st.bulletText, { color: txt }]}>{i}</Text></View>
          ))}
        </View>
      );
    case 'entries':
      return (
        <View>
          {s.entries.map((e, k) => (
            <View key={k} style={{ marginBottom: 6 }} wrap={false}>
              <View style={st.row}>
                <Text style={{ fontFamily: bold, color: txt, flex: 1 }}>{e.title}</Text>
                {e.meta ? <Text style={{ color: muted }}>{e.meta}</Text> : null}
              </View>
              {e.subtitle ? <Text style={{ color: muted }}>{e.subtitle}</Text> : null}
              {(e.bullets || []).map((b, j) => (
                <View key={j} style={st.bulletRow}><Text style={st.bulletDot}>•</Text><Text style={st.bulletText}>{b}</Text></View>
              ))}
            </View>
          ))}
        </View>
      );
    case 'kv':
      return (
        <View>
          {s.rows.map(([k, v]) =>
            compact ? (
              <View key={k} style={{ marginBottom: 4 }}>
                <Text style={{ color: '#e5e7eb', fontSize: 8 }}>{k}</Text>
                <Text style={{ color: txt }}>{v}</Text>
              </View>
            ) : (
              <View key={k} style={{ flexDirection: 'row', marginBottom: 1.5 }}>
                <Text style={{ width: 95, fontFamily: bold }}>{k}</Text>
                <Text style={{ flex: 1 }}>: {v}</Text>
              </View>
            ),
          )}
        </View>
      );
  }
}

function ResumePdf({ data, template, accent }: { data: ResumeData; template: string; accent?: string }) {
  const m = buildResume(data);
  const color = accent || DEFAULT_ACCENT[template] || '#1f3a8a';

  if (template === 'modern') {
    const side = m.sections.filter((s) => SIDEBAR_KEYS.includes(s.key));
    const main = m.sections.filter((s) => !SIDEBAR_KEYS.includes(s.key));
    return (
      <Document title={`${m.name} - Resume`} author={m.name}>
        <Page size="A4" style={[st.page, { fontFamily: 'Helvetica', flexDirection: 'row' }]}>
          <View fixed style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 180, backgroundColor: color }} />
          <View style={{ width: 180, paddingVertical: 26, paddingHorizontal: 16, color: '#fff' }}>
            <Text style={{ fontSize: 17, fontFamily: 'Helvetica-Bold', color: '#fff' }}>{m.name}</Text>
            <Text style={{ fontSize: 10, color: '#fff', marginTop: 4 }}>{m.headline}</Text>
            <Text style={sideTitle}>CONTACT</Text>
            {m.contacts.map((c) => <Text key={c} style={{ color: '#fff', marginBottom: 3 }}>{c}</Text>)}
            {side.map((s) => (
              <View key={s.key}>
                <Text style={sideTitle}>{s.title.toUpperCase()}</Text>
                <Body s={s} color="#fff" compact font="Helvetica" />
              </View>
            ))}
          </View>
          <View style={{ flex: 1, paddingVertical: 26, paddingHorizontal: 22 }}>
            {main.map((s) => (
              <View key={s.key} style={{ marginBottom: 11 }}>
                <Text style={{ fontFamily: 'Helvetica-Bold', color, fontSize: 10.5, borderBottomWidth: 1.5, borderBottomColor: color, paddingBottom: 2, marginBottom: 5 }}>{s.title.toUpperCase()}</Text>
                <Body s={s} color={color} font="Helvetica" />
              </View>
            ))}
          </View>
        </Page>
      </Document>
    );
  }

  if (template === 'professional') {
    return (
      <Document title={`${m.name} - Resume`} author={m.name}>
        <Page size="A4" style={[st.page, { fontFamily: 'Times-Roman', paddingBottom: 28 }]}>
          <View style={{ backgroundColor: color, paddingVertical: 22, paddingHorizontal: 30, color: '#fff' }}>
            <Text style={{ fontSize: 21, fontFamily: 'Times-Bold', color: '#fff' }}>{m.name}</Text>
            <Text style={{ fontSize: 11, color: '#fff', marginTop: 2 }}>{m.headline}</Text>
            <Text style={{ fontSize: 9, color: '#fff', marginTop: 7 }}>{m.contacts.join('   |   ')}</Text>
          </View>
          <View style={{ paddingTop: 16, paddingRight: 30, paddingBottom: 0, paddingLeft: 30 }}>
            {m.sections.map((s) => (
              <View key={s.key} style={{ marginBottom: 10 }}>
                <Text style={{ fontFamily: 'Times-Bold', color, fontSize: 11, borderBottomWidth: 0.75, borderBottomColor: '#d1d5db', paddingBottom: 2, marginBottom: 5 }}>{s.title.toUpperCase()}</Text>
                <Body s={s} color={color} font="Times-Roman" />
              </View>
            ))}
          </View>
        </Page>
      </Document>
    );
  }

  const simple = template === 'simple';
  const font = simple ? 'Helvetica' : 'Times-Roman';
  const bold = simple ? 'Helvetica-Bold' : 'Times-Bold';
  return (
    <Document title={`${m.name} - Resume`} author={m.name}>
      <Page size="A4" style={[st.page, { fontFamily: font, paddingVertical: 30, paddingHorizontal: 34 }]}>
        <View style={{ alignItems: simple ? 'flex-start' : 'center', marginBottom: 10, borderBottomWidth: simple ? 2 : 0, borderBottomColor: color, paddingBottom: simple ? 7 : 0 }}>
          <Text style={{ fontSize: 20, fontFamily: bold, color: simple ? '#111' : color }}>{simple ? m.name : m.name.toUpperCase()}</Text>
          <Text style={{ fontSize: 10, color: '#374151', marginTop: 2 }}>{m.headline}</Text>
          <Text style={{ fontSize: 9, color: '#374151', marginTop: 3 }}>{m.contacts.join('  •  ')}</Text>
        </View>
        {m.sections.map((s) => (
          <View key={s.key} style={{ marginBottom: 9 }}>
            <Text
              style={
                simple
                  ? { fontFamily: bold, fontSize: 10.5, backgroundColor: '#f3f4f6', paddingVertical: 2, paddingHorizontal: 6, marginBottom: 4 }
                  : { fontFamily: bold, fontSize: 10.5, color, borderBottomWidth: 1, borderBottomColor: color, paddingBottom: 1, marginBottom: 4 }
              }
            >
              {simple ? s.title : s.title.toUpperCase()}
            </Text>
            <Body s={s} color={color} font={font} />
          </View>
        ))}
      </Page>
    </Document>
  );
}

const sideTitle = { fontFamily: 'Helvetica-Bold', fontSize: 9.5, color: '#fff', marginTop: 14, marginBottom: 5, borderBottomWidth: 0.75, borderBottomColor: '#d1d5db', paddingBottom: 2 } as const;

export async function makePdfBlob(data: ResumeData, template: string, accent?: string): Promise<Blob> {
  return pdf(<ResumePdf data={data} template={template} accent={accent} />).toBlob();
}
