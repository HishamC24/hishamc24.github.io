import os
import json
from PIL import Image

# Path to database and image folders
DATABASE_PATH = "Database.json"
IMAGES_DIR = "Images/Portfolio"
RESIZED_DIR = os.path.join(IMAGES_DIR, "Resized")

# Ensure output directory exists
os.makedirs(RESIZED_DIR, exist_ok=True)

# Aspect ratio to size map
ASPECT_SIZE_MAP = {
    "1:1": (512, 512),
    "1:2": (512, 1024),
    "2:1": (1024, 512),
    "2:2": (1024, 1024),
}


def resize_image(src_path, dest_path, size):
    try:
        with Image.open(src_path) as img:
            # Resize with antialiasing, keep aspect by fitting and padding if needed
            img = img.convert("RGBA")
            src_w, src_h = img.size
            target_w, target_h = size

            # calculate how to fit and pad
            src_ratio = src_w / src_h
            target_ratio = target_w / target_h

            if src_ratio > target_ratio:
                # source is wider, so height matches, width padded.
                new_h = target_h
                new_w = int(new_h * src_ratio)
            else:
                # source is taller or same ratio, width matches, height padded.
                new_w = target_w
                new_h = int(new_w / src_ratio)

            img = img.resize((new_w, new_h), Image.LANCZOS)

            # Now paste to background
            background = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
            offset = ((target_w - new_w) // 2, (target_h - new_h) // 2)
            background.paste(img, offset, img)
            background = background.convert("RGB")  # drop alpha for saving as jpg/png

            background.save(dest_path)
    except Exception as e:
        print(f"Failed to resize {src_path} -> {dest_path}: {e}")


def process_entry_img(img_info):
    src = img_info.get("src")
    aspect = img_info.get("aspectRatio") if "aspectRatio" in img_info else None
    if src and src.startswith("/Portfolio/") and aspect in ASPECT_SIZE_MAP:
        img_fname = src.split("/")[-1]
        src_path = os.path.join(IMAGES_DIR, img_fname)
        if not os.path.exists(src_path):
            # Try with Images/Portfolio as absolute
            src_path = os.path.join(IMAGES_DIR, img_fname)
        dest_path = os.path.join(RESIZED_DIR, img_fname)
        resize_image(src_path, dest_path, ASPECT_SIZE_MAP[aspect])


def main():
    # Load Database
    with open(DATABASE_PATH, "r", encoding="utf-8") as f:
        database = json.load(f)

    for entry in database:
        # handle primaryImage
        primary = entry.get("primaryImage")
        if primary:
            process_entry_img(primary)

        # handle secondaryImages if present
        secondaries = entry.get("secondaryImages", [])
        for img in secondaries:
            process_entry_img(img)


if __name__ == "__main__":
    main()
