import cv2
import mediapipe as mp
import os
import numpy as np
import pandas as pd
from tqdm import tqdm
import math

print("🚀 Starting landmark extraction pipeline...")

mp_hands = mp.solutions.hands

DATASET_DIR = "dataset"
OUTPUT_CSV = "../2-train/csv/landmarks.csv"

hands = mp_hands.Hands(
    static_image_mode=True,
    max_num_hands=1,
    min_detection_confidence=0.5,
)

rows = []


def distance(a, b):
    return math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2)


labels = sorted(
    [l for l in os.listdir(DATASET_DIR) if os.path.isdir(os.path.join(DATASET_DIR, l))]
)

print(f"📂 Found {len(labels)} labels:", labels)

for label in labels:
    label_path = os.path.join(DATASET_DIR, label)
    files = os.listdir(label_path)

    print(f"\n🖐️ Processing '{label}' ({len(files)} images)")

    for file in tqdm(files, leave=False):
        img_path = os.path.join(label_path, file)
        img = cv2.imread(img_path)

        if img is None:
            continue

        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        results = hands.process(img_rgb)

        if not results.multi_hand_landmarks:
            continue

        hand = results.multi_hand_landmarks[0]

        # =============================
        # 🪞 Mirror X to match webcam
        # =============================
        mirrored = []
        for lm in hand.landmark:
            mirrored.append(type(lm)(x=1 - lm.x, y=lm.y, z=lm.z))

        wrist = mirrored[0]
        scale = distance(mirrored[0], mirrored[9])

        features = []

        # =============================
        # 📍 Normalized landmarks
        # =============================
        for lm in mirrored:
            features.extend(
                [
                    (lm.x - wrist.x) / scale,
                    (lm.y - wrist.y) / scale,
                    (lm.z - wrist.z) / scale,
                ]
            )

        # =============================
        # 🦴 Bone vectors
        # =============================
        for a, b in mp_hands.HAND_CONNECTIONS:
            lm_a = mirrored[a]
            lm_b = mirrored[b]

            features.extend(
                [
                    lm_b.x - lm_a.x,
                    lm_b.y - lm_a.y,
                    lm_b.z - lm_a.z,
                ]
            )

        features.append(label)
        rows.append(features)

df = pd.DataFrame(rows)
df.to_csv(OUTPUT_CSV, index=False)

print(f"\n🎉 Saved {len(df)} rows → {OUTPUT_CSV}")
