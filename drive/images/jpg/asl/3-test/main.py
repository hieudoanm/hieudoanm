import cv2
import mediapipe as mp
import joblib
import numpy as np
import time

# =========================================================
# 🚀 START
# =========================================================

print("🚀 Starting Sign Language Realtime Inference...\n")

# =========================================================
# 📦 LOAD MODEL
# =========================================================

MODEL_PATH = "../2-train/models/sign_model.pkl"

print(f"📦 Loading model from: {MODEL_PATH}")

try:
    model = joblib.load(MODEL_PATH)
    print("✅ Model loaded successfully\n")
except Exception as e:
    print("❌ Failed to load model:", e)
    exit()

# =========================================================
# 🧠 INIT MEDIAPIPE
# =========================================================

print("🧠 Initializing MediaPipe Hands...")

mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=1,
    min_detection_confidence=0.7,
    min_tracking_confidence=0.7,
)

print("✅ MediaPipe ready\n")

# =========================================================
# 🎥 INIT CAMERA
# =========================================================

print("🎥 Opening webcam...")

cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("❌ Failed to access webcam")
    exit()

print("✅ Webcam started")
print("🛑 Press ESC to exit\n")

frame_count = 0
last_pred_time = 0

# =========================================================
# 🔁 MAIN LOOP
# =========================================================

while True:
    ret, frame = cap.read()

    if not ret:
        print("⚠️ Failed to read frame")
        break

    frame_count += 1

    img_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = hands.process(img_rgb)

    # =====================================================
    # ✋ HAND DETECTION
    # =====================================================

    if results.multi_hand_landmarks:
        hand = results.multi_hand_landmarks[0]

        landmarks = []
        for lm in hand.landmark:
            landmarks.extend([lm.x, lm.y, lm.z])

        # =================================================
        # 🔮 PREDICTION
        # =================================================

        pred = model.predict([landmarks])[0]

        now = time.time()

        # Log prediction every 1s (avoid spam)
        if now - last_pred_time > 1:
            print(f"🔮 Prediction: {pred}")
            last_pred_time = now

        # Overlay text
        cv2.putText(
            frame,
            f"Sign: {pred}",
            (50, 50),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (0, 255, 0),
            2,
        )

    else:
        # Log occasionally when no hand
        if frame_count % 60 == 0:
            print("🖐️ No hand detected")

    # =====================================================
    # 🖥️ DISPLAY
    # =====================================================

    cv2.imshow("🧏 Sign Language Detection", frame)

    # ESC to exit
    if cv2.waitKey(1) & 0xFF == 27:
        print("\n🛑 Exit requested")
        break

# =========================================================
# 🧹 CLEANUP
# =========================================================

print("\n🧹 Releasing resources...")

cap.release()
cv2.destroyAllWindows()

print("✅ Camera released")
print("🏁 Program finished")
