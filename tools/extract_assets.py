"""Cut the game artwork out of the 1080p promo frames in reference/frames/.

Run from the project root:  python tools/extract_assets.py
Writes PNG/JPG files into assets/.

Frame geometry (1920x1080 promo frames):
  machine column x 478..1441 (963 px wide)
  top screen     y 0..530
  bottom screen  y 559..1053 (the machine's own button bar below is not used)
"""
import os

from PIL import Image, ImageEnhance, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRAMES = os.path.join(ROOT, "reference", "frames")
ASSETS = os.path.join(ROOT, "assets")

COL_X0, COL_X1 = 478, 1441
TOP = (COL_X0, 0, COL_X1, 530)
BOTTOM = (COL_X0, 559, COL_X1, 1053)

CELL_W, CELL_H = 158, 87
# (x, y of first row, rows) for reels 1..5, in frame pixels
REELS = [(562, 657, 3), (723, 612, 4), (883, 569, 5), (1042, 612, 4), (1203, 657, 3)]

# symbol id -> (frame second, reel index 0-4, row index)
SYMBOLS = {
    "gull": (120, 0, 0),
    "star": (120, 0, 1),
    "anchor": (120, 0, 2),
    "light": (120, 1, 2),
    "turtle": (120, 1, 1),
    "pearl": (120, 3, 1),
    "tuna": (120, 2, 2),
    "bigwheel": (120, 3, 0),
    "larry": (10, 1, 1),
    "buoy": (105, 0, 1),
    "boat": (10, 0, 0),
    "wild": (48, 2, 1),
}


def frame(t):
    return Image.open(os.path.join(FRAMES, f"frame_{t:06.2f}.jpg")).convert("RGB")


def cell(t, reel, row):
    x, y, _ = REELS[reel]
    return frame(t).crop((x, y + row * CELL_H, x + CELL_W, y + (row + 1) * CELL_H))


def crisp(img):
    """Light sharpen to counter video softness."""
    img = img.filter(ImageFilter.UnsharpMask(radius=1.2, percent=60, threshold=2))
    return ImageEnhance.Color(img).enhance(1.05)


def main():
    os.makedirs(os.path.join(ASSETS, "symbols"), exist_ok=True)
    os.makedirs(os.path.join(ASSETS, "bg"), exist_ok=True)

    for name, (t, reel, row) in SYMBOLS.items():
        crisp(cell(t, reel, row)).save(os.path.join(ASSETS, "symbols", f"{name}.png"))

    # Base game background: bottom screen with the reel windows painted white.
    base = frame(105)
    white = Image.new("RGB", (CELL_W, CELL_H), (255, 255, 255))
    for x, y, rows in REELS:
        for r in range(rows):
            base.paste(white, (x, y + r * CELL_H))
    crisp(base.crop(BOTTOM)).save(os.path.join(ASSETS, "bg", "base.jpg"), quality=92)

    # Top screen (paytable + progressive meters).
    crisp(frame(10).crop(TOP)).save(os.path.join(ASSETS, "bg", "top.jpg"), quality=92)

    # Page sides: ocean and sunset art to the left and right of the machine.
    f = frame(10)
    f.crop((0, 0, COL_X0, 1080)).save(os.path.join(ASSETS, "bg", "side_left.jpg"), quality=88)
    f.crop((COL_X1, 0, 1920, 1080)).save(os.path.join(ASSETS, "bg", "side_right.jpg"), quality=88)

    print("assets written to", ASSETS)


if __name__ == "__main__":
    main()
