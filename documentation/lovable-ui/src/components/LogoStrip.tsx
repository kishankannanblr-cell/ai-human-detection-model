const logos = [
  "PyTorch",
  "ONNX",
  "NVIDIA Jetson",
  "Ultralytics",
  "ROS 2",
  "OpenCV",
  "TensorRT",
];

export function LogoStrip() {
  return (
    <div className="mt-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 px-6 opacity-70">
      {logos.map((l) => (
        <span
          key={l}
          className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground"
        >
          {l}
        </span>
      ))}
    </div>
  );
}
