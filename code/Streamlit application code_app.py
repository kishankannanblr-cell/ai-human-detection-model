import os
import io
import math
import shutil
import base64
import requests
from PIL import Image, ImageDraw, ImageFont
import streamlit as st

# Configure Streamlit page layout and dark theme defaults
st.set_page_config(
    page_title="EmberX Tactical Fireground Triage Dashboard",
    page_icon="🔥",
    layout="wide",
    initial_sidebar_state="expanded"
)

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

# Ensure directories exist
os.makedirs(SAMPLES_DIR, exist_ok=True)
os.makedirs(ANNOTATED_DIR, exist_ok=True)

# Colors for bounding boxes
CLASS_COLORS = {
    "fire": "#ef4444",   # Vivid Red
    "human": "#3b82f6",  # Electric Blue
    "smoke": "#9ca3af"   # Cool Gray
}

# CSS Injection for Premium Dark Triage Dashboard
st.markdown("""
<style>
    /* Dark Theme Core Adjustments */
    .stApp {
        background-color: #0f1115;
        color: #f3f4f6;
        font-family: 'Outfit', sans-serif;
    }
    
    /* Hide default streamlit header/footer for cleaner dashboard look */
    header, footer {
        visibility: hidden !important;
    }
    
    /* Custom Sidebar styling */
    section[data-testid="stSidebar"] {
        background-color: rgba(13, 17, 23, 0.95) !important;
        border-right: 1px solid rgba(255, 255, 255, 0.08) !important;
    }
    
    /* Styled Card Containers */
    .triage-card {
        background: rgba(22, 28, 38, 0.65);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        padding: 20px;
        margin-bottom: 20px;
        backdrop-filter: blur(10px);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .triage-card:hover {
        border-color: rgba(99, 102, 241, 0.3);
        transform: translateY(-2px);
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
    }
    
    /* Badge styling */
    .triage-badge {
        display: inline-block;
        padding: 4px 10px;
        border-radius: 50px;
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 10px;
    }
    
    .badge-p1 { background-color: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); box-shadow: 0 0 10px rgba(239, 68, 68, 0.2); }
    .badge-p2 { background-color: rgba(220, 38, 38, 0.15); color: #f87171; border: 1px solid rgba(220, 38, 38, 0.3); }
    .badge-p3 { background-color: rgba(249, 115, 22, 0.15); color: #f97316; border: 1px solid rgba(249, 115, 22, 0.3); box-shadow: 0 0 10px rgba(249, 115, 22, 0.2); }
    .badge-p4 { background-color: rgba(234, 88, 12, 0.15); color: #fb923c; border: 1px solid rgba(234, 88, 12, 0.3); }
    .badge-p5 { background-color: rgba(234, 179, 8, 0.15); color: #eab308; border: 1px solid rgba(234, 179, 8, 0.3); }
    .badge-p6 { background-color: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); }

    /* Dispatch Instruction block */
    .dispatch-box {
        background-color: rgba(255, 255, 255, 0.02);
        border-radius: 8px;
        padding: 12px;
        margin-top: 12px;
        font-size: 0.85rem;
        line-height: 1.4;
    }
    
    .dispatch-box-p1 { border-left: 4px solid #ef4444; }
    .dispatch-box-p2 { border-left: 4px solid #dc2626; }
    .dispatch-box-p3 { border-left: 4px solid #f97316; }
    .dispatch-box-p4 { border-left: 4px solid #ea580c; }
    .dispatch-box-p5 { border-left: 4px solid #eab308; }
    .dispatch-box-p6 { border-left: 4px solid #10b981; }

    /* Metric Tags */
    .metric-tag {
        display: inline-flex;
        align-items: center;
        background-color: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 6px;
        padding: 4px 10px;
        font-size: 0.8rem;
        margin-right: 8px;
        font-weight: 500;
    }
    
    /* Pulse indicator */
    .pulse-dot {
        width: 8px;
        height: 8px;
        background-color: #10b981;
        border-radius: 50%;
        display: inline-block;
        margin-right: 8px;
        box-shadow: 0 0 8px #10b981;
        animation: pulse-animation 1.5s infinite;
    }
    @keyframes pulse-animation {
        0% { transform: scale(0.9); opacity: 0.6; }
        50% { transform: scale(1.1); opacity: 1; box-shadow: 0 0 12px #10b981; }
        100% { transform: scale(0.9); opacity: 0.6; }
    }
    
    /* Guide styles */
    .guide-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 10px;
        border-radius: 8px;
        margin-bottom: 8px;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.04);
    }
</style>
""", unsafe_allow_html=True)

# Helper: Auto-copy sample images from test dataset if samples folder is empty
def initialize_samples():
    if not os.path.exists(DATASET_TEST_DIR):
        return
        
    existing_samples = os.listdir(SAMPLES_DIR)
    if len(existing_samples) < 5:
        test_images = [f for f in os.listdir(DATASET_TEST_DIR) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
        selected_files = test_images[:8]
        for f in selected_files:
            src = os.path.join(DATASET_TEST_DIR, f)
            dest = os.path.join(SAMPLES_DIR, f)
            shutil.copy2(src, dest)

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

def annotate_image(image_input, predictions):
    """Annotates an image object with bounding boxes and labels, returns PIL Image."""
    try:
        if isinstance(image_input, str):
            img = Image.open(image_input)
        else:
            img = Image.open(io.BytesIO(image_input))
            
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
            
        return img
    except Exception as e:
        st.error(f"Error annotating image: {e}")
        # Return a copy of the input image if drawing fails
        if isinstance(image_input, str):
            return Image.open(image_input)
        return Image.open(io.BytesIO(image_input))

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
            "color": "p1",
            "dispatch": "IMMEDIATE DISPATCH: Search & Rescue Team (SAR) (Priority Multi-Victim) + Fire Suppression Team."
        }
    elif human_count == 1 and fire_count >= 1:
        return {
            "tier": 2,
            "badge": "Critical (Single-Victim)",
            "color": "p2",
            "dispatch": "IMMEDIATE DISPATCH: Search & Rescue Team (SAR) + Fire Suppression Team."
        }
    elif human_count >= 2 and fire_count == 0:
        return {
            "tier": 3,
            "badge": "Lower Category A (Multi-Victim)",
            "color": "p3",
            "dispatch": "DISPATCH: Search & Rescue Team (SAR) (Multiple Victims, No Fire Visible)."
        }
    elif human_count == 1 and fire_count == 0:
        return {
            "tier": 4,
            "badge": "Lower Category A (Single-Victim)",
            "color": "p4",
            "dispatch": "DISPATCH: Search & Rescue Team (SAR) (Single Victim, No Fire Visible)."
        }
    elif fire_count >= 1 and human_count == 0:
        return {
            "tier": 5,
            "badge": "Lower Category B (Suppression Only)",
            "color": "p5",
            "dispatch": "DISPATCH: Fire Suppression Team (Hose Group - Active Fire, No Victims Spotted)."
        }
    else:
        return {
            "tier": 6,
            "badge": "Standard Monitoring",
            "color": "p6",
            "dispatch": "MONITOR: No immediate active fire or life threat spotted. Normal surveillance."
        }

# --- Sidebar Layout ---
with st.sidebar:
    # Beautiful Brand
    st.markdown("""
    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
        <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #ef4444, #f97316); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 0 15px rgba(239, 68, 68, 0.4);">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 22px; height: 22px;"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
        </div>
        <div>
            <h1 style="margin: 0; font-size: 1.3rem; font-weight: 700; background: linear-gradient(to right, #ffffff, #e2e8f0); -webkit-background-clip: text; -webkit-text-fill-color: transparent; line-height:1.2;">EmberX</h1>
            <span style="font-size: 0.75rem; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px;">Tactical Triage</span>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    # Status Indicators
    st.markdown("""
    <div style="background-color: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); padding: 12px; border-radius: 10px; margin-bottom: 20px;">
        <div style="font-size: 0.75rem; color: #9ca3af; margin-bottom: 8px; display: flex; align-items: center;">
            <span class="pulse-dot"></span>
            <span>Roboflow Hosted API Connected</span>
        </div>
        <div style="font-size: 0.8rem; color: white; font-weight: 600;">YOLO11s-t1</div>
        <div style="font-size: 0.7rem; color: #9ca3af;">Version 1 (OBB Enabled)</div>
    </div>
    """, unsafe_allow_html=True)

    # Sidebar Controls
    st.subheader("Dashboard Controls")
    if st.button("Reset All Selections", type="secondary", use_container_width=True):
        st.session_state.clear()
        st.rerun()

# --- Main Layout ---
# Header Portal
st.markdown("""
<div style="border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center;">
    <div>
        <h2 style="margin: 0; font-size: 1.75rem; font-weight: 700; color: white;">Command & Dispatch Portal</h2>
        <p style="margin: 4px 0 0 0; color: #9ca3af; font-size: 0.95rem;">Real-time machine learning fireground image analysis & dispatch triage mapping</p>
    </div>
    <div style="background-color: rgba(99, 102, 241, 0.15); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 50px; padding: 6px 14px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
        Localhost Run
    </div>
</div>
""", unsafe_allow_html=True)

# Grid Layout: Left Column (Input) | Right Column (Triage Protocol Guide)
col_input, col_guide = st.columns([7, 5])

# Initialize session state for selected samples
if "selected_samples" not in st.session_state:
    st.session_state.selected_samples = []

with col_input:
    st.markdown("### 1. Capture Scene Input")
    st.markdown("<p style='color:#9ca3af; font-size: 0.9rem; margin-top:-10px;'>Upload fire ground pictures or select test samples (Minimum 3 images required)</p>", unsafe_allow_html=True)
    
    # Image Uploader
    uploaded_files = st.file_uploader(
        "Drag & Drop Scene Images",
        type=["png", "jpg", "jpeg"],
        accept_multiple_files=True,
        label_visibility="collapsed"
    )
    
    # Sample Test Images
    st.markdown("---")
    st.markdown("#### Select From Test Dataset")
    st.markdown("<p style='color:#9ca3af; font-size: 0.85rem; margin-top:-15px;'>Quickly test the model using historical dataset files</p>", unsafe_allow_html=True)
    
    if os.path.exists(SAMPLES_DIR):
        sample_files = sorted([f for f in os.listdir(SAMPLES_DIR) if f.lower().endswith(('.png', '.jpg', '.jpeg'))])
        if sample_files:
            # Let's create a beautiful interactive gallery grid for samples
            # We can show 4 samples per row
            cols_per_row = 4
            for i in range(0, len(sample_files), cols_per_row):
                chunk = sample_files[i:i+cols_per_row]
                cols = st.columns(cols_per_row)
                for col, sample in zip(cols, chunk):
                    img_path = os.path.join(SAMPLES_DIR, sample)
                    col.image(img_path, use_container_width=True)
                    
                    is_selected = sample in st.session_state.selected_samples
                    # Use a unique checkbox for each sample to select it
                    if col.checkbox(f"Select {sample}", value=is_selected, key=f"chk_{sample}", label_visibility="collapsed"):
                        if sample not in st.session_state.selected_samples:
                            st.session_state.selected_samples.append(sample)
                    else:
                        if sample in st.session_state.selected_samples:
                            st.session_state.selected_samples.remove(sample)
        else:
            st.info("No test samples found in the static/samples folder.")
    else:
        st.info("Sample directory not found.")

with col_guide:
    st.markdown("### Triage Protocols")
    st.markdown("<p style='color:#9ca3af; font-size: 0.9rem; margin-top:-10px;'>Visual verification rules and dispatch routing priorities</p>", unsafe_allow_html=True)
    
    st.markdown("""
    <div class="guide-item" style="border-left: 4px solid #ef4444;">
        <span class="triage-badge badge-p1">Priority 1</span>
        <div style="font-size:0.85rem;">
            <strong>Critical (Multi-Victim)</strong><br>
            <span style="color:#9ca3af;">Life Threat (2+ victims) + Fire. Requires SAR & suppression teams.</span>
        </div>
    </div>
    <div class="guide-item" style="border-left: 4px solid #dc2626;">
        <span class="triage-badge badge-p2">Priority 2</span>
        <div style="font-size:0.85rem;">
            <strong>Critical (Single-Victim)</strong><br>
            <span style="color:#9ca3af;">Life Threat (1 victim) + Fire. Immediate rescue & suppression.</span>
        </div>
    </div>
    <div class="guide-item" style="border-left: 4px solid #f97316;">
        <span class="triage-badge badge-p3">Priority 3</span>
        <div style="font-size:0.85rem;">
            <strong>Lower A (Multi-Victim)</strong><br>
            <span style="color:#9ca3af;">Trapped Victims (2+), No Visible Fire. Search & rescue team.</span>
        </div>
    </div>
    <div class="guide-item" style="border-left: 4px solid #ea580c;">
        <span class="triage-badge badge-p4">Priority 4</span>
        <div style="font-size:0.85rem;">
            <strong>Lower A (Single-Victim)</strong><br>
            <span style="color:#9ca3af;">Trapped Victim (1), No Visible Fire. Search & rescue priority.</span>
        </div>
    </div>
    <div class="guide-item" style="border-left: 4px solid #eab308;">
        <span class="triage-badge badge-p5">Priority 5</span>
        <div style="font-size:0.85rem;">
            <strong>Lower B (Active Fire)</strong><br>
            <span style="color:#9ca3af;">Active Fire, No Victims Spotted. Suppression priority.</span>
        </div>
    </div>
    <div class="guide-item" style="border-left: 4px solid #10b981;">
        <span class="triage-badge badge-p6">Priority 6</span>
        <div style="font-size:0.85rem;">
            <strong>Normal Monitoring</strong><br>
            <span style="color:#9ca3af;">No active fire or victims detected. Standard visual monitoring.</span>
        </div>
    </div>
    """, unsafe_allow_html=True)

# Action button and list
total_selected = len(uploaded_files) + len(st.session_state.selected_samples)

st.markdown("---")

col_status, col_btn = st.columns([8, 4])

with col_status:
    st.markdown(f"#### Selected Scenes to Process: `{total_selected}`")
    if total_selected < 3:
        st.warning("Please provide 3 or more images for triage analysis (either upload files or select test samples).")

with col_btn:
    analyze_triggered = st.button(
        f"Analyze & Rank {total_selected} Scenes" if total_selected >= 3 else "Analyze & Rank Scenes",
        disabled=total_selected < 3,
        type="primary",
        use_container_width=True
    )

# --- Analysis & Ranking Execution ---
if analyze_triggered:
    st.markdown("### 2. Ranked Fireground Incidents")
    
    results = []
    
    # Progress loader setup
    progress_bar = st.progress(0)
    status_text = st.empty()
    
    # Create the files list to process
    files_to_process = []
    
    # Add uploaded files
    for file in uploaded_files:
        files_to_process.append({
            "name": file.name,
            "data": file.getvalue(),
            "is_sample": False
        })
        
    # Add sample files
    for sample in st.session_state.selected_samples:
        sample_path = os.path.join(SAMPLES_DIR, sample)
        if os.path.exists(sample_path):
            with open(sample_path, "rb") as sf:
                files_to_process.append({
                    "name": sample,
                    "data": sf.read(),
                    "is_sample": True
                })
                
    num_files = len(files_to_process)
    
    for index, item in enumerate(files_to_process):
        img_name = item["name"]
        img_data = item["data"]
        
        status_text.text(f"Querying Roboflow Model for image {index+1}/{num_files}: {img_name}...")
        progress_bar.progress(int((index / num_files) * 100))
        
        try:
            # Base64 encode the image
            img_b64 = base64.b64encode(img_data).decode("utf-8")
            
            response = requests.post(
                f"{ROBOFLOW_API_URL}?api_key={ROBOFLOW_API_KEY}",
                data=img_b64,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            if response.status_code != 200:
                predictions = []
                st.error(f"Roboflow API error for {img_name}: {response.text}")
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
            
            # Annotate image
            annotated_img = annotate_image(img_data, filtered_preds)
            p_details = calculate_priority(human_count, fire_count)
            
            # Save annotated image locally to static folder
            out_filename = f"annotated_streamlit_{img_name}"
            annotated_path = os.path.join(ANNOTATED_DIR, out_filename)
            annotated_img.save(annotated_path, "JPEG", quality=90)
            
            results.append({
                "original_name": img_name,
                "annotated_image": annotated_img,
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
            st.error(f"Failed to process {img_name}: {e}")
            # Append fallback result on failure
            try:
                fallback_img = Image.open(io.BytesIO(img_data))
            except:
                fallback_img = None
                
            results.append({
                "original_name": img_name,
                "annotated_image": fallback_img,
                "annotated_url": "",
                "counts": {"fire": 0, "human": 0, "smoke": 0},
                "priority_tier": 6,
                "priority_badge": "Error Processing",
                "color_class": "p6",
                "dispatch_info": f"Error running inference: {str(e)}. Monitoring recommended."
            })
            
    progress_bar.progress(100)
    status_text.text("Analysis complete!")
    
    # Sort results by priority tier (lowest tier number = highest priority)
    results.sort(key=lambda x: x["priority_tier"])
    
    # Clean progress indicators
    progress_bar.empty()
    status_text.empty()
    
    # Render incident cards in a grid layout (3 per row)
    grid_cols = 3
    for i in range(0, len(results), grid_cols):
        chunk = results[i:i+grid_cols]
        cols = st.columns(grid_cols)
        
        for col, item in enumerate(chunk):
            with cols[col]:
                badge_class = f"badge-{item['color_class']}"
                dispatch_class = f"dispatch-box-{item['color_class']}"
                
                # Render incident details wrapper
                st.markdown(f"""
                <div class="triage-card">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                        <span style="font-weight:700; font-size:0.9rem; color:#818cf8;">Incident Rank #{i + col + 1}</span>
                        <span class="triage-badge {badge_class}">{item['priority_badge']}</span>
                    </div>
                </div>
                """, unsafe_allow_html=True)
                
                # Image
                if item["annotated_image"]:
                    st.image(item["annotated_image"], use_container_width=True)
                else:
                    st.error("Image loading failed")
                    
                # Details
                st.markdown(f"""
                <div class="triage-card" style="border-top:0; border-top-left-radius:0; border-top-right-radius:0; margin-top:-22px;">
                    <div style="font-weight:600; font-size:0.95rem; margin-bottom:8px; word-break:break-all;">{item['original_name']}</div>
                    <div style="margin-bottom:12px;">
                        <span class="metric-tag">🔥 {item['counts']['fire']} Fire</span>
                        <span class="metric-tag">👤 {item['counts']['human']} Humans</span>
                        <span class="metric-tag">💨 {item['counts']['smoke']} Smoke</span>
                    </div>
                    <div class="dispatch-box {dispatch_class}">
                        <strong>Dispatch Instructions:</strong><br>
                        {item['dispatch_info']}
                    </div>
                </div>
                """, unsafe_allow_html=True)
