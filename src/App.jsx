import { useState, useEffect, useCallback, useMemo, useRef } from "react";

const CATEGORIES = [
  { id: "rehab", label: "Rééducation", color: "#534AB7" },
  { id: "perfomance", label: "Performance", color: "#1D9E75" },
  { id: "rugby", label: "Rugby", color: "#D85A30" },
  { id: "pathologie", label: "Pathologies", color: "#D4537E" },
  { id: "nutrition", label: "Nutrition", color: "#639922" },
  { id: "medical", label: "Nouveautés médicales", color: "#378ADD" },
  { id: "biomecanique", label: "Biomécanique", color: "#BA7517" },
  { id: "psycho", label: "Psycho / RTP", color: "#993556" },
];

const SOURCES = [
  { id: "pubmed", label: "PubMed", icon: "📚" },
  { id: "bjsm", label: "BJSM", icon: "🏃" },
  { id: "jospt", label: "JOSPT", icon: "🦴" },
  { id: "twitter", label: "Twitter/X", icon: "𝕏" },
  { id: "linkedin", label: "LinkedIn", icon: "in" },
  { id: "s4s", label: "ScienceForSport", icon: "⚗️" },
  { id: "sportsmith", label: "Sportsmith", icon: "🔨" },
];

const MOCK_ARTICLES = [
  {
    id: 1,
    title: "Eccentric hamstring strength asymmetries and risk of hamstring injury in professional rugby union players",
    authors: "Williams T, Morgan D, Stokes K et al.",
    source: "bjsm",
    date: "2026-03-24",
    category: "rugby",
    abstract: "Cette étude prospective sur 2 saisons complètes en Premiership anglaise (n=342 joueurs) démontre qu'une asymétrie de force excentrique des ischio-jambiers >15% au Nordic Hamstring mesurée en début de saison est associée à un risque 3.2x plus élevé de lésion musculaire des ischio-jambiers (HR 3.21, IC95% 1.87-5.51, p<0.001). Le seuil optimal identifié par analyse ROC est de 12% d'asymétrie. L'intégration d'un programme de Nordic Hamstring individualisé basé sur ces seuils a réduit l'incidence de 47% dans le groupe intervention.",
    keyFindings: ["Asymétrie >15% = risque x3.2 de lésion IJ", "Seuil optimal : 12% d'asymétrie (ROC)", "Programme Nordic individualisé : -47% d'incidence", "Effet dose-réponse : plus de sessions = meilleure protection"],
    clinicalImplication: "Intégrer un screening systématique de la force excentrique IJ avec Nordic Hamstring en pré-saison. Individualiser le programme de prévention pour les joueurs >12% d'asymétrie.",
    doi: "10.1136/bjsports-2026-058421",
    isFavorite: false,
    tags: ["ischio-jambiers", "prévention", "nordic", "asymétrie"],
  },
  {
    id: 2,
    title: "Blood flow restriction training for ACL rehabilitation: a randomized controlled trial with 2-year follow-up",
    authors: "Korakakis V, Whiteley R, Epameinontidis K et al.",
    source: "jospt",
    date: "2026-03-22",
    category: "rehab",
    abstract: "Essai contrôlé randomisé multicentrique (n=128, 18-35 ans) comparant la rééducation post-ACLR standard vs rééducation + BFR dès S4 post-op. À 6 mois, le groupe BFR présente un index de symétrie du quadriceps significativement supérieur (LSI 89.3% vs 79.1%, p<0.001) et un retour au sport 6 semaines plus précoce. À 2 ans, le taux de re-rupture est comparable (4.7% vs 5.2%, ns) avec un score IKDC supérieur dans le groupe BFR.",
    keyFindings: ["BFR dès S4 post-op : LSI quadriceps 89.3% vs 79.1% à 6 mois", "Retour au sport 6 semaines plus précoce", "Pas d'augmentation du risque de re-rupture à 2 ans", "Protocole : 4x30/15/15/15 à 20-30% 1RM, 80% occlusion"],
    clinicalImplication: "Le BFR peut être intégré en toute sécurité dès la 4ème semaine post-ACLR pour accélérer la récupération du quadriceps sans compromettre la greffe.",
    doi: "10.2519/jospt.2026.11892",
    isFavorite: false,
    tags: ["LCA", "BFR", "rééducation", "quadriceps"],
  },
  {
    id: 3,
    title: "Monitoring training load in elite rugby: GPS metrics and neuromuscular fatigue markers — a systematic review and meta-analysis",
    authors: "Dubois R, Piscione J, Lacome M et al.",
    source: "pubmed",
    date: "2026-03-20",
    category: "perfomance",
    abstract: "Revue systématique et méta-analyse de 34 études (n=1,247 joueurs). Les métriques GPS les plus corrélées à la fatigue neuromusculaire (CMJ, force isométrique) sont : la distance en haute intensité (>5.5 m/s), le nombre d'accélérations >3 m/s², et le PlayerLoad™ cumulé. L'ACWR en zone haute vélocité (ratio 1.3-1.5) est le meilleur prédicteur de blessure sans contact (AUC 0.78). Les auteurs proposent un algorithme décisionnel combinant charge GPS et marqueurs neuromusculaires.",
    keyFindings: ["Distance haute intensité, accélérations et PlayerLoad™ = meilleurs indicateurs", "ACWR zone haute vélocité : ratio 1.3-1.5 = zone de danger", "AUC 0.78 pour prédiction de blessure sans contact", "Algorithme décisionnel GPS + CMJ proposé"],
    clinicalImplication: "Privilégier le suivi de la distance en haute intensité et des accélérations plutôt que la distance totale. Combiner les données GPS avec un suivi CMJ hebdomadaire.",
    doi: "10.1007/s40279-026-01982-4",
    isFavorite: false,
    tags: ["GPS", "charge", "monitoring", "rugby", "fatigue"],
  },
  {
    id: 4,
    title: "Tendinopathy management 2026: isometric, isotonic, or heavy slow resistance? An updated network meta-analysis",
    authors: "Malliaras P, Cook J, Rio E et al.",
    source: "bjsm",
    date: "2026-03-19",
    category: "pathologie",
    abstract: "Network méta-analyse de 52 RCTs (n=3,841 patients) comparant les protocoles de charge dans la tendinopathie d'Achille et patellaire. Les exercices HSR montrent la plus grande taille d'effet pour la douleur à 12 semaines (SMD -1.42, IC95% -1.78 à -1.06) et la satisfaction patient. Les isométriques sont supérieurs pour la gestion aiguë de la douleur (<4 semaines, SMD -0.89). La combinaison isométrique → HSR → plyométrique montre les meilleurs résultats à 12 mois.",
    keyFindings: ["HSR : meilleur effet sur douleur à 12 semaines (SMD -1.42)", "Isométriques : supérieurs en phase aiguë (<4 sem)", "Séquence optimale : ISO → HSR → PLYO", "Plyométrie précoce associée à taux de rechute plus élevé"],
    clinicalImplication: "Structurer la rééducation en phases : isométriques pour contrôle douleur initial, transition vers HSR à 4 semaines, puis plyométrie progressive. Éviter la plyométrie précoce.",
    doi: "10.1136/bjsports-2026-058102",
    isFavorite: false,
    tags: ["tendinopathie", "HSR", "isométrique", "charge"],
  },
  {
    id: 5,
    title: "Sleep quality and injury incidence in professional athletes: prospective cohort study across 8 sports",
    authors: "Nedelec M, Halson S, Juliff L et al.",
    source: "pubmed",
    date: "2026-03-18",
    category: "perfomance",
    abstract: "Étude prospective sur 18 mois, 612 athlètes pro de 8 sports (dont rugby, football, handball). Les athlètes dormant <7h par nuit ont un risque de blessure 1.7x supérieur (RR 1.72, IC95% 1.31-2.26). La qualité subjective du sommeil (PSQI >5) est un prédicteur indépendant même après ajustement sur la charge. L'effet est plus marqué chez les avants au rugby (RR 2.14 pour les premières lignes).",
    keyFindings: ["Sommeil <7h = risque blessure x1.7", "PSQI >5 = prédicteur indépendant de blessure", "Effet amplifié chez les avants rugby (RR 2.14)", "Fenêtre critique : veille de match et J+1"],
    clinicalImplication: "Intégrer le questionnaire PSQI dans le monitoring hebdomadaire. Alerter le staff pour les joueurs <7h de sommeil, surtout les avants. Éducation sommeil en pré-saison.",
    doi: "10.1016/j.jsams.2026.03.012",
    isFavorite: false,
    tags: ["sommeil", "prévention", "monitoring", "récupération"],
  },
  {
    id: 6,
    title: "Point-of-care ultrasound for acute muscle injuries in sport: diagnostic accuracy and clinical decision-making",
    authors: "Hotfiel T, Seil R, Behr M et al.",
    source: "pubmed",
    date: "2026-03-15",
    category: "medical",
    abstract: "Étude diagnostique prospective comparant l'échographie au bord du terrain (POCUS) réalisée par des médecins du sport formés vs IRM de référence dans les lésions musculaires aiguës (n=286 lésions, 14 clubs pro). La sensibilité du POCUS est de 91.3% et la spécificité de 87.6% pour le grading. L'accord inter-examinateur est excellent (κ=0.84). Le POCUS modifie la décision clinique initiale dans 34% des cas et réduit le délai diagnostique de 3.2 jours en moyenne.",
    keyFindings: ["POCUS bord de terrain : Se 91.3%, Sp 87.6%", "Accord inter-examinateur excellent (κ=0.84)", "Modifie la décision clinique dans 34% des cas", "Réduit le délai diagnostique de 3.2 jours"],
    clinicalImplication: "Investir dans la formation POCUS pour les kinésithérapeutes du sport. L'échographie au bord du terrain permet un triage rapide et fiable des lésions musculaires.",
    doi: "10.1177/03635465261234567",
    isFavorite: false,
    tags: ["échographie", "diagnostic", "muscle", "POCUS"],
  },
  {
    id: 7,
    title: "Contextualising GPS data in elite football: moving beyond total distance to match-changing moments",
    authors: "Sportsmith / Will Sparkes",
    source: "sportsmith",
    date: "2026-03-21",
    category: "perfomance",
    abstract: "Cet article Sportsmith explore comment les données GPS traditionnelles (distance totale, distance haute intensité) ne suffisent plus pour optimiser la performance en sport collectif. L'auteur propose un cadre d'analyse contextuel intégrant les phases critiques du match (peak periods), les sprints décisifs et les efforts répétés dans des fenêtres de jeu spécifiques. L'approche combine données GPS, vidéo et données événementielles pour identifier les moments clés où la condition physique fait la différence.",
    keyFindings: ["La distance totale n'est pas corrélée aux résultats de match", "Les 'peak periods' de 1-5 min sont les phases physiques déterminantes", "Intégration GPS + vidéo + événementiel = meilleure lecture de la performance", "Entraîner les capacités spécifiques aux moments décisifs du match"],
    clinicalImplication: "Repenser le monitoring GPS en se focalisant sur les pics d'intensité contextualisés plutôt que les volumes globaux. Applicable au rugby pour cibler les phases de jeu critiques (rucks enchaînés, défense post-turnover).",
    doi: "sportsmith.co/articles/gps-context",
    isFavorite: false,
    tags: ["GPS", "performance", "monitoring", "peak demands"],
  },
  {
    id: 8,
    title: "Isometric strength training: science and application for injury prevention and rehabilitation",
    authors: "Sportsmith / Alex Natera, Keith Baar, Neil Cronin",
    source: "sportsmith",
    date: "2026-03-16",
    category: "rehab",
    abstract: "Cours et article de synthèse Sportsmith sur l'entraînement isométrique. Les experts (dont Keith Baar, spécialiste tendon UC Davis) détaillent les mécanismes physiologiques de l'isométrique sur le tendon (augmentation de la synthèse de collagène, modulation de la douleur via inhibition corticale) et proposent des protocoles appliqués pour la prévention et la rééducation des tendinopathies, lésions musculaires et post-chirurgie. Protocoles spécifiques pour les ischio-jambiers, le tendon d'Achille et le tendon rotulien.",
    keyFindings: ["Isométrique long (45s) : analgésie par inhibition corticale du tendon", "Isométrique + 5min avant gélatine/vitamine C = synthèse collagène optimale", "Protocole tendon rotulien : 5x45s à 70% MVIC, genou 60°", "Application pré-entraînement pour moduler la douleur tendineuse"],
    clinicalImplication: "Utiliser les isométriques longs (45s) comme outil de gestion de la douleur tendineuse avant l'entraînement. Combiner avec gélatine + vitamine C 30-60min avant pour maximiser la synthèse de collagène.",
    doi: "sportsmith.co/courses/isometric-strength",
    isFavorite: false,
    tags: ["isométrique", "tendon", "collagène", "prévention", "Baar"],
  },
];

// ─── Utility components ──────────────────────────────────────
function Badge({ label, color, small }) {
  return (
    <span style={{ display: "inline-block", padding: small ? "2px 8px" : "3px 10px", borderRadius: "999px", fontSize: small ? "10px" : "11px", fontWeight: 500, background: color + "18", color: color, whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

function SourceBadge({ sourceId }) {
  const src = SOURCES.find((s) => s.id === sourceId);
  if (!src) return null;
  return (
    <span style={{ fontSize: "11px", color: "var(--color-text-secondary)", display: "inline-flex", alignItems: "center", gap: "3px" }}>
      <span style={{ fontSize: "12px" }}>{src.icon}</span> {src.label}
    </span>
  );
}

function StarButton({ active, onClick }) {
  return (
    <button onClick={onClick} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", fontSize: "18px", lineHeight: 1, color: active ? "#BA7517" : "var(--color-text-tertiary)", transition: "color 0.15s, transform 0.1s" }} title={active ? "Retirer des favoris" : "Ajouter aux favoris"}>
      {active ? "★" : "☆"}
    </button>
  );
}

function Tag({ label }) {
  return (
    <span style={{ display: "inline-block", padding: "2px 7px", borderRadius: "4px", fontSize: "10px", background: "var(--color-background-secondary)", color: "var(--color-text-secondary)", border: "0.5px solid var(--color-border-tertiary)" }}>
      #{label}
    </span>
  );
}

function formatDate(d) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Infographic generator ──────────────────────────────────
function InfographicModal({ article, onClose }) {
  const canvasRef = useRef(null);
  const [generated, setGenerated] = useState(false);
  const cat = CATEGORIES.find((c) => c.id === article.category);
  const catColor = cat?.color || "#534AB7";

  const generateInfographic = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = 800;
    const H = 1100;
    canvas.width = W;
    canvas.height = H;

    ctx.fillStyle = "#FAFAF7";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = catColor;
    ctx.fillRect(0, 0, W, 6);
    ctx.fillStyle = catColor + "15";
    ctx.fillRect(0, 0, 6, H);

    ctx.fillStyle = catColor;
    ctx.fillRect(30, 40, 4, 36);
    ctx.font = "bold 20px 'Segoe UI', system-ui, sans-serif";
    ctx.fillStyle = "#1a1a18";
    wrapText(ctx, article.title, 46, 56, W - 80, 26);

    const src = SOURCES.find((s) => s.id === article.source);
    ctx.font = "14px 'Segoe UI', system-ui, sans-serif";
    ctx.fillStyle = "#888780";
    const titleLines = Math.ceil(ctx.measureText(article.title).width / (W - 80));
    let y = 56 + Math.max(titleLines, 2) * 28 + 16;
    ctx.fillText(`${src?.label || article.source}  •  ${article.authors}  •  ${formatDate(article.date)}`, 46, y);
    y += 36;

    ctx.fillStyle = catColor + "20";
    roundRect(ctx, 46, y, ctx.measureText(cat?.label || "").width + 24, 28, 14);
    ctx.fill();
    ctx.font = "bold 12px 'Segoe UI', system-ui, sans-serif";
    ctx.fillStyle = catColor;
    ctx.fillText(cat?.label || "", 58, y + 19);
    y += 52;

    ctx.strokeStyle = "#D3D1C7";
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(46, y);
    ctx.lineTo(W - 46, y);
    ctx.stroke();
    y += 28;

    ctx.font = "bold 16px 'Segoe UI', system-ui, sans-serif";
    ctx.fillStyle = catColor;
    ctx.fillText("Résultats clés", 46, y);
    y += 28;

    article.keyFindings.forEach((finding, i) => {
      ctx.fillStyle = catColor;
      ctx.beginPath();
      ctx.arc(60, y - 4, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = "bold 12px 'Segoe UI', system-ui, sans-serif";
      ctx.fillStyle = "#fff";
      ctx.fillText(`${i + 1}`, 56, y);
      ctx.font = "14px 'Segoe UI', system-ui, sans-serif";
      ctx.fillStyle = "#2C2C2A";
      const lines = wrapText(ctx, finding, 82, y, W - 130, 20);
      y += Math.max(lines, 1) * 20 + 16;
    });
    y += 16;

    ctx.fillStyle = catColor + "10";
    const boxH = 100;
    roundRect(ctx, 36, y, W - 72, boxH, 8);
    ctx.fill();
    ctx.strokeStyle = catColor + "30";
    ctx.lineWidth = 1;
    roundRect(ctx, 36, y, W - 72, boxH, 8);
    ctx.stroke();
    ctx.font = "bold 14px 'Segoe UI', system-ui, sans-serif";
    ctx.fillStyle = catColor;
    ctx.fillText("Implication clinique", 56, y + 26);
    ctx.font = "13px 'Segoe UI', system-ui, sans-serif";
    ctx.fillStyle = "#444441";
    wrapText(ctx, article.clinicalImplication, 56, y + 48, W - 130, 18);
    y += boxH + 30;

    ctx.font = "11px 'Segoe UI', system-ui, sans-serif";
    ctx.fillStyle = "#B4B2A9";
    ctx.fillText(`DOI: ${article.doi}`, 46, y);
    ctx.fillStyle = catColor;
    ctx.fillRect(0, H - 4, W, 4);
    ctx.font = "11px 'Segoe UI', system-ui, sans-serif";
    ctx.fillStyle = "#B4B2A9";
    ctx.fillText("VeilleKiné — Veille Scientifique Sport", 46, H - 18);

    setGenerated(true);
  }, [article, catColor]);

  useEffect(() => {
    generateInfographic();
  }, [generateInfographic]);

  const downloadInfographic = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `infographie-${article.id}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--color-background-primary)", borderRadius: "var(--border-radius-lg)", maxWidth: "860px", width: "100%", maxHeight: "90vh", overflow: "auto", padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 500, margin: 0 }}>Infographie</h3>
          <div style={{ display: "flex", gap: "8px" }}>
            {generated && (
              <button onClick={downloadInfographic} style={{ padding: "6px 14px", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-primary)", cursor: "pointer", fontSize: "13px", fontWeight: 500 }}>
                Télécharger PNG
              </button>
            )}
            <button onClick={onClose} style={{ padding: "6px 12px", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-primary)", cursor: "pointer", fontSize: "16px", lineHeight: 1 }}>
              ✕
            </button>
          </div>
        </div>
        <canvas ref={canvasRef} style={{ width: "100%", height: "auto", borderRadius: "8px", border: "0.5px solid var(--color-border-tertiary)" }} />
      </div>
    </div>
  );
}

function wrapText(ctx, text, x, y, maxW, lineH) {
  const words = text.split(" ");
  let line = "";
  let lines = 1;
  for (let i = 0; i < words.length; i++) {
    const test = line + words[i] + " ";
    if (ctx.measureText(test).width > maxW && i > 0) {
      ctx.fillText(line.trim(), x, y);
      line = words[i] + " ";
      y += lineH;
      lines++;
    } else {
      line = test;
    }
  }
  ctx.fillText(line.trim(), x, y);
  return lines;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ─── Article detail view ─────────────────────────────────────
function ArticleDetail({ article, onBack, onToggleFavorite, onShowInfographic }) {
  const cat = CATEGORIES.find((c) => c.id === article.category);
  return (
    <div style={{ maxWidth: "720px" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: "var(--color-text-secondary)", padding: "0", marginBottom: "20px", display: "flex", alignItems: "center", gap: "4px" }}>
        ← Retour à la liste
      </button>
      <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "8px" }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: "20px", fontWeight: 500, margin: "0 0 10px", lineHeight: 1.35 }}>{article.title}</h2>
          <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
            <SourceBadge sourceId={article.source} />
            <span style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}>{formatDate(article.date)}</span>
            {cat && <Badge label={cat.label} color={cat.color} />}
          </div>
        </div>
        <StarButton active={article.isFavorite} onClick={() => onToggleFavorite(article.id)} />
      </div>
      <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: "4px 0 20px" }}>{article.authors}</p>

      <div style={{ marginBottom: "24px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-text-secondary)", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Résumé</h3>
        <p style={{ fontSize: "14px", lineHeight: 1.7, color: "var(--color-text-primary)", margin: 0 }}>{article.abstract}</p>
      </div>

      <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-lg)", padding: "16px 20px", marginBottom: "20px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: 500, margin: "0 0 12px", color: cat?.color || "var(--color-text-primary)" }}>Résultats clés</h3>
        {article.keyFindings.map((f, i) => (
          <div key={i} style={{ display: "flex", gap: "10px", marginBottom: "8px", alignItems: "flex-start" }}>
            <span style={{ width: "20px", height: "20px", borderRadius: "50%", background: cat?.color || "#534AB7", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 500, flexShrink: 0, marginTop: "2px" }}>{i + 1}</span>
            <span style={{ fontSize: "13px", lineHeight: 1.5 }}>{f}</span>
          </div>
        ))}
      </div>

      <div style={{ borderLeft: `3px solid ${cat?.color || "#534AB7"}`, padding: "12px 16px", background: (cat?.color || "#534AB7") + "08", borderRadius: "0 var(--border-radius-md) var(--border-radius-md) 0", marginBottom: "20px" }}>
        <h3 style={{ fontSize: "13px", fontWeight: 500, margin: "0 0 6px", color: cat?.color || "var(--color-text-primary)" }}>Implication clinique</h3>
        <p style={{ fontSize: "13px", lineHeight: 1.6, margin: 0 }}>{article.clinicalImplication}</p>
      </div>

      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "20px" }}>
        {article.tags.map((t) => <Tag key={t} label={t} />)}
      </div>

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <button onClick={() => onShowInfographic(article)} style={{ padding: "8px 16px", borderRadius: "var(--border-radius-md)", border: `1px solid ${cat?.color || "#534AB7"}`, background: (cat?.color || "#534AB7") + "10", color: cat?.color || "#534AB7", cursor: "pointer", fontSize: "13px", fontWeight: 500 }}>
          Générer l'infographie
        </button>
        <button onClick={() => window.open(`https://doi.org/${article.doi}`, "_blank")} style={{ padding: "8px 16px", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-primary)", cursor: "pointer", fontSize: "13px" }}>
          Voir l'article original ↗
        </button>
      </div>
      <p style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginTop: "16px" }}>DOI: {article.doi}</p>
    </div>
  );
}

// ─── Article card (list item) ────────────────────────────────
function ArticleCard({ article, onSelect, onToggleFavorite }) {
  const cat = CATEGORIES.find((c) => c.id === article.category);
  return (
    <div
      style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "16px 20px", cursor: "pointer", transition: "border-color 0.15s", borderLeft: `3px solid ${cat?.color || "#888"}` }}
      onClick={() => onSelect(article)}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-border-secondary)")}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-border-tertiary)"; e.currentTarget.style.borderLeft = `3px solid ${cat?.color || "#888"}`; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: "14px", fontWeight: 500, margin: "0 0 6px", lineHeight: 1.4 }}>{article.title}</h3>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginBottom: "8px" }}>
            <SourceBadge sourceId={article.source} />
            <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>{formatDate(article.date)}</span>
            {cat && <Badge label={cat.label} color={cat.color} small />}
          </div>
          <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {article.clinicalImplication}
          </p>
        </div>
        <StarButton active={article.isFavorite} onClick={(e) => { e.stopPropagation(); onToggleFavorite(article.id); }} />
      </div>
      <div style={{ display: "flex", gap: "4px", marginTop: "10px", flexWrap: "wrap" }}>
        {article.tags.slice(0, 4).map((t) => <Tag key={t} label={t} />)}
      </div>
    </div>
  );
}

// ─── Sources config panel ────────────────────────────────────
function SourcesPanel({ userSources, setUserSources, onClose }) {
  const [newUrl, setNewUrl] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const addSource = () => {
    if (!newUrl.trim()) return;
    setUserSources((prev) => [...prev, { url: newUrl.trim(), label: newLabel.trim() || newUrl.trim(), enabled: true }]);
    setNewUrl("");
    setNewLabel("");
  };

  return (
    <div style={{ maxWidth: "600px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 500, margin: 0 }}>Sources de veille</h2>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: "var(--color-text-secondary)" }}>← Retour</button>
      </div>
      <div style={{ marginBottom: "24px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-text-secondary)", margin: "0 0 12px" }}>Sources intégrées</h3>
        {SOURCES.map((s) => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
            <span style={{ fontSize: "16px", width: "24px", textAlign: "center" }}>{s.icon}</span>
            <span style={{ flex: 1, fontSize: "14px" }}>{s.label}</span>
            <span style={{ fontSize: "11px", color: "var(--color-text-success)", fontWeight: 500 }}>Actif</span>
          </div>
        ))}
      </div>
      <div style={{ marginBottom: "24px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-text-secondary)", margin: "0 0 12px" }}>Vos sources personnalisées</h3>
        {userSources.length === 0 && <p style={{ fontSize: "13px", color: "var(--color-text-tertiary)", fontStyle: "italic" }}>Aucune source ajoutée</p>}
        {userSources.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
            <span style={{ flex: 1, fontSize: "13px" }}>{s.label}</span>
            <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>{s.url}</span>
            <button onClick={() => setUserSources((prev) => prev.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "14px", color: "var(--color-text-danger)" }}>✕</button>
          </div>
        ))}
      </div>
      <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-lg)", padding: "16px" }}>
        <h4 style={{ fontSize: "13px", fontWeight: 500, margin: "0 0 10px" }}>Ajouter une source</h4>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <input type="text" placeholder="Nom (ex: La Clinique du Coureur)" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} style={{ flex: "1 1 180px", minWidth: "140px" }} />
          <input type="text" placeholder="URL ou flux RSS" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} style={{ flex: "2 1 220px", minWidth: "180px" }} />
          <button onClick={addSource} style={{ padding: "8px 16px", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-primary)", cursor: "pointer", fontSize: "13px", fontWeight: 500, whiteSpace: "nowrap" }}>+ Ajouter</button>
        </div>
        <p style={{ fontSize: "11px", color: "var(--color-text-tertiary)", margin: "8px 0 0" }}>Ajoutez des flux RSS, des pages de journaux, des comptes Twitter/X ou LinkedIn à surveiller</p>
      </div>
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────
export default function VeilleApp() {
  const [articles, setArticles] = useState(MOCK_ARTICLES);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [infographicArticle, setInfographicArticle] = useState(null);
  const [view, setView] = useState("feed");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeSource, setActiveSource] = useState("all");
  const [userSources, setUserSources] = useState([]);

  const toggleFavorite = (id) => {
    setArticles((prev) => prev.map((a) => (a.id === id ? { ...a, isFavorite: !a.isFavorite } : a)));
  };

  const filteredArticles = useMemo(() => {
    let list = [...articles];
    if (view === "favorites") list = list.filter((a) => a.isFavorite);
    if (activeCategory !== "all") list = list.filter((a) => a.category === activeCategory);
    if (activeSource !== "all") list = list.filter((a) => a.source === activeSource);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.tags.some((t) => t.includes(q)) ||
          a.clinicalImplication.toLowerCase().includes(q) ||
          a.abstract.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [articles, view, activeCategory, activeSource, searchQuery]);

  const favCount = articles.filter((a) => a.isFavorite).length;

  if (view === "sources") {
    return (
      <div style={{ padding: "1rem 0" }}>
        <SourcesPanel userSources={userSources} setUserSources={setUserSources} onClose={() => setView("feed")} />
      </div>
    );
  }

  if (selectedArticle) {
    const art = articles.find((a) => a.id === selectedArticle.id);
    return (
      <div style={{ padding: "1rem 0" }}>
        <ArticleDetail article={art} onBack={() => setSelectedArticle(null)} onToggleFavorite={toggleFavorite} onShowInfographic={setInfographicArticle} />
        {infographicArticle && <InfographicModal article={infographicArticle} onClose={() => setInfographicArticle(null)} />}
      </div>
    );
  }

  return (
    <div style={{ padding: "1rem 0" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "linear-gradient(135deg, #1D9E75, #0F6E56)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "16px", fontWeight: 500 }}>V</div>
            <div>
              <h1 style={{ fontSize: "20px", fontWeight: 500, margin: 0 }}>VeilleKiné</h1>
              <p style={{ fontSize: "11px", color: "var(--color-text-secondary)", margin: 0 }}>Kiné du sport & préparation physique</p>
            </div>
          </div>
          <button onClick={() => setView("sources")} style={{ padding: "6px 14px", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-primary)", cursor: "pointer", fontSize: "12px" }}>
            Sources
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px", marginBottom: "20px" }}>
        <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "12px 14px" }}>
          <p style={{ fontSize: "11px", color: "var(--color-text-secondary)", margin: "0 0 4px" }}>Cette semaine</p>
          <p style={{ fontSize: "22px", fontWeight: 500, margin: 0 }}>{articles.length}</p>
        </div>
        <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "12px 14px" }}>
          <p style={{ fontSize: "11px", color: "var(--color-text-secondary)", margin: "0 0 4px" }}>Favoris</p>
          <p style={{ fontSize: "22px", fontWeight: 500, margin: 0 }}>{favCount}</p>
        </div>
        <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "12px 14px" }}>
          <p style={{ fontSize: "11px", color: "var(--color-text-secondary)", margin: "0 0 4px" }}>Sources actives</p>
          <p style={{ fontSize: "22px", fontWeight: 500, margin: 0 }}>{SOURCES.length + userSources.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0", marginBottom: "16px", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
        {[{ key: "feed", label: "Fil d'actualité" }, { key: "favorites", label: `Favoris (${favCount})` }].map((tab) => (
          <button key={tab.key} onClick={() => setView(tab.key)} style={{ padding: "8px 16px", border: "none", background: "none", cursor: "pointer", fontSize: "13px", fontWeight: view === tab.key ? 500 : 400, color: view === tab.key ? "var(--color-text-primary)" : "var(--color-text-secondary)", borderBottom: view === tab.key ? "2px solid var(--color-text-primary)" : "2px solid transparent", marginBottom: "-0.5px" }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <input type="text" placeholder="Rechercher par titre, tag, pathologie..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: "100%", marginBottom: "12px", boxSizing: "border-box" }} />

      {/* Category filters */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
        <button onClick={() => setActiveCategory("all")} style={{ padding: "4px 10px", borderRadius: "999px", border: activeCategory === "all" ? "1px solid var(--color-text-primary)" : "0.5px solid var(--color-border-tertiary)", background: activeCategory === "all" ? "var(--color-text-primary)" : "var(--color-background-primary)", color: activeCategory === "all" ? "var(--color-background-primary)" : "var(--color-text-secondary)", cursor: "pointer", fontSize: "11px", fontWeight: 500 }}>Toutes</button>
        {CATEGORIES.map((cat) => (
          <button key={cat.id} onClick={() => setActiveCategory(activeCategory === cat.id ? "all" : cat.id)} style={{ padding: "4px 10px", borderRadius: "999px", border: activeCategory === cat.id ? `1px solid ${cat.color}` : "0.5px solid var(--color-border-tertiary)", background: activeCategory === cat.id ? cat.color + "15" : "var(--color-background-primary)", color: activeCategory === cat.id ? cat.color : "var(--color-text-secondary)", cursor: "pointer", fontSize: "11px", fontWeight: 500 }}>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Source filters */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "16px" }}>
        {SOURCES.map((src) => (
          <button key={src.id} onClick={() => setActiveSource(activeSource === src.id ? "all" : src.id)} style={{ padding: "3px 8px", borderRadius: "var(--border-radius-md)", border: activeSource === src.id ? "1px solid var(--color-border-primary)" : "0.5px solid var(--color-border-tertiary)", background: activeSource === src.id ? "var(--color-background-secondary)" : "transparent", cursor: "pointer", fontSize: "11px", color: "var(--color-text-secondary)" }}>
            {src.icon} {src.label}
          </button>
        ))}
      </div>

      {/* Article list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {filteredArticles.length === 0 && (
          <p style={{ fontSize: "14px", color: "var(--color-text-tertiary)", textAlign: "center", padding: "40px 0" }}>
            {view === "favorites" ? "Aucun article en favoris" : "Aucun article trouvé"}
          </p>
        )}
        {filteredArticles.map((article) => (
          <ArticleCard key={article.id} article={article} onSelect={setSelectedArticle} onToggleFavorite={toggleFavorite} />
        ))}
      </div>

      {infographicArticle && <InfographicModal article={infographicArticle} onClose={() => setInfographicArticle(null)} />}
    </div>
  );
}
