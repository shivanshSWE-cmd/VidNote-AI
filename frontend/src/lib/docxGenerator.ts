import { Document, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, HeadingLevel, AlignmentType, BorderStyle, ShadingType } from 'docx';
import { saveAs } from 'file-saver';
import { VideoOsintData } from './osintEngine';

export async function generateClientDocx(
  osintData: VideoOsintData,
  englishNotes: string,
  hinglishNotes: string
): Promise<void> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Title
          new Paragraph({
            text: osintData.title,
            heading: HeadingLevel.TITLE,
            spacing: { after: 120 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'VidNote AI — Open API & OSINT Video Intelligence Summary',
                italics: true,
                color: '64748B',
                size: 22,
              }),
            ],
            spacing: { after: 240 },
          }),

          // Metadata Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              createTableRow('Source Platform', osintData.platform.toUpperCase()),
              createTableRow('Source URL', osintData.cleanUrl),
              createTableRow('Content Creator', osintData.uploader),
              createTableRow('Duration', osintData.durationStr),
              createTableRow('Extraction Date', new Date().toLocaleDateString()),
            ],
          }),

          new Paragraph({ text: '', spacing: { after: 240 } }),

          // English Notes Heading
          new Paragraph({
            text: 'English Study Notes',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 240, after: 120 },
          }),
          ...parseMarkdownParagraphs(englishNotes),

          // Hinglish Notes Heading
          new Paragraph({
            text: 'Hinglish Study Notes',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 360, after: 120 },
          }),
          ...parseMarkdownParagraphs(hinglishNotes),

          // OSINT Wikipedia Enrichment
          ...(osintData.wikiEnrichments && osintData.wikiEnrichments.length > 0
            ? [
                new Paragraph({
                  text: 'OSINT Knowledge Enrichment (Open Wikipedia Data)',
                  heading: HeadingLevel.HEADING_1,
                  spacing: { before: 360, after: 120 },
                }),
                ...osintData.wikiEnrichments.flatMap((item) => [
                  new Paragraph({
                    children: [new TextRun({ text: item.term, bold: true, size: 24 })],
                    spacing: { before: 120, after: 60 },
                  }),
                  new Paragraph({
                    text: item.extract,
                    spacing: { after: 120 },
                  }),
                ]),
              ]
            : []),

          // Verbatim Transcript
          new Paragraph({
            text: 'Verbatim Transcript with Timestamps',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 360, after: 120 },
          }),
          ...osintData.transcriptItems.map((item) => {
            const mins = Math.floor(item.start / 60);
            const secs = Math.floor(item.start % 60);
            const timeStr = `[${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}]`;

            return new Paragraph({
              children: [
                new TextRun({ text: `${timeStr} `, bold: true, color: '2563EB' }),
                new TextRun({ text: item.text }),
              ],
              spacing: { after: 60 },
            });
          }),
        ],
      },
    ],
  });

  const blob = await saveAsDocxBlob(doc);
  const safeTitle = osintData.title.replace(/[^a-zA-Z0-9_\-]/g, '_').substring(0, 30);
  saveAs(blob, `VidNote_${safeTitle}.docx`);
}

function createTableRow(key: string, val: string): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 30, type: WidthType.PERCENTAGE },
        shading: { fill: 'F1F5F9', type: ShadingType.CLEAR, color: 'auto' },
        children: [new Paragraph({ children: [new TextRun({ text: key, bold: true, size: 20 })] })],
      }),
      new TableCell({
        width: { size: 70, type: WidthType.PERCENTAGE },
        shading: { fill: 'F8FAFC', type: ShadingType.CLEAR, color: 'auto' },
        children: [new Paragraph({ children: [new TextRun({ text: val, size: 20 })] })],
      }),
    ],
  });
}

function parseMarkdownParagraphs(mdText: string): Paragraph[] {
  const lines = mdText.split('\n');
  const paragraphs: Paragraph[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('# ')) {
      paragraphs.push(new Paragraph({ text: trimmed.replace('# ', ''), heading: HeadingLevel.HEADING_2, spacing: { before: 180, after: 60 } }));
    } else if (trimmed.startsWith('## ')) {
      paragraphs.push(new Paragraph({ text: trimmed.replace('## ', ''), heading: HeadingLevel.HEADING_3, spacing: { before: 120, after: 60 } }));
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      paragraphs.push(new Paragraph({ text: trimmed.substring(2), bullet: { level: 0 }, spacing: { after: 40 } }));
    } else {
      paragraphs.push(new Paragraph({ text: trimmed, spacing: { after: 60 } }));
    }
  }

  return paragraphs;
}

// Convert docx Document to Blob using Packer
import { Packer } from 'docx';
async function saveAsDocxBlob(doc: Document): Promise<Blob> {
  return await Packer.toBlob(doc);
}
