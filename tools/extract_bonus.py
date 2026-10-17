"""Cut the Buoy Bonus artwork and Larry's animation frames out of the promo frames.

Run from the project root after tools/grab_frames.py has filled reference/:
    python tools/extract_bonus.py
Writes into assets/bonus/ and assets/bonus/anim/.

All bottom-screen coordinates are relative to the bottom screen (963 x 494),
which sits at x 478, y 559 in the 1920x1080 promo frames.
"""
import glob
import os

from PIL import Image, ImageDraw, ImageFilter, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REF = os.path.join(ROOT, "reference")
OUT = os.path.join(ROOT, "assets", "bonus")

COL_X0 = 478
TOP = (COL_X0, 0, COL_X0 + 963, 530)
BOTTOM = (COL_X0, 559, COL_X0 + 963, 559 + 494)

# Larry animation strip on the boat: everything above the row of buoys
ANIM_BOX = (90, 0, 963, 335)


def frame(path):
    return Image.open(os.path.join(REF, path)).convert("RGB")


def bottom(path):
    return frame(path).crop(BOTTOM)


def top(path):
    return frame(path).crop(TOP)


def soft_mask(size, feather, ellipse=False):
    """White shape with blurred edges, for blending crops into a background."""
    w, h = size
    m = Image.new("L", size, 0)
    d = ImageDraw.Draw(m)
    box = (feather, feather, w - feather, h - feather)
    (d.ellipse if ellipse else d.rectangle)(box, fill=255)
    return m.filter(ImageFilter.GaussianBlur(feather / 2))


def with_alpha(img, mask):
    out = img.convert("RGBA")
    out.putalpha(mask)
    return out


def save_jpg(img, name, q=88):
    img.save(os.path.join(OUT, name), quality=q)


def main():
    os.makedirs(os.path.join(OUT, "anim"), exist_ok=True)

    # Screens used as backgrounds
    save_jpg(bottom("frames/frame_018.00.jpg"), "pick_bonus.jpg")
    save_jpg(bottom("frames/frame_022.00.jpg"), "pick_lobster.jpg")
    save_jpg(top("frames/frame_097.00.jpg"), "title_classic.jpg")
    save_jpg(top("frames/frame_030.00.jpg"), "title_free_games.jpg")
    # Boat scene: frame 29.6 has no caption, but two buoys are outlined there; take those from 28.0.
    boat = bottom("frames_fine/frame_029.60.jpg")
    clean = bottom("frames/frame_028.00.jpg")
    for x0 in (352, 540):
        patch = clean.crop((x0, 322, x0 + 92, 462))
        boat.paste(patch, (x0, 322), soft_mask(patch.size, 8))
    save_jpg(boat, "boat.jpg")

    # Pick a Lobster reveal pieces (from the zoomed-in "GOOD LUCK!" frame)
    good = bottom("frames/frame_026.00.jpg")
    head = good.crop((110, 70, 865, 178))
    with_alpha(head, soft_mask(head.size, 8)).save(os.path.join(OUT, "good_luck.png"))
    lit = good.crop((335, 180, 615, 376))
    with_alpha(lit, soft_mask(lit.size, 14, ellipse=True)).save(os.path.join(OUT, "lobster_lit.png"))
    dim = good.crop((62, 190, 342, 362))
    with_alpha(dim, soft_mask(dim.size, 14, ellipse=True)).save(os.path.join(OUT, "lobster_dim.png"))

    # A picked buoy: the glass "ghost" buoy, with water around it, edges feathered
    ghost = bottom("frames_fine/frame_035.60.jpg").crop((348, 328, 442, 462))
    with_alpha(ghost, soft_mask(ghost.size, 10)).save(os.path.join(OUT, "ghost.png"))

    # "TOTAL BONUS ... CREDITS" board with the number painted out
    board = bottom("frames/frame_095.00.jpg")
    # Wood grain runs sideways, so stretch thin strips from either side of the number
    # across it and cross-fade between them.
    y0, y1, x0, x1 = 198, 328, 274, 696
    left = board.crop((x0 - 24, y0, x0, y1)).resize((x1 - x0, y1 - y0))
    right = board.crop((x1, y0, x1 + 24, y1)).resize((x1 - x0, y1 - y0))
    fade = Image.linear_gradient("L").rotate(90, expand=True).resize((x1 - x0, y1 - y0))
    fill = Image.composite(left, right, ImageOps.mirror(fade))
    board.paste(fill, (x0, y0), soft_mask(fill.size, 6))
    board = board.crop((60, 52, 905, 458))
    with_alpha(board, soft_mask(board.size, 12)).save(os.path.join(OUT, "total_board.png"))

    # Larry's animations, 12 frames per second, from reference/anim/
    anim = sorted(glob.glob(os.path.join(REF, "anim", "*.jpg")))
    clips = {"haul": range(3, 31), "pull": range(50, 58), "giant": range(58, 119)}
    stills = {"idle_start": 0, "idle_crate": 50}
    for name, idx in stills.items():
        Image.open(anim[idx]).convert("RGB").crop(BOTTOM).crop(ANIM_BOX).save(
            os.path.join(OUT, "anim", f"{name}.jpg"), quality=86
        )
    for name, rng in clips.items():
        for n, i in enumerate(rng):
            img = Image.open(anim[i]).convert("RGB").crop(BOTTOM).crop(ANIM_BOX)
            img.save(os.path.join(OUT, "anim", f"{name}_{n:02d}.jpg"), quality=82)
        print(name, len(rng), "frames")

    print("bonus assets written to", OUT)


if __name__ == "__main__":
    main()
