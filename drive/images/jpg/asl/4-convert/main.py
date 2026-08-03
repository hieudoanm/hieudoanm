import numpy as np
from skl2onnx import to_onnx
import joblib
import os

print("🚀 Starting PKL → ONNX conversion...")
print("==================================================")

# =========================================================
# 📦 Load PKL model
# =========================================================
model_path = "../2-train/models/sign_model.pkl"

print(f"📦 Loading PKL model from {model_path} ...")

model = joblib.load(model_path)

print("✅ Model loaded successfully!")
print("--------------------------------------------------")

# =========================================================
# 🔍 Model signature / metadata
# =========================================================
print("🔍 Inspecting model signature...")

print(f"🧠 Model type: {type(model)}")

# Feature count
if hasattr(model, "n_features_in_"):
    print(f"📏 Input features: {model.n_features_in_}")
else:
    print("⚠️ Could not detect feature count automatically")

# Classes / sign labels
if hasattr(model, "classes_"):
    print(f"✋ Total signs: {len(model.classes_)}")
    print(f"🔤 Sign labels: {model.classes_}")
else:
    print("⚠️ No class labels found")

# Parameters
if hasattr(model, "get_params"):
    params = model.get_params()
    print(f"⚙️ Key params preview: {list(params.keys())[:5]}")

print("--------------------------------------------------")

# =========================================================
# 🧪 Prepare sample input
# =========================================================
print("🧪 Preparing sample input tensor...")

# Default to MediaPipe hand landmarks
feature_count = getattr(model, "n_features_in_", 63)

X_sample = np.zeros((1, feature_count), dtype=np.float32)

print(f"📏 Sample shape: {X_sample.shape}")
print(f"🔢 Data type: {X_sample.dtype}")
print("✅ Sample tensor ready!")

print("--------------------------------------------------")

# =========================================================
# 🔄 Convert to ONNX
# =========================================================
print("🔄 Converting model to ONNX format...")

onnx_model = to_onnx(model, X_sample, target_opset=12)

print("✅ Conversion complete!")

print("--------------------------------------------------")

# =========================================================
# 💾 Save ONNX model
# =========================================================
output_path = "../../../app/public/models/sign_model.onnx"

print("💾 Saving ONNX model to:")
print(f"📂 {output_path}")

with open(output_path, "wb") as f:
    f.write(onnx_model.SerializeToString())

print("🎉 Model saved successfully!")

# =========================================================
# 📏 File size info
# =========================================================

file_size_bytes = os.path.getsize(output_path)
file_size_kb = file_size_bytes / 1024
file_size_mb = file_size_kb / 1024

print("📏 Model size:")
print(f"   🧱 Bytes : {file_size_bytes:,}")
print(f"   📦 KB    : {file_size_kb:,.2f} KB")
print(f"   🚚 MB    : {file_size_mb:,.2f} MB")


print("==================================================")
print("🏁 PKL → ONNX conversion finished.")
print("🌐 Ready for browser inference!")
