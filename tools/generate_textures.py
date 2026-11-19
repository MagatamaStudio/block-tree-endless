"""Generate original 16x16 pixel-art block/item textures for the mod.

The textures are hand-built from palettes and noise; they are not copies of
Minecraft assets. Output is upscaled with nearest-neighbour for crisp CSS use.
"""

from __future__ import annotations

import os
import random

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "img")
os.makedirs(OUT, exist_ok=True)

SCALE = 4


def rgba(color):
    return color if len(color) == 4 else (*color, 255)


def canvas(base=(0, 0, 0, 0), size=16):
    return Image.new("RGBA", (size, size), rgba(base))


def noise(img, palette, seed):
    rnd = random.Random(seed)
    for y in range(img.height):
        for x in range(img.width):
            img.putpixel((x, y), rgba(rnd.choice(palette)))


def overlay_noise(img, palette, seed, chance=0.18):
    rnd = random.Random(seed)
    for y in range(img.height):
        for x in range(img.width):
            if rnd.random() < chance:
                img.putpixel((x, y), rgba(rnd.choice(palette)))


def bevel(img, light, dark):
    light, dark = rgba(light), rgba(dark)
    for i in range(img.width):
        img.putpixel((i, 0), light)
        img.putpixel((i, img.height - 1), dark)
        img.putpixel((0, i), light)
        img.putpixel((img.width - 1, i), dark)


def save(img, name, scale=SCALE):
    big = img.resize((img.width * scale, img.height * scale), Image.NEAREST)
    big.save(os.path.join(OUT, name))


def oak_log():
    base = [(104, 78, 48), (113, 85, 53), (96, 71, 43), (121, 92, 58)]
    img = canvas()
    noise(img, base, 11)
    for x in (0, 4, 8, 12):
        for y in range(16):
            img.putpixel((x, y), rgba((82, 60, 37)))
    for x in (2, 6, 10, 14):
        for y in range(16):
            if random.Random(x * 31 + y).random() < 0.35:
                img.putpixel((x, y), rgba((138, 106, 66)))
    for x, y in ((7, 1), (3, 9), (13, 6), (10, 13)):
        img.putpixel((x, y), rgba((74, 53, 32)))
    return img


def oak_planks():
    img = canvas((170, 135, 84))
    noise(img, [(166, 132, 82), (175, 140, 88), (160, 127, 78)], 22)
    for y in (0, 5, 10, 15):
        for x in range(16):
            img.putpixel((x, y), rgba((122, 94, 57)))
    for y in range(1, 16):
        for x in (3, 11):
            if y % 5 != 0:
                img.putpixel((x, y), rgba((151, 119, 74)))
    for x, y in ((7, 2), (14, 7), (5, 12), (10, 13)):
        img.putpixel((x, y), rgba((90, 68, 41)))
    return img


def cobblestone():
    img = canvas((127, 127, 127))
    noise(img, [(120, 120, 120), (133, 133, 133), (112, 112, 112)], 33)
    patches = [
        (1, 1, 5, 4), (7, 1, 4, 3), (12, 2, 3, 4),
        (2, 6, 4, 4), (7, 5, 3, 5), (11, 7, 4, 4),
        (1, 11, 5, 4), (7, 11, 4, 4), (12, 12, 3, 3),
    ]
    for i, (x0, y0, w, h) in enumerate(patches):
        tone = (146, 146, 146) if i % 3 else (100, 100, 100)
        for y in range(y0, y0 + h):
            for x in range(x0, x0 + w):
                img.putpixel((x, y), rgba(tone))
    for y in range(16):
        for x in range(16):
            if (x in (0, 6, 10, 15) or y in (0, 5, 10, 15)) and random.Random(x * 7 + y * 13).random() < 0.7:
                img.putpixel((x, y), rgba((78, 78, 78)))
    return img


def iron_block():
    img = canvas((205, 205, 205))
    noise(img, [(200, 200, 200), (212, 212, 212), (194, 194, 194)], 44)
    for i in range(2, 14):
        img.putpixel((i, 2), rgba((236, 236, 236)))
        img.putpixel((i, 13), rgba((164, 164, 164)))
        img.putpixel((2, i), rgba((236, 236, 236)))
        img.putpixel((13, i), rgba((164, 164, 164)))
    for x, y in ((4, 4), (11, 4), (4, 11), (11, 11)):
        img.putpixel((x, y), rgba((150, 150, 150)))
        img.putpixel((x + 1, y), rgba((232, 232, 232)))
    return img


def diamond_block():
    img = canvas((52, 170, 162))
    noise(img, [(48, 162, 155), (58, 180, 170), (42, 148, 142)], 55)
    gems = [(2, 2), (9, 2), (5, 6), (12, 6), (2, 10), (9, 11)]
    for cx, cy in gems:
        pattern = [(1, 0), (0, 1), (1, 1), (2, 1), (1, 2)]
        for dx, dy in pattern:
            img.putpixel((cx + dx, cy + dy), rgba((150, 245, 235)))
        img.putpixel((cx + 1, cy + 1), rgba((225, 255, 250)))
    bevel(img, (92, 215, 205), (28, 115, 110))
    return img


def netherrack():
    img = canvas((103, 39, 39))
    noise(img, [(96, 35, 35), (112, 45, 43), (84, 30, 30)], 66)
    rnd = random.Random(77)
    for _ in range(40):
        x, y = rnd.randrange(16), rnd.randrange(16)
        img.putpixel((x, y), rgba((138, 55, 50)))
    for _ in range(25):
        x, y = rnd.randrange(16), rnd.randrange(16)
        img.putpixel((x, y), rgba((65, 22, 22)))
    return img


def end_stone():
    img = canvas((214, 208, 158))
    noise(img, [(210, 204, 154), (222, 216, 168), (200, 195, 146)], 88)
    rnd = random.Random(99)
    for _ in range(30):
        x, y = rnd.randrange(16), rnd.randrange(16)
        img.putpixel((x, y), rgba((184, 179, 132)))
        img.putpixel((min(15, x + 1), y), rgba((236, 231, 185)))
    return img


def ancient_debris():
    img = canvas((74, 60, 52))
    noise(img, [(70, 57, 50), (82, 66, 56), (60, 49, 44)], 111)
    rnd = random.Random(122)
    for _ in range(18):
        x, y = rnd.randrange(16), rnd.randrange(16)
        img.putpixel((x, y), rgba((127, 65, 46)))
        if x + 1 < 16:
            img.putpixel((x + 1, y), rgba((96, 50, 38)))
    return img


def grass_block():
    img = canvas((126, 91, 58))
    noise(img, [(120, 86, 54), (134, 97, 62), (110, 78, 49)], 133)
    for x in range(16):
        top = 3 if random.Random(x * 17).random() < 0.5 else 4
        for y in range(top):
            img.putpixel((x, y), rgba((96, 160, 60) if y < top - 1 else (82, 143, 52)))
        img.putpixel((x, top), rgba((72, 124, 45)))
    for x, y in ((3, 7), (9, 10), (13, 6), (6, 13)):
        img.putpixel((x, y), rgba((94, 67, 42)))
    return img


def stone_tile():
    size = 32
    img = canvas((40, 40, 44), size)
    rnd = random.Random(144)
    for y in range(size):
        for x in range(size):
            v = rnd.choice([0, 0, 0, 3, -3, 6, -6])
            img.putpixel((x, y), rgba((max(20, min(60, 40 + v)),) * 3))
    for i in range(size):
        if i % 16 == 0:
            img.putpixel((i, 0), rgba((30, 30, 33)))
            img.putpixel((0, i), rgba((30, 30, 33)))
    for i in range(1, size):
        img.putpixel((i, 0), rgba((50, 50, 55)))
        img.putpixel((0, i), rgba((50, 50, 55)))
    for _ in range(22):
        x, y = rnd.randrange(size), rnd.randrange(size)
        img.putpixel((x, y), rgba((52, 52, 57)))
    return img


def golden_apple():
    img = canvas()
    body = [(203, 161, 41), (226, 190, 60), (174, 135, 32), (243, 215, 90)]
    for y in range(4, 15):
        for x in range(3, 13):
            if (x - 8) ** 2 / 20 + (y - 9.5) ** 2 / 26 <= 1:
                img.putpixel((x, y), rgba(random.Random(x * 31 + y).choice(body)))
    for x, y in ((7, 2), (8, 2), (8, 3)):
        img.putpixel((x, y), rgba((90, 65, 35)))
    for x, y in ((9, 1), (10, 1), (10, 2)):
        img.putpixel((x, y), rgba((94, 160, 62)))
    img.putpixel((6, 10), rgba((255, 245, 170)))
    return img


def pickaxe(head):
    img = canvas()
    handle = [(100, 70, 42), (122, 88, 52), (80, 55, 32)]
    for i in range(10):
        x, y = 4 + i, 14 - i
        if 0 <= x < 16 and 0 <= y < 16:
            img.putpixel((x, y), rgba(handle[i % 3]))
    pts = [(4, 5), (5, 4), (6, 4), (7, 3), (8, 3), (9, 3), (10, 4), (11, 4), (12, 5),
           (5, 5), (6, 5), (7, 4), (8, 4), (9, 4), (10, 5), (11, 5)]
    for x, y in pts:
        img.putpixel((x, y), rgba(head))
    for x, y in ((6, 4), (8, 3), (10, 4)):
        img.putpixel((x, y), rgba(tuple(min(255, c + 45) for c in head)))
    return img


def crafting_table():
    img = oak_planks()
    for x in range(3, 13):
        img.putpixel((x, 3), rgba((78, 55, 32)))
        img.putpixel((x, 12), rgba((78, 55, 32)))
    for y in range(3, 13):
        img.putpixel((3, y), rgba((78, 55, 32)))
        img.putpixel((12, y), rgba((78, 55, 32)))
    for x in range(4, 12):
        for y in range(4, 12):
            img.putpixel((x, y), rgba((137, 104, 64)))
    img.putpixel((7, 7), rgba((60, 44, 27)))
    img.putpixel((8, 8), rgba((60, 44, 27)))
    bevel(img, (196, 160, 105), (105, 80, 48))
    return img


def furnace():
    img = cobblestone()
    for x in range(4, 12):
        img.putpixel((x, 5), rgba((55, 55, 55)))
    for y in range(5, 12):
        img.putpixel((4, y), rgba((55, 55, 55)))
        img.putpixel((11, y), rgba((55, 55, 55)))
    for x in range(5, 11):
        img.putpixel((x, 11), rgba((55, 55, 55)))
    for x in range(5, 11):
        for y in range(6, 11):
            img.putpixel((x, y), rgba((38, 30, 28)))
    for x in range(6, 10):
        img.putpixel((x, 9), rgba((220, 120, 35)))
        img.putpixel((x, 10), rgba((150, 60, 25)))
    img.putpixel((7, 8), rgba((255, 190, 70)))
    img.putpixel((8, 8), rgba((255, 190, 70)))
    return img


def ender_eye():
    img = canvas()
    for y in range(16):
        for x in range(16):
            dx, dy = x - 7.5, y - 7.5
            d = (dx * dx + dy * dy) ** 0.5
            if d < 6.8:
                img.putpixel((x, y), rgba((30, 60, 50) if d > 5 else (20, 90, 70)))
            if d < 3.2:
                img.putpixel((x, y), rgba((70, 200, 150)))
            if d < 1.8:
                img.putpixel((x, y), rgba((190, 255, 220)))
    return img


def dragon_egg():
    img = canvas()
    for y in range(2, 15):
        for x in range(3, 13):
            dx = (x - 8) / 5
            dy = (y - 8.5) / 7
            if dx * dx + dy * dy <= 1:
                img.putpixel((x, y), rgba((78, 40, 110)))
    for x, y in ((6, 5), (10, 6), (7, 9), (11, 10), (5, 11)):
        img.putpixel((x, y), rgba((36, 18, 55)))
    for x, y in ((6, 6), (10, 7), (8, 10)):
        img.putpixel((x, y), rgba((150, 95, 200)))
    return img


def beacon():
    img = canvas((70, 200, 190))
    for y in range(4, 15):
        half = (y - 3) // 2
        for x in range(8 - half, 8 + half):
            img.putpixel((x, y), rgba((70, 200, 190) if (x + y) % 3 else (130, 245, 235)))
    bevel(img, (160, 255, 245), (30, 120, 120))
    return img


def crystal_block(base, light, dark, seed, shards=6):
    img = canvas(base)
    noise(img, [(base[0], base[1], base[2]), (base[0] - 8, base[1] - 8, base[2] - 8), (base[0] + 8, base[1] + 8, base[2] + 8)], seed)
    rnd = random.Random(seed + 1)
    for _ in range(shards):
        cx, cy = rnd.randrange(2, 14), rnd.randrange(2, 14)
        for dx, dy in ((0, -1), (-1, 0), (0, 0), (1, 0), (0, 1)):
            x, y = cx + dx, cy + dy
            if 0 <= x < 16 and 0 <= y < 16:
                img.putpixel((x, y), rgba(light))
        img.putpixel((cx, cy), rgba((255, 255, 255)))
    bevel(img, light, dark)
    return img


def twilight_moss():
    img = canvas((72, 88, 62))
    noise(img, [(68, 84, 58), (78, 96, 66), (58, 74, 52)], 201)
    rnd = random.Random(202)
    for _ in range(26):
        x, y = rnd.randrange(16), rnd.randrange(16)
        img.putpixel((x, y), rgba((96, 128, 72)))
        if rnd.random() < 0.5 and x + 1 < 16:
            img.putpixel((x + 1, y), rgba((84, 116, 64)))
    for x, y in ((3, 4), (11, 7), (6, 12)):
        img.putpixel((x, y), rgba((48, 64, 46)))
    return img


def manasteel():
    img = canvas((64, 156, 136))
    noise(img, [(60, 148, 130), (72, 168, 146), (52, 134, 118)], 211)
    bevel(img, (132, 224, 200), (32, 100, 88))
    # small flower motif
    for x, y in ((8, 6), (7, 7), (9, 7), (8, 8)):
        img.putpixel((x, y), rgba((220, 250, 235)))
    img.putpixel((8, 7), rgba((255, 230, 120)))
    return img


def eu_cell():
    img = canvas((216, 166, 40))
    noise(img, [(210, 160, 36), (226, 178, 52), (198, 148, 30)], 221)
    for x in range(3, 13):
        img.putpixel((x, 2), rgba((120, 88, 20)))
        img.putpixel((x, 13), rgba((120, 88, 20)))
    for y in range(3, 13):
        img.putpixel((2, y), rgba((120, 88, 20)))
        img.putpixel((13, y), rgba((120, 88, 20)))
    bolt = [(9, 3), (8, 4), (7, 5), (9, 6), (8, 7), (7, 8), (6, 9), (8, 10), (9, 11)]
    for x, y in bolt:
        img.putpixel((x, y), rgba((255, 250, 210)))
    return img


def void_metal():
    img = canvas((58, 42, 78))
    noise(img, [(54, 38, 74), (66, 48, 88), (44, 30, 62)], 231)
    bevel(img, (150, 110, 190), (24, 16, 34))
    for x, y in ((5, 6), (10, 9), (6, 11)):
        img.putpixel((x, y), rgba((190, 150, 230)))
        img.putpixel((x + 1, y), rgba((110, 70, 150)))
    return img


def certus_quartz():
    return crystal_block((160, 205, 225), (215, 245, 255), (100, 150, 175), 241, 7)


def chaos_shard():
    return crystal_block((120, 34, 158), (240, 110, 255), (70, 14, 100), 251, 5)


def moon_dust():
    img = canvas((158, 158, 164))
    noise(img, [(152, 152, 158), (168, 168, 174), (140, 140, 146)], 261)
    rnd = random.Random(262)
    for _ in range(7):
        cx, cy = rnd.randrange(3, 13), rnd.randrange(3, 13)
        r = rnd.choice([1, 2])
        for y in range(max(0, cy - r), min(16, cy + r + 1)):
            for x in range(max(0, cx - r), min(16, cx + r + 1)):
                img.putpixel((x, y), rgba((126, 126, 132)))
        img.putpixel((cx, cy), rgba((100, 100, 108)))
    return img


def plasma_cell():
    img = canvas((226, 96, 34))
    noise(img, [(220, 90, 30), (240, 112, 46), (204, 78, 24)], 271)
    for y in range(16):
        for x in range(16):
            d = ((x - 7.5) ** 2 + (y - 7.5) ** 2) ** 0.5
            if d < 2:
                img.putpixel((x, y), rgba((255, 245, 190)))
            elif d < 4:
                img.putpixel((x, y), rgba((255, 190, 80)))
    bevel(img, (255, 210, 120), (130, 44, 12))
    return img


def emc_crystal():
    img = crystal_block((220, 180, 60), (255, 235, 130), (150, 110, 24), 281, 5)
    for x, y in ((7, 7), (8, 8)):
        img.putpixel((x, y), rgba((120, 230, 140)))
    return img


def creative_core():
    img = canvas((232, 70, 158))
    noise(img, [(226, 64, 152), (244, 84, 172), (210, 52, 136)], 291)
    rnd = random.Random(292)
    for _ in range(18):
        x, y = rnd.randrange(16), rnd.randrange(16)
        img.putpixel((x, y), rgba(rnd.choice([(120, 230, 255), (255, 240, 120), (140, 255, 160), (255, 255, 255)])))
    for y in range(5, 11):
        for x in range(5, 11):
            img.putpixel((x, y), rgba((255, 220, 245)))
    bevel(img, (255, 170, 220), (140, 24, 90))
    return img


def quest_book():
    img = canvas((126, 84, 46))
    noise(img, [(120, 80, 44), (134, 92, 52), (108, 72, 38)], 301)
    for x in range(2, 14):
        img.putpixel((x, 2), rgba((88, 58, 30)))
        img.putpixel((x, 13), rgba((88, 58, 30)))
    for y in range(2, 14):
        img.putpixel((2, y), rgba((88, 58, 30)))
        img.putpixel((13, y), rgba((88, 58, 30)))
    for y in range(4, 12):
        for x in range(4, 12):
            img.putpixel((x, y), rgba((238, 226, 190)))
    for y in range(4, 12):
        img.putpixel((4, y), rgba((205, 190, 150)))
    img.putpixel((12, 3), rgba((120, 200, 90)))
    img.putpixel((12, 4), rgba((120, 200, 90)))
    img.putpixel((12, 5), rgba((120, 200, 90)))
    img.putpixel((11, 5), rgba((120, 200, 90)))
    return img


def mega_texture(base, accent, kind, seed):
    img = canvas(base)
    noise(img, [(base[0], base[1], base[2]),
                (max(0, base[0] - 14), max(0, base[1] - 14), max(0, base[2] - 14)),
                (min(255, base[0] + 14), min(255, base[1] + 14), min(255, base[2] + 14))], seed)
    rnd = random.Random(seed + 3)
    if kind == 0:  # crystal
        for _ in range(5):
            cx, cy = rnd.randrange(2, 14), rnd.randrange(2, 14)
            for dx, dy in ((0, -1), (-1, 0), (0, 0), (1, 0), (0, 1)):
                x, y = cx + dx, cy + dy
                if 0 <= x < 16 and 0 <= y < 16:
                    img.putpixel((x, y), rgba(accent))
            img.putpixel((cx, cy), rgba((255, 255, 255)))
    elif kind == 1:  # circuit
        for y in (4, 8, 12):
            for x in range(2, 14):
                img.putpixel((x, y), rgba(accent))
        for x in (4, 8, 12):
            for y in range(2, 14):
                if y % 4:
                    img.putpixel((x, y), rgba(accent))
        for _ in range(10):
            img.putpixel((rnd.randrange(1, 15), rnd.randrange(1, 15)), rgba(accent))
    elif kind == 2:  # organic
        for _ in range(22):
            x, y = rnd.randrange(1, 15), rnd.randrange(1, 15)
            img.putpixel((x, y), rgba(accent))
            if rnd.random() < 0.5:
                img.putpixel((min(15, x + 1), y), rgba(accent))
    elif kind == 3:  # plates
        for i in range(2, 14):
            img.putpixel((i, 2), rgba(accent))
            img.putpixel((i, 13), rgba(accent))
            img.putpixel((2, i), rgba(accent))
            img.putpixel((13, i), rgba(accent))
        for x, y in ((5, 5), (10, 5), (5, 10), (10, 10)):
            img.putpixel((x, y), rgba(accent))
    else:  # void
        for y in range(16):
            for x in range(16):
                d = ((x - 7.5) ** 2 + (y - 7.5) ** 2) ** 0.5
                if 2 < d < 5 and (x + y) % 3 == 0:
                    img.putpixel((x, y), rgba(accent))
        img.putpixel((7, 7), rgba((255, 255, 255)))
        img.putpixel((8, 8), rgba(accent))
    bevel(img, tuple(min(255, c + 40) for c in base), tuple(max(0, c - 45) for c in base))
    return img


def main():
    save(oak_log(), "oak_log.png")
    save(oak_planks(), "oak_planks.png")
    save(cobblestone(), "cobblestone.png")
    save(iron_block(), "iron_block.png")
    save(diamond_block(), "diamond_block.png")
    save(netherrack(), "netherrack.png")
    save(end_stone(), "end_stone.png")
    save(ancient_debris(), "ancient_debris.png")
    save(grass_block(), "grass_block.png")
    save(stone_tile(), "stone_tile.png", scale=2)
    save(golden_apple(), "golden_apple.png")
    save(pickaxe((150, 110, 62)), "pickaxe_wood.png")
    save(pickaxe((130, 130, 130)), "pickaxe_stone.png")
    save(pickaxe((220, 220, 220)), "pickaxe_iron.png")
    save(pickaxe((80, 220, 210)), "pickaxe_diamond.png")
    save(crafting_table(), "crafting_table.png")
    save(furnace(), "furnace.png")
    save(ender_eye(), "ender_eye.png")
    save(dragon_egg(), "dragon_egg.png")
    save(beacon(), "beacon.png")
    save(twilight_moss(), "twilight_moss.png")
    save(manasteel(), "manasteel.png")
    save(eu_cell(), "eu_cell.png")
    save(void_metal(), "void_metal.png")
    save(certus_quartz(), "certus_quartz.png")
    save(chaos_shard(), "chaos_shard.png")
    save(moon_dust(), "moon_dust.png")
    save(plasma_cell(), "plasma_cell.png")
    save(emc_crystal(), "emc_crystal.png")
    save(creative_core(), "creative_core.png")
    save(quest_book(), "quest_book.png")
    mega_palettes = [
        ((95, 158, 201), (170, 220, 255)), ((107, 125, 74), (160, 200, 110)),
        ((75, 45, 107), (160, 95, 210)), ((140, 154, 158), (215, 230, 235)),
        ((79, 155, 217), (150, 220, 255)), ((217, 180, 74), (255, 235, 140)),
        ((217, 79, 61), (255, 160, 110)), ((63, 143, 122), (140, 235, 205)),
        ((192, 79, 217), (245, 160, 255)), ((127, 191, 63), (200, 245, 130)),
        ((191, 165, 63), (255, 235, 150)), ((127, 217, 79), (200, 255, 140)),
        ((163, 36, 36), (240, 100, 100)), ((107, 79, 163), (190, 150, 245)),
        ((79, 163, 217), (150, 220, 255)), ((217, 217, 79), (255, 255, 170)),
        ((79, 217, 191), (160, 255, 235)), ((191, 143, 79), (255, 210, 150)),
        ((154, 154, 154), (220, 220, 220)), ((217, 79, 154), (255, 150, 210)),
    ]
    for i, (base, accent) in enumerate(mega_palettes, start=1):
        save(mega_texture(base, accent, (i - 1) % 5, 400 + i), f"mega_{i:02d}.png")
    save(grass_block(), "favicon.png", scale=2)
    print("Generated textures in", OUT)


if __name__ == "__main__":
    main()
