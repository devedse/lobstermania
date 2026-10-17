"""Cut the Buoy Bonus Free Games artwork out of the promo frames.

Run from the project root:  python tools/extract_freegames.py
Writes into assets/freegames/. (The chest cut-out, chest.png, was made separately
by tracing its green outline in frame 52 and is kept as-is.)
"""
import os

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRAMES = os.path.join(ROOT, "reference", "frames")
OUT = os.path.join(ROOT, "assets", "freegames")

TOP = (478, 0, 1441, 530)
BOTTOM = (478, 559, 1441, 1053)
CELL_W, CELL_H = 158, 87
# reel windows on the bottom screen (x, y, rows)
REELS = [(84, 98, 3), (245, 53, 4), (405, 10, 5), (564, 53, 4), (725, 98, 3)]

# Free-game symbol tiles: name -> (frame second, reel, row)
TILES = {
    "light": (48, 0, 0), "turtle": (48, 1, 0), "star": (48, 2, 0), "anchor": (48, 1, 1),
    "wild": (48, 2, 1), "buoy": (48, 2, 2), "pearl": (48, 1, 3),
    "tuna": (58, 0, 0), "boat": (58, 3, 1), "gull": (58, 3, 2),
}

# Award icons on the rules screen (frame 39, bottom-screen coordinates)
ICONS = {
    "credits": (150, 133, 250, 215),
    "wilds": (484, 133, 584, 215),
    "multiplier": (150, 225, 250, 307),
    "extra": (496, 228, 586, 306),
    "king": (328, 312, 414, 396),
}


def frame(t):
    return Image.open(os.path.join(FRAMES, f"frame_{t:06.2f}.jpg")).convert("RGB")


def soft_mask(size, feather, ellipse=False):
    m = Image.new("L", size, 0)
    d = ImageDraw.Draw(m)
    box = (feather, feather, size[0] - feather, size[1] - feather)
    (d.ellipse if ellipse else d.rectangle)(box, fill=255)
    return m.filter(ImageFilter.GaussianBlur(feather / 2))


def water_background():
    """Bottom screen with the reel windows emptied.

    The frame from 0:44 gives the frame art. Each reel window is refilled with a
    vertical water gradient: for every row, the median of all water-coloured pixels
    in that window across the free-game frames (symbols drop out).
    """
    base = frame(44).crop(BOTTOM)
    times = [t for t in range(41, 93) if t not in (59, 60, 61)]
    stack = np.stack([np.asarray(frame(t).crop(BOTTOM)) for t in times]).astype(np.int16)
    out = base.copy()
    for x, y, rows in REELS:
        y0, y1 = max(0, y - 2), y + rows * CELL_H + 2
        win = stack[:, y0:y1, x - 2 : x + CELL_W + 2]
        r, g, b = win[..., 0], win[..., 1], win[..., 2]
        water = (b > r + 70) & (b > g + 40) & (b > 110) & (r < 90)
        col = np.zeros((y1 - y0, 3))
        for k in range(y1 - y0):
            sel = win[:, k][water[:, k]]
            col[k] = np.median(sel, axis=0) if len(sel) else col[k - 1]
        # smooth the profile, then darken slightly toward the window edges for depth
        col = np.stack([np.convolve(np.pad(col[:, c], 45, mode="edge"), np.ones(91) / 91, "valid") for c in range(3)], 1)
        w = CELL_W + 4
        edge = 1 - 0.12 * (np.abs(np.linspace(-1, 1, w)) ** 3)
        grad = (col[:, None, :] * edge[None, :, None]).clip(0, 255).astype(np.uint8)
        out.paste(Image.fromarray(grad), (x - 2, y0))
    return out


def top_boat():
    """Top screen boat with every buoy dimmed (no ghosts): ghosts at slots 4 and 6 are
    covered with copies of their dimmed neighbours."""
    top = frame(44).crop(TOP)
    for src_x, dst_x in ((280, 383), (682, 580)):
        patch = top.crop((src_x - 42, 378, src_x + 42, 512))
        top.paste(patch, (dst_x - 42, 378), soft_mask(patch.size, 8))
    return top


def main():
    os.makedirs(OUT, exist_ok=True)

    water_background().save(os.path.join(OUT, "fg_bottom.jpg"), quality=90)
    top_boat().save(os.path.join(OUT, "fg_top.jpg"), quality=90)
    frame(39).crop(BOTTOM).save(os.path.join(OUT, "fg_rules.jpg"), quality=90)

    for name, (t, reel, row) in TILES.items():
        x, y, _ = REELS[reel]
        cell = frame(t).crop(BOTTOM).crop((x, y + row * CELL_H, x + CELL_W, y + (row + 1) * CELL_H))
        cell = cell.filter(ImageFilter.UnsharpMask(radius=1.2, percent=60, threshold=2))
        cell.save(os.path.join(OUT, f"{name}.png"))

    rules = frame(39).crop(BOTTOM)
    for name, box in ICONS.items():
        icon = rules.crop(box).convert("RGBA")
        icon.putalpha(soft_mask(icon.size, 3, ellipse=True))
        icon.save(os.path.join(OUT, f"award_{name}.png"))

    print("free games assets written to", OUT)


if __name__ == "__main__":
    main()
