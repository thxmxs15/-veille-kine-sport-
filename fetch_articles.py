"""
VeilleKiné — Collecte automatique d'articles PubMed + figures PMC
v3 — Meilleure extraction des abstracts + validation des images
"""

import json
import urllib.request
import urllib.parse
import os
import re
from datetime import datetime, timedelta

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://onuhahnabdbslgstcxws.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")
PUBMED_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"

SEARCH_QUERIES = [
    {"query": "(hamstring injury OR hamstring strain) AND (sport OR athlete OR rugby OR football) AND (prevention OR rehabilitation OR return to sport)", "category": "pathologie", "tags": ["ischio-jambiers", "prévention"]},
    {"query": "(ACL OR anterior cruciate ligament) AND (reconstruction OR rehabilitation OR return to sport) AND (athlete OR sport)", "category": "rehab", "tags": ["LCA", "retour au sport"]},
    {"query": "(tendinopathy OR tendon) AND (loading OR exercise OR rehabilitation) AND (sport OR athlete)", "category": "pathologie", "tags": ["tendinopathie", "tendon"]},
    {"query": "(ankle sprain OR ankle instability) AND (sport OR athlete) AND (rehabilitation OR prevention OR return to sport)", "category": "pathologie", "tags": ["cheville", "entorse"]},
    {"query": "(shoulder OR rotator cuff) AND (sport OR athlete OR overhead) AND (injury OR rehabilitation OR prevention)", "category": "pathologie", "tags": ["épaule", "coiffe"]},
    {"query": "(shoulder instability OR shoulder dislocation) AND (sport OR athlete) AND (rehabilitation OR return to sport)", "category": "pathologie", "tags": ["épaule", "instabilité"]},
    {"query": "(concussion OR head injury) AND (sport OR athlete OR rugby) AND (return to play OR management OR assessment)", "category": "medical", "tags": ["commotion", "neurologie"]},
    {"query": "(training load monitoring OR GPS tracking OR workload) AND (sport OR athlete OR rugby OR football) AND (injury OR performance)", "category": "perfomance", "tags": ["GPS", "charge", "monitoring"]},
    {"query": "(foot OR ankle) AND (biomechanics OR injury) AND (sport OR running OR athlete) AND (rehabilitation OR prevention)", "category": "biomecanique", "tags": ["pied", "cheville", "biomécanique"]},
]

DAYS_BACK = 7
MAX_ARTICLES_PER_QUERY = 3


def http_get(url, timeout=15):
    """GET request with User-Agent."""
    req = urllib.request.Request(url)
    req.add_header("User-Agent", "VeilleKine/1.0 (scientific-watch)")
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read().decode("utf-8")


def pubmed_search(query, days_back=7, max_results=3):
    date_from = (datetime.now() - timedelta(days=days_back)).strftime("%Y/%m/%d")
    date_to = datetime.now().strftime("%Y/%m/%d")
    params = urllib.parse.urlencode({
        "db": "pubmed", "term": query, "retmax": max_results,
        "sort": "date", "datetype": "pdat",
        "mindate": date_from, "maxdate": date_to, "retmode": "json",
    })
    try:
        data = json.loads(http_get(f"{PUBMED_BASE}/esearch.fcgi?{params}"))
        return data.get("esearchresult", {}).get("idlist", [])
    except Exception as e:
        print(f"  Erreur recherche: {e}")
        return []


def clean_xml(text):
    text = text.replace("&lt;", "<").replace("&gt;", ">")
    text = text.replace("&amp;", "&").replace("&quot;", '"').replace("&apos;", "'")
    result = []
    in_tag = False
    for c in text:
        if c == "<": in_tag = True
        elif c == ">": in_tag = False
        elif not in_tag: result.append(c)
    return "".join(result).strip()


def extract_between(text, start_tag, end_tag, start_from=0):
    """Extrait le texte entre deux balises XML."""
    s = text.find(start_tag, start_from)
    if s < 0: return None, -1
    s += len(start_tag)
    e = text.find(end_tag, s)
    if e < 0: return None, -1
    return text[s:e], e + len(end_tag)


def extract_full_abstract(part):
    """Extrait l'abstract complet, y compris les abstracts structurés avec plusieurs sections."""
    abstract_parts = []

    # Chercher la section Abstract
    abs_section_start = part.find("<Abstract>")
    abs_section_end = part.find("</Abstract>")

    if abs_section_start < 0 or abs_section_end < 0:
        return ""

    abs_section = part[abs_section_start:abs_section_end]

    # Extraire tous les <AbstractText> (il peut y en avoir plusieurs pour les abstracts structurés)
    pos = 0
    while True:
        # Trouver le prochain AbstractText
        at_start = abs_section.find("<AbstractText", pos)
        if at_start < 0:
            break

        # Vérifier s'il y a un attribut Label (abstract structuré)
        label = ""
        label_match = re.search(r'Label="([^"]*)"', abs_section[at_start:at_start + 200])
        if label_match:
            label = label_match.group(1)

        # Trouver la fin de la balise ouvrante
        tag_end = abs_section.find(">", at_start)
        if tag_end < 0:
            break

        # Trouver la balise fermante
        close_tag = abs_section.find("</AbstractText>", tag_end)
        if close_tag < 0:
            break

        content = clean_xml(abs_section[tag_end + 1:close_tag])

        if content:
            if label:
                abstract_parts.append(f"{label}: {content}")
            else:
                abstract_parts.append(content)

        pos = close_tag + 15

    return " ".join(abstract_parts)[:2000]


def pubmed_fetch_details(pmids):
    if not pmids: return []
    params = urllib.parse.urlencode({
        "db": "pubmed", "id": ",".join(pmids),
        "retmode": "xml", "rettype": "abstract",
    })
    try:
        xml_data = http_get(f"{PUBMED_BASE}/efetch.fcgi?{params}")
    except Exception as e:
        print(f"  Erreur fetch: {e}")
        return []

    articles = []
    parts = xml_data.split("<PubmedArticle>")
    for part in parts[1:]:
        try:
            art = {}

            # Titre
            title, _ = extract_between(part, "<ArticleTitle>", "</ArticleTitle>")
            art["title"] = clean_xml(title) if title else ""
            if not art["title"]:
                continue

            # Abstract complet (structuré ou non)
            art["abstract"] = extract_full_abstract(part)

            # Auteurs
            authors = []
            auth_pos = 0
            for _ in range(20):  # max 20 auteurs
                ln, auth_pos = extract_between(part, "<LastName>", "</LastName>", auth_pos)
                if ln is None: break
                ln = clean_xml(ln)
                init, _ = extract_between(part, "<Initials>", "</Initials>", auth_pos - 50)
                init = " " + clean_xml(init) if init else ""
                authors.append(f"{ln}{init}")
            if len(authors) > 3:
                art["authors"] = ", ".join(authors[:3]) + " et al."
            else:
                art["authors"] = ", ".join(authors) if authors else ""

            # DOI
            doi = ""
            doi_marker = 'IdType="doi"'
            doi_pos = part.find(doi_marker)
            if doi_pos >= 0:
                doi_text_start = part.rfind(">", 0, doi_pos) + 1
                doi_text_end = part.find("<", doi_text_start)
                if doi_text_start > 0 and doi_text_end > doi_text_start:
                    doi = clean_xml(part[doi_text_start:doi_text_end]).strip()
            art["doi"] = doi

            # Date
            year_start = part.find("<PubDate>")
            if year_start >= 0:
                y, _ = extract_between(part, "<Year>", "</Year>", year_start)
                m, _ = extract_between(part, "<Month>", "</Month>", year_start)
                d, _ = extract_between(part, "<Day>", "</Day>", year_start)
                y = y or "2026"; m = m or "01"; d = d or "01"
                month_map = {"Jan":"01","Feb":"02","Mar":"03","Apr":"04","May":"05","Jun":"06",
                             "Jul":"07","Aug":"08","Sep":"09","Oct":"10","Nov":"11","Dec":"12"}
                m = month_map.get(m, m.zfill(2) if m.isdigit() else "01")
                art["date"] = f"{y}-{m}-{d.zfill(2)}"
            else:
                art["date"] = datetime.now().strftime("%Y-%m-%d")

            # PMID
            pmid_tag_start = part.find("<PMID")
            if pmid_tag_start >= 0:
                pmid, _ = extract_between(part, ">", "</PMID>", pmid_tag_start)
                art["pmid"] = pmid

            articles.append(art)
        except Exception as e:
            print(f"  Erreur parsing: {e}")
    return articles


def get_pmc_id(pmid):
    """Convertit PMID → PMC ID."""
    try:
        data = json.loads(http_get(
            f"https://www.ncbi.nlm.nih.gov/pmc/utils/idconv/v1.0/?ids={pmid}&format=json", timeout=10))
        records = data.get("records", [])
        if records and records[0].get("pmcid"):
            return records[0]["pmcid"]
    except:
        pass
    return None


def validate_image_url(url):
    """Vérifie qu'une URL d'image est accessible (retourne 200)."""
    try:
        req = urllib.request.Request(url, method="HEAD")
        req.add_header("User-Agent", "VeilleKine/1.0")
        with urllib.request.urlopen(req, timeout=8) as resp:
            content_type = resp.headers.get("Content-Type", "")
            if resp.status == 200 and ("image" in content_type or "octet" in content_type):
                return True
    except:
        pass
    return False


def find_article_image(pmid):
    """Cherche une image validée pour l'article via PMC."""
    pmcid = get_pmc_id(pmid)
    if not pmcid:
        return None

    print(f"    PMC: {pmcid}")

    # Essayer de récupérer les noms de fichiers image depuis le XML PMC
    try:
        xml = http_get(f"{PUBMED_BASE}/efetch.fcgi?db=pmc&id={pmcid}&rettype=xml", timeout=15)

        # Chercher les href des figures
        graphic_refs = re.findall(r'xlink:href="([^"]+)"', xml)

        for ref in graphic_refs:
            if ref.startswith("http"):
                if validate_image_url(ref):
                    return ref
                continue

            # Construire les URLs possibles pour cette figure
            for ext in ["", ".jpg", ".jpeg", ".png", ".gif"]:
                fig_url = f"https://www.ncbi.nlm.nih.gov/pmc/articles/{pmcid}/bin/{ref}{ext}"
                if validate_image_url(fig_url):
                    print(f"    Image validée: {fig_url[:70]}...")
                    return fig_url

    except Exception as e:
        print(f"    Erreur PMC XML: {e}")

    return None


def check_existing_doi(doi):
    if not doi: return False
    url = f"{SUPABASE_URL}/rest/v1/articles?doi=eq.{urllib.parse.quote(doi)}&select=id"
    req = urllib.request.Request(url, headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return len(json.loads(resp.read())) > 0
    except: return False


def check_existing_title(title):
    url = f"{SUPABASE_URL}/rest/v1/articles?title=eq.{urllib.parse.quote(title)}&select=id"
    req = urllib.request.Request(url, headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return len(json.loads(resp.read())) > 0
    except: return False


def insert_article(data):
    url = f"{SUPABASE_URL}/rest/v1/articles"
    body = json.dumps(data).encode("utf-8")
    req = urllib.request.Request(url, data=body, method="POST", headers={
        "apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json", "Prefer": "return=minimal",
    })
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status in (200, 201)
    except Exception as e:
        print(f"  Erreur insertion: {e}")
        return False


def generate_key_findings(abstract):
    if not abstract or len(abstract) < 50: return []
    sentences = re.split(r'(?<=[.!?])\s+', abstract)
    findings = []
    keywords = ["significantly", "p<", "p =", "p=", "(p", "OR ", "RR ", "HR ",
                "CI ", "reduced", "increased", "compared", "associated",
                "effective", "improvement", "decrease", "higher", "lower",
                "risk", "effect", "outcome", "demonstrated", "revealed",
                "showed", "found", "correlation", "difference", "mean",
                "median", "ratio", "percent", "%", "fold"]
    for s in sentences:
        s = s.strip()
        if len(s) > 40 and any(kw.lower() in s.lower() for kw in keywords):
            findings.append(s[:250])
        if len(findings) >= 4:
            break
    if not findings and sentences:
        findings = [sentences[0][:250]]
    return findings


def main():
    print(f"=== VeilleKiné v3 — {datetime.now().strftime('%Y-%m-%d %H:%M')} ===")
    print(f"Période: {DAYS_BACK} derniers jours | Images PMC: activé\n")

    if not SUPABASE_KEY:
        print("ERREUR: SUPABASE_KEY manquante"); return

    stats = {"new": 0, "skipped": 0, "images": 0, "no_abstract": 0}

    for search in SEARCH_QUERIES:
        tags = search["tags"]
        print(f"--- {tags[0]} ---")

        pmids = pubmed_search(search["query"], DAYS_BACK, MAX_ARTICLES_PER_QUERY)
        if not pmids:
            print("  Aucun résultat"); continue

        print(f"  {len(pmids)} trouvé(s)")
        articles = pubmed_fetch_details(pmids)

        for art in articles:
            if art.get("doi") and check_existing_doi(art["doi"]):
                print(f"  Skip (doublon): {art['title'][:50]}...")
                stats["skipped"] += 1; continue
            if check_existing_title(art.get("title", "")):
                stats["skipped"] += 1; continue

            # Abstract
            abstract = art.get("abstract", "")
            if not abstract:
                print(f"  Pas d'abstract: {art['title'][:50]}...")
                stats["no_abstract"] += 1

            # Image PMC
            image_url = None
            if art.get("pmid"):
                image_url = find_article_image(art["pmid"])
                if image_url: stats["images"] += 1

            # Key findings
            key_findings = generate_key_findings(abstract)

            article_data = {
                "title": art["title"],
                "authors": art.get("authors", ""),
                "source_slug": "pubmed",
                "date": art.get("date", datetime.now().strftime("%Y-%m-%d")),
                "category": search["category"],
                "abstract": abstract,
                "key_findings": json.dumps(key_findings),
                "clinical_implication": "",
                "doi": art.get("doi", ""),
                "tags": json.dumps(tags),
                "is_favorite": False,
                "image_url": image_url,
            }

            if insert_article(article_data):
                flags = []
                if abstract: flags.append("abstract")
                if image_url: flags.append("image")
                if key_findings: flags.append(f"{len(key_findings)} findings")
                print(f"  + {art['title'][:50]}... [{', '.join(flags)}]")
                stats["new"] += 1

    print(f"\n=== Résultats ===")
    print(f"  Nouveaux: {stats['new']}")
    print(f"  Avec image: {stats['images']}")
    print(f"  Sans abstract: {stats['no_abstract']}")
    print(f"  Doublons: {stats['skipped']}")


if __name__ == "__main__":
    main()
