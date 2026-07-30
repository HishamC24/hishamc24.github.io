import json
import random

def get_aspect_ratio(item):
    try:
        return item["primaryImage"]["aspectRatio"]
    except Exception:
        return None


def group_by_aspect_ratio(items):
    aspect_dict = {}
    for item in items:
        aspect = get_aspect_ratio(item)
        if aspect not in aspect_dict:
            aspect_dict[aspect] = []
        aspect_dict[aspect].append(item)
    return aspect_dict


def shuffle_no_repeats(items):
    """
    Shuffle items so that no two consecutive items have the same aspect ratio.
    Return a new list if possible, else return [].
    """
    aspect_dict = group_by_aspect_ratio(items)
    aspect_keys = list(aspect_dict.keys())
    # To allow random picks, shuffle each aspect list
    for v in aspect_dict.values():
        random.shuffle(v)

    result = []
    prev_aspect = None

    from collections import Counter

    aspect_counts = {k: len(v) for k, v in aspect_dict.items()}
    total_items = len(items)

    for _ in range(total_items):
        available_aspects = [
            aspect
            for aspect in aspect_keys
            if aspect_counts[aspect] > 0 and aspect != prev_aspect
        ]
        if not available_aspects:
            # fail out
            return []
        aspect_choice = random.choice(available_aspects)
        item = aspect_dict[aspect_choice].pop()
        result.append(item)
        aspect_counts[aspect_choice] -= 1
        prev_aspect = aspect_choice

    return result


input_filename = "Database_PreShuffle.json"
output_filename = "Database.json"

with open(input_filename, "r", encoding="utf-8") as f:
    items = json.load(f)

if len(items) < 2:
    shuffled_items = items

for _ in range(2048):
    items_copy = items[:]
    random.shuffle(items_copy)
    shuffled = shuffle_no_repeats(items_copy)
    if shuffled:
        shuffled_items = shuffled

aspect_dict = group_by_aspect_ratio(items)
aspect_keys = list(aspect_dict.keys())
for v in aspect_dict.values():
    random.shuffle(v)

from collections import Counter

aspect_counts = {k: len(v) for k, v in aspect_dict.items()}
total_items = len(items)

result = []
prev_aspect = None

for _ in range(total_items):
    available_aspects = [
        aspect
        for aspect in aspect_keys
        if aspect_counts[aspect] > 0 and aspect != prev_aspect
    ]
    if not available_aspects:
        # must pick a repeat now; pick the aspect with the most left
        available_aspects = [
            aspect for aspect in aspect_keys if aspect_counts[aspect] > 0
        ]
    # Pick the aspect with largest remaining (helps interleave long runs)
    max_count = max([aspect_counts[a] for a in available_aspects])
    top_aspects = [a for a in available_aspects if aspect_counts[a] == max_count]
    aspect_choice = random.choice(top_aspects)
    item = aspect_dict[aspect_choice].pop()
    result.append(item)
    aspect_counts[aspect_choice] -= 1
    prev_aspect = aspect_choice

shuffled_items = result

with open(output_filename, "w", encoding="utf-8") as f:
    json.dump(shuffled_items, f, indent=2, ensure_ascii=False)


print(f"Database shuffled and written to {output_filename}")
