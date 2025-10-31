#!/usr/bin/env python3
"""
add_wikimedia_credit.py – Wikimedia Commons → credits.json
"""

import sys
import json
import re
import html
import requests
from bs4 import BeautifulSoup
from urllib.parse import unquote, urljoin
import os
import shutil
from pathlib import Path

JSON_FILE = "credits.json"


# ----------------------------------------------------------------------
def extract_file_title(url: str) -> str:
    m = re.search(r"File:([^#]+)", url)
    if not m:
        raise ValueError("Invalid Wikimedia Commons file URL")
    return unquote(m.group(1).strip())


# ----------------------------------------------------------------------
def get_author(soup: BeautifulSoup) -> str:
    """
    <td id="fileinfotpl_aut" ...>Author</td>
    <td><a ...>Юкатан</a></td>
    → return visible link text
    """
    # Find the <td> that has the ID (may be HTML-encoded &#95;)
    auth_label = soup.find(
        "td",
        id=re.compile(r"^fileinfotpl[_&#95;]*aut$", re.I)
    )
    if not auth_label:
        return "Unknown"

    # The actual author is in the *next* <td> in the same <tr>
    auth_cell = auth_label.find_next_sibling("td")
    if not auth_cell:
        # fallback: same row, second <td>
        row = auth_label.find_parent("tr")
        tds = row.find_all("td") if row else []
        auth_cell = tds[1] if len(tds) > 1 else None

    if not auth_cell:
        return "Unknown"

    link = auth_cell.find("a")
    if link and link.text.strip():
        return link.text.strip()

    return auth_cell.get_text(strip=True) or "Unknown"


# ----------------------------------------------------------------------
def get_english_description(soup: BeautifulSoup) -> str:
    """
    Extract English description text *inside* the first pair of quotes.
    Example: "End of priority road"
    """
    desc_div = soup.find("div", class_="description", lang="en")
    if not desc_div:
        return ""

    text = desc_div.get_text(separator=" ", strip=True)
    text = re.sub(r"^English[:]\s*", "", text, flags=re.I)

    m = re.search(r'"([^"]*)"', text)
    return m.group(1).strip() if m else text.strip()


# ----------------------------------------------------------------------
def get_license_info(soup: BeautifulSoup):
    """
    Return (license_name, license_url) with https:// enforced
    """
    # 1. Try Licensing section
    lic_header = soup.find("th", string=re.compile(r"^Licensing$", re.I))
    if lic_header:
        cell = lic_header.find_next_sibling("td")
        if cell:
            txt = cell.get_text()
            link = cell.find("a", href=re.compile(
                r"creativecommons\.org|wikipedia\.org/wiki/Public_domain", re.I))
            if link:
                href = link["href"]
                name = link.get_text(strip=True) or href.split(
                    "/")[-1].replace("_", " ")
                return name, _ensure_https(href)

            # Common CC patterns
            if "CC BY-SA 4.0" in txt:
                return "CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/"
            if "CC BY 4.0" in txt:
                return "CC BY 4.0", "https://creativecommons.org/licenses/by/4.0/"
            if "CC0" in txt:
                return "CC0 1.0", "https://creativecommons.org/publicdomain/zero/1.0/"

    # 2. Fallback: any CC link on page
    link = soup.find("a", href=re.compile(
        r"creativecommons\.org|wikipedia\.org/wiki/Public_domain", re.I))
    if link:
        href = link["href"]
        name = link.get_text(strip=True) or href.split(
            "/")[-1].replace("_", " ")
        return name, _ensure_https(href)

    return "Unknown License", ""


# ----------------------------------------------------------------------
def _ensure_https(url: str) -> str:
    """Add https:// if missing and make absolute"""
    if not url:
        return ""
    url = url.strip()
    if url.startswith("//"):
        return "https:" + url
    if url.startswith("http://"):
        return "https://" + url[7:]
    if not url.startswith("http"):
        return "https://creativecommons.org" + url if url.startswith("/") else "https://creativecommons.org/" + url
    return url


# ----------------------------------------------------------------------
def fetch_and_parse(url: str):
    headers = {
        "User-Agent": "WikimediaCreditExtractor/1.0 (+https://github.com/yourname/yourrepo)"
    }
    r = requests.get(url, headers=headers)
    r.raise_for_status()
    soup = BeautifulSoup(r.text, "html.parser")

    title = extract_file_title(url)
    author = get_author(soup)
    description = get_english_description(soup)
    license_name, license_url = get_license_info(soup)
    link = soup.find("a", class_="internal")
    if not link or not link.get("href"):
        print("Warning: Could not find direct SVG download link")
        download_url = None
    else:
        download_url = link["href"]

    return {
        "title": title,
        "author": author,
        "description": description,
        "page": url,
        "license": license_name,
        "licenseUrl": license_url,
    }, download_url


# ----------------------------------------------------------------------
def append_to_json(entry: dict):
    try:
        with open(JSON_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        if not isinstance(data, list):
            data = []
    except (FileNotFoundError, json.JSONDecodeError):
        data = []

    if any(e["page"] == entry["page"] for e in data):
        print(f"Already exists: {entry['title']}")
        return

    data.append(entry)
    with open(JSON_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"Added: {entry['title']}")
    print(f"   Author: {entry['author']}")
    print(f"   Desc: \"{entry['description']}\"")


def update_glyphs_json(title: str, description: str):
    glyphs_path = Path("../src/modules/glyphs.json")
    if not glyphs_path.exists():
        print(f"Warning: {glyphs_path} not found")
        return

    with open(glyphs_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Recursive search for "id": "road-signs" with "items" list
    def find_road_signs(obj):
        if isinstance(obj, dict):
            if obj.get("id") == "road-signs" and "items" in obj and isinstance(obj["items"], list):
                return obj["items"]
            for v in obj.values():
                result = find_road_signs(v)
                if result is not None:
                    return result
        elif isinstance(obj, list):
            for item in obj:
                result = find_road_signs(item)
                if result is not None:
                    return result
        return None

    items_list = find_road_signs(data)
    if not items_list:
        print("Warning: 'road-signs' with 'items' not found in glyphs.json")
        return

    # Safe filename
    filename = "".join(c if c.isalnum() or c in "._-" else "-" for c in title.lower())
    if not filename.endswith(".svg"):
        filename = filename.rsplit(".", 1)[0] + ".svg"

    new_entry = {
        "src": f"./src/svg/glyphs/{filename}",
        "text": description or title.split(".")[0].replace("_", " ").title()
    }

    # Prepend
    items_list.insert(0, new_entry)

    with open(glyphs_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"Updated glyphs.json → prepended {filename}")


def download_svg(download_url, title: str):
    """
    Extract the actual SVG download URL from:
      <a href="https://upload.wikimedia.org/..." class="internal">Original file</a>
    Then download to ../src/svg/glyphs/
    """

    out_dir = Path("../src/svg/glyphs")
    out_dir.mkdir(parents=True, exist_ok=True)

    filename = title.lower().replace(" ", "-")
    out_path = out_dir / filename

    headers = {
        "User-Agent": "WikimediaCreditExtractor/1.0 (+https://github.com/yourname/yourrepo)"
    }
    try:
        r = requests.get(download_url, headers=headers, stream=True, timeout=30)
        r.raise_for_status()
        with open(out_path, "wb") as f:
            for chunk in r.iter_content(1024 * 64):
                f.write(chunk)
        print(f"Downloaded → {out_path}")
    except Exception as e:
        print(f"Warning: Download failed: {e}")


# ----------------------------------------------------------------------
def main():
    if len(sys.argv) != 2:
        print("Usage: python add_wikimedia_credit.py <Wikimedia File URL>")
        sys.exit(1)

    url = sys.argv[1].strip()
    if not url.startswith("https://commons.wikimedia.org/wiki/File:"):
        print("Error: Must be a Wikimedia Commons File: page")
        sys.exit(1)

    try:
        entry, link = fetch_and_parse(url)
        append_to_json(entry)
    except Exception as e:
        print(f"Failed: {e}")
        sys.exit(1)

    try:
        download_svg(link, entry['title'])
        # update_glyphs_json(entry['title'], entry['description'])
        filename = "".join(c if c.isalnum() or c in "._-" else "-" for c in entry['title'].lower())
        print('{ "src": "./assets/svg/glyphs/'+filename+'", "text": "'+entry['title']+'" },')
    except Exception as e:
        print(f"Warning: Asset update failed: {e}")

def main():
    if len(sys.argv) not in (2, 3):
        print("Usage:")
        print("  Single URL: python add_wikimedia_credit.py <URL>")
        print("  Batch file: python add_wikimedia_credit.py --batch <urls.txt>")
        sys.exit(1)

    if sys.argv[1] == "--batch":
        if len(sys.argv) != 3:
            print("Error: --batch requires a file path")
            sys.exit(1)
        batch_file = Path(sys.argv[2])
        if not batch_file.exists():
            print(f"Error: File not found: {batch_file}")
            sys.exit(1)

        urls = [line.strip() for line in batch_file.read_text().splitlines() if line.strip()]
        print(f"Processing {len(urls)} URLs from {batch_file}...\n")
        json = ''
        for url in urls:
            if not url.startswith("https://commons.wikimedia.org/wiki/File:"):
                print(f"Skipping invalid URL: {url}")
                continue
            try:
                print(f"→ {url}")
                entry, link = fetch_and_parse(url)
                append_to_json(entry)
                print()  # spacing
            except Exception as e:
                print(f"Failed {url}: {e}\n")
            try:
                download_svg(link, entry['title'])
                # update_glyphs_json(entry['title'], entry['description'])
                filename = "".join(c if c.isalnum() or c in "._-" else "-" for c in entry['title'].lower())
                json += ('{ "src": "./assets/svg/glyphs/'+filename+'", "text": "'+entry['description']+'" },\n')
            except Exception as e:
                print(f"Warning: Asset update failed: {e}")
        print("Batch complete.")
        print(json)
        return

    # Single URL mode
    url = sys.argv[1].strip()
    if not url.startswith("https://commons.wikimedia.org/wiki/File:"):
        print("Error: Must be a Wikimedia Commons File: page")
        sys.exit(1)

    try:
        entry, link = fetch_and_parse(url)
        append_to_json(entry)
    except Exception as e:
        print(f"Failed: {e}")
        sys.exit(1)
    try:
        download_svg(link, entry['title'])
        # update_glyphs_json(entry['title'], entry['description'])
        filename = "".join(c if c.isalnum() or c in "._-" else "-" for c in entry['title'].lower())
        print('{ "src": "./assets/svg/glyphs/'+filename+'", "text": "'+entry['title']+'" },')
    except Exception as e:
        print(f"Warning: Asset update failed: {e}")

if __name__ == "__main__":
    main()
