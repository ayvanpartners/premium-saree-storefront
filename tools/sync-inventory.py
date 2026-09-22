import csv
import json
from pathlib import Path
import shutil

from PIL import Image, ImageOps


REPO = Path(r"C:\dev\SareeShop")
INVENTORY_ROOT = REPO / "src" / "assets" / "images"
CATALOG_ROOT = REPO / "src" / "assets" / "catalog"
MODULE_PATH = REPO / "src" / "data" / "inventory-records.mjs"
TOOL_PATH = REPO / "tools" / "sync-inventory.py"
SOURCE_TOOL = Path(__file__).resolve()

COLOR_HEX = {
    "red": "#9E2A2B",
    "orange": "#C2612F",
    "gold": "#C89A3C",
    "green": "#3E6B4F",
    "teal": "#287C78",
    "blue": "#2F4E7A",
    "purple": "#5C4173",
    "magenta": "#A82D72",
    "black": "#2B2725",
    "gray": "#777777",
    "cream": "#E7D8BA",
}
COLOR_FAMILY = {
    "red": "red",
    "orange": "orange",
    "gold": "yellow",
    "green": "green",
    "teal": "blue",
    "blue": "blue",
    "purple": "purple",
    "magenta": "pink",
    "black": "black",
    "gray": "neutral",
    "cream": "white",
}


def title_words(value):
    return " ".join(word.capitalize() for word in value.replace("-", " ").split())


with (INVENTORY_ROOT / "saree-inventory.csv").open(newline="", encoding="utf-8-sig") as handle:
    rows = list(csv.DictReader(handle))

records = []
converted = 0
for row_number, row in enumerate(rows, 1):
    folder = INVENTORY_ROOT / row["Price"] / row["Folder"]
    source_images = sorted(folder.glob("*.jpg"))
    if len(source_images) != int(row["ImageCount"]):
        raise RuntimeError(f"Image count mismatch for {folder}")

    web_images = []
    for source in source_images:
        relative = Path(row["Price"]) / row["Folder"] / f"{source.stem}.webp"
        target = CATALOG_ROOT / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        regenerate = not target.exists() or target.stat().st_mtime < source.stat().st_mtime
        if not regenerate:
            try:
                with Image.open(target) as existing:
                    existing.verify()
            except Exception:
                regenerate = True
        if regenerate:
            with Image.open(source) as image:
                image = ImageOps.exif_transpose(image).convert("RGB")
                image.thumbnail((900, 1200), Image.Resampling.LANCZOS)
                # Method 1 keeps the full visual size/quality while making a
                # large catalogue refresh practical on an ordinary laptop.
                image.save(target, "WEBP", quality=78, method=1)
            converted += 1
        with Image.open(target) as web_image:
            width, height = web_image.size
        web_images.append(
            {
                "src": "/assets/catalog/" + relative.as_posix(),
                "width": width,
                "height": height,
                "label": f"Product view {len(web_images) + 1}",
            }
        )

    colors = [part.strip() for part in row["Colors"].split("|") if part.strip()]
    primary = colors[0] if colors else "multi"
    pattern = row["Pattern"]
    border = row["Border"]
    characteristic = " ".join(part for part in (title_words(" and ".join(colors)), title_words(pattern)) if part)
    records.append(
        {
            "id": row["SKU"].lower(),
            "sku": row["SKU"],
            "name": f"{characteristic} Saree — {row['SKU']}",
            "price": int(row["Price"]),
            "colors": colors,
            "colourName": " and ".join(title_words(color) for color in colors),
            "colourFamily": COLOR_FAMILY.get(primary, "multi"),
            "colourHex": COLOR_HEX.get(primary, "#8A6F5A"),
            "pattern": pattern,
            "border": border,
            "description": row["WebDescription"],
            "images": web_images,
            "isNew": row_number <= 24,
            "sourceFiles": row["OriginalFiles"].split(" | "),
        }
    )

MODULE_PATH.write_text(
    "/* Generated from src/assets/images/saree-inventory.csv. */\n"
    "export const inventoryRecords = "
    + json.dumps(records, ensure_ascii=False, indent=2)
    + ";\n",
    encoding="utf-8",
)

TOOL_PATH.parent.mkdir(parents=True, exist_ok=True)
if SOURCE_TOOL.resolve() != TOOL_PATH.resolve():
    shutil.copy2(SOURCE_TOOL, TOOL_PATH)

size_mb = sum(path.stat().st_size for path in CATALOG_ROOT.rglob("*.webp")) / 1024 / 1024
print(f"Inventory records: {len(records)}")
print(f"Web images: {sum(len(record['images']) for record in records)}")
print(f"Converted this run: {converted}")
print(f"Optimized image size: {size_mb:.1f} MB")
print(f"Module: {MODULE_PATH}")
