# How to Run the Dashboard

This project includes a dashboard for testing fire, smoke, and human detection on images. You do **not** need to retrain the model to run the dashboard. The dashboard uses a hosted Roboflow model API for inference.

## Requirements

- Python 3.9 or newer
- Internet connection
- Required Python packages:
  - Flask
  - Requests
  - Pillow

## Setup

Clone the repository and open the project folder:

```bash
git clone https://github.com/kishankannanblr-cell/ai-human-detection-model.git
cd ai-human-detection-model
```

## Running the Project

1. Create and activate a virtual environment:
   - **Windows:**
     ```powershell
     python -m venv .venv
     .venv\Scripts\activate
     ```
   - **macOS/Linux:**
     ```bash
     python -m venv .venv
     source .venv/bin/activate
     ```

2. Install the required Python packages:
   ```bash
   pip install flask requests pillow
   ```

3. Run the Flask application:
   ```bash
   python code/backend_server.py
   ```

4. Open your browser and navigate to:
   [http://127.0.0.1:5000](http://127.0.0.1:5000)
