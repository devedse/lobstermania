"""Run tools/sim.html in headless Chrome and print the results.

Usage: python tools/run_sim.py [spins per level, default 300000]
"""
import os
import pathlib
import sys

from playwright.sync_api import sync_playwright

page_url = pathlib.Path(os.path.dirname(os.path.abspath(__file__)), "sim.html").as_uri() + (f"?n={sys.argv[1]}" if len(sys.argv) > 1 else "")

with sync_playwright() as p:
    browser = p.chromium.launch(channel="chrome", headless=True)
    page = browser.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto(page_url)
    page.wait_for_function("document.getElementById('out').textContent !== 'Running…'", timeout=1800000)
    print(page.inner_text("#out"))
    for e in errors:
        print("PAGE ERROR:", e)
    browser.close()
