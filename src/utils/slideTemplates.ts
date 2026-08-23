import pptxgen from 'pptxgenjs';
import { cleanHexColor } from './pptxExporter';

// 16:9 Standard Presentation Dimensions in Inches (13.333 x 7.5)
export const SLIDE_WIDTH = 13.333;
export const SLIDE_HEIGHT = 7.5;

// Theme Colors Configuration Interface
export interface EditorialTheme {
  name: string;
  bg: string;              // Slide Background color (#rrggbb)
  primaryText: string;     // Main headline color
  secondaryText: string;   // Body / subtitle color
  mutedText: string;       // Subtle metadata / caption color
  accent: string;          // Highlight / brand accent color
  accentLight?: string;    // Soft tint of accent for badges / pill fills
  cardBg: string;          // Card / Container background
  cardBorder: string;      // Card stroke / border color
  headingFont: string;     // e.g. "Outfit", "Playfair Display", "Georgia", "Arial"
  bodyFont: string;        // e.g. "Inter", "Plus Jakarta Sans", "Calibri"
}

export const DEFAULT_EDITORIAL_THEMES: Record<string, EditorialTheme> = {
  editorialLight: {
    name: 'Editorial Minimal Light',
    bg: '#FBFBFC',
    primaryText: '#0F172A',
    secondaryText: '#334155',
    mutedText: '#64748B',
    accent: '#2563EB',
    accentLight: '#EFF6FF',
    cardBg: '#FFFFFF',
    cardBorder: '#E2E8F0',
    headingFont: 'Georgia',
    bodyFont: 'Calibri',
  },
  darkTitanium: {
    name: 'Titanium Dark',
    bg: '#0B0F19',
    primaryText: '#F8FAFC',
    secondaryText: '#CBD5E1',
    mutedText: '#94A3B8',
    accent: '#6366F1',
    accentLight: '#1E1B4B',
    cardBg: '#131B2E',
    cardBorder: '#23304D',
    headingFont: 'Segoe UI',
    bodyFont: 'Arial',
  },
  emeraldVenture: {
    name: 'Emerald Venture',
    bg: '#041F1A',
    primaryText: '#F0FDF4',
    secondaryText: '#A7F3D0',
    mutedText: '#6EE7B7',
    accent: '#10B981',
    accentLight: '#064E3B',
    cardBg: '#08332B',
    cardBorder: '#0F5144',
    headingFont: 'Segoe UI',
    bodyFont: 'Arial',
  },
  warmSunset: {
    name: 'Warm Sunset',
    bg: '#180E29',
    primaryText: '#FFF1F2',
    secondaryText: '#FDA4AF',
    mutedText: '#F472B6',
    accent: '#F43F5E',
    accentLight: '#4C0519',
    cardBg: '#2A1124',
    cardBorder: '#50143A',
    headingFont: 'Georgia',
    bodyFont: 'Calibri',
  },
};

// ==========================================
// 1. Title Cover Layout
// ==========================================
export interface TitleCoverData {
  kicker?: string;          // e.g. "ANNUAL REPORT 2026"
  title: string;           // e.g. "The Future of Scalable Artificial Intelligence"
  subtitle: string;        // e.g. "Strategic Insights, Performance Metrics, and Market Horizons"
  author: string;          // e.g. "Dr. Sarah Chen"
  authorRole?: string;     // e.g. "Chief Executive Officer & Co-Founder"
  dateOrCompany?: string;  // e.g. "SlideCraft Technologies • Confidential"
  notes?: string;
}

export function renderTitleCover(
  pres: pptxgen,
  slide: pptxgen.Slide,
  data: TitleCoverData,
  theme: EditorialTheme = DEFAULT_EDITORIAL_THEMES.darkTitanium
) {
  // Background
  slide.background = { color: cleanHexColor(theme.bg) };

  // Decorative Accent bar on the left
  slide.addShape(pres.ShapeType.rect, {
    x: 0.8,
    y: 1.0,
    w: 0.08,
    h: 5.5,
    fill: { color: cleanHexColor(theme.accent) },
    line: { width: 0, color: cleanHexColor(theme.accent) },
  });

  // Kicker / Category pill
  if (data.kicker) {
    slide.addShape(pres.ShapeType.roundRect, {
      x: 1.2,
      y: 1.1,
      w: 3.2,
      h: 0.38,
      fill: { color: cleanHexColor(theme.accentLight || theme.cardBg) },
      line: { color: cleanHexColor(theme.accent), width: 1 },
    });

    slide.addText(data.kicker.toUpperCase(), {
      x: 1.2,
      y: 1.1,
      w: 3.2,
      h: 0.38,
      fontSize: 10,
      fontFace: theme.headingFont,
      bold: true,
      color: cleanHexColor(theme.accent),
      align: 'center',
      valign: 'middle',
    });
  }

  // Main Title
  slide.addText(data.title, {
    x: 1.2,
    y: data.kicker ? 1.7 : 1.3,
    w: 10.8,
    h: 2.4,
    fontSize: 40,
    fontFace: theme.headingFont,
    bold: true,
    color: cleanHexColor(theme.primaryText),
    align: 'left',
    valign: 'top',
    wrap: true,
  });

  // Subtitle
  slide.addText(data.subtitle, {
    x: 1.2,
    y: data.kicker ? 4.2 : 3.8,
    w: 9.8,
    h: 1.3,
    fontSize: 16,
    fontFace: theme.bodyFont,
    color: cleanHexColor(theme.secondaryText),
    align: 'left',
    valign: 'top',
    wrap: true,
  });

  // Bottom Divider
  slide.addShape(pres.ShapeType.line, {
    x: 1.2,
    y: 5.8,
    w: 10.8,
    h: 0,
    line: { color: cleanHexColor(theme.cardBorder), width: 1.5 },
  });

  // Author Credentials
  const authorInfo = data.authorRole ? `${data.author}\n${data.authorRole}` : data.author;
  slide.addText(authorInfo, {
    x: 1.2,
    y: 6.0,
    w: 5.5,
    h: 0.9,
    fontSize: 12,
    fontFace: theme.headingFont,
    bold: true,
    color: cleanHexColor(theme.primaryText),
    align: 'left',
    valign: 'top',
  });

  // Metadata / Date
  if (data.dateOrCompany) {
    slide.addText(data.dateOrCompany, {
      x: 7.0,
      y: 6.0,
      w: 5.0,
      h: 0.9,
      fontSize: 11,
      fontFace: theme.bodyFont,
      color: cleanHexColor(theme.mutedText),
      align: 'right',
      valign: 'top',
    });
  }

  if (data.notes) slide.addNotes(data.notes);
}

// ==========================================
// 2. Split Photo Editorial Layout
// ==========================================
export interface SplitPhotoEditorialData {
  kicker?: string;
  title: string;
  bodyParagraphs: string[];
  calloutQuote?: string;
  imageSrc?: string;       // Path or Base64
  imageCaption?: string;
  photoOnRight?: boolean;  // Default true
  notes?: string;
}

export function renderSplitPhotoEditorial(
  pres: pptxgen,
  slide: pptxgen.Slide,
  data: SplitPhotoEditorialData,
  theme: EditorialTheme = DEFAULT_EDITORIAL_THEMES.darkTitanium
) {
  slide.background = { color: cleanHexColor(theme.bg) };
  const photoRight = data.photoOnRight ?? true;

  const textX = photoRight ? 0.9 : 7.0;
  const imageX = photoRight ? 7.0 : 0.9;
  const columnW = 5.4;

  // 1. Text Column
  if (data.kicker) {
    slide.addText(data.kicker.toUpperCase(), {
      x: textX,
      y: 0.8,
      w: columnW,
      h: 0.3,
      fontSize: 10,
      fontFace: theme.headingFont,
      bold: true,
      color: cleanHexColor(theme.accent),
      align: 'left',
    });
  }

  // Headline
  slide.addText(data.title, {
    x: textX,
    y: data.kicker ? 1.2 : 0.8,
    w: columnW,
    h: 1.6,
    fontSize: 26,
    fontFace: theme.headingFont,
    bold: true,
    color: cleanHexColor(theme.primaryText),
    align: 'left',
    valign: 'top',
    wrap: true,
  });

  // Body Paragraphs
  const bodyText = data.bodyParagraphs.join('\n\n');
  slide.addText(bodyText, {
    x: textX,
    y: data.kicker ? 2.9 : 2.5,
    w: columnW,
    h: data.calloutQuote ? 2.5 : 4.0,
    fontSize: 12,
    fontFace: theme.bodyFont,
    color: cleanHexColor(theme.secondaryText),
    align: 'left',
    valign: 'top',
    wrap: true,
  });

  // Callout Quote Card if provided
  if (data.calloutQuote) {
    slide.addShape(pres.ShapeType.roundRect, {
      x: textX,
      y: 5.5,
      w: columnW,
      h: 1.3,
      fill: { color: cleanHexColor(theme.cardBg) },
      line: { color: cleanHexColor(theme.accent), width: 1.5 },
    });

    slide.addText(`“${data.calloutQuote}”`, {
      x: textX + 0.3,
      y: 5.6,
      w: columnW - 0.6,
      h: 1.1,
      fontSize: 12,
      fontFace: theme.headingFont,
      italic: true,
      color: cleanHexColor(theme.primaryText),
      align: 'left',
      valign: 'middle',
      wrap: true,
    });
  }

  // 2. Photo / Visual Column
  if (data.imageSrc) {
    try {
      slide.addImage({
        path: !data.imageSrc.startsWith('data:') ? data.imageSrc : undefined,
        data: data.imageSrc.startsWith('data:') ? data.imageSrc : undefined,
        x: imageX,
        y: 0.8,
        w: columnW,
        h: 5.4,
      });
    } catch {
      // Fallback placeholder container
      slide.addShape(pres.ShapeType.roundRect, {
        x: imageX,
        y: 0.8,
        w: columnW,
        h: 5.4,
        fill: { color: cleanHexColor(theme.cardBg) },
        line: { color: cleanHexColor(theme.cardBorder), width: 1 },
      });
    }
  } else {
    // Elegant container placeholder
    slide.addShape(pres.ShapeType.roundRect, {
      x: imageX,
      y: 0.8,
      w: columnW,
      h: 5.4,
      fill: { color: cleanHexColor(theme.cardBg) },
      line: { color: cleanHexColor(theme.cardBorder), width: 1.5 },
    });

    slide.addText('IMAGE / VISUAL SHOWCASE', {
      x: imageX,
      y: 3.2,
      w: columnW,
      h: 0.5,
      fontSize: 12,
      fontFace: theme.headingFont,
      bold: true,
      color: cleanHexColor(theme.mutedText),
      align: 'center',
      valign: 'middle',
    });
  }

  if (data.imageCaption) {
    slide.addText(data.imageCaption, {
      x: imageX,
      y: 6.3,
      w: columnW,
      h: 0.4,
      fontSize: 10,
      fontFace: theme.bodyFont,
      color: cleanHexColor(theme.mutedText),
      italic: true,
      align: 'left',
    });
  }

  if (data.notes) slide.addNotes(data.notes);
}

// ==========================================
// 3. Big Stat Callout Layout
// ==========================================
export interface SupportingStat {
  value: string;
  label: string;
}

export interface BigStatCalloutData {
  kicker?: string;
  mainStatValue: string;        // e.g. "87.4%" or "$120M"
  mainStatLabel: string;        // e.g. "Reduction in Model Inference Overhead"
  mainStatDescription: string;  // Detailed contextual paragraph
  trendBadge?: string;          // e.g. "+34% YoY"
  supportingStats?: SupportingStat[]; // 2-3 secondary metrics
  notes?: string;
}

export function renderBigStatCallout(
  pres: pptxgen,
  slide: pptxgen.Slide,
  data: BigStatCalloutData,
  theme: EditorialTheme = DEFAULT_EDITORIAL_THEMES.darkTitanium
) {
  slide.background = { color: cleanHexColor(theme.bg) };

  // Header kicker
  if (data.kicker) {
    slide.addText(data.kicker.toUpperCase(), {
      x: 1.0,
      y: 0.7,
      w: 11.3,
      h: 0.3,
      fontSize: 10,
      fontFace: theme.headingFont,
      bold: true,
      color: cleanHexColor(theme.accent),
      align: 'left',
    });
  }

  // Left Column: The Giant Metric Card
  slide.addShape(pres.ShapeType.roundRect, {
    x: 1.0,
    y: 1.2,
    w: 5.6,
    h: 5.4,
    fill: { color: cleanHexColor(theme.cardBg) },
    line: { color: cleanHexColor(theme.accent), width: 1.5 },
  });

  // Main Big Value
  slide.addText(data.mainStatValue, {
    x: 1.3,
    y: 1.6,
    w: 5.0,
    h: 1.8,
    fontSize: 64,
    fontFace: theme.headingFont,
    bold: true,
    color: cleanHexColor(theme.primaryText),
    align: 'left',
    valign: 'top',
  });

  // Trend Badge
  if (data.trendBadge) {
    slide.addShape(pres.ShapeType.roundRect, {
      x: 1.3,
      y: 3.5,
      w: 2.2,
      h: 0.4,
      fill: { color: cleanHexColor(theme.accentLight || theme.bg) },
      line: { color: cleanHexColor(theme.accent), width: 1 },
    });

    slide.addText(data.trendBadge, {
      x: 1.3,
      y: 3.5,
      w: 2.2,
      h: 0.4,
      fontSize: 11,
      fontFace: theme.headingFont,
      bold: true,
      color: cleanHexColor(theme.accent),
      align: 'center',
      valign: 'middle',
    });
  }

  // Main Stat Label
  slide.addText(data.mainStatLabel, {
    x: 1.3,
    y: 4.1,
    w: 5.0,
    h: 1.0,
    fontSize: 18,
    fontFace: theme.headingFont,
    bold: true,
    color: cleanHexColor(theme.primaryText),
    align: 'left',
    valign: 'top',
    wrap: true,
  });

  // Right Column: Detailed Narrative & Supporting Stats
  slide.addText('STRATEGIC IMPACT & CONTEXT', {
    x: 7.1,
    y: 1.2,
    w: 5.2,
    h: 0.3,
    fontSize: 11,
    fontFace: theme.headingFont,
    bold: true,
    color: cleanHexColor(theme.mutedText),
  });

  slide.addText(data.mainStatDescription, {
    x: 7.1,
    y: 1.6,
    w: 5.2,
    h: 2.2,
    fontSize: 13,
    fontFace: theme.bodyFont,
    color: cleanHexColor(theme.secondaryText),
    align: 'left',
    valign: 'top',
    wrap: true,
  });

  // Secondary Supporting Stats Grid
  if (data.supportingStats && data.supportingStats.length > 0) {
    const startY = 4.0;
    const cardH = 1.2;
    const gap = 0.2;

    data.supportingStats.slice(0, 2).forEach((stat, idx) => {
      const cy = startY + idx * (cardH + gap);
      slide.addShape(pres.ShapeType.roundRect, {
        x: 7.1,
        y: cy,
        w: 5.2,
        h: cardH,
        fill: { color: cleanHexColor(theme.cardBg) },
        line: { color: cleanHexColor(theme.cardBorder), width: 1 },
      });

      slide.addText(stat.value, {
        x: 7.4,
        y: cy + 0.15,
        w: 1.8,
        h: 0.9,
        fontSize: 24,
        fontFace: theme.headingFont,
        bold: true,
        color: cleanHexColor(theme.accent),
        valign: 'middle',
      });

      slide.addText(stat.label, {
        x: 9.3,
        y: cy + 0.15,
        w: 2.8,
        h: 0.9,
        fontSize: 11,
        fontFace: theme.bodyFont,
        color: cleanHexColor(theme.secondaryText),
        valign: 'middle',
        wrap: true,
      });
    });
  }

  if (data.notes) slide.addNotes(data.notes);
}

// ==========================================
// 4. 2-Column Story Layout
// ==========================================
export interface ColumnContent {
  tag?: string;
  heading: string;
  body: string;
  bullets?: string[];
}

export interface TwoColumnStoryData {
  mainKicker?: string;
  mainTitle: string;
  column1: ColumnContent;
  column2: ColumnContent;
  notes?: string;
}

export function renderTwoColumnStory(
  pres: pptxgen,
  slide: pptxgen.Slide,
  data: TwoColumnStoryData,
  theme: EditorialTheme = DEFAULT_EDITORIAL_THEMES.darkTitanium
) {
  slide.background = { color: cleanHexColor(theme.bg) };

  // Main Header
  if (data.mainKicker) {
    slide.addText(data.mainKicker.toUpperCase(), {
      x: 1.0,
      y: 0.6,
      w: 11.3,
      h: 0.3,
      fontSize: 10,
      fontFace: theme.headingFont,
      bold: true,
      color: cleanHexColor(theme.accent),
      align: 'left',
    });
  }

  slide.addText(data.mainTitle, {
    x: 1.0,
    y: data.mainKicker ? 1.0 : 0.6,
    w: 11.3,
    h: 1.0,
    fontSize: 28,
    fontFace: theme.headingFont,
    bold: true,
    color: cleanHexColor(theme.primaryText),
    align: 'left',
    valign: 'top',
  });

  const cols = [
    { ...data.column1, x: 1.0 },
    { ...data.column2, x: 7.0 },
  ];
  const colW = 5.3;
  const colY = 2.2;
  const colH = 4.6;

  cols.forEach((col) => {
    // Card Container
    slide.addShape(pres.ShapeType.roundRect, {
      x: col.x,
      y: colY,
      w: colW,
      h: colH,
      fill: { color: cleanHexColor(theme.cardBg) },
      line: { color: cleanHexColor(theme.cardBorder), width: 1.5 },
    });

    let currentY = colY + 0.35;

    // Tag
    if (col.tag) {
      slide.addText(col.tag.toUpperCase(), {
        x: col.x + 0.4,
        y: currentY,
        w: colW - 0.8,
        h: 0.3,
        fontSize: 10,
        fontFace: theme.headingFont,
        bold: true,
        color: cleanHexColor(theme.accent),
      });
      currentY += 0.4;
    }

    // Heading
    slide.addText(col.heading, {
      x: col.x + 0.4,
      y: currentY,
      w: colW - 0.8,
      h: 0.8,
      fontSize: 18,
      fontFace: theme.headingFont,
      bold: true,
      color: cleanHexColor(theme.primaryText),
      valign: 'top',
      wrap: true,
    });
    currentY += 0.85;

    // Body
    slide.addText(col.body, {
      x: col.x + 0.4,
      y: currentY,
      w: colW - 0.8,
      h: 1.5,
      fontSize: 12,
      fontFace: theme.bodyFont,
      color: cleanHexColor(theme.secondaryText),
      align: 'left',
      valign: 'top',
      wrap: true,
    });
    currentY += 1.55;

    // Bullets
    if (col.bullets && col.bullets.length > 0) {
      const bulletsText = col.bullets.map((b) => `• ${b}`).join('\n');
      slide.addText(bulletsText, {
        x: col.x + 0.4,
        y: currentY,
        w: colW - 0.8,
        h: 1.2,
        fontSize: 11,
        fontFace: theme.bodyFont,
        color: cleanHexColor(theme.mutedText),
        align: 'left',
        valign: 'top',
        wrap: true,
      });
    }
  });

  if (data.notes) slide.addNotes(data.notes);
}

// ==========================================
// 5. Asymmetric Quote Layout
// ==========================================
export interface AsymmetricQuoteData {
  quote: string;
  authorName: string;
  authorTitle: string;
  authorCompany?: string;
  contextTag?: string;
  highlightNumber?: string;
  highlightLabel?: string;
  notes?: string;
}

export function renderAsymmetricQuote(
  pres: pptxgen,
  slide: pptxgen.Slide,
  data: AsymmetricQuoteData,
  theme: EditorialTheme = DEFAULT_EDITORIAL_THEMES.darkTitanium
) {
  slide.background = { color: cleanHexColor(theme.bg) };

  // Main Card Container for Quote (Left / Center)
  slide.addShape(pres.ShapeType.roundRect, {
    x: 1.0,
    y: 1.0,
    w: 8.0,
    h: 5.5,
    fill: { color: cleanHexColor(theme.cardBg) },
    line: { color: cleanHexColor(theme.cardBorder), width: 1.5 },
  });

  // Giant Quotation Mark Symbol
  slide.addText('“', {
    x: 1.4,
    y: 1.1,
    w: 1.5,
    h: 1.2,
    fontSize: 90,
    fontFace: 'Georgia',
    color: cleanHexColor(theme.accent),
    valign: 'top',
  });

  // Quote Statement Text
  slide.addText(data.quote, {
    x: 1.5,
    y: 2.2,
    w: 7.0,
    h: 2.6,
    fontSize: 22,
    fontFace: theme.headingFont,
    italic: true,
    color: cleanHexColor(theme.primaryText),
    align: 'left',
    valign: 'top',
    wrap: true,
  });

  // Author Details
  const authorFull = `${data.authorName}\n${data.authorTitle}${data.authorCompany ? ` • ${data.authorCompany}` : ''}`;
  slide.addText(authorFull, {
    x: 1.5,
    y: 5.0,
    w: 7.0,
    h: 1.0,
    fontSize: 12,
    fontFace: theme.headingFont,
    bold: true,
    color: cleanHexColor(theme.accent),
    align: 'left',
    valign: 'top',
  });

  // Right Side Highlight Card (Asymmetric Element)
  slide.addShape(pres.ShapeType.roundRect, {
    x: 9.3,
    y: 1.0,
    w: 3.0,
    h: 5.5,
    fill: { color: cleanHexColor(theme.accentLight || theme.cardBg) },
    line: { color: cleanHexColor(theme.accent), width: 1.5 },
  });

  if (data.contextTag) {
    slide.addText(data.contextTag.toUpperCase(), {
      x: 9.5,
      y: 1.4,
      w: 2.6,
      h: 0.4,
      fontSize: 10,
      fontFace: theme.headingFont,
      bold: true,
      color: cleanHexColor(theme.accent),
      align: 'center',
    });
  }

  if (data.highlightNumber) {
    slide.addText(data.highlightNumber, {
      x: 9.5,
      y: 2.6,
      w: 2.6,
      h: 1.2,
      fontSize: 36,
      fontFace: theme.headingFont,
      bold: true,
      color: cleanHexColor(theme.primaryText),
      align: 'center',
      valign: 'middle',
    });
  }

  if (data.highlightLabel) {
    slide.addText(data.highlightLabel, {
      x: 9.5,
      y: 3.9,
      w: 2.6,
      h: 1.8,
      fontSize: 12,
      fontFace: theme.bodyFont,
      color: cleanHexColor(theme.secondaryText),
      align: 'center',
      valign: 'top',
      wrap: true,
    });
  }

  if (data.notes) slide.addNotes(data.notes);
}

// ==========================================
// 6. Timeline Layout
// ==========================================
export interface TimelineEvent {
  step: string;          // e.g. "Phase 01" or "2024"
  title: string;         // e.g. "Foundation & Pilot"
  description: string;   // e.g. "Deployed core multi-agent engine..."
  isCurrent?: boolean;
}

export interface TimelineData {
  kicker?: string;
  title: string;
  subtitle?: string;
  events: TimelineEvent[]; // 3-4 steps
  notes?: string;
}

export function renderTimeline(
  pres: pptxgen,
  slide: pptxgen.Slide,
  data: TimelineData,
  theme: EditorialTheme = DEFAULT_EDITORIAL_THEMES.darkTitanium
) {
  slide.background = { color: cleanHexColor(theme.bg) };

  // Header
  if (data.kicker) {
    slide.addText(data.kicker.toUpperCase(), {
      x: 1.0,
      y: 0.6,
      w: 11.3,
      h: 0.3,
      fontSize: 10,
      fontFace: theme.headingFont,
      bold: true,
      color: cleanHexColor(theme.accent),
    });
  }

  slide.addText(data.title, {
    x: 1.0,
    y: data.kicker ? 1.0 : 0.6,
    w: 11.3,
    h: 0.8,
    fontSize: 28,
    fontFace: theme.headingFont,
    bold: true,
    color: cleanHexColor(theme.primaryText),
    align: 'left',
  });

  // Connecting Progress Horizontal Line
  slide.addShape(pres.ShapeType.line, {
    x: 1.5,
    y: 2.5,
    w: 10.3,
    h: 0,
    line: { color: cleanHexColor(theme.accent), width: 3 },
  });

  const eventCount = Math.min(4, Math.max(2, data.events.length));
  const cardW = (11.3 - (eventCount - 1) * 0.3) / eventCount;

  data.events.slice(0, 4).forEach((event, idx) => {
    const cardX = 1.0 + idx * (cardW + 0.3);

    // Step Node Marker Circle on line
    slide.addShape(pres.ShapeType.ellipse, {
      x: cardX + cardW / 2 - 0.2,
      y: 2.3,
      w: 0.4,
      h: 0.4,
      fill: { color: cleanHexColor(event.isCurrent ? theme.accent : theme.cardBg) },
      line: { color: cleanHexColor(theme.accent), width: 2 },
    });

    // Milestone Event Card below
    slide.addShape(pres.ShapeType.roundRect, {
      x: cardX,
      y: 3.1,
      w: cardW,
      h: 3.6,
      fill: { color: cleanHexColor(theme.cardBg) },
      line: {
        color: cleanHexColor(event.isCurrent ? theme.accent : theme.cardBorder),
        width: event.isCurrent ? 2 : 1,
      },
    });

    // Step / Year Label
    slide.addText(event.step.toUpperCase(), {
      x: cardX + 0.2,
      y: 3.3,
      w: cardW - 0.4,
      h: 0.35,
      fontSize: 11,
      fontFace: theme.headingFont,
      bold: true,
      color: cleanHexColor(theme.accent),
      align: 'left',
    });

    // Event Title
    slide.addText(event.title, {
      x: cardX + 0.2,
      y: 3.75,
      w: cardW - 0.4,
      h: 0.7,
      fontSize: 14,
      fontFace: theme.headingFont,
      bold: true,
      color: cleanHexColor(theme.primaryText),
      align: 'left',
      valign: 'top',
      wrap: true,
    });

    // Description
    slide.addText(event.description, {
      x: cardX + 0.2,
      y: 4.55,
      w: cardW - 0.4,
      h: 1.9,
      fontSize: 11,
      fontFace: theme.bodyFont,
      color: cleanHexColor(theme.secondaryText),
      align: 'left',
      valign: 'top',
      wrap: true,
    });
  });

  if (data.notes) slide.addNotes(data.notes);
}

// ==========================================
// 7. Grid 3-Card Layout
// ==========================================
export interface GridCardItem {
  tag?: string;
  title: string;
  description: string;
  footerMetric?: string;
}

export interface Grid3CardData {
  kicker?: string;
  title: string;
  subtitle?: string;
  cards: [GridCardItem, GridCardItem, GridCardItem];
  notes?: string;
}

export function renderGrid3Card(
  pres: pptxgen,
  slide: pptxgen.Slide,
  data: Grid3CardData,
  theme: EditorialTheme = DEFAULT_EDITORIAL_THEMES.darkTitanium
) {
  slide.background = { color: cleanHexColor(theme.bg) };

  // Header
  if (data.kicker) {
    slide.addText(data.kicker.toUpperCase(), {
      x: 1.0,
      y: 0.6,
      w: 11.3,
      h: 0.3,
      fontSize: 10,
      fontFace: theme.headingFont,
      bold: true,
      color: cleanHexColor(theme.accent),
    });
  }

  slide.addText(data.title, {
    x: 1.0,
    y: data.kicker ? 0.95 : 0.6,
    w: 11.3,
    h: 0.8,
    fontSize: 28,
    fontFace: theme.headingFont,
    bold: true,
    color: cleanHexColor(theme.primaryText),
    align: 'left',
  });

  if (data.subtitle) {
    slide.addText(data.subtitle, {
      x: 1.0,
      y: data.kicker ? 1.75 : 1.4,
      w: 11.3,
      h: 0.5,
      fontSize: 13,
      fontFace: theme.bodyFont,
      color: cleanHexColor(theme.secondaryText),
      align: 'left',
    });
  }

  const cardW = 3.55;
  const cardGap = 0.32;
  const cardY = data.subtitle ? 2.4 : 2.1;
  const cardH = data.subtitle ? 4.4 : 4.7;

  data.cards.slice(0, 3).forEach((card, idx) => {
    const cardX = 1.0 + idx * (cardW + cardGap);

    // Card Container
    slide.addShape(pres.ShapeType.roundRect, {
      x: cardX,
      y: cardY,
      w: cardW,
      h: cardH,
      fill: { color: cleanHexColor(theme.cardBg) },
      line: { color: cleanHexColor(theme.cardBorder), width: 1.5 },
    });

    let currentY = cardY + 0.35;

    // Card Tag / Badge
    if (card.tag) {
      slide.addText(card.tag.toUpperCase(), {
        x: cardX + 0.3,
        y: currentY,
        w: cardW - 0.6,
        h: 0.3,
        fontSize: 10,
        fontFace: theme.headingFont,
        bold: true,
        color: cleanHexColor(theme.accent),
      });
      currentY += 0.4;
    }

    // Card Title
    slide.addText(card.title, {
      x: cardX + 0.3,
      y: currentY,
      w: cardW - 0.6,
      h: 0.8,
      fontSize: 18,
      fontFace: theme.headingFont,
      bold: true,
      color: cleanHexColor(theme.primaryText),
      valign: 'top',
      wrap: true,
    });
    currentY += 0.85;

    // Card Description
    slide.addText(card.description, {
      x: cardX + 0.3,
      y: currentY,
      w: cardW - 0.6,
      h: card.footerMetric ? 1.8 : 2.4,
      fontSize: 12,
      fontFace: theme.bodyFont,
      color: cleanHexColor(theme.secondaryText),
      align: 'left',
      valign: 'top',
      wrap: true,
    });

    // Optional Footer Metric Pill
    if (card.footerMetric) {
      slide.addShape(pres.ShapeType.roundRect, {
        x: cardX + 0.3,
        y: cardY + cardH - 0.8,
        w: cardW - 0.6,
        h: 0.45,
        fill: { color: cleanHexColor(theme.accentLight || theme.bg) },
        line: { color: cleanHexColor(theme.accent), width: 1 },
      });

      slide.addText(card.footerMetric, {
        x: cardX + 0.3,
        y: cardY + cardH - 0.8,
        w: cardW - 0.6,
        h: 0.45,
        fontSize: 11,
        fontFace: theme.headingFont,
        bold: true,
        color: cleanHexColor(theme.accent),
        align: 'center',
        valign: 'middle',
      });
    }
  });

  if (data.notes) slide.addNotes(data.notes);
}

// ==========================================
// 8. Section Divider Layout
// ==========================================
export interface SectionDividerData {
  sectionNumber: string;    // e.g. "02" or "PART III"
  sectionTitle: string;     // e.g. "Market Dynamics & Competitive Moats"
  description?: string;     // Narrative overview of section
  agendaBullets?: string[]; // Topics covered in this section
  notes?: string;
}

export function renderSectionDivider(
  pres: pptxgen,
  slide: pptxgen.Slide,
  data: SectionDividerData,
  theme: EditorialTheme = DEFAULT_EDITORIAL_THEMES.darkTitanium
) {
  slide.background = { color: cleanHexColor(theme.bg) };

  // Large Section Number Backdrop (Oversized subtle accent)
  slide.addText(data.sectionNumber, {
    x: 1.0,
    y: 1.0,
    w: 4.0,
    h: 2.2,
    fontSize: 96,
    fontFace: theme.headingFont,
    bold: true,
    color: cleanHexColor(theme.accent),
    valign: 'top',
  });

  // Main Section Title
  slide.addText(data.sectionTitle, {
    x: 1.0,
    y: 3.3,
    w: 6.8,
    h: 1.8,
    fontSize: 34,
    fontFace: theme.headingFont,
    bold: true,
    color: cleanHexColor(theme.primaryText),
    align: 'left',
    valign: 'top',
    wrap: true,
  });

  // Section Description
  if (data.description) {
    slide.addText(data.description, {
      x: 1.0,
      y: 5.2,
      w: 6.8,
      h: 1.4,
      fontSize: 14,
      fontFace: theme.bodyFont,
      color: cleanHexColor(theme.secondaryText),
      align: 'left',
      valign: 'top',
      wrap: true,
    });
  }

  // Right Side Agenda Card
  if (data.agendaBullets && data.agendaBullets.length > 0) {
    slide.addShape(pres.ShapeType.roundRect, {
      x: 8.4,
      y: 1.2,
      w: 3.9,
      h: 5.2,
      fill: { color: cleanHexColor(theme.cardBg) },
      line: { color: cleanHexColor(theme.cardBorder), width: 1.5 },
    });

    slide.addText('IN THIS SECTION', {
      x: 8.8,
      y: 1.6,
      w: 3.1,
      h: 0.3,
      fontSize: 11,
      fontFace: theme.headingFont,
      bold: true,
      color: cleanHexColor(theme.accent),
    });

    const agendaText = data.agendaBullets.map((b, i) => `${(i + 1).toString().padStart(2, '0')}.  ${b}`).join('\n\n');
    slide.addText(agendaText, {
      x: 8.8,
      y: 2.2,
      w: 3.1,
      h: 3.8,
      fontSize: 13,
      fontFace: theme.bodyFont,
      color: cleanHexColor(theme.primaryText),
      align: 'left',
      valign: 'top',
      wrap: true,
    });
  }

  if (data.notes) slide.addNotes(data.notes);
}

// ==========================================
// Master Presentation Generator Helper
// ==========================================
export type EditorialLayoutType =
  | 'titleCover'
  | 'splitPhoto'
  | 'bigStat'
  | 'twoColumnStory'
  | 'asymmetricQuote'
  | 'timeline'
  | 'grid3Card'
  | 'sectionDivider';

export interface EditorialSlideConfig {
  type: EditorialLayoutType;
  data: any;
  theme?: EditorialTheme;
}

/**
 * Helper to add any of the 8 editorial layouts to an existing PPTX presentation instance
 */
export function addEditorialSlideToPresentation(
  pres: pptxgen,
  config: EditorialSlideConfig,
  globalTheme: EditorialTheme = DEFAULT_EDITORIAL_THEMES.darkTitanium
): pptxgen.Slide {
  const slide = pres.addSlide();
  const theme = config.theme || globalTheme;

  switch (config.type) {
    case 'titleCover':
      renderTitleCover(pres, slide, config.data as TitleCoverData, theme);
      break;
    case 'splitPhoto':
      renderSplitPhotoEditorial(pres, slide, config.data as SplitPhotoEditorialData, theme);
      break;
    case 'bigStat':
      renderBigStatCallout(pres, slide, config.data as BigStatCalloutData, theme);
      break;
    case 'twoColumnStory':
      renderTwoColumnStory(pres, slide, config.data as TwoColumnStoryData, theme);
      break;
    case 'asymmetricQuote':
      renderAsymmetricQuote(pres, slide, config.data as AsymmetricQuoteData, theme);
      break;
    case 'timeline':
      renderTimeline(pres, slide, config.data as TimelineData, theme);
      break;
    case 'grid3Card':
      renderGrid3Card(pres, slide, config.data as Grid3CardData, theme);
      break;
    case 'sectionDivider':
      renderSectionDivider(pres, slide, config.data as SectionDividerData, theme);
      break;
    default:
      console.warn(`Unknown editorial layout type: ${config.type}`);
  }

  return slide;
}

/**
 * Creates a complete native .pptx file with sample slides from all 8 editorial layouts
 */
export async function exportEditorialShowcasePresentation(
  title: string = 'Editorial Showcase Deck',
  theme: EditorialTheme = DEFAULT_EDITORIAL_THEMES.darkTitanium
): Promise<void> {
  const pres = new pptxgen();
  pres.defineLayout({ name: 'SLIDECRAFT_16_9', width: SLIDE_WIDTH, height: SLIDE_HEIGHT });
  pres.layout = 'SLIDECRAFT_16_9';
  pres.title = title;

  // 1. Title Cover
  renderTitleCover(
    pres,
    pres.addSlide(),
    {
      kicker: 'STRATEGIC OUTLOOK 2026',
      title: 'Architecting the Autonomous Enterprise Intelligence Layer',
      subtitle: 'A foundational report on latency optimization, agent swarms, and cloud economics.',
      author: 'Dr. Sarah Chen & Alex Rivera',
      authorRole: 'Founding Research Partners, SlideCraft Labs',
      dateOrCompany: 'Confidential • Executive Briefing',
      notes: 'Welcome everyone. This presentation introduces our core findings for enterprise intelligence.',
    },
    theme
  );

  // 2. Section Divider
  renderSectionDivider(
    pres,
    pres.addSlide(),
    {
      sectionNumber: '01',
      sectionTitle: 'The Shift Toward Autonomous Multi-Agent Systems',
      description: 'Understanding the systemic infrastructure transition from isolated APIs to connected agent workflows.',
      agendaBullets: [
        'Compute bottleneck & GPU expenditure analysis',
        'Latency reduction through decentralized edge meshes',
        'Continuous automated LoRA adapter fine-tuning',
      ],
      notes: 'Section 1 outlines the macroeconomic and technical drivers.',
    },
    theme
  );

  // 3. Split Photo Editorial
  renderSplitPhotoEditorial(
    pres,
    pres.addSlide(),
    {
      kicker: 'ARCHITECTURAL ADVANTAGE',
      title: 'Sub-Millisecond Orchestration at Global Edge Nodes',
      bodyParagraphs: [
        'Traditional cloud pipelines incur 600ms+ round trips across centralized regions. By shifting routing logic directly to 180+ global edge locations, response latency is compressed by 7x.',
        'Zero-trust cryptographic enclaves guarantee sensitive enterprise data never touches unverified shared memory layers.',
      ],
      calloutQuote: 'Execution speed directly correlates with task completion accuracy in recursive multi-step reasoning.',
      imageCaption: 'Figure 1.1: Distributed Edge Mesh Topology Across 24 Availability Zones',
      notes: 'Explain why edge routing creates an insurmountable latency advantage.',
    },
    theme
  );

  // 4. Big Stat Callout
  renderBigStatCallout(
    pres,
    pres.addSlide(),
    {
      kicker: 'EFFICIENCY METRICS',
      mainStatValue: '65.8%',
      mainStatLabel: 'Reduction in Total Cloud GPU Compute Expenditure',
      mainStatDescription: 'Through automated prompt compression and speculative token decoding, our enterprise runtime eliminates redundant LLM inference overhead across production clusters.',
      trendBadge: 'Verified SOC2 Audit',
      supportingStats: [
        { value: '< 80 ms', label: 'P99 end-to-end conversational streaming latency' },
        { value: '99.99%', label: 'Guaranteed mission-critical uptime across all regions' },
      ],
      notes: 'Highlight how cost savings fund subsequent AI roadmap expansion.',
    },
    theme
  );

  // 5. 2-Column Story
  renderTwoColumnStory(
    pres,
    pres.addSlide(),
    {
      mainKicker: 'MARKET COMPARISON',
      mainTitle: 'Legacy Cloud Stacks vs. Next-Gen Runtime Engines',
      column1: {
        tag: 'Legacy Infrastructure',
        heading: 'Fragmented & High-Cost Operations',
        body: 'Enterprises struggle with brittle glue code, opaque GPU bills, and manual fine-tuning pipelines that take quarters to deploy.',
        bullets: [
          'Average 6+ months to reach production',
          'Inference bills scaling 3x faster than revenue',
          'Data compliance friction across departments',
        ],
      },
      column2: {
        tag: 'SlideCraft Platform',
        heading: 'Unified Autonomous Runtime',
        body: 'Single integrated SDK delivering sub-80ms edge execution, automated evaluation suites, and instant compliance out of the box.',
        bullets: [
          'Live deployment in under 48 hours',
          '86% gross margin efficiency at scale',
          'Turnkey SOC2 Type II & HIPAA security',
        ],
      },
      notes: 'Emphasize the clear contrast and customer time-to-value.',
    },
    theme
  );

  // 6. Asymmetric Quote
  renderAsymmetricQuote(
    pres,
    pres.addSlide(),
    {
      quote: 'SlideCraft’s edge orchestration runtime allowed us to scale from 10,000 to 10 million daily interactions without adding a single DevOps engineer.',
      authorName: 'David K. Vance',
      authorTitle: 'Chief Technology Officer',
      authorCompany: 'Global Fintech Innovations',
      contextTag: 'CUSTOMER TRACTION',
      highlightNumber: '10M+',
      highlightLabel: 'Daily Autonomous Requests Processed with Zero Outages',
      notes: 'Quote from our lead enterprise design partner.',
    },
    theme
  );

  // 7. Timeline
  renderTimeline(
    pres,
    pres.addSlide(),
    {
      kicker: 'STRATEGIC ROADMAP',
      title: 'Four Phases of Platform Expansion',
      events: [
        {
          step: 'Phase 01',
          title: 'Core Engine',
          description: 'Python and TS SDKs with local sandbox execution and telemetry logging.',
        },
        {
          step: 'Phase 02',
          title: 'Global Mesh',
          description: 'Multi-region routing with automated latency-aware caching layers.',
          isCurrent: true,
        },
        {
          step: 'Phase 03',
          title: 'Agent Swarms',
          description: 'Autonomous multi-agent orchestration with human-in-the-loop audit.',
        },
        {
          step: 'Phase 04',
          title: 'Ecosystem',
          description: 'Third-party plugin store and hardware accelerator integrations.',
        },
      ],
      notes: 'Walk the board through our execution milestones.',
    },
    theme
  );

  // 8. Grid 3-Card
  renderGrid3Card(
    pres,
    pres.addSlide(),
    {
      kicker: 'CORE PILLARS',
      title: 'Engineered for Uncompromising Scale',
      subtitle: 'Three foundational moats powering our competitive advantage.',
      cards: [
        {
          tag: 'Speed',
          title: 'Edge Mesh Routing',
          description: 'Intelligent latency-aware traffic distribution across 180+ global PoPs.',
          footerMetric: 'Sub-80ms Global SLA',
        },
        {
          tag: 'Security',
          title: 'Zero-Trust Enclaves',
          description: 'End-to-end encrypted model orchestration where prompts never touch logs.',
          footerMetric: 'SOC2 & HIPAA Compliant',
        },
        {
          tag: 'Economics',
          title: 'Autonomous LoRA',
          description: 'Continuous self-improving feedback loops that refine model weights.',
          footerMetric: '65% GPU Cost Reduction',
        },
      ],
      notes: 'Summarize the 3 core technological pillars.',
    },
    theme
  );

  const fileName = `${title.trim().replace(/[^a-zA-Z0-9-_ ]/g, '') || 'editorial_presentation'}.pptx`;
  await pres.writeFile({ fileName });
}
