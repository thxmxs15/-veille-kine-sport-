"""
VeilleKiné — Collecte automatique d'articles PubMed
Se lance chaque jour via GitHub Actions.
Cherche les nouveaux articles sur vos thèmes et les insère dans Supabase.
"""

import json
import urllib.request
import urllib.parse
import os
from datetime import datetime, timedelta

# ─── CONFIG ───────────────────────────────────────────────────
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://onuhahnabdbslgstcxws.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

PUBMED_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"

# Thèmes de recherche avec catégorie associée
SEARCH_QUERIES = [
    {
        "query": "(hamstring injury OR hamstring strain) AND (sport OR athlete OR rugby OR football) AND (prevention OR rehabilitation OR return to sport)",
        "category": "pathologie",
        "tags": ["ischio-jambiers", "prévention"],
    },
    {
        "query": "(ACL OR anterior cruciate ligament) AND (reconstruction OR rehabilitation OR return to sport) AND (athlete OR sport)",
        "category": "rehab",
        "tags": ["LCA", "retour au sport"],
    },
    {
        "query": "(tendinopathy OR tendon) AND (loading OR exercise OR rehabilitation) AND (sport OR athlete)",
        "category": "pathologie",
        "tags": ["tendinopathie", "tendon"],
    },
    {
        "query": "(ankle sprain OR ankle instability) AND (sport OR athlete) AND (rehabilitation OR prevention OR return to sport)",
        "category": "pathologie",
        "tags": ["cheville", "entorse"],
    },
    {
        "query": "(shoulder OR rotator cuff) AND (sport OR athlete OR overhead) AND (injury OR rehabilitation OR prevention)",
        "category": "pathologie",
        "tags": ["épaule", "coiffe"],
    },
    {
        "query": "(shoulder instability OR shoulder dislocation) AND (sport OR athlete) AND (rehabilitation OR return to sport)",
        "category": "pathologie",
        "tags": ["épaule", "instabilité"],
    },
    {
        "query": "(concussion OR head injury) AND (sport OR athlete OR rugby) AND (return to play OR management OR assessment)",
        "category": "medical",
        "tags": ["commotion", "neurologie"],
    },
    {
        "query": "(training load monitoring OR GPS tracking OR workload) AND (sport OR athlete OR rugby OR football) AND (injury OR performance)",
        "category": "perfomance",
        "tags": ["GPS", "charge", "monitoring"],
    },
    {
        "query": "(foot OR ankle) AND (biomechanics OR injury) AND (sport OR running OR athlete) AND (rehabilitation OR prevention)",
        "category": "biomecanique",
        "tags": ["pied", "cheville", "biomécanique"],
    },
]

# Nombre de jours à remonter pour la recherche
DAYS_BACK = 3
MAX_ARTICLES_PER_QUERY = 3


def pubmed_search(query, days_back=3, max_results=3):
    """Recherche sur PubMed et retourne les IDs des articles."""
    date_from = (datetime.now() - timedelta(days=days_back)).strftime("%Y/%m/%d")
    date_to = datetime.now().strftime("%Y/%m/%d")

    params = urllib.parse.urlencode({
        "db": "pubmed",
        "term": query,
        "retmax": max_results,
        "sort": "date",
        "datetype": "pdat",
        "mindate": date_from,
        "maxdate": date_to,
        "retmode": "json",
    })

    url = f"{PUBMED_BASE}/esearch.fcgi?{params}"
    try:
        with urllib.request.urlopen(url, timeout=15) as resp:
            data = json.loads(resp.read())
            return data.get("esearchresult", {}).get("idlist", [])
    except Exception as e:
        print(f"  Erreur recherche PubMed: {e}")
        return []


def pubmed_fetch_details(pmids):
    """Récupère les détails des articles par leurs IDs PubMed."""
    if not pmids:
        return []

    params = urllib.parse.urlencode({
        "db": "pubmed",
        "id": ",".join(pmids),
        "retmode": "xml",
        "rettype": "abstract",
    })

    url = f"{PUBMED_BASE}/efetch.fcgi?{params}"
    try:
        with urllib.request.urlopen(url, timeout=15) as resp:
            xml_data = resp.read().decode("utf-8")
            return parse_pubmed_xml(xml_data)
    except Exception as e:
        print(f"  Erreur fetch PubMed: {e}")
        return []


def parse_pubmed_xml(xml_str):
    """Parse le XML PubMed (simple, sans dépendance externe)."""
    articles = []
    # Split par article
    parts = xml_str.split("<PubmedArticle>")

    for part in parts[1:]:
        try:
            article = {}

            # Title
            title_start = part.find("<ArticleTitle>")
            title_end = part.find("</ArticleTitle>")
            if title_start >= 0 and title_end >= 0:
                article["title"] = clean_xml(part[title_start + 14:title_end])

            # Abstract
            abs_start = part.find("<AbstractText>")
            abs_end = part.find("</AbstractText>")
            if abs_start >= 0 and abs_end >= 0:
                article["abstract"] = clean_xml(part[abs_start + 14:abs_end])[:1500]
            else:
                article["abstract"] = ""

            # Authors
            authors = []
            auth_section = part
            while "<LastName>" in auth_section:
                ln_start = auth_section.find("<LastName>") + 10
                ln_end = auth_section.find("</LastName>")
                if ln_start >= 10 and ln_end >= 0:
                    last_name = clean_xml(auth_section[ln_start:ln_end])
                    # Get initials
                    init_start = auth_section.find("<Initials>")
                    init_end = auth_section.find("</Initials>")
                    initials = ""
                    if init_start >= 0 and init_end >= 0:
                        initials = " " + clean_xml(auth_section[init_start + 10:init_end])
                    authors.append(f"{last_name}{initials}")
                    auth_section = auth_section[ln_end + 11:]
                else:
                    break
            if len(authors) > 3:
                article["authors"] = ", ".join(authors[:3]) + " et al."
            else:
                article["authors"] = ", ".join(authors)

            # DOI
            doi = ""
            doi_marker = 'IdType="doi"'
            doi_pos = part.find(doi_marker)
            if doi_pos >= 0:
                # Search backward for <ArticleId
                search_area = part[max(0, doi_pos - 200):doi_pos + len(doi_marker)]
                aid_start = search_area.rfind(">") + 1
                doi_text_start = part.rfind(">", 0, doi_pos) + 1
                doi_text_end = part.find("<", doi_text_start)
                if doi_text_start > 0 and doi_text_end > doi_text_start:
                    doi = clean_xml(part[doi_text_start:doi_text_end]).strip()
            article["doi"] = doi

            # Date
            date_str = ""
            year_start = part.find("<PubDate>")
            if year_start >= 0:
                y_s = part.find("<Year>", year_start)
                y_e = part.find("</Year>", year_start)
                m_s = part.find("<Month>", year_start)
                m_e = part.find("</Month>", year_start)
                d_s = part.find("<Day>", year_start)
                d_e = part.find("</Day>", year_start)
                year = part[y_s + 6:y_e] if y_s >= 0 and y_e >= 0 else "2026"
                month = part[m_s + 7:m_e] if m_s >= 0 and m_e >= 0 else "01"
                day = part[d_s + 5:d_e] if d_s >= 0 and d_e >= 0 else "01"
                # Convert month name to number if needed
                month_map = {"Jan": "01", "Feb": "02", "Mar": "03", "Apr": "04",
                             "May": "05", "Jun": "06", "Jul": "07", "Aug": "08",
                             "Sep": "09", "Oct": "10", "Nov": "11", "Dec": "12"}
                month = month_map.get(month, month.zfill(2))
                date_str = f"{year}-{month}-{day.zfill(2)}"
            article["date"] = date_str or datetime.now().strftime("%Y-%m-%d")

            # PMID
            pmid_start = part.find("<PMID")
            if pmid_start >= 0:
                pmid_s = part.find(">", pmid_start) + 1
                pmid_e = part.find("</PMID>", pmid_s)
                article["pmid"] = part[pmid_s:pmid_e]

            if article.get("title"):
                articles.append(article)

        except Exception as e:
            print(f"  Erreur parsing article: {e}")
            continue

    return articles


def clean_xml(text):
    """Nettoie le texte XML basique."""
    text = text.replace("&lt;", "<").replace("&gt;", ">")
    text = text.replace("&amp;", "&").replace("&quot;", '"')
    text = text.replace("&apos;", "'")
    # Remove remaining XML tags
    result = ""
    in_tag = False
    for char in text:
        if char == "<":
            in_tag = True
        elif char == ">":
            in_tag = False
        elif not in_tag:
            result += char
    return result.strip()


def check_existing_doi(doi):
    """Vérifie si un article avec ce DOI existe déjà dans Supabase."""
    if not doi:
        return False
    url = f"{SUPABASE_URL}/rest/v1/articles?doi=eq.{urllib.parse.quote(doi)}&select=id"
    req = urllib.request.Request(url, headers={
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    })
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
            return len(data) > 0
    except:
        return False


def check_existing_title(title):
    """Vérifie si un article avec ce titre existe déjà."""
    url = f"{SUPABASE_URL}/rest/v1/articles?title=eq.{urllib.parse.quote(title)}&select=id"
    req = urllib.request.Request(url, headers={
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    })
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
            return len(data) > 0
    except:
        return False


def insert_article(article_data):
    """Insère un article dans Supabase."""
    url = f"{SUPABASE_URL}/rest/v1/articles"
    data = json.dumps(article_data).encode("utf-8")
    req = urllib.request.Request(url, data=data, method="POST", headers={
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    })
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status in (200, 201)
    except Exception as e:
        print(f"  Erreur insertion: {e}")
        return False


def generate_key_findings(abstract):
    """Extrait les points clés basiques de l'abstract."""
    if not abstract or len(abstract) < 50:
        return []

    sentences = abstract.replace(". ", ".|").split("|")
    findings = []
    keywords = ["significantly", "p<", "p =", "OR ", "RR ", "HR ", "CI ", "reduced",
                 "increased", "compared", "associated", "effective", "improvement",
                 "decrease", "higher", "lower", "risk", "effect", "outcome"]

    for s in sentences:
        s = s.strip()
        if len(s) > 30 and any(kw.lower() in s.lower() for kw in keywords):
            findings.append(s[:200])
        if len(findings) >= 4:
            break

    return findings if findings else [sentences[0][:200]] if sentences else []


def main():
    print(f"=== VeilleKiné — Collecte du {datetime.now().strftime('%Y-%m-%d %H:%M')} ===")
    print(f"Recherche sur les {DAYS_BACK} derniers jours\n")

    if not SUPABASE_KEY:
        print("ERREUR: SUPABASE_KEY non configurée")
        return

    total_new = 0
    total_skipped = 0

    for search in SEARCH_QUERIES:
        query = search["query"]
        category = search["category"]
        base_tags = search["tags"]
        print(f"Recherche: {base_tags[0]}...")

        pmids = pubmed_search(query, days_back=DAYS_BACK, max_results=MAX_ARTICLES_PER_QUERY)
        if not pmids:
            print(f"  Aucun résultat")
            continue

        print(f"  {len(pmids)} article(s) trouvé(s)")
        articles = pubmed_fetch_details(pmids)

        for art in articles:
            # Vérifier doublons
            if art.get("doi") and check_existing_doi(art["doi"]):
                print(f"  Doublon (DOI): {art['title'][:60]}...")
                total_skipped += 1
                continue
            if check_existing_title(art.get("title", "")):
                print(f"  Doublon (titre): {art['title'][:60]}...")
                total_skipped += 1
                continue

            # Préparer les données
            key_findings = generate_key_findings(art.get("abstract", ""))

            article_data = {
                "title": art["title"],
                "authors": art.get("authors", ""),
                "source_slug": "pubmed",
                "date": art.get("date", datetime.now().strftime("%Y-%m-%d")),
                "category": category,
                "abstract": art.get("abstract", ""),
                "key_findings": json.dumps(key_findings),
                "clinical_implication": "",
                "doi": art.get("doi", ""),
                "tags": json.dumps(base_tags),
                "is_favorite": False,
            }

            if insert_article(article_data):
                print(f"  + {art['title'][:60]}...")
                total_new += 1
            else:
                print(f"  ERREUR: {art['title'][:60]}...")

    print(f"\n=== Terminé: {total_new} nouveaux, {total_skipped} doublons ignorés ===")


if __name__ == "__main__":
    main()
