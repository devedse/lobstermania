"""Cut the Big Wheel Bonus artwork out of the promo frames.

Run from the project root:  python tools/extract_wheel.py
Writes assets/wheel/initiated.png: the "Big Wheel Bonus Initiated!" board with its
"1 SPIN AWARDED" line painted over, so the game can write the number of spins itself.
(The wheel itself is drawn by js/wheel.js, because the promo never shows all of it.)
"""
import os

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRAMES = os.path.join(ROOT, "reference", "frames")
OUT = os.path.join(ROOT, "assets", "wheel")

BOTTOM = (478, 559, 1441, 1053)
BOARD = (138, 38, 828, 458)  # board incl. rope, bottom-screen coordinates (frame 2:02)
SPIN_LINE = (226, 312, 744, 392)  # "1 SPIN AWARDED", board-relative after the crop below


def main():
    os.makedirs(OUT, exist_ok=True)
    f = Image.open(os.path.join(FRAMES, "frame_122.00.jpg")).convert("RGB").crop(BOTTOM)
    board = np.asarray(f.crop(BOARD)).copy()
    x0, y0, x1, y1 = (v - o for v, o in zip(SPIN_LINE, (BOARD[0], BOARD[1], BOARD[0], BOARD[1])))
    # Planks run sideways, so fill the line with the clean plank strip left of the text,
    # mirrored back and forth across the width
    strip = board[y0:y1, 62:x0 - 2]
    n = strip.shape[1]
    for x in range(x0, x1):
        k = (x - x0) % (2 * n)
        board[y0:y1, x] = strip[:, n - 1 - k if k < n else k - n]
    # Smear sideways to hide the mirror seams (the game writes the spin count on top)
    fill = board[y0:y1, x0:x1].astype(np.float32)
    kernel = np.ones(41) / 41
    for c in range(3):
        for r in range(fill.shape[0]):
            fill[r, :, c] = np.convolve(np.pad(fill[r, :, c], 20, mode="edge"), kernel, "valid")
    board[y0:y1, x0:x1] = fill.astype(np.uint8)
    img = Image.fromarray(board.astype(np.uint8))
    # Soften the seam
    seam = img.filter(ImageFilter.GaussianBlur(2))
    m = Image.new("L", img.size, 0)
    for y in (y0, y1):
        ImageDraw.Draw(m).rectangle((x0, y - 3, x1, y + 3), fill=255)
    img.paste(seam, (0, 0), m.filter(ImageFilter.GaussianBlur(2)))
    # Alpha: the rope-framed board, feathered at the edge
    w, h = img.size
    a = Image.new("L", (w, h), 0)
    ImageDraw.Draw(a).rounded_rectangle((14, 22, w - 14, h - 10), radius=26, fill=255)
    ImageDraw.Draw(a).rounded_rectangle((44, 2, 272, 70), radius=20, fill=255)  # "Lucky Larry's" logo
    img.putalpha(a.filter(ImageFilter.GaussianBlur(5)))
    img.save(os.path.join(OUT, "initiated.png"))
    print("wrote", os.path.join(OUT, "initiated.png"), img.size)


if __name__ == "__main__":
    main()
