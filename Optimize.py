import os
import json
from PIL import Image

RAW_DIR = "Images Raw"
OUTPUT_DIR = "Images"
DATABASE_PATH = "Database_PreShuffle.json"

ASPECT_SIZE_MAP = {
    "1:1": (512, 512),
    "1:2": (512, 1024),
    "2:1": (1024, 512),
    "2:2": (1024, 1024),
}


def get_image_sizes_from_db():
    """Reads the DB and maps filenames to their target sizes."""
    size_map = {}
    if not os.path.exists(DATABASE_PATH):
        print(
            f"Warning: {DATABASE_PATH} not found. Images will be optimized without resizing."
        )
        return size_map

    with open(DATABASE_PATH, "r", encoding="utf-8") as f:
        database = json.load(f)

    for entry in database:
        images = []
        if entry.get("primaryImage"):
            images.append(entry.get("primaryImage"))
        images.extend(entry.get("secondaryImages", []))

        for img_info in images:
            src = img_info.get("src")
            aspect = img_info.get("aspectRatio")
            if src and aspect in ASPECT_SIZE_MAP:
                filename = os.path.basename(src)
                size_map[filename] = ASPECT_SIZE_MAP[aspect]

    return size_map


def optimize_and_resize_image(src_path, dest_path, target_size=None):
    try:
        with Image.open(src_path) as img:
            img = img.convert("RGBA")

            if target_size:
                src_w, src_h = img.size
                target_w, target_h = target_size

                src_ratio = src_w / src_h
                target_ratio = target_w / target_h

                if src_ratio > target_ratio:
                    new_h = target_h
                    new_w = int(new_h * src_ratio)
                else:
                    new_w = target_w
                    new_h = int(new_w / src_ratio)

                resample_filter = getattr(Image, "Resampling", Image).LANCZOS
                img = img.resize((new_w, new_h), resample_filter)

                background = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
                offset = ((target_w - new_w) // 2, (target_h - new_h) // 2)
                background.paste(img, offset, img)
                final_img = background.convert("RGB")
            else:
                final_img = img.convert("RGB")

            ext = os.path.splitext(dest_path)[1].lower()
            if ext in [".jpg", ".jpeg"]:
                final_img.save(dest_path, "JPEG", optimize=True, quality=85)
            elif ext == ".png":
                final_img.save(dest_path, "PNG", optimize=True)
            elif ext == ".webp":
                final_img.save(dest_path, "WEBP", optimize=True, quality=85)
            else:
                final_img.save(dest_path)

            print(f"Processed: {src_path} -> {dest_path}")

    except Exception as e:
        print(f"Failed to process {src_path}: {e}")


def main():
    size_map = get_image_sizes_from_db()

    for root, _, files in os.walk(RAW_DIR):
        rel_path = os.path.relpath(root, RAW_DIR)

        if rel_path == ".":
            dest_dir = OUTPUT_DIR
        else:
            dest_dir = os.path.join(OUTPUT_DIR, rel_path)

        os.makedirs(dest_dir, exist_ok=True)

        for file in files:
            if not file.lower().endswith(
                (".png", ".jpg", ".jpeg", ".webp", ".bmp", ".gif")
            ):
                continue

            src_path = os.path.join(root, file)
            dest_path = os.path.join(dest_dir, file)

            target_size = size_map.get(file)

            optimize_and_resize_image(src_path, dest_path, target_size)


if __name__ == "__main__":
    main()
