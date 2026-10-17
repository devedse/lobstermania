"""Bundle the game into one self-contained HTML file (code, styles and images inlined).

Run from anywhere:  python tools/build_single.py
Writes dist/lobstermania.html, handy for opening on another device.
"""
import base64
import mimetypes
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "dist", "lobstermania.html")


def read(rel):
    with open(os.path.join(ROOT, rel), encoding="utf-8") as f:
        return f.read()


def data_uri(rel):
    path = os.path.join(ROOT, rel)
    mime = mimetypes.guess_type(path)[0] or "application/octet-stream"
    with open(path, "rb") as f:
        return f"data:{mime};base64," + base64.b64encode(f.read()).decode("ascii")


def inline_assets(text, prefix=""):
    """Replace every assets/... path (optionally preceded by ../) with a data URI."""
    return re.sub(
        r"(?:\.\./)?(assets/[A-Za-z0-9_./-]+\.(?:png|jpg|jpeg|gif|webp))",
        lambda m: data_uri(m.group(1)),
        text,
    )


def main():
    html = read("index.html")

    css = inline_assets(read("css/style.css"))
    html = html.replace('<link rel="stylesheet" href="css/style.css">', f"<style>\n{css}\n</style>")

    def script(m):
        js = inline_assets(read(m.group(1)))
        return f"<script>\n{js}\n</script>"

    html = re.sub(r'<script src="(js/[^"]+)"></script>', script, html)
    html = inline_assets(html)

    # Images whose names are built at runtime (the bonus screens and Larry's animation
    # frames) go into a lookup table that LM.url() reads.
    entries = []
    for dirpath, _, files in [w for d in ("bonus", "freegames") for w in os.walk(os.path.join(ROOT, "assets", d))]:
        for name in sorted(files):
            rel = os.path.relpath(os.path.join(dirpath, name), ROOT).replace(os.sep, "/")
            entries.append(f'"{rel}":"{data_uri(rel)}"')
    table = "<script>window.LM_ASSETS={" + ",".join(entries) + "};</script>\n"
    html = html.replace("<script>\n", table + "<script>\n", 1)

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"wrote {OUT} ({os.path.getsize(OUT) / 1e6:.1f} MB)")


if __name__ == "__main__":
    main()
