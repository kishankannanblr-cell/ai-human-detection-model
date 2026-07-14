export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-rule">
      <div className="mx-auto grid max-w-[1400px] gap-8 px-8 py-12 font-mono text-[11px] uppercase tracking-wider text-muted-foreground md:grid-cols-4">
        <div>
          <div className="mb-3 flex items-center gap-2 text-foreground">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-ember/20 text-ember">◉</span>
            PYRA / Vision
          </div>
          <p className="normal-case tracking-normal">
            AI-assisted firefighting drones. YOLO human detection with a
            priority-ranked dispatch board for the Incident Commander.
            Educational concept site.
          </p>
        </div>
        <div>
          <div className="mb-3 text-foreground">Detection stack</div>
          <ul className="space-y-1 normal-case tracking-normal">
            <li>YOLOv8 / YOLO-NAS vision models</li>
            <li>PyTorch · ONNX Runtime · TensorRT</li>
            <li>NVIDIA Jetson Orin (edge)</li>
            <li>ROS 2 · MQTT telemetry</li>
          </ul>
        </div>
        <div>
          <div className="mb-3 text-foreground">Sensors</div>
          <ul className="space-y-1 normal-case tracking-normal">
            <li>RGB 4K camera · LiDAR ToF · RTK GNSS</li>
            <li>Mesh radio + LTE failover</li>
          </ul>
        </div>
        <div>
          <div className="mb-3 text-foreground">Revision</div>
          <ul className="space-y-1">
            <li>2026.06 — A</li>
            <li>Imagery generated for illustration</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-rule px-6 py-4 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        © 2026 — PYRA / Vision concept
      </div>
    </footer>
  );
}
