import { useState, useEffect, useCallback, useMemo, useRef } from "react";

// ─── SUPABASE ────────────────────────────────────────────────
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
  await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, { method: "PATCH", headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify(data) });
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

// ─── Small components ────────────────────────────────────────
function Badge({ label, color, small }) {
  return <span style={{ display: "inline-block", padding: small ? "2px 8px" : "3px 10px", borderRadius: "999px", fontSize: small ? "10px" : "11px", fontWeight: 500, background: color + "18", color, whiteSpace: "nowrap" }}>{label}</span>;
}
function SourceBadge({ sourceSlug, sources }) {
  const s = sources.find((x) => x.slug === sourceSlug);
  return s ? <span style={{ fontSize: "11px", color: "var(--color-text-secondary)", display: "inline-flex", alignItems: "center", gap: "3px" }}><span style={{ fontSize: "12px" }}>{s.icon}</span> {s.label}</span> : null;
}
function StarButton({ active, onClick }) {
  return <button onClick={onClick} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", fontSize: "18px", lineHeight: 1, color: active ? "#BA7517" : "var(--color-text-tertiary)" }}>{active ? "★" : "☆"}</button>;
}
function Tag({ label }) {
  return <span style={{ display: "inline-block", padding: "2px 7px", borderRadius: "4px", fontSize: "10px", background: "var(--color-background-secondary)", color: "var(--color-text-secondary)", border: "0.5px solid var(--color-border-tertiary)" }}>#{label}</span>;
}
function formatDate(d) { return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }); }
function LoadingSpinner() { return <div style={{ textAlign: "center", padding: "40px 0" }}><div style={{ display: "inline-block", width: "28px", height: "28px", border: "2.5px solid var(--color-border-tertiary)", borderTopColor: "#1D9E75", borderRadius: "50%", animation: "spin .8s linear infinite" }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style><p style={{ fontSize: "13px", color: "var(--color-text-secondary)", marginTop: "10px" }}>Chargement...</p></div>; }
function ArticleImage({ url, alt, style }) {
  const [err, setErr] = useState(false);
  if (!url || err) return null;
  return <img src={url} alt={alt || ""} onError={() => setErr(true)} style={{ width: "100%", objectFit: "cover", borderRadius: "var(--border-radius-md)", ...style }} />;
}

// ─── Image edit modal ────────────────────────────────────────
function ImageEditModal({ article, onClose, onSave }) {
  const [url, setUrl] = useState(article.image_url || "");
  const [saving, setSaving] = useState(false);
  const save = async () => { setSaving(true); await onSave(article.id, url); setSaving(false); onClose(); };
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "var(--color-background-primary)", borderRadius: "var(--border-radius-lg)", maxWidth: 500, width: "100%", padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 500, margin: "0 0 16px" }}>Modifier l'image</h3>
        <input type="text" placeholder="URL de l'image" value={url} onChange={e => setUrl(e.target.value)} style={{ width: "100%", marginBottom: 12, boxSizing: "border-box" }} />
        {url && <ArticleImage url={url} alt="Aperçu" style={{ height: 160, marginBottom: 12 }} />}
        <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", margin: "0 0 16px" }}>Collez l'URL d'une image (Unsplash, figure de l'article, etc.)</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-primary)", cursor: "pointer", fontSize: 13 }}>Annuler</button>
          <button onClick={save} disabled={saving} style={{ padding: "8px 16px", borderRadius: "var(--border-radius-md)", border: "none", background: "#1D9E75", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 500, opacity: saving ? .5 : 1 }}>{saving ? "..." : "Enregistrer"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Similar articles ────────────────────────────────────────
function SimilarArticles({ currentArticle, allArticles, sources, onSelect }) {
  const similar = useMemo(() => {
    const curTags = Array.isArray(currentArticle.tags) ? currentArticle.tags : [];
    return allArticles
      .filter(a => a.id !== currentArticle.id)
      .map(a => {
        const aTags = Array.isArray(a.tags) ? a.tags : [];
        let score = 0;
        curTags.forEach(t => { if (aTags.includes(t)) score += 3; });
        if (a.category === currentArticle.category) score += 2;
        if (a.source_slug === currentArticle.source_slug) score += 1;
        return { ...a, score };
      })
      .filter(a => a.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [currentArticle, allArticles]);
  if (!similar.length) return null;
  return (
    <div style={{ marginTop: 28, paddingTop: 20, borderTop: "0.5px solid var(--color-border-tertiary)" }}>
      <h3 style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-secondary)", margin: "0 0 12px" }}>Articles similaires</h3>
      {similar.map(a => {
        const cat = CATEGORIES.find(c => c.id === a.category);
        return (
          <div key={a.id} onClick={() => onSelect(a)} style={{ display: "flex", gap: 12, padding: "10px 12px", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-tertiary)", cursor: "pointer", marginBottom: 8, alignItems: "center" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--color-background-secondary)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            {a.image_url && <img src={a.image_url} alt="" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} onError={e => e.target.style.display = "none"} />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 500, margin: "0 0 4px", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{a.title}</p>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <SourceBadge sourceSlug={a.source_slug} sources={sources} />
                {cat && <Badge label={cat.label} color={cat.color} small />}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Canvas helpers ──────────────────────────────────────────
function wrapText(ctx, text, x, y, maxW, lineH) {
  const words = (text || "").split(" "); let line = ""; let lines = 1;
  for (let i = 0; i < words.length; i++) {
    const test = line + words[i] + " ";
    if (ctx.measureText(test).width > maxW && i > 0) { ctx.fillText(line.trim(), x, y); line = words[i] + " "; y += lineH; lines++; }
    else line = test;
  }
  ctx.fillText(line.trim(), x, y); return lines;
}
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h); ctx.lineTo(x+r,y+h);
  ctx.quadraticCurveTo(x,y+h,x,y+h-r); ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
}

// ─── INFOGRAPHIC — Style Le Meur (fond clair) ───────────────
function InfographicModal({ article, sources, onClose }) {
  const canvasRef = useRef(null);
  const [generated, setGenerated] = useState(false);
  const cat = CATEGORIES.find(c => c.id === article.category);
  const cc = cat?.color || "#534AB7";

  const generate = useCallback(() => {
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext("2d");
    const W = 900, H = 1350;
    cv.width = W; cv.height = H;
    const P = 50, CW = W - P * 2;

    const draw = (img) => {
      let y = 0;

      // Fond
      ctx.fillStyle = "#FAFAF8"; ctx.fillRect(0, 0, W, H);

      // Barre catégorie top
      ctx.fillStyle = cc; ctx.fillRect(0, 0, W, 8);
      y = 36;

      // ─── Image étude ───
      if (img) {
        const imgH = 240;
        ctx.save();
        roundRect(ctx, P, y, CW, imgH, 14); ctx.clip();
        const sc = Math.max(CW / img.width, imgH / img.height);
        ctx.drawImage(img, P + (CW - img.width * sc) / 2, y + (imgH - img.height * sc) / 2, img.width * sc, img.height * sc);
        ctx.restore();
        ctx.strokeStyle = "#D3D1C7"; ctx.lineWidth = 1;
        roundRect(ctx, P, y, CW, imgH, 14); ctx.stroke();
        y += imgH + 20;
      }

      // ─── Badge catégorie ───
      const catLabel = cat?.label || "";
      ctx.font = "bold 12px 'Segoe UI', system-ui, sans-serif";
      const bw = ctx.measureText(catLabel).width + 24;
      ctx.fillStyle = cc + "18"; roundRect(ctx, P, y, bw, 26, 13); ctx.fill();
      ctx.fillStyle = cc; ctx.fillText(catLabel, P + 12, y + 17);
      y += 40;

      // ─── Titre ───
      ctx.font = "bold 24px 'Segoe UI', system-ui, sans-serif";
      ctx.fillStyle = "#1a1a18";
      const tl = wrapText(ctx, article.title, P, y, CW, 30);
      y += Math.max(tl, 1) * 30 + 14;

      // ─── Auteurs + source ───
      const src = sources.find(s => s.slug === article.source_slug);
      ctx.font = "400 13px 'Segoe UI', system-ui, sans-serif";
      ctx.fillStyle = "#888780";
      ctx.fillText(article.authors || "", P, y); y += 18;
      ctx.fillText(`${src?.label || article.source_slug}  •  ${formatDate(article.date)}`, P, y);
      y += 28;

      // ─── Séparateur ───
      ctx.strokeStyle = "#E0DED6"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(P, y); ctx.lineTo(W - P, y); ctx.stroke();
      y += 24;

      // ─── Résumé ───
      if (article.abstract) {
        ctx.font = "400 13px 'Segoe UI', system-ui, sans-serif";
        ctx.fillStyle = "#555552";
        const al = wrapText(ctx, (article.abstract || "").slice(0, 600), P, y, CW, 19);
        y += Math.max(al, 1) * 19 + 24;
      }

      // ─── RÉSULTATS CLÉS — style Le Meur ───
      const findings = Array.isArray(article.key_findings) ? article.key_findings : [];
      if (findings.length > 0) {
        // Fond section
        const secY = y - 8;
        ctx.fillStyle = cc + "06";
        const estH = findings.length * 65 + 50;
        roundRect(ctx, P - 4, secY, CW + 8, estH, 12); ctx.fill();
        ctx.strokeStyle = cc + "20"; ctx.lineWidth = 1;
        roundRect(ctx, P - 4, secY, CW + 8, estH, 12); ctx.stroke();

        // Titre section
        ctx.fillStyle = cc;
        ctx.font = "bold 16px 'Segoe UI', system-ui, sans-serif";
        ctx.fillText("RÉSULTATS CLÉS", P + 14, y + 8);
        y += 36;

        findings.forEach((f, i) => {
          // Gros numéro
          ctx.font = "bold 32px 'Segoe UI', system-ui, sans-serif";
          ctx.fillStyle = cc + "25";
          ctx.fillText(`${i + 1}`, P + 14, y + 18);

          // Texte
          ctx.font = "500 14px 'Segoe UI', system-ui, sans-serif";
          ctx.fillStyle = "#2C2C2A";
          const fl = wrapText(ctx, f, P + 52, y, CW - 68, 20);
          y += Math.max(fl, 1) * 20 + 18;

          // Séparateur fin
          if (i < findings.length - 1) {
            ctx.strokeStyle = cc + "12"; ctx.lineWidth = 0.5;
            ctx.beginPath(); ctx.moveTo(P + 52, y - 6); ctx.lineTo(W - P - 10, y - 6); ctx.stroke();
          }
        });
        y += 16;
      }

      // ─── Séparateur ───
      ctx.strokeStyle = "#E0DED6"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(P, y); ctx.lineTo(W - P, y); ctx.stroke();
      y += 24;

      // ─── Implication clinique ───
      if (article.clinical_implication) {
        ctx.fillStyle = cc; ctx.fillRect(P, y, 4, 70);
        ctx.font = "bold 13px 'Segoe UI', system-ui, sans-serif";
        ctx.fillStyle = cc;
        ctx.fillText("IMPLICATION CLINIQUE", P + 18, y + 6);
        ctx.font = "400 13px 'Segoe UI', system-ui, sans-serif";
        ctx.fillStyle = "#2C2C2A";
        wrapText(ctx, article.clinical_implication, P + 18, y + 28, CW - 32, 19);
      }

      // ─── Footer ───
      ctx.fillStyle = cc; ctx.fillRect(0, H - 6, W, 6);
      ctx.font = "400 11px 'Segoe UI', system-ui, sans-serif";
      ctx.fillStyle = "#B4B2A9";
      ctx.fillText(`DOI: ${article.doi || ""}`, P, H - 28);
      const brand = "VeilleKiné — Veille Scientifique Sport";
      ctx.fillText(brand, W - P - ctx.measureText(brand).width, H - 28);

      // Logo
      ctx.fillStyle = cc; roundRect(ctx, P, H - 50, 22, 22, 5); ctx.fill();
      ctx.font = "bold 13px 'Segoe UI', system-ui, sans-serif";
      ctx.fillStyle = "#fff"; ctx.fillText("V", P + 6, H - 34);

      setGenerated(true);
    };

    if (article.image_url) {
      const img = new Image(); img.crossOrigin = "anonymous";
      img.onload = () => draw(img); img.onerror = () => draw(null);
      img.src = article.image_url;
    } else draw(null);
  }, [article, cc, sources]);

  useEffect(() => { generate(); }, [generate]);

  const download = () => {
    const cv = canvasRef.current; if (!cv) return;
    const a = document.createElement("a");
    a.download = `VeilleKine-${article.title.slice(0, 35).replace(/[^a-zA-Z0-9]/g, "-")}.png`;
    a.href = cv.toDataURL("image/png"); a.click();
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "var(--color-background-primary)", borderRadius: "var(--border-radius-lg)", maxWidth: 920, width: "100%", maxHeight: "90vh", overflow: "auto", padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 500, margin: 0 }}>Infographie</h3>
          <div style={{ display: "flex", gap: 8 }}>
            {generated && <button onClick={download} style={{ padding: "6px 14px", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-primary)", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>Télécharger PNG</button>}
            <button onClick={onClose} style={{ padding: "6px 12px", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-primary)", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>✕</button>
          </div>
        </div>
        <canvas ref={canvasRef} style={{ width: "100%", height: "auto", borderRadius: 8, border: "0.5px solid var(--color-border-tertiary)" }} />
      </div>
    </div>
  );
}

// ─── Article detail ──────────────────────────────────────────
function ArticleDetail({ article, sources, allArticles, onBack, onToggleFavorite, onShowInfographic, onSelectArticle, onEditImage }) {
  const cat = CATEGORIES.find(c => c.id === article.category);
  const findings = Array.isArray(article.key_findings) ? article.key_findings : [];
  const tags = Array.isArray(article.tags) ? article.tags : [];

  return (
    <div style={{ maxWidth: 720 }}>
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--color-text-secondary)", padding: 0, marginBottom: 20, display: "flex", alignItems: "center", gap: 4 }}>← Retour</button>

      {article.image_url ? (
        <div style={{ position: "relative", marginBottom: 16 }}>
          <ArticleImage url={article.image_url} alt={article.title} style={{ height: 220 }} />
          <button onClick={() => onEditImage(article)} style={{ position: "absolute", bottom: 8, right: 8, padding: "4px 10px", borderRadius: "var(--border-radius-md)", border: "none", background: "rgba(0,0,0,.5)", color: "#fff", cursor: "pointer", fontSize: 11 }}>Modifier</button>
        </div>
      ) : (
        <button onClick={() => onEditImage(article)} style={{ width: "100%", padding: 20, borderRadius: "var(--border-radius-lg)", border: "1px dashed var(--color-border-secondary)", background: "var(--color-background-secondary)", cursor: "pointer", fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 16, textAlign: "center" }}>+ Ajouter une image</button>
      )}

      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 20, fontWeight: 500, margin: "0 0 10px", lineHeight: 1.35 }}>{article.title}</h2>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <SourceBadge sourceSlug={article.source_slug} sources={sources} />
            <span style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>{formatDate(article.date)}</span>
            {cat && <Badge label={cat.label} color={cat.color} />}
          </div>
        </div>
        <StarButton active={article.is_favorite} onClick={() => onToggleFavorite(article.id, !article.is_favorite)} />
      </div>
      <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "4px 0 20px" }}>{article.authors}</p>

      {article.abstract && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-secondary)", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Résumé</h3>
          <p style={{ fontSize: 14, lineHeight: 1.7, margin: 0 }}>{article.abstract}</p>
        </div>
      )}

      {findings.length > 0 && (
        <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-lg)", padding: "16px 20px", marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 500, margin: "0 0 12px", color: cat?.color }}>Résultats clés</h3>
          {findings.map((f, i) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
              <span style={{ width: 20, height: 20, borderRadius: "50%", background: cat?.color || "#534AB7", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 500, flexShrink: 0, marginTop: 2 }}>{i + 1}</span>
              <span style={{ fontSize: 13, lineHeight: 1.5 }}>{f}</span>
            </div>
          ))}
        </div>
      )}

      {article.clinical_implication && (
        <div style={{ borderLeft: `3px solid ${cat?.color || "#534AB7"}`, padding: "12px 16px", background: (cat?.color || "#534AB7") + "08", borderRadius: 0, marginBottom: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 500, margin: "0 0 6px", color: cat?.color }}>Implication clinique</h3>
          <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>{article.clinical_implication}</p>
        </div>
      )}

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
        {tags.map(t => <Tag key={t} label={t} />)}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => onShowInfographic(article)} style={{ padding: "8px 16px", borderRadius: "var(--border-radius-md)", border: `1px solid ${cat?.color || "#534AB7"}`, background: (cat?.color || "#534AB7") + "10", color: cat?.color, cursor: "pointer", fontSize: 13, fontWeight: 500 }}>Générer l'infographie</button>
        {article.doi && <button onClick={() => window.open(`https://doi.org/${article.doi}`, "_blank")} style={{ padding: "8px 16px", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-primary)", cursor: "pointer", fontSize: 13 }}>Article original ↗</button>}
      </div>
      {article.doi && <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 16 }}>DOI: {article.doi}</p>}

      <SimilarArticles currentArticle={article} allArticles={allArticles} sources={sources} onSelect={onSelectArticle} />
    </div>
  );
}

// ─── Article card ────────────────────────────────────────────
function ArticleCard({ article, sources, onSelect, onToggleFavorite }) {
  const cat = CATEGORIES.find(c => c.id === article.category);
  const tags = Array.isArray(article.tags) ? article.tags : [];
  return (
    <div onClick={() => onSelect(article)}
      style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", overflow: "hidden", cursor: "pointer", transition: "border-color .15s" }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "var(--color-border-secondary)"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "var(--color-border-tertiary)"}>
      {article.image_url && <img src={article.image_url} alt="" style={{ width: "100%", height: 140, objectFit: "cover" }} onError={e => e.target.style.display = "none"} />}
      <div style={{ padding: "14px 18px", borderLeft: `3px solid ${cat?.color || "#888"}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: 14, fontWeight: 500, margin: "0 0 6px", lineHeight: 1.4 }}>{article.title}</h3>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
              <SourceBadge sourceSlug={article.source_slug} sources={sources} />
              <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>{formatDate(article.date)}</span>
              {cat && <Badge label={cat.label} color={cat.color} small />}
            </div>
            {(article.abstract || article.clinical_implication) && (
              <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {article.clinical_implication || article.abstract}
              </p>
            )}
          </div>
          <StarButton active={article.is_favorite} onClick={e => { e.stopPropagation(); onToggleFavorite(article.id, !article.is_favorite); }} />
        </div>
        {tags.length > 0 && <div style={{ display: "flex", gap: 4, marginTop: 10, flexWrap: "wrap" }}>{tags.slice(0, 4).map(t => <Tag key={t} label={t} />)}</div>}
      </div>
    </div>
  );
}

// ─── Sources panel ───────────────────────────────────────────
function SourcesPanel({ sources, onClose, onAddSource, onDeleteSource }) {
  const [label, setLabel] = useState(""); const [url, setUrl] = useState(""); const [icon, setIcon] = useState("📄"); const [adding, setAdding] = useState(false);
  const add = async () => {
    if (!label.trim()) return; setAdding(true);
    const slug = label.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
    await onAddSource({ slug, label: label.trim(), icon: icon || "📄", url: url.trim(), source_type: "rss", enabled: true });
    setLabel(""); setUrl(""); setIcon("📄"); setAdding(false);
  };
  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 500, margin: 0 }}>Sources de veille</h2>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--color-text-secondary)" }}>← Retour</button>
      </div>
      <div style={{ marginBottom: 24 }}>
        {sources.map(s => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
            <span style={{ fontSize: 16, width: 24, textAlign: "center" }}>{s.icon}</span>
            <span style={{ flex: 1, fontSize: 14 }}>{s.label}</span>
            <span style={{ fontSize: 11, color: "var(--color-text-success)", fontWeight: 500 }}>Actif</span>
            <button onClick={() => onDeleteSource(s.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--color-text-danger)", padding: "2px 6px" }}>✕</button>
          </div>
        ))}
      </div>
      <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-lg)", padding: 16 }}>
        <h4 style={{ fontSize: 13, fontWeight: 500, margin: "0 0 10px" }}>Ajouter une source</h4>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input type="text" placeholder="Emoji" value={icon} onChange={e => setIcon(e.target.value)} style={{ width: 50, textAlign: "center" }} />
          <input type="text" placeholder="Nom" value={label} onChange={e => setLabel(e.target.value)} style={{ flex: "1 1 140px", minWidth: 120 }} />
          <input type="text" placeholder="URL ou RSS" value={url} onChange={e => setUrl(e.target.value)} style={{ flex: "2 1 180px", minWidth: 140 }} />
          <button onClick={add} disabled={adding} style={{ padding: "8px 16px", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-primary)", cursor: "pointer", fontSize: 13, fontWeight: 500, opacity: adding ? .5 : 1 }}>{adding ? "..." : "+ Ajouter"}</button>
        </div>
        <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", margin: "8px 0 0" }}>Sauvegardé dans la base — pas besoin de toucher au code</p>
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────
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
    (async () => {
      try {
        setLoading(true);
        const [arts, srcs] = await Promise.all([
          supaFetch("articles", { order: "date.desc" }),
          supaFetch("sources", { order: "created_at.asc" }),
        ]);
        setArticles(Array.isArray(arts) ? arts : []);
        setSources(Array.isArray(srcs) ? srcs : []);
      } catch (e) { setError("Impossible de charger les données."); console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const toggleFavorite = async (id, val) => {
    setArticles(p => p.map(a => a.id === id ? { ...a, is_favorite: val } : a));
    await supaUpdate("articles", id, { is_favorite: val });
  };
  const updateImage = async (id, url) => {
    setArticles(p => p.map(a => a.id === id ? { ...a, image_url: url } : a));
    if (selectedArticle?.id === id) setSelectedArticle(p => ({ ...p, image_url: url }));
    await supaUpdate("articles", id, { image_url: url });
  };
  const addSource = async (d) => { const r = await supaInsert("sources", d); if (Array.isArray(r) && r[0]) setSources(p => [...p, r[0]]); };
  const deleteSource = async (id) => { await supaDelete("sources", id); setSources(p => p.filter(s => s.id !== id)); };

  const filteredArticles = useMemo(() => {
    let list = [...articles];
    if (view === "favorites") list = list.filter(a => a.is_favorite);
    if (activeCategory !== "all") list = list.filter(a => a.category === activeCategory);
    if (activeSource !== "all") list = list.filter(a => a.source_slug === activeSource);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(a => a.title?.toLowerCase().includes(q) || (Array.isArray(a.tags) ? a.tags : []).some(t => t.toLowerCase().includes(q)) || a.clinical_implication?.toLowerCase().includes(q) || a.abstract?.toLowerCase().includes(q));
    }
    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [articles, view, activeCategory, activeSource, searchQuery]);

  const favCount = articles.filter(a => a.is_favorite).length;

  if (loading) return <LoadingSpinner />;
  if (error) return <div style={{ textAlign: "center", padding: "40px 0" }}><p style={{ fontSize: 14, color: "var(--color-text-danger)" }}>{error}</p><button onClick={() => window.location.reload()} style={{ marginTop: 12, padding: "8px 20px", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-primary)", cursor: "pointer", fontSize: 13 }}>Réessayer</button></div>;

  if (view === "sources") return <div style={{ padding: "1rem 0" }}><SourcesPanel sources={sources} onClose={() => setView("feed")} onAddSource={addSource} onDeleteSource={deleteSource} /></div>;

  if (selectedArticle) {
    const art = articles.find(a => a.id === selectedArticle.id) || selectedArticle;
    return (
      <div style={{ padding: "1rem 0" }}>
        <ArticleDetail article={art} sources={sources} allArticles={articles} onBack={() => setSelectedArticle(null)} onToggleFavorite={toggleFavorite} onShowInfographic={setInfographicArticle} onSelectArticle={a => { setSelectedArticle(a); window.scrollTo(0, 0); }} onEditImage={setEditingImage} />
        {infographicArticle && <InfographicModal article={infographicArticle} sources={sources} onClose={() => setInfographicArticle(null)} />}
        {editingImage && <ImageEditModal article={editingImage} onClose={() => setEditingImage(null)} onSave={updateImage} />}
      </div>
    );
  }

  return (
    <div style={{ padding: "1rem 0" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#1D9E75,#0F6E56)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 16, fontWeight: 500 }}>V</div>
            <div><h1 style={{ fontSize: 20, fontWeight: 500, margin: 0 }}>VeilleKiné</h1><p style={{ fontSize: 11, color: "var(--color-text-secondary)", margin: 0 }}>Kiné du sport & préparation physique</p></div>
          </div>
          <button onClick={() => setView("sources")} style={{ padding: "6px 14px", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-primary)", cursor: "pointer", fontSize: 12 }}>Sources</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 10, marginBottom: 20 }}>
        <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "12px 14px" }}><p style={{ fontSize: 11, color: "var(--color-text-secondary)", margin: "0 0 4px" }}>Total</p><p style={{ fontSize: 22, fontWeight: 500, margin: 0 }}>{articles.length}</p></div>
        <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "12px 14px" }}><p style={{ fontSize: 11, color: "var(--color-text-secondary)", margin: "0 0 4px" }}>Favoris</p><p style={{ fontSize: 22, fontWeight: 500, margin: 0 }}>{favCount}</p></div>
        <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "12px 14px" }}><p style={{ fontSize: 11, color: "var(--color-text-secondary)", margin: "0 0 4px" }}>Sources</p><p style={{ fontSize: 22, fontWeight: 500, margin: 0 }}>{sources.length}</p></div>
      </div>

      <div style={{ display: "flex", gap: 0, marginBottom: 16, borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
        {[{ key: "feed", label: "Fil d'actualité" }, { key: "favorites", label: `Favoris (${favCount})` }].map(tab => (
          <button key={tab.key} onClick={() => setView(tab.key)} style={{ padding: "8px 16px", border: "none", background: "none", cursor: "pointer", fontSize: 13, fontWeight: view === tab.key ? 500 : 400, color: view === tab.key ? "var(--color-text-primary)" : "var(--color-text-secondary)", borderBottom: view === tab.key ? "2px solid var(--color-text-primary)" : "2px solid transparent", marginBottom: "-0.5px" }}>{tab.label}</button>
        ))}
      </div>

      <input type="text" placeholder="Rechercher par titre, tag, pathologie..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ width: "100%", marginBottom: 12, boxSizing: "border-box" }} />

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
        <button onClick={() => setActiveCategory("all")} style={{ padding: "4px 10px", borderRadius: "999px", border: activeCategory === "all" ? "1px solid var(--color-text-primary)" : "0.5px solid var(--color-border-tertiary)", background: activeCategory === "all" ? "var(--color-text-primary)" : "var(--color-background-primary)", color: activeCategory === "all" ? "var(--color-background-primary)" : "var(--color-text-secondary)", cursor: "pointer", fontSize: 11, fontWeight: 500 }}>Toutes</button>
        {CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => setActiveCategory(activeCategory === cat.id ? "all" : cat.id)} style={{ padding: "4px 10px", borderRadius: "999px", border: activeCategory === cat.id ? `1px solid ${cat.color}` : "0.5px solid var(--color-border-tertiary)", background: activeCategory === cat.id ? cat.color + "15" : "var(--color-background-primary)", color: activeCategory === cat.id ? cat.color : "var(--color-text-secondary)", cursor: "pointer", fontSize: 11, fontWeight: 500 }}>{cat.label}</button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        {sources.map(src => (
          <button key={src.id} onClick={() => setActiveSource(activeSource === src.slug ? "all" : src.slug)} style={{ padding: "3px 8px", borderRadius: "var(--border-radius-md)", border: activeSource === src.slug ? "1px solid var(--color-border-primary)" : "0.5px solid var(--color-border-tertiary)", background: activeSource === src.slug ? "var(--color-background-secondary)" : "transparent", cursor: "pointer", fontSize: 11, color: "var(--color-text-secondary)" }}>{src.icon} {src.label}</button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 12 }}>
        {filteredArticles.length === 0 && <p style={{ fontSize: 14, color: "var(--color-text-tertiary)", textAlign: "center", padding: "40px 0", gridColumn: "1/-1" }}>{view === "favorites" ? "Aucun article en favoris" : "Aucun article trouvé"}</p>}
        {filteredArticles.map(a => <ArticleCard key={a.id} article={a} sources={sources} onSelect={setSelectedArticle} onToggleFavorite={toggleFavorite} />)}
      </div>

      {infographicArticle && <InfographicModal article={infographicArticle} sources={sources} onClose={() => setInfographicArticle(null)} />}
      {editingImage && <ImageEditModal article={editingImage} onClose={() => setEditingImage(null)} onSave={updateImage} />}
    </div>
  );
}
