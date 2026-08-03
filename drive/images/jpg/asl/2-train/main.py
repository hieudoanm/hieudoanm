import pandas as pd
import time
import joblib

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

# =========================================================
# 🚀 START
# =========================================================

print("🚀 Starting Sign Language Model Training...\n")
start_time = time.time()

# =========================================================
# 📂 LOAD DATASET
# =========================================================

print("📂 Loading dataset...")

df = pd.read_csv("csv/landmarks.csv")

print(f"✅ Dataset loaded")
print(f"📊 Shape: {df.shape[0]} rows × {df.shape[1]} columns")

# =========================================================
# 🏷️ SPLIT FEATURES / LABELS
# =========================================================

print("\n🏷️ Preparing features & labels...")

X = df.iloc[:, :-1]
y = df.iloc[:, -1]

print(f"🔢 Features shape: {X.shape}")
print(f"🧾 Labels count: {y.nunique()} classes")

print("\n📚 Label distribution:")
print(y.value_counts())

# =========================================================
# ✂️ TRAIN / TEST SPLIT
# =========================================================

print("\n✂️ Splitting train/test sets...")

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y,
)

print(f"🟢 Train samples: {len(X_train)}")
print(f"🔵 Test samples:  {len(X_test)}")

# =========================================================
# 🌲 TRAIN MODEL
# =========================================================

print("\n🌲 Training RandomForest model...")

model = RandomForestClassifier(
    n_estimators=200,
    n_jobs=-1,
    random_state=42,
    verbose=1,
)

train_start = time.time()
model.fit(X_train, y_train)
train_end = time.time()

print(f"✅ Training complete in {train_end - train_start:.2f}s")

# =========================================================
# 🔮 PREDICTION
# =========================================================

print("\n🔮 Running predictions...")

preds = model.predict(X_test)

# =========================================================
# 📊 EVALUATION
# =========================================================

acc = accuracy_score(y_test, preds)

print("\n📊 MODEL PERFORMANCE")
print("================================")
print(f"🎯 Accuracy: {acc * 100:.2f}%")
print("================================")

print("\n🧾 Classification Report:")
print(classification_report(y_test, preds))

# =========================================================
# 💾 SAVE MODEL
# =========================================================

output_path = "models/sign_model.pkl"

print("\n💾 Saving model...")
joblib.dump(model, output_path)

print(f"✅ Model saved → {output_path}")

# =========================================================
# ⏱️ TOTAL TIME
# =========================================================

end_time = time.time()

print("\n🏁 Training pipeline finished!")
print(f"⏱️ Total time: {end_time - start_time:.2f}s")
