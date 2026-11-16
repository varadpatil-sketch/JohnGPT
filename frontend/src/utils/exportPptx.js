import PptxGenJS from "pptxgenjs";

/**
 * Maps slide themes to clean hex colors for PowerPoint
 */
const THEME_PALETTES = {
  forest: {
    bg: "0D2818",
    title: "FFFFFF",
    kicker: "D4AF37",
    subtitle: "F7F4EA",
    cardBg: "163D27",
    text: "E2E8F0",
    accent: "D4AF37",
  },
  cream: {
    bg: "F7F4EA",
    title: "0D2818",
    kicker: "9B7B1C",
    subtitle: "2D3748",
    cardBg: "FFFFFF",
    text: "4A5568",
    accent: "0D2818",
  },
  gold: {
    bg: "D8AE5E",
    title: "1A202C",
    kicker: "744210",
    subtitle: "2D3748",
    cardBg: "E2B76D",
    text: "1A202C",
    accent: "744210",
  },
  obsidian: {
    bg: "0B0F19",
    title: "F8FAFC",
    kicker: "38BDF8",
    subtitle: "94A3B8",
    cardBg: "1E293B",
    text: "CBD5E1",
    accent: "38BDF8",
  },
  indigo: {
    bg: "1E1B4B",
    title: "FFFFFF",
    kicker: "A855F7",
    subtitle: "DDD6FE",
    cardBg: "312E81",
    text: "E0E7FF",
    accent: "A855F7",
  },
};

/**
 * Export a JohnGPT Slide Deck to a true Microsoft PowerPoint (.pptx) file.
 * @param {Object} deck - Slide deck object with title, theme, and slides array
 */
export async function exportDeckToPptx(deck) {
  if (!deck || !Array.isArray(deck.slides)) {
    throw new Error("Invalid deck format");
  }

  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_16x9";
  pptx.author = "JohnGPT";
  pptx.company = "JohnGPT Presentations";
  pptx.title = deck.title || "Presentation";

  const defaultTheme = deck.theme || "forest";

  deck.slides.forEach((slideData, index) => {
    const slide = pptx.addSlide();
    const slideThemeKey = slideData.themeVariant || defaultTheme;
    const palette = THEME_PALETTES[slideThemeKey] || THEME_PALETTES.forest;

    // Set background color
    slide.background = { color: palette.bg };

    const layout = slideData.layout || "bullets";

    if (layout === "title") {
      // 1. Title / Hero Slide
      if (slideData.kicker) {
        slide.addText(slideData.kicker.toUpperCase(), {
          x: 0.8,
          y: 2.0,
          w: 8.4,
          h: 0.5,
          fontSize: 13,
          color: palette.kicker,
          bold: true,
          charSpacing: 3,
          fontFace: "Arial",
        });
      }

      slide.addText(slideData.title || deck.title || "Presentation", {
        x: 0.8,
        y: 2.6,
        w: 11.0,
        h: 1.5,
        fontSize: 52,
        color: palette.title,
        bold: true,
        fontFace: "Georgia",
      });

      if (slideData.subtitle) {
        slide.addText(slideData.subtitle, {
          x: 0.8,
          y: 4.2,
          w: 10.0,
          h: 1.0,
          fontSize: 20,
          color: palette.subtitle,
          fontFace: "Georgia",
          italic: true,
        });
      }

      // Slide Footer / Branding
      slide.addText("JohnGPT Slides · 16:9 Presentation", {
        x: 0.8,
        y: 6.8,
        w: 6.0,
        h: 0.4,
        fontSize: 10,
        color: palette.kicker,
        fontFace: "Arial",
      });
    } else if (layout === "stats") {
      // 2. Stats / KPI Dashboard Slide
      if (slideData.kicker) {
        slide.addText(slideData.kicker.toUpperCase(), {
          x: 0.8,
          y: 0.6,
          w: 8.0,
          h: 0.4,
          fontSize: 12,
          color: palette.kicker,
          bold: true,
          charSpacing: 2,
        });
      }

      slide.addText(slideData.title || "The Game at a Glance", {
        x: 0.8,
        y: 1.0,
        w: 10.0,
        h: 0.8,
        fontSize: 34,
        color: palette.title,
        bold: true,
        fontFace: "Georgia",
      });

      if (slideData.subtitle) {
        slide.addText(slideData.subtitle, {
          x: 0.8,
          y: 1.8,
          w: 10.0,
          h: 0.6,
          fontSize: 15,
          color: palette.subtitle,
        });
      }

      const stats = slideData.stats || [];
      const colWidth = 3.4;
      const startX = 0.8;
      const cardY = 2.7;

      stats.forEach((st, sIdx) => {
        const curX = startX + sIdx * (colWidth + 0.4);

        // Card box background
        slide.addShape(pptx.ShapeType.roundRect, {
          x: curX,
          y: cardY,
          w: colWidth,
          h: 3.4,
          fill: { color: palette.cardBg },
          line: { color: palette.accent, width: 1 },
          rectRadius: 0.15,
        });

        // Giant Stat Number
        slide.addText(String(st.value), {
          x: curX + 0.2,
          y: cardY + 0.3,
          w: colWidth - 0.4,
          h: 1.2,
          fontSize: 54,
          color: palette.accent,
          bold: true,
          fontFace: "Arial",
          align: "center",
        });

        // Label
        slide.addText(st.label || "", {
          x: curX + 0.2,
          y: cardY + 1.5,
          w: colWidth - 0.4,
          h: 0.6,
          fontSize: 18,
          color: palette.title,
          bold: true,
          align: "center",
        });

        // Description
        slide.addText(st.desc || "", {
          x: curX + 0.3,
          y: cardY + 2.1,
          w: colWidth - 0.6,
          h: 1.0,
          fontSize: 13,
          color: palette.text,
          align: "center",
        });
      });
    } else if (layout === "columns") {
      // 3. Multi-Column / Cards Slide
      if (slideData.kicker) {
        slide.addText(slideData.kicker.toUpperCase(), {
          x: 0.8,
          y: 0.6,
          w: 8.0,
          h: 0.4,
          fontSize: 12,
          color: palette.kicker,
          bold: true,
        });
      }

      slide.addText(slideData.title || "Positions", {
        x: 0.8,
        y: 1.0,
        w: 10.0,
        h: 0.8,
        fontSize: 34,
        color: palette.title,
        bold: true,
        fontFace: "Georgia",
      });

      if (slideData.subtitle) {
        slide.addText(slideData.subtitle, {
          x: 0.8,
          y: 1.8,
          w: 10.0,
          h: 0.5,
          fontSize: 14,
          color: palette.subtitle,
        });
      }

      const columns = slideData.columns || [];
      const numCols = Math.max(columns.length, 1);
      const colWidth = (11.0 - (numCols - 1) * 0.3) / numCols;
      const startX = 0.8;
      const cardY = 2.6;

      columns.forEach((col, cIdx) => {
        const curX = startX + cIdx * (colWidth + 0.3);

        slide.addShape(pptx.ShapeType.roundRect, {
          x: curX,
          y: cardY,
          w: colWidth,
          h: 3.8,
          fill: { color: palette.cardBg },
          line: { color: palette.accent, width: 1 },
          rectRadius: 0.1,
        });

        slide.addText(col.title || `Column ${cIdx + 1}`, {
          x: curX + 0.2,
          y: cardY + 0.3,
          w: colWidth - 0.4,
          h: 0.6,
          fontSize: 19,
          color: palette.title,
          bold: true,
          fontFace: "Georgia",
        });

        if (col.role) {
          slide.addText(col.role, {
            x: curX + 0.2,
            y: cardY + 0.9,
            w: colWidth - 0.4,
            h: 0.4,
            fontSize: 12,
            color: palette.accent,
            bold: true,
          });
        }

        slide.addText(col.desc || "", {
          x: curX + 0.2,
          y: cardY + 1.4,
          w: colWidth - 0.4,
          h: 2.1,
          fontSize: 13,
          color: palette.text,
        });
      });
    } else if (layout === "table") {
      // 4. Tabular Slide
      if (slideData.kicker) {
        slide.addText(slideData.kicker.toUpperCase(), {
          x: 0.8,
          y: 0.6,
          w: 8.0,
          h: 0.4,
          fontSize: 12,
          color: palette.kicker,
          bold: true,
        });
      }

      slide.addText(slideData.title || "Data & History", {
        x: 0.8,
        y: 1.0,
        w: 10.0,
        h: 0.8,
        fontSize: 34,
        color: palette.title,
        bold: true,
        fontFace: "Georgia",
      });

      if (slideData.subtitle) {
        slide.addText(slideData.subtitle, {
          x: 0.8,
          y: 1.8,
          w: 10.0,
          h: 0.5,
          fontSize: 14,
          color: palette.subtitle,
        });
      }

      const tableData = slideData.table || { headers: [], rows: [] };
      const tableRows = [];

      if (tableData.headers && tableData.headers.length) {
        tableRows.push(
          tableData.headers.map((h) => ({
            text: h,
            options: {
              bold: true,
              fill: palette.cardBg,
              color: palette.kicker,
              fontSize: 13,
            },
          }))
        );
      }

      (tableData.rows || []).forEach((row) => {
        tableRows.push(
          row.map((cell) => ({
            text: String(cell),
            options: {
              color: palette.text,
              fontSize: 12,
              fill: palette.bg,
            },
          }))
        );
      });

      if (tableRows.length) {
        slide.addTable(tableRows, {
          x: 0.8,
          y: 2.6,
          w: 11.2,
          rowH: 0.6,
          border: { type: "solid", pt: 1, color: palette.cardBg },
        });
      }
    } else if (layout === "quote") {
      // 5. Quote / Closing Slide
      if (slideData.kicker) {
        slide.addText(slideData.kicker.toUpperCase(), {
          x: 1.2,
          y: 1.2,
          w: 8.0,
          h: 0.4,
          fontSize: 13,
          color: palette.kicker,
          bold: true,
          charSpacing: 2,
        });
      }

      slide.addText(slideData.title || "Simple rules, endless stories", {
        x: 1.2,
        y: 1.8,
        w: 10.5,
        h: 1.2,
        fontSize: 42,
        color: palette.title,
        bold: true,
        fontFace: "Georgia",
      });

      slide.addText(`“${slideData.quote || slideData.subtitle || ""}”`, {
        x: 1.2,
        y: 3.2,
        w: 10.0,
        h: 1.8,
        fontSize: 22,
        color: palette.text,
        italic: true,
        fontFace: "Georgia",
      });

      if (slideData.author) {
        slide.addText(`— ${slideData.author}`, {
          x: 1.2,
          y: 5.2,
          w: 8.0,
          h: 0.5,
          fontSize: 16,
          bold: true,
          color: palette.accent,
        });
      }
    } else {
      // 6. Standard Bullets / Key Rules Slide
      if (slideData.kicker) {
        slide.addText(slideData.kicker.toUpperCase(), {
          x: 0.8,
          y: 0.6,
          w: 8.0,
          h: 0.4,
          fontSize: 12,
          color: palette.kicker,
          bold: true,
        });
      }

      slide.addText(slideData.title || "Core Rules", {
        x: 0.8,
        y: 1.0,
        w: 10.0,
        h: 0.8,
        fontSize: 34,
        color: palette.title,
        bold: true,
        fontFace: "Georgia",
      });

      if (slideData.subtitle) {
        slide.addText(slideData.subtitle, {
          x: 0.8,
          y: 1.8,
          w: 10.0,
          h: 0.5,
          fontSize: 14,
          color: palette.subtitle,
        });
      }

      const points = slideData.points || [];
      points.forEach((pt, pIdx) => {
        const itemY = 2.6 + pIdx * 0.95;

        // Number / bullet pill
        slide.addShape(pptx.ShapeType.ellipse, {
          x: 0.8,
          y: itemY + 0.05,
          w: 0.35,
          h: 0.35,
          fill: { color: palette.accent },
        });

        slide.addText(String(pIdx + 1), {
          x: 0.8,
          y: itemY + 0.05,
          w: 0.35,
          h: 0.35,
          fontSize: 10,
          bold: true,
          color: palette.bg,
          align: "center",
        });

        // Point title
        slide.addText(typeof pt === "string" ? pt : pt.title || "", {
          x: 1.3,
          y: itemY,
          w: 10.0,
          h: 0.35,
          fontSize: 16,
          bold: true,
          color: palette.title,
        });

        // Point text description
        if (typeof pt === "object" && pt.text) {
          slide.addText(pt.text, {
            x: 1.3,
            y: itemY + 0.35,
            w: 10.0,
            h: 0.5,
            fontSize: 13,
            color: palette.text,
          });
        }
      });
    }

    // Numbering badge in bottom left
    slide.addText(`${index + 1}`, {
      x: 0.5,
      y: 6.8,
      w: 0.4,
      h: 0.3,
      fontSize: 10,
      color: palette.kicker,
      bold: true,
    });
  });

  const safeFileName = `${(deck.title || "Presentation").replace(/[^a-zA-Z0-9_-]/g, "_")}.pptx`;
  await pptx.writeFile({ fileName: safeFileName });
}

/**
 * Generate a standalone offline responsive HTML presentation
 */
export function generateHtmlPresentation(deck) {
  const deckJson = JSON.stringify(deck, null, 2);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${deck.title || "Presentation"} · JohnGPT Slides</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #090a0f;
      color: #f8fafc;
      font-family: 'Inter', -apple-system, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      user-select: none;
    }
    .slide-stage-container {
      width: 90vw;
      max-width: 1100px;
      aspect-ratio: 16 / 9;
      position: relative;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 25px 70px rgba(0, 0, 0, 0.6);
      transition: all 0.3s ease;
    }
    .slide-card {
      width: 100%;
      height: 100%;
      padding: 5% 7%;
      display: none;
      flex-direction: column;
      justify-content: center;
      position: absolute;
      top: 0;
      left: 0;
    }
    .slide-card.active {
      display: flex;
    }
    .theme-forest { background: #0d2818; color: #f7f4ea; }
    .theme-cream { background: #f7f4ea; color: #0d2818; }
    .theme-gold { background: #d8ae5e; color: #1a202c; }
    .theme-obsidian { background: #0b0f19; color: #f8fafc; }
    .theme-indigo { background: #1e1b4b; color: #ffffff; }

    .kicker {
      font-size: 0.95rem;
      font-weight: 700;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      margin-bottom: 0.8rem;
    }
    .theme-forest .kicker { color: #d4af37; }
    .theme-cream .kicker { color: #8c6d1f; }
    .theme-gold .kicker { color: #5f370e; }

    .slide-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: clamp(2rem, 4vw, 3.8rem);
      line-height: 1.15;
      font-weight: 700;
      margin-bottom: 1rem;
    }
    .slide-subtitle {
      font-size: clamp(1rem, 1.8vw, 1.4rem);
      line-height: 1.5;
      opacity: 0.9;
      max-width: 800px;
    }
    .stats-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
      margin-top: 2rem;
    }
    .stat-card {
      padding: 1.5rem;
      border-radius: 12px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.12);
      text-align: center;
    }
    .theme-cream .stat-card {
      background: #ffffff;
      border: 1px solid rgba(0,0,0,0.08);
      box-shadow: 0 4px 15px rgba(0,0,0,0.05);
    }
    .stat-val {
      font-size: clamp(2.5rem, 5vw, 4.2rem);
      font-weight: 800;
      line-height: 1;
      margin-bottom: 0.5rem;
    }
    .theme-cream .stat-val { color: #0d2818; }
    .theme-forest .stat-val { color: #d4af37; }
    .stat-lbl {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 0.3rem;
    }
    .stat-desc {
      font-size: 0.85rem;
      opacity: 0.75;
    }
    .bullets-list {
      display: flex;
      flex-direction: column;
      gap: 1.2rem;
      margin-top: 1.5rem;
    }
    .bullet-item {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
    }
    .bullet-num {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: #d4af37;
      color: #0d2818;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.85rem;
      flex-shrink: 0;
      margin-top: 2px;
    }
    .columns-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.2rem;
      margin-top: 1.5rem;
    }
    .col-card {
      background: #ffffff;
      padding: 1.2rem;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.04);
      border: 1px solid rgba(0,0,0,0.06);
    }
    .col-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 0.4rem;
    }
    .col-role {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #8c6d1f;
      margin-bottom: 0.6rem;
    }
    .col-desc {
      font-size: 0.85rem;
      line-height: 1.45;
      color: #4a5568;
    }
    .slide-footer-nav {
      position: fixed;
      bottom: 20px;
      display: flex;
      align-items: center;
      gap: 15px;
      background: rgba(18, 20, 29, 0.85);
      backdrop-filter: blur(12px);
      padding: 8px 18px;
      border-radius: 40px;
      border: 1px solid rgba(255,255,255,0.12);
      z-index: 100;
    }
    .nav-btn {
      background: transparent;
      border: none;
      color: #fff;
      font-size: 1.1rem;
      cursor: pointer;
      padding: 6px 10px;
      border-radius: 6px;
      transition: background 0.2s;
    }
    .nav-btn:hover { background: rgba(255,255,255,0.1); }
    .slide-counter { font-size: 0.9rem; font-weight: 600; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="slide-stage-container" id="slideStage">
    <!-- Slides rendered dynamically -->
  </div>

  <div class="slide-footer-nav">
    <button class="nav-btn" onclick="prevSlide()" title="Previous slide (←)">‹ Prev</button>
    <span class="slide-counter" id="counterText">1 / 1</span>
    <button class="nav-btn" onclick="nextSlide()" title="Next slide (→)">Next ›</button>
  </div>

  <script>
    const deck = ${deckJson};
    let currentIndex = 0;
    const container = document.getElementById("slideStage");
    const counter = document.getElementById("counterText");

    function renderDeck() {
      container.innerHTML = "";
      deck.slides.forEach((s, idx) => {
        const theme = s.themeVariant || deck.theme || "forest";
        const card = document.createElement("div");
        card.className = "slide-card theme-" + theme + (idx === currentIndex ? " active" : "");
        
        let innerHtml = "";
        if (s.kicker) innerHtml += '<div class="kicker">' + s.kicker + '</div>';
        innerHtml += '<h2 class="slide-title">' + (s.title || "") + '</h2>';
        if (s.subtitle) innerHtml += '<div class="slide-subtitle">' + s.subtitle + '</div>';

        if (s.layout === "stats" && s.stats) {
          innerHtml += '<div class="stats-row">';
          s.stats.forEach(st => {
            innerHtml += '<div class="stat-card"><div class="stat-val">' + st.value + '</div><div class="stat-lbl">' + st.label + '</div><div class="stat-desc">' + st.desc + '</div></div>';
          });
          innerHtml += '</div>';
        } else if (s.layout === "columns" && s.columns) {
          innerHtml += '<div class="columns-grid">';
          s.columns.forEach(c => {
            innerHtml += '<div class="col-card"><div class="col-title">' + c.title + '</div><div class="col-role">' + (c.role || "") + '</div><div class="col-desc">' + (c.desc || "") + '</div></div>';
          });
          innerHtml += '</div>';
        } else if (s.layout === "bullets" && s.points) {
          innerHtml += '<div class="bullets-list">';
          s.points.forEach((p, pIdx) => {
            const title = typeof p === "string" ? p : p.title;
            const text = typeof p === "object" ? p.text : "";
            innerHtml += '<div class="bullet-item"><div class="bullet-num">' + (pIdx + 1) + '</div><div><strong>' + title + '</strong> ' + text + '</div></div>';
          });
          innerHtml += '</div>';
        } else if (s.layout === "quote" && s.quote) {
          innerHtml += '<div style="margin-top: 2rem; font-size: 1.5rem; font-style: italic; font-family: Georgia, serif;">“' + s.quote + '”</div>';
          if (s.author) innerHtml += '<div style="margin-top: 1rem; font-weight: 700; color: #d4af37;">— ' + s.author + '</div>';
        }

        card.innerHTML = innerHtml;
        container.appendChild(card);
      });
      counter.textContent = (currentIndex + 1) + " / " + deck.slides.length;
    }

    function showSlide(index) {
      if (index < 0 || index >= deck.slides.length) return;
      currentIndex = index;
      const cards = container.querySelectorAll(".slide-card");
      cards.forEach((c, idx) => {
        c.classList.toggle("active", idx === currentIndex);
      });
      counter.textContent = (currentIndex + 1) + " / " + deck.slides.length;
    }

    function nextSlide() { if (currentIndex < deck.slides.length - 1) showSlide(currentIndex + 1); }
    function prevSlide() { if (currentIndex > 0) showSlide(currentIndex - 1); }

    window.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") nextSlide();
      else if (e.key === "ArrowLeft" || e.key === "PageUp") prevSlide();
    });

    renderDeck();
  </script>
</body>
</html>`;
}

