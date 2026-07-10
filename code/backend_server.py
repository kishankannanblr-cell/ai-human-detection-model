import os
import io
import math
import shutil
import base64
import requests
from flask import Flask, request, jsonify, render_template, send_from_directory
from PIL import Image, ImageDraw, ImageFont

app = Flask(__name__, static_folder='static', template_folder='templates')

# Configuration
ROBOFLOW_API_KEY = "hFh3t5QTkKXiH1UiErKE"
MODEL_ID = "fire-smoke-and-human-detector-cokiv/1"
ROBOFLOW_API_URL = f"https://detect.roboflow.com/{MODEL_ID}"

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, 'static')
SAMPLES_DIR = os.path.join(STATIC_DIR, 'samples')
ANNOTATED_DIR = os.path.join(STATIC_DIR, 'annotated')
DATASET_TEST_DIR = os.path.join(BASE_DIR, 'dataset', 'test', 'images')

# Colors for bounding boxes
CLASS_COLORS = {
    "fire": "#ef4444",   # Vivid Red
    "human": "#3b82f6",  # Electric Blue
    "smoke": "#9ca3af"   # Cool Gray
}

# Ensure directories exist
os.makedirs(SAMPLES_DIR, exist_ok=True)
os.makedirs(ANNOTATED_DIR, exist_ok=True)

# Auto-copy sample images from test dataset if samples folder is empty
def initialize_samples():
    if not os.path.exists(DATASET_TEST_DIR):
        print(f"Dataset test directory not found at {DATASET_TEST_DIR}. Skipping auto-copy.")
        return
        
    existing_samples = os.listdir(SAMPLES_DIR)
    if len(existing_samples) < 5:
        print("Initializing sample images from test dataset...")
        test_images = [f for f in os.listdir(DATASET_TEST_DIR) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
        # Choose a variety of files to showcase different scenarios
        # We want some containing humans, some containing fire, some containing smoke
        selected_files = []
        
        # Try to find specific patterns or just grab diverse files
        for img in test_images:
            if len(selected_files) >= 8:
                break
            # Look for distinctive names (like new_fire_*, middle_*, image_*, img-*)
            selected_files.append(img)
            
        for f in selected_files:
            src = os.path.join(DATASET_TEST_DIR, f)
            dest = os.path.join(SAMPLES_DIR, f)
            shutil.copy2(src, dest)
        print(f"Copied {len(selected_files)} sample files to {SAMPLES_DIR}")

initialize_samples()

def get_obb_corners(cx, cy, w, h, angle_deg):
    """Calculates coordinates of the 4 corner points of a rotated bounding box."""
    angle_rad = math.radians(angle_deg)
    cos_a = math.cos(angle_rad)
    sin_a = math.sin(angle_rad)
    
    hw = w / 2.0
    hh = h / 2.0
    
    # Unrotated corner offsets relative to center
    dxs = [-hw, hw, hw, -hw]
    dys = [-hh, -hh, hh, hh]
    
    corners = []
    for dx, dy in zip(dxs, dys):
        # Rotate offsets and add center coordinates
        rx = cx + dx * cos_a - dy * sin_a
        ry = cy + dx * sin_a + dy * cos_a
        corners.append((rx, ry))
    return corners

def annotate_image(img_path, predictions, output_path):
    """Annotates an image with bounding boxes (rotated or standard) and labels."""
    try:
        with Image.open(img_path) as img:
            # Convert to RGB if in indexed/grayscale mode
            if img.mode != 'RGB':
                img = img.convert('RGB')
                
            draw = ImageDraw.Draw(img)
            
            # Try to load a clean default font or fallback
            try:
                font = ImageFont.truetype("arial.ttf", 16)
            except IOError:
                font = ImageFont.load_default()

            for pred in predictions:
                cls_name = pred.get("class", "unknown").lower()
                conf = pred.get("confidence", 0.0)
                cx = pred.get("x", 0)
                cy = pred.get("y", 0)
                w = pred.get("width", 0)
                h = pred.get("height", 0)
                angle = pred.get("angle", 0.0) # Roboflow OBB rotation in degrees
                
                color_hex = CLASS_COLORS.get(cls_name, "#10b981")
                # Draw OBB (Oriented Bounding Box)
                corners = get_obb_corners(cx, cy, w, h, angle)
                
                # Draw thick boundary polygon
                draw.polygon(corners, outline=color_hex, width=4)
                
                # Draw label background box
                label_text = f"{cls_name} {int(conf * 100)}%"
                
                # Determine text size using textbbox if available (Pillow 10+), otherwise textsize
                try:
                    left, top, right, bottom = draw.textbbox((0, 0), label_text, font=font)
                    text_w = right - left
                    text_h = bottom - top
                except AttributeError:
                    text_w, text_h = draw.textsize(label_text, font=font)
                
                # Draw label near the top-left corner of the bounding box
                tx, ty = corners[0]
                draw.rectangle([tx, ty - text_h - 4, tx + text_w + 6, ty], fill=color_hex)
                draw.text((tx + 3, ty - text_h - 2), label_text, fill="white", font=font)
                
            img.save(output_path, "JPEG", quality=90)
            return True
    except Exception as e:
        print(f"Error annotating image {img_path}: {e}")
        return False

def calculate_priority(human_count, fire_count):
    """
    Ranks the scene priority based on counts of humans and fire:
    Priority 1: Critical (Multi-Victim) -> Life Threat + Fire, 2+ trapped victims
    Priority 2: Critical (Single-Victim) -> Life Threat + Fire, 1 trapped victim
    Priority 3: Lower Category A (Multi-Victim) -> Trapped Victims (2+), No Visible Fire
    Priority 4: Lower Category A (Single-Victim) -> Trapped Victim (1), No Visible Fire
    Priority 5: Lower Category B -> Active Fire, No Victims Spotted
    Priority 6: Lowest / Monitoring -> No immediate fire or victims
    """
    if human_count >= 2 and fire_count >= 1:
        return {
            "tier": 1,
            "badge": "Critical (Multi-Victim)",
            "color": "danger",
            "dispatch": "IMMEDIATE DISPATCH: Search & Rescue Team (SAR) (Priority Multi-Victim) + Fire Suppression Team."
        }
    elif human_count == 1 and fire_count >= 1:
        return {
            "tier": 2,
            "badge": "Critical (Single-Victim)",
            "color": "danger-single",
            "dispatch": "IMMEDIATE DISPATCH: Search & Rescue Team (SAR) + Fire Suppression Team."
        }
    elif human_count >= 2 and fire_count == 0:
        return {
            "tier": 3,
            "badge": "Lower Category A (Multi-Victim)",
            "color": "warning",
            "dispatch": "DISPATCH: Search & Rescue Team (SAR) (Multiple Victims, No Fire Visible)."
        }
    elif human_count == 1 and fire_count == 0:
        return {
            "tier": 4,
            "badge": "Lower Category A (Single-Victim)",
            "color": "warning-single",
            "dispatch": "DISPATCH: Search & Rescue Team (SAR) (Single Victim, No Fire Visible)."
        }
    elif fire_count >= 1 and human_count == 0:
        return {
            "tier": 5,
            "badge": "Lower Category B (Suppression Only)",
            "color": "info",
            "dispatch": "DISPATCH: Fire Suppression Team (Hose Group - Active Fire, No Victims Spotted)."
        }
    else:
        return {
            "tier": 6,
            "badge": "Standard Monitoring",
            "color": "success",
            "dispatch": "MONITOR: No immediate active fire or life threat spotted. Normal surveillance."
        }

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/samples')
def list_samples():
    """Returns list of available sample images for the quick test interface."""
    try:
        samples = [f for f in os.listdir(SAMPLES_DIR) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
        return jsonify({"samples": sorted(samples)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/analyze', methods=['POST'])
def analyze():
    """
    Accepts uploads (or sample filenames) and performs inference on each.
    Ranks them from highest to lowest priority and returns the annotated images and details.
    """
    files_to_process = []
    
    # Check if files were uploaded
    uploaded_files = request.files.getlist('images')
    if uploaded_files and uploaded_files[0].filename != '':
        for i, file in enumerate(uploaded_files):
            filename = f"upload_{i}_{file.filename}"
            temp_path = os.path.join(ANNOTATED_DIR, f"temp_{filename}")
            file.save(temp_path)
            files_to_process.append({
                "name": file.filename,
                "path": temp_path,
                "is_temp": True
            })
            
    # Check if sample image filenames were provided
    sample_names = request.form.getlist('samples')
    if sample_names:
        for name in sample_names:
            sample_path = os.path.join(SAMPLES_DIR, name)
            if os.path.exists(sample_path):
                temp_path = os.path.join(ANNOTATED_DIR, f"temp_sample_{name}")
                shutil.copy2(sample_path, temp_path)
                files_to_process.append({
                    "name": name,
                    "path": temp_path,
                    "is_temp": True
                })

    if len(files_to_process) < 3:
        for f in files_to_process:
            if f.get("is_temp") and os.path.exists(f["path"]):
                os.remove(f["path"])
        return jsonify({"error": "Please provide 3 or more images for triage analysis."}), 400

    results = []

    for item in files_to_process:
        img_path = item["path"]
        img_name = item["name"]
        
        try:
            with open(img_path, "rb") as image_file:
                img_data = image_file.read()
                img_b64 = base64.b64encode(img_data).decode("utf-8")
                
            response = requests.post(
                f"{ROBOFLOW_API_URL}?api_key={ROBOFLOW_API_KEY}",
                data=img_b64,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            if response.status_code != 200:
                print(f"Roboflow API error for {img_name}: {response.text}")
                predictions = []
            else:
                predictions = response.json().get("predictions", [])
                
            fire_count = 0
            human_count = 0
            smoke_count = 0
            
            filtered_preds = []
            for pred in predictions:
                if pred.get("confidence", 0.0) >= 0.40:
                    cls_name = pred.get("class", "").lower()
                    filtered_preds.append(pred)
                    if cls_name == "fire":
                        fire_count += 1
                    elif cls_name == "human":
                        human_count += 1
                    elif cls_name == "smoke":
                        smoke_count += 1

            out_filename = f"annotated_{os.path.basename(img_path).replace('temp_', '')}"
            annotated_path = os.path.join(ANNOTATED_DIR, out_filename)
            
            annotate_image(img_path, filtered_preds, annotated_path)
            p_details = calculate_priority(human_count, fire_count)
            
            results.append({
                "original_name": img_name,
                "annotated_url": f"/static/annotated/{out_filename}",
                "counts": {
                    "fire": fire_count,
                    "human": human_count,
                    "smoke": smoke_count
                },
                "priority_tier": p_details["tier"],
                "priority_badge": p_details["badge"],
                "color_class": p_details["color"],
                "dispatch_info": p_details["dispatch"]
            })
            
        except Exception as e:
            print(f"Failed to process {img_name}: {e}")
            results.append({
                "original_name": img_name,
                "annotated_url": "",
                "counts": {"fire": 0, "human": 0, "smoke": 0},
                "priority_tier": 6,
                "priority_badge": "Error Processing",
                "color_class": "success",
                "dispatch_info": f"Error running inference: {str(e)}. Monitoring recommended."
            })
        finally:
            if os.path.exists(img_path):
                os.remove(img_path)

    results.sort(key=lambda x: x["priority_tier"])
    return jsonify({"results": results})

if __name__ == '__main__':
    print("Starting Fireground Triage Dashboard Server...")
    app.run(host='0.0.0.0', port=5000, debug=True)
