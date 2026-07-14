# How to Setup and Run the Dashboards (Flask & Streamlit)

This folder contains setup and run instructions for the two user interfaces developed for the fire, smoke, and human detection system. Both applications run **offline local inference** using your trained YOLO model (`emberx_v2.pt`).

---

## 📋 System Requirements

- **Python:** Version 3.9, 3.10, or 3.11 (Python 3.12 is also supported, but ensure your PyTorch version matches).
- **Model Weights:** You must have the `emberx_v2.pt` model weights file.
- **Hardware:** CUDA-capable GPU is recommended for faster video processing, but it will automatically run on the CPU if no GPU is detected.

---

## 🛠️ Step-by-Step Installation

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/kishankannanblr-cell/ai-human-detection-model.git
   cd ai-human-detection-model
   ```

2. **Set Up a Virtual Environment (Highly Recommended):**
   * **Windows:**
     ```powershell
     python -m venv .venv
     .venv\Scripts\activate
     ```
   * **macOS / Linux:**
     ```bash
     python -m venv .venv
     source .venv/bin/activate
     ```

3. **Install Dependencies:**
   Install all required libraries using the provided requirements file:
   ```bash
   pip install -r requirements/requirements.txt
   ```

4. **Verify Model Weights:**
   Ensure the `emberx_v2.pt` model weights file is downloaded and placed in the project root directory or the `code/` folder:
   - Path: `code/emberx_v2.pt`

---

## 🚀 How to Run the Applications

You can view both applications running on localhost by following the instructions below.

### 1. UI Integrated with Model (Flask Application)
This is the fully custom HTML/JS/CSS tactical triage web application.

- **Start the Server:**
  Run the Flask server script:
  ```bash
  python code/backend_server.py
  ```
- **Access the Interface:**
  Once the server starts (showing `* Running on http://127.0.0.1:5000`), open your web browser and navigate to:
  👉 **[http://localhost:5000](http://localhost:5000)** or **[http://127.0.0.1:5000](http://127.0.0.1:5000)**

---

### 2. Streamlit Dashboard
This is the analytical glassmorphic triage dashboard for search-and-rescue (SAR) triage.

- **Start the Application:**
  Launch the Streamlit app:
  ```bash
  streamlit run "code/Streamlit application code_app.py"
  ```
- **Access the Interface:**
  Streamlit will automatically open a browser window. If it does not, copy and paste the local URL into your web browser:
  👉 **[http://localhost:8501](http://localhost:8501)** or **[http://127.0.0.1:8501](http://127.0.0.1:8501)**

---

## 📁 Repository Code Structure

- `code/backend_server.py`: Flask application server file (integrates styling and local YOLO model).
- `code/Streamlit application code_app.py`: Streamlit tactical triage dashboard application.
- `code/static/`: Contains static styling (`style.css`), dynamic javascript frontend scripts (`main.js`), sample media assets, and directories for local model output.
- `code/templates/`: Contains HTML layout templates (e.g. `index.html`).
- `requirements/requirements.txt`: Python package dependency list.
