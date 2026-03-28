import { useState, useEffect, useCallback, useMemo, useRef } from "react";

// ─── SUPABASE CONFIG ─────────────────────────────────────────
const SUPABASE_URL = "https://onuhahnabdbslgstcxws.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9udWhhaG5hYmRic2xnc3RjeHdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NDYzNjIsImV4cCI6MjA5MDIyMjM2Mn0.T4t8CQiyz-ggO6EZeF905lW2b-E9nw_S10X2zbtSObE";

async function supaFetch(table, { select = "*", order, eq, limit } = {}) {
  let url = `${SUPABASE_URL}/rest/v1/${table}?select=${select}`;
  if (eq) url += `&${eq[0]}=eq.${eq[1]}`;
  if (order) url += `&order=${order}`;
  if (limit) url += `&limit=${limit}`;
  const res = await fetch(url, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
  return res.json();
}
async function supaUpdate(table, id, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, { method: "PATCH", headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify(data) });
  return res.ok;
}
async function supaInsert(table, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, { method: "POST", headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" }, body: JSON.stringify(data) });
  return res.json();
}
async function supaDelete(table, id) {
  await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, { method: "DELETE", headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
}

// ─── CONFIG ──────────────────────────────────────────────────
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

// ─── Utility components ──────────────────────────────────────
function Badge({ label, color, small }) {
  return <span style={{ display: "inline-block", padding: small ? "2px 8px" : "3px 10px", borderRadius: "999px", fontSize: small ? "10px" : "11px", fontWeight: 500, background: color + "18", color, whiteSpace: "nowrap" }}>{label}</span>;
}
function SourceBadge({ sourceSlug, sources }) {
  const src = sources.find((s) => s.slug === sourceSlug);
  if (!src) return null;
  return <span style={{ fontSize: "11px", color: "var(--color-text-secondary)", display: "inline-flex", alignItems: "center", gap: "3px" }}><span style={{ fontSize: "12px" }}>{src.icon}</span> {src.label}</span>;
}
function StarButton({ active, onClick }) {
  return <button onClick={onClick} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", fontSize: "18px", lineHeight: 1, color: active ? "#BA7517" : "var(--color-text-tertiary)", transition: "color 0.15s" }} title={active ? "Retirer des favoris" : "Ajouter aux favoris"}>{active ? "★" : "☆"}</button>;
}
function Tag({ label, onClick }) {
  return <span onClick={onClick} style={{ display: "inline-block", padding: "2px 7px", borderRadius: "4px", fontSize: "10px", background: "var(--color-background-secondary)", color: "var(--color-text-secondary)", border: "0.5px solid var(--color-border-tertiary)", cursor: onClick ? "pointer" : "default" }}>#{label}</span>;
}
function formatDate(d) { return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }); }
function LoadingSpinner() {
  return <div style={{ textAlign: "center", padding: "40px 0" }}><div style={{ display: "inline-block", width: "28px", height: "28px", border: "2.5px solid var(--color-border-tertiary)", borderTopColor: "#1D9E75", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /><style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style><p style={{ fontSize: "13px", color: "var(--color-text-secondary)", marginTop: "10px" }}>Chargement...</p></div>;
}

// ─── Article image component ─────────────────────────────────
function ArticleImage({ url, alt, style }) {
  const [error, setError] = useState(false);
  if (!url || error) return null;
  return <img src={url} alt={alt || ""} onError={() => setError(true)} style={{ width: "100%", objectFit: "cover", borderRadius: "var(--border-radius-md)", ...style }} />;
}

// ─── Image edit modal ────────────────────────────────────────
function ImageEditModal({ article, onClose, onSave }) {
  const [url, setUrl] = useState(article.image_url || "");
  const [saving, setSaving] = useState(false);
  const handleSave = async () => {
    setSaving(true);
    await onSave(article.id, url);
    setSaving(false);
    onClose();
  };
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--color-background-primary)", borderRadius: "var(--border-radius-lg)", maxWidth: "500px", width: "100%", padding: "24px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 500, margin: "0 0 16px" }}>Modifier l'image</h3>
        <input type="text" placeholder="URL de l'image (Unsplash, Imgur, etc.)" value={url} onChange={(e) => setUrl(e.target.value)} style={{ width: "100%", marginBottom: "12px", boxSizing: "border-box" }} />
        {url && <ArticleImage url={url} alt="Aperçu" style={{ height: "160px", marginBottom: "12px" }} />}
        <p style={{ fontSize: "11px", color: "var(--color-text-tertiary)", margin: "0 0 16px" }}>Collez l'URL d'une image depuis Unsplash, Google Images, ou toute autre source</p>
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-primary)", cursor: "pointer", fontSize: "13px" }}>Annuler</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: "8px 16px", borderRadius: "var(--border-radius-md)", border: "none", background: "#1D9E75", color: "#fff", cursor: "pointer", fontSize: "13px", fontWeight: 500, opacity: saving ? 0.5 : 1 }}>{saving ? "..." : "Enregistrer"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Similar articles component ──────────────────────────────
function SimilarArticles({ currentArticle, allArticles, sources, onSelect }) {
  const similar = useMemo(() => {
    const currentTags = Array.isArray(currentArticle.tags) ? currentArticle.tags : [];
    const scored = allArticles
      .filter((a) => a.id !== currentArticle.id)
      .map((a) => {
        const aTags = Array.isArray(a.tags) ? a.tags : [];
        let score = 0;
        // Tags en commun (poids fort)
        currentTags.forEach((t) => { if (aTags.includes(t)) score += 3; });
        // Même catégorie
        if (a.category === currentArticle.category) score += 2;
        // Même source
        if (a.source_slug === currentArticle.source_slug) score += 1;
        return { ...a, score };
      })
      .filter((a) => a.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    return scored;
  }, [currentArticle, allArticles]);

  if (similar.length === 0) return null;

  return (
    <div style={{ marginTop: "28px", paddingTop: "20px", borderTop: "0.5px solid var(--color-border-tertiary)" }}>
      <h3 style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-text-secondary)", margin: "0 0 12px" }}>Articles similaires</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {similar.map((a) => {
          const cat = CATEGORIES.find((c) => c.id === a.category);
          return (
            <div key={a.id} onClick={() => onSelect(a)} style={{ display: "flex", gap: "12px", padding: "10px 12px", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-tertiary)", cursor: "pointer", transition: "background 0.15s", alignItems: "center" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--color-background-secondary)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
              {a.image_url && <img src={a.image_url} alt="" style={{ width: "56px", height: "56px", objectFit: "cover", borderRadius: "6px", flexShrink: 0 }} onError={(e) => e.target.style.display = "none"} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "12px", fontWeight: 500, margin: "0 0 4px", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{a.title}</p>
                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  <SourceBadge sourceSlug={a.source_slug} sources={sources} />
                  {cat && <Badge label={cat.label} color={cat.color} small />}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Infographic generator ──────────────────────────────────
function InfographicModal({ article, sources, onClose }) {
  const canvasRef = useRef(null);
  const [generated, setGenerated] = useState(false);
  const cat = CATEGORIES.find((c) => c.id === article.category);
  const cc = cat?.color || "#534AB7";

  const generateInfographic = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = 800, H = 1200;
    canvas.width = W; canvas.height = H;

    ctx.fillStyle = "#FAFAF7"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = cc; ctx.fillRect(0, 0, W, 6);
    ctx.fillStyle = cc + "15"; ctx.fillRect(0, 0, 6, H);

    let y = 40;

    // If image, draw it at the top
    const drawContent = (img) => {
      if (img) {
        const imgH = 220;
        ctx.save();
        roundRect(ctx, 36, y, W - 72, imgH, 12); ctx.clip();
        const scale = Math.max((W - 72) / img.width, imgH / img.height);
        const sw = img.width * scale, sh = img.height * scale;
        ctx.drawImage(img, 36 + (W - 72 - sw) / 2, y + (imgH - sh) / 2, sw, sh);
        ctx.restore();
        // Overlay gradient for text readability
        ctx.fillStyle = cc + "30"; roundRect(ctx, 36, y, W - 72, imgH, 12); ctx.fill();
        y += imgH + 16;
      }

      ctx.fillStyle = cc; ctx.fillRect(30, y, 4, 36);
      ctx.font = "bold 20px 'Segoe UI', system-ui, sans-serif"; ctx.fillStyle = "#1a1a18";
      wrapText(ctx, article.title, 46, y + 16, W - 80, 26);
      const titleLines = Math.ceil(ctx.measureText(article.title).width / (W - 80));
      y += Math.max(titleLines, 2) * 28 + 24;

      const src = sources.find((s) => s.slug === article.source_slug);
      ctx.font = "14px 'Segoe UI', system-ui, sans-serif"; ctx.fillStyle = "#888780";
      ctx.fillText(`${src?.label || article.source_slug}  •  ${article.authors}  •  ${formatDate(article.date)}`, 46, y);
      y += 30;

      ctx.fillStyle = cc + "20"; roundRect(ctx, 46, y, ctx.measureText(cat?.label || "").width + 24, 28, 14); ctx.fill();
      ctx.font = "bold 12px 'Segoe UI', system-ui, sans-serif"; ctx.fillStyle = cc;
      ctx.fillText(cat?.label || "", 58, y + 19); y += 46;

      ctx.strokeStyle = "#D3D1C7"; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(46, y); ctx.lineTo(W - 46, y); ctx.stroke(); y += 24;

      ctx.font = "bold 16px 'Segoe UI', system-ui, sans-serif"; ctx.fillStyle = cc;
      ctx.fillText("Résultats clés", 46, y); y += 28;

      const findings = Array.isArray(article.key_findings) ? article.key_findings : [];
      findings.forEach((finding, i) => {
        ctx.fillStyle = cc; ctx.beginPath(); ctx.arc(60, y - 4, 10, 0, Math.PI * 2); ctx.fill();
        ctx.font = "bold 12px 'Segoe UI', system-ui, sans-serif"; ctx.fillStyle = "#fff"; ctx.fillText(`${i + 1}`, i < 9 ? 56 : 53, y);
        ctx.font = "14px 'Segoe UI', system-ui, sans-serif"; ctx.fillStyle = "#2C2C2A";
        const lines = wrapText(ctx, finding, 82, y, W - 130, 20);
        y += Math.max(lines, 1) * 20 + 16;
      });
      y += 12;

      ctx.fillStyle = cc + "10"; const boxH = 100;
      roundRect(ctx, 36, y, W - 72, boxH, 8); ctx.fill();
      ctx.strokeStyle = cc + "30"; ctx.lineWidth = 1; roundRect(ctx, 36, y, W - 72, boxH, 8); ctx.stroke();
      ctx.font = "bold 14px 'Segoe UI', system-ui, sans-serif"; ctx.fillStyle = cc;
      ctx.fillText("Implication clinique", 56, y + 26);
      ctx.font = "13px 'Segoe UI', system-ui, sans-serif"; ctx.fillStyle = "#444441";
      wrapText(ctx, article.clinical_implication || "", 56, y + 48, W - 130, 18);
      y += boxH + 24;

      ctx.font = "11px 'Segoe UI', system-ui, sans-serif"; ctx.fillStyle = "#B4B2A9";
      ctx.fillText(`DOI: ${article.doi || ""}`, 46, y);
      ctx.fillStyle = cc; ctx.fillRect(0, H - 4, W, 4);
      ctx.font = "11px 'Segoe UI', system-ui, sans-serif"; ctx.fillStyle = "#B4B2A9";
      ctx.fillText("VeilleKiné — Veille Scientifique Sport", 46, H - 18);
      setGenerated(true);
    };

    // Try loading article image
    if (article.image_url) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => drawContent(img);
      img.onerror = () => drawContent(null);
      img.src = article.image_url;
    } else {
      drawContent(null);
    }
  }, [article, cc, sources]);

  useEffect(() => { generateInfographic(); }, [generateInfographic]);

  const downloadInfographic = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const link = document.createElement("a"); link.download = `infographie-${article.title.slice(0, 30)}.png`;
    link.href = canvas.toDataURL("image/png"); link.click();
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--color-background-primary)", borderRadius: "var(--border-radius-lg)", maxWidth: "860px", width: "100%", maxHeight: "90vh", overflow: "auto", padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 500, margin: 0 }}>Infographie</h3>
          <div style={{ display: "flex", gap: "8px" }}>
            {generated && <button onClick={downloadInfographic} style={{ padding: "6px 14px", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-primary)", cursor: "pointer", fontSize: "13px", fontWeight: 500 }}>Télécharger PNG</button>}
            <button onClick={onClose} style={{ padding: "6px 12px", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-primary)", cursor: "pointer", fontSize: "16px", lineHeight: 1 }}>✕</button>
          </div>
        </div>
        <canvas ref={canvasRef} style={{ width: "100%", height: "auto", borderRadius: "8px", border: "0.5px solid var(--color-border-tertiary)" }} />
      </div>
    </div>
  );
}

function wrapText(ctx, text, x, y, maxW, lineH) {
  const words = (text || "").split(" "); let line = ""; let lines = 1;
  for (let i = 0; i < words.length; i++) {
    const test = line + words[i] + " ";
    if (ctx.measureText(test).width > maxW && i > 0) { ctx.fillText(line.trim(), x, y); line = words[i] + " "; y += lineH; lines++; }
    else { line = test; }
  }
  ctx.fillText(line.trim(), x, y); return lines;
}
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h); ctx.lineTo(x+r,y+h);
  ctx.quadraticCurveTo(x,y+h,x,y+h-r); ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
}

// ─── Article detail view ─────────────────────────────────────
function ArticleDetail({ article, sources, allArticles, onBack, onToggleFavorite, onShowInfographic, onSelectArticle, onEditImage }) {
  const cat = CATEGORIES.find((c) => c.id === article.category);
  const findings = Array.isArray(article.key_findings) ? article.key_findings : [];
  const tags = Array.isArray(article.tags) ? article.tags : [];

  return (
    <div style={{ maxWidth: "720px" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: "var(--color-text-secondary)", padding: 0, marginBottom: "20px", display: "flex", alignItems: "center", gap: "4px" }}>← Retour à la liste</button>

      {/* Article image */}
      {article.image_url ? (
        <div style={{ position: "relative", marginBottom: "16px" }}>
          <ArticleImage url={article.image_url} alt={article.title} style={{ height: "220px" }} />
          <button onClick={() => onEditImage(article)} style={{ position: "absolute", bottom: "8px", right: "8px", padding: "4px 10px", borderRadius: "var(--border-radius-md)", border: "none", background: "rgba(0,0,0,0.5)", color: "#fff", cursor: "pointer", fontSize: "11px" }}>Modifier</button>
        </div>
      ) : (
        <button onClick={() => onEditImage(article)} style={{ width: "100%", padding: "20px", borderRadius: "var(--border-radius-lg)", border: "1px dashed var(--color-border-secondary)", background: "var(--color-background-secondary)", cursor: "pointer", fontSize: "13px", color: "var(--color-text-secondary)", marginBottom: "16px", textAlign: "center" }}>
          + Ajouter une image à cet article
        </button>
      )}

      <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "8px" }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: "20px", fontWeight: 500, margin: "0 0 10px", lineHeight: 1.35 }}>{article.title}</h2>
          <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
            <SourceBadge sourceSlug={article.source_slug} sources={sources} />
            <span style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}>{formatDate(article.date)}</span>
            {cat && <Badge label={cat.label} color={cat.color} />}
          </div>
        </div>
        <StarButton active={article.is_favorite} onClick={() => onToggleFavorite(article.id, !article.is_favorite)} />
      </div>
      <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: "4px 0 20px" }}>{article.authors}</p>

      <div style={{ marginBottom: "24px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-text-secondary)", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Résumé</h3>
        <p style={{ fontSize: "14px", lineHeight: 1.7, margin: 0 }}>{article.abstract}</p>
      </div>

      {findings.length > 0 && (
        <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-lg)", padding: "16px 20px", marginBottom: "20px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: 500, margin: "0 0 12px", color: cat?.color }}>Résultats clés</h3>
          {findings.map((f, i) => (
            <div key={i} style={{ display: "flex", gap: "10px", marginBottom: "8px", alignItems: "flex-start" }}>
              <span style={{ width: "20px", height: "20px", borderRadius: "50%", background: cat?.color || "#534AB7", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 500, flexShrink: 0, marginTop: "2px" }}>{i + 1}</span>
              <span style={{ fontSize: "13px", lineHeight: 1.5 }}>{f}</span>
            </div>
          ))}
        </div>
      )}

      {article.clinical_implication && (
        <div style={{ borderLeft: `3px solid ${cat?.color || "#534AB7"}`, padding: "12px 16px", background: (cat?.color || "#534AB7") + "08", borderRadius: 0, marginBottom: "20px" }}>
          <h3 style={{ fontSize: "13px", fontWeight: 500, margin: "0 0 6px", color: cat?.color }}>Implication clinique</h3>
          <p style={{ fontSize: "13px", lineHeight: 1.6, margin: 0 }}>{article.clinical_implication}</p>
        </div>
      )}

      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "20px" }}>
        {tags.map((t) => <Tag key={t} label={t} />)}
      </div>

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <button onClick={() => onShowInfographic(article)} style={{ padding: "8px 16px", borderRadius: "var(--border-radius-md)", border: `1px solid ${cat?.color || "#534AB7"}`, background: (cat?.color || "#534AB7") + "10", color: cat?.color || "#534AB7", cursor: "pointer", fontSize: "13px", fontWeight: 500 }}>Générer l'infographie</button>
        {article.doi && <button onClick={() => window.open(`https://doi.org/${article.doi}`, "_blank")} style={{ padding: "8px 16px", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-primary)", cursor: "pointer", fontSize: "13px" }}>Voir l'article original ↗</button>}
      </div>
      {article.doi && <p style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginTop: "16px" }}>DOI: {article.doi}</p>}

      {/* Similar articles */}
      <SimilarArticles currentArticle={article} allArticles={allArticles} sources={sources} onSelect={onSelectArticle} />
    </div>
  );
}

// ─── Article card ────────────────────────────────────────────
function ArticleCard({ article, sources, onSelect, onToggleFavorite }) {
  const cat = CATEGORIES.find((c) => c.id === article.category);
  const tags = Array.isArray(article.tags) ? article.tags : [];
  return (
    <div
      style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", overflow: "hidden", cursor: "pointer", transition: "border-color 0.15s" }}
      onClick={() => onSelect(article)}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--color-border-secondary)"}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--color-border-tertiary)"}
    >
      {/* Thumbnail image */}
      {article.image_url && (
        <img src={article.image_url} alt="" style={{ width: "100%", height: "140px", objectFit: "cover" }} onError={(e) => e.target.style.display = "none"} />
      )}
      <div style={{ padding: "14px 18px", borderLeft: `3px solid ${cat?.color || "#888"}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: "14px", fontWeight: 500, margin: "0 0 6px", lineHeight: 1.4 }}>{article.title}</h3>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginBottom: "8px" }}>
              <SourceBadge sourceSlug={article.source_slug} sources={sources} />
              <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>{formatDate(article.date)}</span>
              {cat && <Badge label={cat.label} color={cat.color} small />}
            </div>
            <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {article.clinical_implication}
            </p>
          </div>
          <StarButton active={article.is_favorite} onClick={(e) => { e.stopPropagation(); onToggleFavorite(article.id, !article.is_favorite); }} />
        </div>
        {tags.length > 0 && (
          <div style={{ display: "flex", gap: "4px", marginTop: "10px", flexWrap: "wrap" }}>
            {tags.slice(0, 4).map((t) => <Tag key={t} label={t} />)}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sources panel ───────────────────────────────────────────
function SourcesPanel({ sources, onClose, onAddSource, onDeleteSource }) {
  const [newLabel, setNewLabel] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newIcon, setNewIcon] = useState("📄");
  const [adding, setAdding] = useState(false);
  const handleAdd = async () => {
    if (!newLabel.trim()) return;
    setAdding(true);
    const slug = newLabel.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
    await onAddSource({ slug, label: newLabel.trim(), icon: newIcon || "📄", url: newUrl.trim(), source_type: "rss", enabled: true });
    setNewLabel(""); setNewUrl(""); setNewIcon("📄"); setAdding(false);
  };
  return (
    <div style={{ maxWidth: "600px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 500, margin: 0 }}>Sources de veille</h2>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: "var(--color-text-secondary)" }}>← Retour</button>
      </div>
      <div style={{ marginBottom: "24px" }}>
        {sources.map((s) => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
            <span style={{ fontSize: "16px", width: "24px", textAlign: "center" }}>{s.icon}</span>
            <span style={{ flex: 1, fontSize: "14px" }}>{s.label}</span>
            <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.url}</span>
            <span style={{ fontSize: "11px", color: "var(--color-text-success)", fontWeight: 500 }}>Actif</span>
            <button onClick={() => onDeleteSource(s.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "14px", color: "var(--color-text-danger)", padding: "2px 6px" }}>✕</button>
          </div>
        ))}
      </div>
      <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-lg)", padding: "16px" }}>
        <h4 style={{ fontSize: "13px", fontWeight: 500, margin: "0 0 10px" }}>Ajouter une source</h4>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <input type="text" placeholder="Emoji" value={newIcon} onChange={(e) => setNewIcon(e.target.value)} style={{ width: "50px", textAlign: "center" }} />
          <input type="text" placeholder="Nom (ex: La Clinique du Coureur)" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} style={{ flex: "1 1 160px", minWidth: "120px" }} />
          <input type="text" placeholder="URL ou flux RSS" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} style={{ flex: "2 1 200px", minWidth: "160px" }} />
          <button onClick={handleAdd} disabled={adding} style={{ padding: "8px 16px", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-primary)", cursor: "pointer", fontSize: "13px", fontWeight: 500, whiteSpace: "nowrap", opacity: adding ? 0.5 : 1 }}>{adding ? "..." : "+ Ajouter"}</button>
        </div>
        <p style={{ fontSize: "11px", color: "var(--color-text-tertiary)", margin: "8px 0 0" }}>Sauvegardé dans la base — pas besoin de toucher au code</p>
      </div>
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────
export default function VeilleApp() {
  const [articles, setArticles] = useState([]);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [infographicArticle, setInfographicArticle] = useState(null);
  const [editingImage, setEditingImage] = useState(null);
  const [view, setView] = useState("feed");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeSource, setActiveSource] = useState("all");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [arts, srcs] = await Promise.all([
          supaFetch("articles", { order: "date.desc" }),
          supaFetch("sources", { order: "created_at.asc" }),
        ]);
        setArticles(Array.isArray(arts) ? arts : []);
        setSources(Array.isArray(srcs) ? srcs : []);
        setError(null);
      } catch (e) {
        setError("Impossible de charger les données.");
        console.error(e);
      } finally { setLoading(false); }
    }
    loadData();
  }, []);

  const toggleFavorite = async (id, val) => {
    setArticles((prev) => prev.map((a) => (a.id === id ? { ...a, is_favorite: val } : a)));
    await supaUpdate("articles", id, { is_favorite: val });
  };

  const updateImage = async (id, url) => {
    setArticles((prev) => prev.map((a) => (a.id === id ? { ...a, image_url: url } : a)));
    if (selectedArticle?.id === id) setSelectedArticle((prev) => ({ ...prev, image_url: url }));
    await supaUpdate("articles", id, { image_url: url });
  };

  const addSource = async (data) => {
    const result = await supaInsert("sources", data);
    if (Array.isArray(result) && result.length > 0) setSources((prev) => [...prev, result[0]]);
  };
  const deleteSource = async (id) => {
    await supaDelete("sources", id);
    setSources((prev) => prev.filter((s) => s.id !== id));
  };

  const filteredArticles = useMemo(() => {
    let list = [...articles];
    if (view === "favorites") list = list.filter((a) => a.is_favorite);
    if (activeCategory !== "all") list = list.filter((a) => a.category === activeCategory);
    if (activeSource !== "all") list = list.filter((a) => a.source_slug === activeSource);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((a) =>
        a.title?.toLowerCase().includes(q) ||
        (Array.isArray(a.tags) ? a.tags : []).some((t) => t.toLowerCase().includes(q)) ||
        a.clinical_implication?.toLowerCase().includes(q) ||
        a.abstract?.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [articles, view, activeCategory, activeSource, searchQuery]);

  const favCount = articles.filter((a) => a.is_favorite).length;

  if (loading) return <LoadingSpinner />;
  if (error) return <div style={{ textAlign: "center", padding: "40px 0" }}><p style={{ fontSize: "14px", color: "var(--color-text-danger)" }}>{error}</p><button onClick={() => window.location.reload()} style={{ marginTop: "12px", padding: "8px 20px", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-primary)", cursor: "pointer", fontSize: "13px" }}>Réessayer</button></div>;

  if (view === "sources") return <div style={{ padding: "1rem 0" }}><SourcesPanel sources={sources} onClose={() => setView("feed")} onAddSource={addSource} onDeleteSource={deleteSource} /></div>;

  if (selectedArticle) {
    const art = articles.find((a) => a.id === selectedArticle.id) || selectedArticle;
    return (
      <div style={{ padding: "1rem 0" }}>
        <ArticleDetail article={art} sources={sources} allArticles={articles} onBack={() => setSelectedArticle(null)} onToggleFavorite={toggleFavorite} onShowInfographic={setInfographicArticle} onSelectArticle={(a) => { setSelectedArticle(a); window.scrollTo(0, 0); }} onEditImage={setEditingImage} />
        {infographicArticle && <InfographicModal article={infographicArticle} sources={sources} onClose={() => setInfographicArticle(null)} />}
        {editingImage && <ImageEditModal article={editingImage} onClose={() => setEditingImage(null)} onSave={updateImage} />}
      </div>
    );
  }

  return (
    <div style={{ padding: "1rem 0" }}>
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "linear-gradient(135deg, #1D9E75, #0F6E56)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "16px", fontWeight: 500 }}>V</div>
            <div>
              <h1 style={{ fontSize: "20px", fontWeight: 500, margin: 0 }}>VeilleKiné</h1>
              <p style={{ fontSize: "11px", color: "var(--color-text-secondary)", margin: 0 }}>Kiné du sport & préparation physique</p>
            </div>
          </div>
          <button onClick={() => setView("sources")} style={{ padding: "6px 14px", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-primary)", cursor: "pointer", fontSize: "12px" }}>Sources</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px", marginBottom: "20px" }}>
        <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "12px 14px" }}><p style={{ fontSize: "11px", color: "var(--color-text-secondary)", margin: "0 0 4px" }}>Total articles</p><p style={{ fontSize: "22px", fontWeight: 500, margin: 0 }}>{articles.length}</p></div>
        <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "12px 14px" }}><p style={{ fontSize: "11px", color: "var(--color-text-secondary)", margin: "0 0 4px" }}>Favoris</p><p style={{ fontSize: "22px", fontWeight: 500, margin: 0 }}>{favCount}</p></div>
        <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "12px 14px" }}><p style={{ fontSize: "11px", color: "var(--color-text-secondary)", margin: "0 0 4px" }}>Sources</p><p style={{ fontSize: "22px", fontWeight: 500, margin: 0 }}>{sources.length}</p></div>
      </div>

      <div style={{ display: "flex", gap: 0, marginBottom: "16px", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
        {[{ key: "feed", label: "Fil d'actualité" }, { key: "favorites", label: `Favoris (${favCount})` }].map((tab) => (
          <button key={tab.key} onClick={() => setView(tab.key)} style={{ padding: "8px 16px", border: "none", background: "none", cursor: "pointer", fontSize: "13px", fontWeight: view === tab.key ? 500 : 400, color: view === tab.key ? "var(--color-text-primary)" : "var(--color-text-secondary)", borderBottom: view === tab.key ? "2px solid var(--color-text-primary)" : "2px solid transparent", marginBottom: "-0.5px" }}>{tab.label}</button>
        ))}
      </div>

      <input type="text" placeholder="Rechercher par titre, tag, pathologie..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: "100%", marginBottom: "12px", boxSizing: "border-box" }} />

      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
        <button onClick={() => setActiveCategory("all")} style={{ padding: "4px 10px", borderRadius: "999px", border: activeCategory === "all" ? "1px solid var(--color-text-primary)" : "0.5px solid var(--color-border-tertiary)", background: activeCategory === "all" ? "var(--color-text-primary)" : "var(--color-background-primary)", color: activeCategory === "all" ? "var(--color-background-primary)" : "var(--color-text-secondary)", cursor: "pointer", fontSize: "11px", fontWeight: 500 }}>Toutes</button>
        {CATEGORIES.map((cat) => (
          <button key={cat.id} onClick={() => setActiveCategory(activeCategory === cat.id ? "all" : cat.id)} style={{ padding: "4px 10px", borderRadius: "999px", border: activeCategory === cat.id ? `1px solid ${cat.color}` : "0.5px solid var(--color-border-tertiary)", background: activeCategory === cat.id ? cat.color + "15" : "var(--color-background-primary)", color: activeCategory === cat.id ? cat.color : "var(--color-text-secondary)", cursor: "pointer", fontSize: "11px", fontWeight: 500 }}>{cat.label}</button>
        ))}
      </div>

      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "16px" }}>
        {sources.map((src) => (
          <button key={src.id} onClick={() => setActiveSource(activeSource === src.slug ? "all" : src.slug)} style={{ padding: "3px 8px", borderRadius: "var(--border-radius-md)", border: activeSource === src.slug ? "1px solid var(--color-border-primary)" : "0.5px solid var(--color-border-tertiary)", background: activeSource === src.slug ? "var(--color-background-secondary)" : "transparent", cursor: "pointer", fontSize: "11px", color: "var(--color-text-secondary)" }}>{src.icon} {src.label}</button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "12px" }}>
        {filteredArticles.length === 0 && (
          <p style={{ fontSize: "14px", color: "var(--color-text-tertiary)", textAlign: "center", padding: "40px 0", gridColumn: "1 / -1" }}>
            {view === "favorites" ? "Aucun article en favoris" : "Aucun article trouvé"}
          </p>
        )}
        {filteredArticles.map((article) => (
          <ArticleCard key={article.id} article={article} sources={sources} onSelect={setSelectedArticle} onToggleFavorite={toggleFavorite} />
        ))}
      </div>

      {infographicArticle && <InfographicModal article={infographicArticle} sources={sources} onClose={() => setInfographicArticle(null)} />}
      {editingImage && <ImageEditModal article={editingImage} onClose={() => setEditingImage(null)} onSave={updateImage} />}
    </div>
  );
}
