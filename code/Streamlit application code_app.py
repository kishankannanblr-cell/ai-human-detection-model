import os
import io
import math
import shutil
import base64
from PIL import Image, ImageDraw, ImageFont
import streamlit as st
import yt_dlp
import cv2

# Configure Streamlit page layout and dark theme defaults
st.set_page_config(
    page_title="EmberX_v2 Tactical Fireground Triage Dashboard",
    page_icon="🔥",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Configuration Defaults
DEFAULT_MODEL_ID = "fire-smoke-and-human-detector-cokiv/1"

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
    "fire": "#f43f5e",   # Rose-500
    "human": "#6366f1",  # Indigo-500
    "smoke": "#06b6d4"   # Cyan-500
}

# CSS Injection for Premium Glassmorphic Triage Dashboard
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');

    /* Fluid Mesh Background for App */
    .stApp {
        background: radial-gradient(at 0% 0%, rgba(224, 242, 254, 0.65) 0, transparent 50%),
                    radial-gradient(at 50% 0%, rgba(233, 213, 255, 0.65) 0, transparent 50%),
                    radial-gradient(at 100% 0%, rgba(250, 232, 255, 0.65) 0, transparent 50%),
                    radial-gradient(at 50% 100%, rgba(224, 231, 255, 0.65) 0, transparent 50%),
                    #f8fafc;
        color: #1e293b;
        font-family: 'Outfit', sans-serif;
    }
    
    /* Hide default streamlit header/footer for cleaner dashboard look */
    header, footer {
        visibility: hidden !important;
    }
    
    /* Custom Glass Sidebar styling */
    section[data-testid="stSidebar"] {
        background-color: rgba(255, 255, 255, 0.45) !important;
        backdrop-filter: blur(24px) saturate(180%);
        -webkit-backdrop-filter: blur(24px) saturate(180%);
        border-right: 1px solid rgba(255, 255, 255, 0.4) !important;
        box-shadow: 4px 0 24px rgba(31, 38, 135, 0.02) !important;
    }
    section[data-testid="stSidebar"] * {
        color: #1e1b4b !important;
    }
    section[data-testid="stSidebar"] [data-testid="stExpander"] {
        background-color: rgba(255, 255, 255, 0.5) !important;
        border: 1px solid rgba(79, 70, 229, 0.12) !important;
        border-radius: 12px !important;
    }
    
    /* Premium Glass Card Containers */
    .triage-card {
        background: rgba(255, 255, 255, 0.75) !important;
        backdrop-filter: blur(12px) saturate(180%);
        -webkit-backdrop-filter: blur(12px) saturate(180%);
        border: 1px solid rgba(255, 255, 255, 0.5) !important;
        border-radius: 20px !important;
        padding: 20px;
        margin-bottom: 20px;
        box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.04), 
                    inset 0 1px 1px rgba(255, 255, 255, 0.6) !important;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        color: #1e293b !important;
    }
    .triage-card:hover {
        border-color: rgba(99, 102, 241, 0.35) !important;
        transform: translateY(-2px);
        box-shadow: 0 12px 40px 0 rgba(99, 102, 241, 0.08),
                    inset 0 1px 1px rgba(255, 255, 255, 0.7) !important;
    }
    
    /* Badge styling - High Legibility Pastel */
    .triage-badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 50px;
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 10px;
    }
    
    .badge-p1 { background-color: #fee2e2 !important; color: #dc2626 !important; border: 1px solid #fca5a5 !important; }
    .badge-p2 { background-color: #fef2f2 !important; color: #b91c1c !important; border: 1px solid #fecaca !important; }
    .badge-p3 { background-color: #ffedd5 !important; color: #ea580c !important; border: 1px solid #fed7aa !important; }
    .badge-p4 { background-color: #fff7ed !important; color: #c2410c !important; border: 1px solid #ffedd5 !important; }
    .badge-p5 { background-color: #fef9c3 !important; color: #a16207 !important; border: 1px solid #fef08a !important; }
    .badge-p6 { background-color: #dcfce7 !important; color: #16a34a !important; border: 1px solid #bbf7d0 !important; }

    /* Dispatch Instruction block */
    .dispatch-box {
        border-radius: 12px;
        padding: 14px;
        margin-top: 12px;
        font-size: 0.85rem;
        line-height: 1.5;
    }
    
    .dispatch-box-p1 { border-left: 4px solid #dc2626 !important; background-color: #fef2f2 !important; color: #991b1b !important; }
    .dispatch-box-p2 { border-left: 4px solid #b91c1c !important; background-color: #fff5f5 !important; color: #991b1b !important; }
    .dispatch-box-p3 { border-left: 4px solid #d97706 !important; background-color: #fffbeb !important; color: #92400e !important; }
    .dispatch-box-p4 { border-left: 4px solid #c2410c !important; background-color: #fffaf0 !important; color: #9a3412 !important; }
    .dispatch-box-p5 { border-left: 4px solid #b45309 !important; background-color: #fefdf0 !important; color: #854d0e !important; }
    .dispatch-box-p6 { border-left: 4px solid #16a34a !important; background-color: #f0fdf4 !important; color: #166534 !important; }

    /* Metric Tags */
    .metric-tag {
        display: inline-flex;
        align-items: center;
        background-color: rgba(99, 102, 241, 0.06);
        border: 1px solid rgba(99, 102, 241, 0.12);
        border-radius: 8px;
        padding: 6px 12px;
        font-size: 0.8rem;
        margin-right: 8px;
        font-weight: 600;
        color: #4f46e5;
    }
    
    /* Pulse indicator */
    .pulse-dot {
        width: 8px;
        height: 8px;
        background-color: #16a34a;
        border-radius: 50%;
        display: inline-block;
        margin-right: 8px;
        box-shadow: 0 0 8px #16a34a;
        animation: pulse-animation 1.5s infinite;
    }
    @keyframes pulse-animation {
        0% { transform: scale(0.9); opacity: 0.6; }
        50% { transform: scale(1.1); opacity: 1; box-shadow: 0 0 14px #16a34a; }
        100% { transform: scale(0.9); opacity: 0.6; }
    }
    
    /* Guide styles */
    .guide-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 12px;
        border-radius: 12px;
        margin-bottom: 8px;
        background: rgba(255, 255, 255, 0.5);
        border: 1px solid rgba(79, 70, 229, 0.08);
        color: #475569;
    }

    /* Global text overrides for light glassmorphism */
    h1, h2, h3, h4, h5, h6 { color: #1e1b4b !important; font-weight: 700 !important; }
    p, span, li, label, div { color: #334155; }
    
    /* Streamlit widget text fixes */
    .stMarkdown, .stText { color: #334155 !important; }
    .stSelectbox label, .stSlider label, .stRadio label, .stCheckbox label,
    .stNumberInput label, .stTextInput label, .stTextArea label {
        color: #1e1b4b !important;
        font-weight: 600 !important;
    }
    
    /* Premium Button overrides */
    button[data-testid="baseButton-primary"] {
        background: linear-gradient(135deg, #4f46e5 0%, #8b5cf6 100%) !important;
        color: white !important;
        border: none !important;
        border-radius: 12px !important;
        padding: 8px 16px !important;
        font-weight: 600 !important;
        box-shadow: 0 4px 14px rgba(79, 70, 229, 0.25) !important;
        transition: all 0.2s ease !important;
    }
    button[data-testid="baseButton-primary"]:hover {
        transform: translateY(-1px) !important;
        box-shadow: 0 6px 20px rgba(79, 70, 229, 0.35) !important;
    }
    button[data-testid="baseButton-secondary"] {
        background: rgba(255, 255, 255, 0.65) !important;
        color: #4f46e5 !important;
        border: 1px solid rgba(79, 70, 229, 0.25) !important;
        border-radius: 12px !important;
        padding: 8px 16px !important;
        font-weight: 600 !important;
        transition: all 0.2s ease !important;
    }
    button[data-testid="baseButton-secondary"]:hover {
        background: rgba(255, 255, 255, 0.85) !important;
        border-color: #4f46e5 !important;
        color: #312e81 !important;
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
            angle = pred.get("angle", 0.0) # OBB rotation in degrees
            
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

def extract_youtube_frames(url, num_frames=6, output_dir=None):
    """
    Downloads a low-resolution version of a YouTube video to a temp file,
    OR opens a local video file directly if it exists,
    extracts evenly-spaced frames, converts them to RGB/PIL, and returns them
    along with the video title.
    """
    import uuid
    if not output_dir:
        output_dir = ANNOTATED_DIR
        
    is_local = os.path.exists(url)
    
    if is_local:
        temp_video_path = url
        title = os.path.splitext(os.path.basename(url))[0]
    else:
        temp_filename = f"temp_youtube_video_{uuid.uuid4().hex}.mp4"
        temp_video_path = os.path.join(output_dir, temp_filename)
        
        # Clean up any potential files
        for ext in ["", ".part", ".ytdl"]:
            p = temp_video_path + ext
            if os.path.exists(p):
                try:
                    os.remove(p)
                except Exception as e:
                    print(f"Could not remove existing temp file {p}: {e}")
                
        ydl_opts = {
            'format': 'worst[ext=mp4]/worst', # Lowest resolution mp4 for fast download
            'outtmpl': temp_video_path,
            'quiet': True,
            'no_warnings': True,
            'continuedl': False, # Disable resume to prevent range errors
        }
        
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                title = info.get('title', 'YouTube Video')
        except Exception as e:
            print(f"yt-dlp first attempt failed: {e}. Trying fallback formats...")
            ydl_opts['format'] = 'worst'
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                title = info.get('title', 'YouTube Video')
                
        if not os.path.exists(temp_video_path):
            raise FileNotFoundError("Failed to download YouTube video stream.")
            
    cap = cv2.VideoCapture(temp_video_path)
    if not cap.isOpened():
        if not is_local:
            # Clean up files on error
            for ext in ["", ".part", ".ytdl"]:
                p = temp_video_path + ext
                if os.path.exists(p):
                    try:
                        os.remove(p)
                    except:
                        pass
        raise ValueError("Could not open video file with OpenCV.")
        
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    frames = []
    # Safe title for file names
    safe_title = "".join([c if c.isalnum() or c in ('-', '_') else '_' for c in title])
    
    if total_frames > 0:
        step = total_frames // (num_frames + 1)
        for i in range(1, num_frames + 1):
            idx = step * i
            cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
            ret, frame = cap.read()
            if ret:
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                pil_img = Image.fromarray(frame_rgb)
                
                frame_filename = f"yt_frame_{safe_title}_{i}.jpg"
                frame_path = os.path.join(output_dir, frame_filename)
                pil_img.save(frame_path, "JPEG")
                
                frames.append({
                    "name": f"{title} (Frame {i})",
                    "path": frame_path,
                    "filename": frame_filename
                })
    else:
        count = 0
        idx = 0
        while len(frames) < num_frames:
            ret, frame = cap.read()
            if not ret:
                break
            if idx % 120 == 0:
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                pil_img = Image.fromarray(frame_rgb)
                
                count += 1
                frame_filename = f"yt_frame_{safe_title}_{count}.jpg"
                frame_path = os.path.join(output_dir, frame_filename)
                pil_img.save(frame_path, "JPEG")
                
                frames.append({
                    "name": f"{title} (Frame {count})",
                    "path": frame_path,
                    "filename": frame_filename
                })
            idx += 1
            
    cap.release()
    
    if not is_local:
        for ext in ["", ".part", ".ytdl"]:
            p = temp_video_path + ext
            if os.path.exists(p):
                try:
                    os.remove(p)
                except Exception as e:
                    print(f"Could not clean up temp file {p}: {e}")
        
    return frames, title

# --- Sidebar Layout ---
with st.sidebar:
    # Beautiful Brand
    st.markdown("""
    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
        <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 4px 10px rgba(99, 102, 241, 0.2);">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 22px; height: 22px;"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
        </div>
        <div>
            <h1 style="margin: 0; font-size: 1.3rem; font-weight: 700; color: #1e1b4b; line-height:1.2;">EmberX_v2</h1>
            <span style="font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Tactical Triage</span>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    # Inference Settings
    st.subheader("Inference Engine")
    inference_source = "Local Model (Offline)"
    local_model_path = "emberx_v2.pt"
    
    with st.expander("📂 Local Model Settings", expanded=True):
        local_model_path = st.text_input(
            "Local Model Weights (.pt)",
            value="emberx_v2.pt",
            help="Path to local YOLO weights file"
        )
        
    # Status Indicators
    st.markdown(f"""
    <div style="background-color: rgba(255, 255, 255, 0.6); border: 1px solid rgba(79, 70, 229, 0.15); padding: 12px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.01);">
        <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 8px; display: flex; align-items: center;">
            <span class="pulse-dot" style="background-color: #16a34a; box-shadow: 0 0 8px #16a34a;"></span>
            <span style="color: #16a34a; font-weight: 700;">Local Inference Active</span>
        </div>
        <div style="font-size: 0.8rem; color: #1e1b4b; font-weight: 600; word-break: break-all;">{local_model_path}</div>
        <div style="font-size: 0.7rem; color: #475569; margin-top: 2px;">YOLO11s-OBB &bull; Fire, Smoke &amp; Human Detection</div>
        <div style="font-size: 0.65rem; color: #64748b; margin-top: 4px; line-height: 1.4;">Runs fully offline using local GPU/CPU. No cloud API or internet connection required.</div>
    </div>
    """, unsafe_allow_html=True)

    # Sidebar Controls
    st.subheader("Dashboard Controls")
    triage_mode = st.radio("Select Triage Mode", ["Image Triage & Ranking", "Multi-Room SAR Triage"], index=0)
    
    if st.button("Reset All Selections", type="secondary", use_container_width=True):
        st.session_state.clear()
        st.rerun()

# --- Query Model Helper (Local Inference) ---
def query_model(image_data):
    """
    Queries the local YOLO model for predictions.
    Returns predictions list of dicts.
    """
    try:
        from ultralytics import YOLO
        # Check if model is already loaded in session state to avoid reloading on every frame
        if "local_yolo_model" not in st.session_state or st.session_state.get("local_model_path_used") != local_model_path:
            model_full_path = os.path.join(BASE_DIR, local_model_path)
            if not os.path.exists(model_full_path) and os.path.exists(local_model_path):
                model_full_path = local_model_path
            st.session_state.local_yolo_model = YOLO(model_full_path)
            st.session_state.local_model_path_used = local_model_path
            
        model = st.session_state.local_yolo_model
        
        # Load PIL Image
        if isinstance(image_data, bytes):
            img = Image.open(io.BytesIO(image_data))
        else:
            img = Image.open(image_data)
            
        results = model(img, verbose=False)[0]
        predictions = []
        
        # Process OBB (Oriented Bounding Boxes)
        if hasattr(results, 'obb') and results.obb is not None and len(results.obb) > 0:
            xywhr = results.obb.xywhr.cpu().numpy()
            confs = results.obb.conf.cpu().numpy()
            clss = results.obb.cls.cpu().numpy()
            names = results.names
            
            for i in range(len(xywhr)):
                cx, cy, w, h, angle_rad = xywhr[i]
                conf = float(confs[i])
                cls_id = int(clss[i])
                cls_name = names.get(cls_id, "unknown")
                angle_deg = math.degrees(angle_rad)
                
                predictions.append({
                    "class": cls_name,
                    "confidence": conf,
                    "x": float(cx),
                    "y": float(cy),
                    "width": float(w),
                    "height": float(h),
                    "angle": float(angle_deg)
                })
        # Process standard Bounding Boxes
        elif hasattr(results, 'boxes') and results.boxes is not None and len(results.boxes) > 0:
            xywh = results.boxes.xywh.cpu().numpy()
            confs = results.boxes.conf.cpu().numpy()
            clss = results.boxes.cls.cpu().numpy()
            names = results.names
            
            for i in range(len(xywh)):
                cx, cy, w, h = xywh[i]
                conf = float(confs[i])
                cls_id = int(clss[i])
                cls_name = names.get(cls_id, "unknown")
                
                predictions.append({
                    "class": cls_name,
                    "confidence": conf,
                    "x": float(cx),
                    "y": float(cy),
                    "width": float(w),
                    "height": float(h),
                    "angle": 0.0
                })
        return predictions
        
    except ImportError:
        st.error("Error: The 'ultralytics' library is required for local inference. Please install it with `pip install ultralytics`")
        return []
    except Exception as e:
        st.error(f"Local YOLO inference error: {e}")
        return []

# --- Main Layout ---
# Header Portal
st.markdown("""
<div style="border-bottom: 1px solid rgba(79, 70, 229, 0.15); padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center;">
    <div>
        <h2 style="margin: 0; font-size: 1.75rem; font-weight: 700; color: #1e1b4b;">Command & Dispatch Portal</h2>
        <p style="margin: 4px 0 0 0; color: #475569; font-size: 0.95rem;">Real-time machine learning fireground image analysis & dispatch triage mapping</p>
    </div>
    <div style="background-color: rgba(79, 70, 229, 0.08); color: #4f46e5; border: 1px solid rgba(79, 70, 229, 0.2); border-radius: 50px; padding: 6px 14px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
        Localhost Run
    </div>
</div>
""", unsafe_allow_html=True)

# Initialize session state for multi-room triage
if "multi_room_results" not in st.session_state:
    st.session_state.multi_room_results = None
if "multi_room_ranked_results" not in st.session_state:
    st.session_state.multi_room_ranked_results = None
if "image_triage_results" not in st.session_state:
    st.session_state.image_triage_results = None
if "image_triage_ranked_results" not in st.session_state:
    st.session_state.image_triage_ranked_results = None

if triage_mode == "Multi-Room SAR Triage":
    st.markdown("### Tactical Multi-Room Surveillance")
    st.markdown("<p style='color:#475569; font-size: 0.95rem; margin-top:-10px;'>Simultaneous live POV feeds monitoring Room 1 to Room 4</p>", unsafe_allow_html=True)
    
    cols_preview = st.columns(4)
    rooms = [
        {"id": "Room 1", "title": "GoPro Rowhome Fire (Local)", "url": os.path.join(STATIC_DIR, "Room_1.mp4")},
        {"id": "Room 2", "title": "Firefighter POV (Local)", "url": os.path.join(STATIC_DIR, "Room_2.mp4")},
        {"id": "Room 3", "title": "Residential Fire POV (Local)", "url": os.path.join(STATIC_DIR, "Room_3.mp4")},
        {"id": "Room 4", "title": "TFD First Due POV (Local)", "url": os.path.join(STATIC_DIR, "Room_4.mp4")}
    ]
    
    for i, room in enumerate(rooms):
        with cols_preview[i]:
            st.markdown(f"**{room['id']}**")
            st.markdown(f"<span style='font-size:0.8rem; color:#475569;'>{room['title']}</span>", unsafe_allow_html=True)
            st.video(room["url"])
            
    execute_multi = st.button("Execute Multi-Room Triage", type="primary", use_container_width=True)
    
    if execute_multi:
        progress_bar = st.progress(0)
        status_text = st.empty()
        
        room_results = []
        
        for idx, room in enumerate(rooms):
            url = room["url"]
            room_id = room["id"]
            
            status_text.text(f"Extracting & analyzing frames from {room_id}...")
            progress_bar.progress(int((idx / len(rooms)) * 100))
            
            try:
                frames, title = extract_youtube_frames(url, num_frames=5, output_dir=ANNOTATED_DIR)
                
                import random
                all_frame_candidates = []
                
                for index, item in enumerate(frames):
                    img_path = item["path"]
                    img_name = item["name"]
                    
                    with open(img_path, "rb") as f:
                        img_data = f.read()
                        
                    predictions = query_model(img_data)
                        
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
                                
                    p_details = calculate_priority(human_count, fire_count)
                    
                    all_frame_candidates.append({
                        "item": item,
                        "img_data": img_data,
                        "predictions": filtered_preds,
                        "counts": {"fire": fire_count, "human": human_count, "smoke": smoke_count},
                        "priority_tier": p_details["tier"],
                        "priority_badge": p_details["badge"],
                        "color_class": p_details["color"],
                        "dispatch_info": p_details["dispatch"]
                    })
                
                # Weighted random selection: lower tier = higher weight
                # Tier 1 gets weight 6, tier 6 gets weight 1 — favors critical frames
                # but doesn't guarantee the most critical one every time
                if all_frame_candidates:
                    weights = [max(1, 7 - c["priority_tier"]) for c in all_frame_candidates]
                    best_frame_pred = random.choices(all_frame_candidates, weights=weights, k=1)[0]
                else:
                    best_frame_pred = None
                
                if best_frame_pred:
                    best_item = best_frame_pred["item"]
                    annotated_img = annotate_image(best_frame_pred["img_data"], best_frame_pred["predictions"])
                    
                    out_filename = f"annotated_streamlit_{room_id.replace(' ', '_')}_{best_item['filename']}"
                    annotated_path = os.path.join(ANNOTATED_DIR, out_filename)
                    annotated_img.save(annotated_path, "JPEG", quality=90)
                    
                    room_results.append({
                        "room_id": room_id,
                        "video_title": title,
                        "annotated_image": annotated_img,
                        "counts": best_frame_pred["counts"],
                        "priority_tier": best_frame_pred["priority_tier"],
                        "priority_badge": best_frame_pred["priority_badge"],
                        "color_class": best_frame_pred["color_class"],
                        "dispatch_info": best_frame_pred["dispatch_info"]
                    })
                else:
                    room_results.append({
                        "room_id": room_id,
                        "video_title": room["title"],
                        "annotated_image": None,
                        "counts": {"fire": 0, "human": 0, "smoke": 0},
                        "priority_tier": 6,
                        "priority_badge": "Standard Monitoring",
                        "color_class": "p6",
                        "dispatch_info": "No critical frames extracted. Standard monitoring recommended."
                    })
                    
                # Clean up extracted raw frames
                for item in frames:
                    if os.path.exists(item["path"]):
                        os.remove(item["path"])
                        
            except Exception as e:
                st.error(f"Failed to process {room_id}: {e}")
                room_results.append({
                    "room_id": room_id,
                    "video_title": room["title"],
                    "annotated_image": None,
                    "counts": {"fire": 0, "human": 0, "smoke": 0},
                    "priority_tier": 6,
                    "priority_badge": "Error",
                    "color_class": "p6",
                    "dispatch_info": f"Error running triage: {str(e)}"
                })
                
        progress_bar.progress(100)
        status_text.text("Multi-room analysis complete!")
        progress_bar.empty()
        status_text.empty()
        
        ranked_results = sorted(room_results, key=lambda x: (
            x["priority_tier"],
            -x["counts"]["human"],
            -x["counts"]["fire"]
        ))
        
        st.session_state.multi_room_results = room_results
        st.session_state.multi_room_ranked_results = ranked_results
        st.rerun()
        
    if st.session_state.multi_room_results is not None:
        st.markdown("---")
        st.markdown("### 1. Critical Frames Extracted Per Room")
        cols_feeds = st.columns(4)
        for idx, item in enumerate(st.session_state.multi_room_results):
            with cols_feeds[idx]:
                badge_class = f"badge-{item['color_class']}"
                dispatch_class = f"dispatch-box-{item['color_class']}"
                
                st.markdown(f"""
                <div class="triage-card">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                        <span style="font-weight:700; font-size:0.9rem; color:#4f46e5;">{item['room_id']}</span>
                        <span class="triage-badge {badge_class}">{item['priority_badge']}</span>
                    </div>
                </div>
                """, unsafe_allow_html=True)
                
                if item["annotated_image"]:
                    st.image(item["annotated_image"], use_container_width=True)
                else:
                    st.error("No image available")
                    
                st.markdown(f"""
                <div class="triage-card" style="border-top:0; border-top-left-radius:0; border-top-right-radius:0; margin-top:-22px;">
                    <div style="font-weight:600; font-size:0.8rem; margin-bottom:8px; word-break:break-all; line-height:1.2;">{item['video_title']}</div>
                    <div style="margin-bottom:12px;">
                        <span class="metric-tag">🔥 {item['counts']['fire']} Fire</span>
                        <span class="metric-tag">👤 {item['counts']['human']} Humans</span>
                        <span class="metric-tag">💨 {item['counts']['smoke']} Smoke</span>
                    </div>
                </div>
                """, unsafe_allow_html=True)
                
        st.markdown("### 2. Search & Rescue (SAR) Triage Priority Ranking")
        # Compute dense ranks: items with the same priority_tier share the same rank
        ranked_results = st.session_state.multi_room_ranked_results
        dense_ranks = []
        current_rank = 0
        prev_tier = None
        for item in ranked_results:
            if item["priority_tier"] != prev_tier:
                current_rank += 1
                prev_tier = item["priority_tier"]
            dense_ranks.append(current_rank)
        
        for rank_idx, item in enumerate(ranked_results):
            badge_class = f"badge-{item['color_class']}"
            dispatch_class = f"dispatch-box-{item['color_class']}"
            
            rank_col, img_col, details_col = st.columns([1.5, 3, 7.5])
            
            with rank_col:
                st.markdown(f"""
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; min-height: 120px; background: rgba(255, 255, 255, 0.7); border: 1px solid rgba(79, 70, 229, 0.15); border-radius: 16px; text-align: center; box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.03);">
                    <div style="font-size: 2.2rem; font-weight: 800; color: #4f46e5; line-height: 1.1;">#{dense_ranks[rank_idx]}</div>
                    <div style="font-size: 0.65rem; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">SAR Rank</div>
                </div>
                """, unsafe_allow_html=True)
                
            with img_col:
                if item["annotated_image"]:
                    st.image(item["annotated_image"], use_container_width=True)
                else:
                    st.error("No image available")
                    
            with details_col:
                st.markdown(f"""
                <div class="triage-badge {badge_class}" style="margin-bottom: 5px;">{item['priority_badge']}</div>
                <div style="font-size: 1.1rem; font-weight: 700; color: #1e1b4b;">{item['room_id']} — <span style="font-weight: 400; color: #475569; font-size:0.9rem;">{item['video_title']}</span></div>
                <div style="margin: 6px 0;">
                    <span class="metric-tag">🔥 {item['counts']['fire']} Fire</span>
                    <span class="metric-tag">👤 {item['counts']['human']} Humans</span>
                    <span class="metric-tag">💨 {item['counts']['smoke']} Smoke</span>
                </div>
                <div class="dispatch-box {dispatch_class}" style="margin-top: 5px;">
                    <strong>Dispatch Instructions:</strong> {item['dispatch_info']}
                </div>
                """, unsafe_allow_html=True)
                
            st.markdown("---")
            
    st.stop()

# Image Triage & Ranking View
st.markdown("### Image Recognition & Dispatch Triage")
st.markdown("<p style='color:#475569; font-size: 0.95rem; margin-top:-10px;'>Analyze static fireground photographs (including pre-loaded samples 1-6 or your own uploaded images) to identify fire, smoke, and human presence, automatically prioritizing dispatch resources.</p>", unsafe_allow_html=True)

# Selection of image source
source_option = st.radio(
    "Select Image Source",
    ["Folder Samples (Images 1-6)", "Upload Custom Images"],
    horizontal=True
)

selected_images = []

if source_option == "Folder Samples (Images 1-6)":
    st.markdown("##### Pre-loaded Images from Folder")
    # Display images in a grid
    cols = st.columns(6)
    for i in range(1, 7):
        img_filename = f"image {i}.jpg"
        img_path = os.path.join(BASE_DIR, img_filename)
        with cols[i-1]:
            if os.path.exists(img_path):
                # Show thumbnail
                st.image(img_path, caption=f"Image {i}", use_container_width=True)
                selected_images.append({
                    "name": f"image {i}.jpg",
                    "path": img_path,
                    "is_custom": False
                })
            else:
                st.error(f"image {i}.jpg not found")
else:
    st.markdown("##### Upload Custom Images")
    uploaded_files = st.file_uploader(
        "Drag & Drop or browse images (JPEG/PNG)",
        accept_multiple_files=True,
        type=["jpg", "jpeg", "png"]
    )
    if uploaded_files:
        for file in uploaded_files:
            selected_images.append({
                "name": file.name,
                "data": file.read(),
                "is_custom": True
            })
    else:
        st.info("Please upload one or more images to proceed.")
        
# Button to execute
execute_triage = st.button("Execute Image Triage & Ranking", type="primary", use_container_width=True, disabled=len(selected_images) == 0)

if execute_triage and selected_images:
    progress_bar = st.progress(0)
    status_text = st.empty()
    
    image_results = []
    
    for idx, img_item in enumerate(selected_images):
        img_name = img_item["name"]
        status_text.text(f"Analyzing {img_name}...")
        progress_bar.progress(int((idx / len(selected_images)) * 100))
        
        try:
            # Read image bytes
            if img_item["is_custom"]:
                img_data = img_item["data"]
            else:
                with open(img_item["path"], "rb") as f:
                    img_data = f.read()
            
            # Predict
            predictions = query_model(img_data)
            
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
            
            # Priority Details
            p_details = calculate_priority(human_count, fire_count)
            
            # Annotate image
            annotated_img = annotate_image(img_data, filtered_preds)
            
            image_results.append({
                "name": img_name,
                "annotated_image": annotated_img,
                "counts": {"fire": fire_count, "human": human_count, "smoke": smoke_count},
                "priority_tier": p_details["tier"],
                "priority_badge": p_details["badge"],
                "color_class": p_details["color"],
                "dispatch_info": p_details["dispatch"]
            })
            
        except Exception as e:
            st.error(f"Failed to process {img_name}: {e}")
            image_results.append({
                "name": img_name,
                "annotated_image": None,
                "counts": {"fire": 0, "human": 0, "smoke": 0},
                "priority_tier": 6,
                "priority_badge": "Error",
                "color_class": "p6",
                "dispatch_info": f"Error running triage: {str(e)}"
            })
            
    progress_bar.progress(100)
    status_text.text("Image recognition and ranking complete!")
    progress_bar.empty()
    status_text.empty()
    
    # Sort results
    ranked_results = sorted(image_results, key=lambda x: (
        x["priority_tier"],
        -x["counts"]["human"],
        -x["counts"]["fire"]
    ))
    
    st.session_state.image_triage_results = image_results
    st.session_state.image_triage_ranked_results = ranked_results
    st.rerun()
    
# Show results if available
if st.session_state.image_triage_results is not None:
    st.markdown("---")
    st.markdown("### 1. Detections & Metrics Per Image")
    
    results_list = st.session_state.image_triage_results
    num_cols = min(3, len(results_list))
    rows = math.ceil(len(results_list) / num_cols)
    
    for r in range(rows):
        cols_feeds = st.columns(num_cols)
        for c in range(num_cols):
            idx = r * num_cols + c
            if idx < len(results_list):
                item = results_list[idx]
                with cols_feeds[c]:
                    badge_class = f"badge-{item['color_class']}"
                    
                    st.markdown(f"""
                    <div class="triage-card">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                            <span style="font-weight:700; font-size:0.9rem; color:#4f46e5;">{item['name']}</span>
                            <span class="triage-badge {badge_class}">{item['priority_badge']}</span>
                        </div>
                    </div>
                    """, unsafe_allow_html=True)
                    
                    if item["annotated_image"]:
                        st.image(item["annotated_image"], use_container_width=True)
                    else:
                        st.error("No image available")
                        
                    st.markdown(f"""
                    <div class="triage-card" style="border-top:0; border-top-left-radius:0; border-top-right-radius:0; margin-top:-22px;">
                        <div style="margin-bottom:12px;">
                            <span class="metric-tag">🔥 {item['counts']['fire']} Fire</span>
                            <span class="metric-tag">👤 {item['counts']['human']} Humans</span>
                            <span class="metric-tag">💨 {item['counts']['smoke']} Smoke</span>
                        </div>
                    </div>
                    """, unsafe_allow_html=True)
                    
    st.markdown("### 2. Search & Rescue (SAR) Triage Priority Ranking")
    ranked_results = st.session_state.image_triage_ranked_results
    
    dense_ranks = []
    current_rank = 0
    prev_tier = None
    for item in ranked_results:
        if item["priority_tier"] != prev_tier:
            current_rank += 1
            prev_tier = item["priority_tier"]
        dense_ranks.append(current_rank)
        
    for rank_idx, item in enumerate(ranked_results):
        badge_class = f"badge-{item['color_class']}"
        dispatch_class = f"dispatch-box-{item['color_class']}"
        
        rank_col, img_col, details_col = st.columns([1.5, 3, 7.5])
        
        with rank_col:
            st.markdown(f"""
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; min-height: 120px; background: rgba(255, 255, 255, 0.7); border: 1px solid rgba(79, 70, 229, 0.15); border-radius: 16px; text-align: center; box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.03);">
                <div style="font-size: 2.2rem; font-weight: 800; color: #4f46e5; line-height: 1.1;">#{dense_ranks[rank_idx]}</div>
                <div style="font-size: 0.65rem; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">SAR Rank</div>
            </div>
            """, unsafe_allow_html=True)
            
        with img_col:
            if item["annotated_image"]:
                st.image(item["annotated_image"], use_container_width=True)
            else:
                st.error("No image available")
                
        with details_col:
            st.markdown(f"""
            <div class="triage-badge {badge_class}" style="margin-bottom: 5px;">{item['priority_badge']}</div>
            <div style="font-size: 1.1rem; font-weight: 700; color: #1e1b4b;">{item['name']}</div>
            <div style="margin: 6px 0;">
                <span class="metric-tag">🔥 {item['counts']['fire']} Fire</span>
                <span class="metric-tag">👤 {item['counts']['human']} Humans</span>
                <span class="metric-tag">💨 {item['counts']['smoke']} Smoke</span>
            </div>
            <div class="dispatch-box {dispatch_class}" style="margin-top: 5px;">
                <strong>Dispatch Instructions:</strong> {item['dispatch_info']}
            </div>
            """, unsafe_allow_html=True)
            
        st.markdown("---")
