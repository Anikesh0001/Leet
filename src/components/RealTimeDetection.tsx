import React, { useRef, useEffect, useState } from "react";
import {
  Camera,
  AlertTriangle,
  Play,
  Pause,
  Volume2,
  VolumeX,
  RefreshCw,
} from "lucide-react";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import * as cocoSsd from "@tensorflow-models/coco-ssd";

const RealTimeDetection: React.FC<any> = ({
  settings = { suspiciousClasses: ['cell phone', 'book', 'cup', 'laptop', 'keyboard'], alertSound: true },
  onDetection = () => {},
  autoStart = false,
  minimalView = false,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetecting, setIsDetecting] = useState(false);
  const [model, setModel] = useState<any>(null);
  const [currentDetections, setCurrentDetections] = useState<any[]>([]);
  const [alertActive, setAlertActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [multiplePersonWarning, setMultiplePersonWarning] = useState(false);
  const [noPersonWarning, setNoPersonWarning] = useState(false);

  const [stats, setStats] = useState({
    totalDetections: 0,
    suspiciousDetections: 0,
    fps: 0,
  });
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const isDetectingRef = useRef(false);
  const noPersonFrameRef = useRef(0);
  const [, setRiskScore] = useState(0);
  const riskRef = useRef(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const [tabSwitchWarning, setTabSwitchWarning] = useState(false);
  const [splitScreenWarning, setSplitScreenWarning] = useState(false);

  useEffect(() => {
    const initialWidth = window.innerWidth;
    const initialHeight = window.innerHeight;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        console.warn("⚠️ Tab switch detected!");
        setTabSwitchWarning(true);
        playAlertSound();
        try {
          onDetection({ type: "tab_switch", timestamp: Date.now() });
          // also broadcast a window event so other listeners can pick it up
          try { window.dispatchEvent(new CustomEvent('proctor:event', { detail: { type: 'tab_switch', timestamp: Date.now() } })); } catch(e){}
        } catch (e) {
          console.error("onDetection error", e);
        }

        setTimeout(() => setTabSwitchWarning(false), 3000);
      }
    };

    const handleResize = () => {
      const widthRatio = window.innerWidth / initialWidth;
      const heightRatio = window.innerHeight / initialHeight;

      if (widthRatio < 0.7 || heightRatio < 0.7) {
        console.warn("⚠️ Split screen or minimized window detected!");
        setSplitScreenWarning(true);
        playAlertSound();

        try {
          onDetection({ type: "split_screen", timestamp: Date.now() });
          try { window.dispatchEvent(new CustomEvent('proctor:event', { detail: { type: 'split_screen', timestamp: Date.now() } })); } catch(e){}
        } catch (e) {
          console.error("onDetection error", e);
        }

        setTimeout(() => setSplitScreenWarning(false), 3000);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("resize", handleResize);

    initializeSystem();

    // risk decay interval
    const decay = setInterval(() => {
      if (riskRef.current > 0) {
        riskRef.current = Math.max(0, riskRef.current - 1);
        setRiskScore(riskRef.current);
        try { onDetection({ type: 'risk_update', risk: riskRef.current, timestamp: Date.now() }); } catch(e){}
      }
    }, 1000);

    return () => {
      cleanup();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("resize", handleResize);
      clearInterval(decay);
    };
  }, []);

  const cleanup = () => {
    console.log("🧹 Cleaning up...");
    isDetectingRef.current = false;
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
    }
  };

  const initializeSystem = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Request camera first so the user sees the feed quickly while the model loads
      try {
        await setupCamera(selectedDeviceId || undefined);
      } catch (e) {
        console.warn("Camera setup delayed or blocked", e);
      }

      console.log("🚀 Initializing TensorFlow.js...");
      await tf.ready();
      console.log("✅ TensorFlow.js ready, backend:", tf.getBackend());

      console.log("📦 Loading COCO-SSD model...");
      const loadedModel = await (cocoSsd as any).load({ base: "mobilenet_v2" });
      setModel(loadedModel);
      console.log("✅ Model loaded successfully");

      setIsLoading(false);
    } catch (error: any) {
      console.error("❌ Error initializing system:", error);
      setError(error?.message || String(error));
      setIsLoading(false);
    }
  };

  const requestCamera = async () => {
    try {
      await setupCamera(selectedDeviceId || undefined);
    } catch (e) {
      console.error('Failed to get camera', e);
      setError('Failed to access camera. Please allow camera permissions and refresh.');
    }
  };

  const setupCamera = async (deviceId?: string) => {
    try {
      console.log("📹 Requesting camera access...");
      const constraints: any = deviceId
        ? { video: { deviceId: { exact: deviceId } } }
        : { video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" } };

      // Stop existing tracks if any
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // After getting permission, refresh device list so the correct device shows
      try {
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        setDevices(allDevices.filter((d) => d.kind === "videoinput"));
      } catch (e) {
        console.warn("Failed to enumerate devices", e);
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          console.log("✅ Video metadata loaded");
          try {
            // Ensure playsInline is set for mobile browsers
            videoRef.current?.setAttribute("playsinline", "true");
            const p = videoRef.current?.play();
            if (p && typeof p.then === "function") {
              p.then(() => {
                console.log("▶️ Video playing");
                setCameraReady(true);
              }).catch((err) => {
                console.error("❌ Error playing video:", err);
                setError("Failed to start video playback. Check browser autoplay/camera policies.");
              });
            } else {
              setCameraReady(true);
            }
          } catch (err) {
            console.error("Error while starting video", err);
            setError("Failed to start video playback");
          }
        };
      }
    } catch (error) {
      console.error("❌ Error accessing camera:", error);
      const message = (error as any)?.name === 'NotAllowedError' || (error as any)?.message?.toLowerCase?.()?.includes('permission')
        ? 'Camera access denied. Please allow camera permissions for this site (Chrome → lock icon → Camera → Allow) and refresh.'
        : 'Camera access failed. Ensure your browser supports getUserMedia and the site is served over HTTPS or localhost.';
      setError(message);
    }
  };

  const playAlertSound = () => {
    if (!settings.alertSound) return;

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);

      oscillator.frequency.setValueAtTime(800, audioContextRef.current.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContextRef.current.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContextRef.current.currentTime + 0.2);

      gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.3);

      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + 0.3);
    } catch (error) {
      console.error("❌ Error playing alert sound:", error);
    }
  };

  const detectObjects = async () => {
    if (
      !model ||
      !videoRef.current ||
      !canvasRef.current ||
      !cameraReady ||
      !isDetectingRef.current
    ) {
      console.log("⚠️ Detection skipped - missing requirements");
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

    if (video.readyState !== 4 || video.videoWidth === 0) {
      console.log("⚠️ Video not ready for detection");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    try {
      console.log("🔍 Running detection...");

      const predictions = await model.detect(video, undefined, 0.2);

      console.log(
        `📊 Raw predictions: ${predictions.length}`,
        predictions.map((p: any) => `${p.class}:${(p.score * 100).toFixed(1)}%`)
      );

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const validPredictions = predictions.filter((prediction: any) => prediction.score >= 0.25);
      const persons = validPredictions.filter((p: any) => p.class === "person");
      const multiplePersonsDetected = persons.length > 1;

      // detect no-person: if there are zero persons for several frames
      if (persons.length === 0) {
        noPersonFrameRef.current = (noPersonFrameRef.current || 0) + 1;
      } else {
        noPersonFrameRef.current = 0;
      }

      if (noPersonFrameRef.current > 30 && !noPersonWarning) {
        console.warn('⚠️ No person detected for a while (away from camera)');
        setNoPersonWarning(true);
        playAlertSound();
        try { onDetection({ type: 'no_person', timestamp: Date.now() }); } catch(e) { console.error(e); }
        try { window.dispatchEvent(new CustomEvent('proctor:event', { detail: { type: 'no_person', timestamp: Date.now() } })); } catch(e){}
        setTimeout(() => setNoPersonWarning(false), 4000);
      }

      if (multiplePersonsDetected && !multiplePersonWarning) {
        console.warn("🚨 More than one person detected!");
        setMultiplePersonWarning(true);
        playAlertSound();
        try {
          onDetection({ type: "multiple_persons", count: persons.length, timestamp: Date.now() });
          try { window.dispatchEvent(new CustomEvent('proctor:event', { detail: { type: 'multiple_persons', count: persons.length, timestamp: Date.now() } })); } catch(e){}
        } catch (e) {
          console.error("onDetection error", e);
        }

        setTimeout(() => setMultiplePersonWarning(false), 3000);
      }

      console.log(`✅ Valid detections: ${validPredictions.length}`);

      let hasSuspiciousObject = false;
      const detections: any[] = [];

      validPredictions.forEach((prediction: any, index: number) => {
        const [x, y, width, height] = prediction.bbox;
        const isSuspicious = settings.suspiciousClasses.includes(prediction.class);

        console.log(`${index + 1}. ${prediction.class} (${(prediction.score * 100).toFixed(1)}%) - ${isSuspicious ? "🚨 SUSPICIOUS" : "✅ Normal"}`);

        if (isSuspicious) {
          hasSuspiciousObject = true;
        }

        if (prediction.class === "person" && multiplePersonsDetected) {
          ctx.strokeStyle = "#ff0000";
          ctx.lineWidth = 8;
        } else {
          ctx.strokeStyle = isSuspicious ? "#ff0000" : "#00ff00";
          ctx.lineWidth = isSuspicious ? 8 : 6;
        }

        ctx.strokeRect(x, y, width, height);

        const label = `${prediction.class.toUpperCase()} ${Math.round(prediction.score * 100)}%`;
        ctx.font = "bold 20px Arial";
        const textWidth = ctx.measureText(label).width;

        ctx.fillStyle = isSuspicious ? "#ff0000" : "#00ff00";
        ctx.fillRect(x, y - 35, textWidth + 20, 35);

        ctx.fillStyle = "white";
        ctx.fillText(label, x + 10, y - 10);

        const barWidth = Math.max(100, width);
        const barHeight = 8;
        const barX = x;
        const barY = y + height + 10;

        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        ctx.fillRect(barX, barY, barWidth, barHeight);

        ctx.fillStyle = isSuspicious ? "#ff0000" : "#00ff00";
        ctx.fillRect(barX, barY, barWidth * prediction.score, barHeight);

        const enriched = { ...prediction, suspicious: isSuspicious, bbox: prediction.bbox };
        detections.push(enriched);

        try {
          const payload = { ...enriched, timestamp: Date.now() };
          onDetection(payload);
          try { window.dispatchEvent(new CustomEvent('proctor:event', { detail: payload })); } catch(e){}
        } catch (e) {
          console.error('onDetection handler error', e);
        }
      });

      setCurrentDetections(detections);

      if (hasSuspiciousObject && !alertActive) {
        console.log("🚨🚨🚨 SUSPICIOUS OBJECT DETECTED! 🚨🚨🚨");
        setAlertActive(true);
        playAlertSound();
        setStats((prev) => ({ ...prev, suspiciousDetections: prev.suspiciousDetections + 1 }));
        // increase risk
        riskRef.current = Math.min(100, riskRef.current + 15);
        setRiskScore(riskRef.current);
        try { onDetection({ type: 'risk_update', risk: riskRef.current, timestamp: Date.now() }); } catch(e){}
        try { window.dispatchEvent(new CustomEvent('proctor:event', { detail: { type: 'suspicious_detected', risk: riskRef.current, timestamp: Date.now() } })); } catch(e){}

        setTimeout(() => setAlertActive(false), 3000);
      }

      setStats((prev) => ({ ...prev, totalDetections: prev.totalDetections + validPredictions.length }));

      frameCountRef.current++;
      const currentTime = performance.now();
      if (currentTime - lastTimeRef.current >= 1000) {
        const fps = frameCountRef.current;
        console.log(`📈 FPS: ${fps}`);
        setStats((prev) => ({ ...prev, fps }));
        frameCountRef.current = 0;
        lastTimeRef.current = currentTime;
      }
    } catch (error) {
      console.error("❌ Error during detection:", error);
    }
  };

  const startDetection = () => {
    if (!model || !cameraReady) {
      console.log("⚠️ Cannot start detection - model or camera not ready");
      return;
    }

    console.log("🎯 Starting detection loop...");
    setIsDetecting(true);
    isDetectingRef.current = true;

    frameCountRef.current = 0;
    lastTimeRef.current = performance.now();

    const detect = async () => {
      if (isDetectingRef.current) {
        await detectObjects();
        animationRef.current = requestAnimationFrame(detect) as any;
      }
    };

    detect();
  };

  const stopDetection = () => {
    console.log("⏹️ Stopping detection...");
    setIsDetecting(false);
    isDetectingRef.current = false;

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d") as CanvasRenderingContext2D;
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }

    setCurrentDetections([]);
    setStats((prev) => ({ ...prev, fps: 0 }));
  };

  const toggleDetection = () => {
    if (isDetecting) stopDetection(); else startDetection();
  };

  // If requested, auto-start detection when model & camera are ready
  useEffect(() => {
    if (autoStart && model && cameraReady && !isDetectingRef.current) {
      startDetection();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, model, cameraReady]);

  const restartSystem = () => {
    cleanup();
    setModel(null);
    setCameraReady(false);
    setError(null);
    setCurrentDetections([]);
    setStats({ totalDetections: 0, suspiciousDetections: 0, fps: 0 });
    initializeSystem();
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center space-y-4 max-w-md">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto" />
          <h3 className="text-xl font-bold text-white">System Error</h3>
          <p className="text-red-400">{error}</p>
          <button onClick={restartSystem} className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-200 mx-auto">
            <RefreshCw className="w-5 h-5" />
            <span>Restart System</span>
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    if (minimalView) {
      return (
        <div className="w-full h-full bg-black flex items-center justify-center">
          <div className="text-center text-gray-300">Loading AI Model...</div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="text-white text-lg">Loading AI Model...</p>
          <p className="text-gray-400 text-sm">This may take a few moments</p>
        </div>
      </div>
    );
  }

  // Minimal view: only render the live camera feed (canvas overlay + small alert)
  if (minimalView) {
    return (
      <div className="relative w-full h-full bg-black">
        {alertActive && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 bg-red-600/90 text-white rounded-full px-4 py-2 text-sm font-semibold">🚨 CHEATING DETECTED</div>
        )}

        {tabSwitchWarning && (
          <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-30 bg-yellow-500/90 text-black rounded-full px-4 py-2 text-sm font-semibold">⚠️ Tab switched away</div>
        )}

        {splitScreenWarning && (
          <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-30 bg-orange-500/90 text-white rounded-full px-4 py-2 text-sm font-semibold">⚠️ Split-screen detected</div>
        )}

        {noPersonWarning && (
          <div className="absolute top-32 left-1/2 transform -translate-x-1/2 z-30 bg-yellow-700/90 text-white rounded-full px-4 py-2 text-sm font-semibold">⚠️ No person detected</div>
        )}

        {multiplePersonWarning && (
          <div className="absolute top-40 left-1/2 transform -translate-x-1/2 z-30 bg-red-700/90 text-white rounded-full px-4 py-2 text-sm font-semibold">🚨 Multiple persons detected</div>
        )}

        <div className="relative w-full h-full">
          <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} autoPlay muted playsInline />
          <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
        </div>

        {!cameraReady && (
          <div className="absolute inset-0 z-40 flex items-center justify-center">
            <div className="bg-black/70 p-6 rounded-lg text-center">
              <div className="text-white mb-3">Camera not active</div>
              {error && <div className="text-sm text-yellow-200 mb-2">{error}</div>}
              <div className="flex items-center justify-center">
                <button onClick={() => requestCamera()} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded">Start Camera</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  

  return (
    <div className="space-y-6">
      {alertActive && (
        <div className="bg-red-600/90 border border-red-500 rounded-lg p-4 animate-pulse">
          <div className="flex items-center justify-center space-x-3">
            <AlertTriangle className="w-6 h-6 text-white" />
            <span className="text-white font-bold text-lg">🚨 CHEATING DETECTED! 🚨</span>
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
        </div>
      )}

      {tabSwitchWarning && (
        <div className="bg-yellow-600/90 border border-yellow-400 rounded-lg p-4 animate-pulse mb-4">
          <div className="flex items-center justify-center space-x-3">
            <AlertTriangle className="w-6 h-6 text-white" />
            <span className="text-white font-bold text-lg">⚠️ Tab Switching Detected!</span>
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
        </div>
      )}

      {multiplePersonWarning && (
        <div className="bg-red-700/90 border border-red-400 rounded-lg p-4 animate-pulse mb-4">
          <div className="flex items-center justify-center space-x-3">
            <AlertTriangle className="w-6 h-6 text-white" />
            <span className="text-white font-bold text-lg">🚨 More Than One Person Detected!</span>
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
        </div>
      )}

      {splitScreenWarning && (
        <div className="bg-orange-600/90 border border-orange-400 rounded-lg p-4 animate-pulse mb-4">
          <div className="flex items-center justify-center space-x-3">
            <AlertTriangle className="w-6 h-6 text-white" />
            <span className="text-white font-bold text-lg">⚠️ Split-Screen or Minimized Window Detected!</span>
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
        </div>
      )}

      <div className="flex justify-center space-x-4">
        {devices.length > 0 && (
          <div className="flex items-center">
            <select
              value={selectedDeviceId ?? ""}
              onChange={(e) => {
                const id = e.target.value || null;
                setSelectedDeviceId(id);
                if (id) {
                  setupCamera(id).catch((err) => console.error("Failed to switch camera", err));
                }
              }}
              className="bg-gray-800 text-white px-3 py-2 rounded-md mr-2"
            >
              <option value="">Default Camera</option>
              {devices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>{d.label || d.deviceId}</option>
              ))}
            </select>
          </div>
        )}
        <button onClick={toggleDetection} disabled={!model || !cameraReady} className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${isDetecting ? "bg-red-600 hover:bg-red-700 text-white" : "bg-green-600 hover:bg-green-700 text-white"} disabled:opacity-50 disabled:cursor-not-allowed`}>
          {isDetecting ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          <span>{isDetecting ? "Stop" : "Start"} Detection</span>
        </button>

        <button onClick={() => (settings.alertSound = !settings.alertSound)} className="flex items-center space-x-2 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-all duration-200">
          {settings.alertSound ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>

        <button onClick={restartSystem} className="flex items-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-200">
          <RefreshCw className="w-5 h-5" />
        </button>
        {!cameraReady && (
          <button onClick={() => requestCamera()} className="flex items-center space-x-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all duration-200">
            <Camera className="w-4 h-4" />
            <span>Start Camera</span>
          </button>
        )}
      </div>

      <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
        <h3 className="text-yellow-300 font-bold mb-2">🧪 Test Detection (try these)</h3>
        <div className="text-yellow-200 text-sm mb-2">Tip: Move yourself (person) in front of the camera to test person-detection.</div>

        <div className="max-h-40 overflow-y-auto pr-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <div className="text-yellow-200">👤 Person</div>
            <div className="text-yellow-200">📱 Cell Phone</div>
            <div className="text-yellow-200">📖 Book</div>
            <div className="text-yellow-200">🍎 Apple</div>
            <div className="text-yellow-200">☕ Cup</div>
            <div className="text-yellow-200">✂️ Scissors</div>
            <div className="text-yellow-200">🖱️ Mouse</div>
            <div className="text-yellow-200">⌨️ Keyboard</div>
            <div className="text-yellow-200">🍌 Banana</div>
          </div>
        </div>

        <p className="text-yellow-300 text-xs mt-2">Hold objects clearly in front of the camera. Detection threshold set to 25% for maximum sensitivity!</p>
      </div>

      <div className="bg-gray-900/50 rounded-lg p-4 text-xs text-gray-400">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>Model: {model ? "✅ Loaded" : "❌ Not loaded"}</div>
          <div>Camera: {cameraReady ? "✅ Ready" : "❌ Not ready"}</div>
          <div>Backend: {tf.getBackend()}</div>
          <div>Detection: {isDetecting ? "🟢 Running" : "🔴 Stopped"}</div>
          <div>Threshold: 25% (Ultra Low)</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="bg-black rounded-xl overflow-hidden border border-red-500/20 relative">
            <div className="bg-gray-900 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Camera className="w-4 h-4 text-red-400" />
                <span className="text-red-400 text-sm font-medium">Live Camera Feed</span>
                {isDetecting && <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>}
              </div>
              <span className="text-gray-400 text-sm">{videoRef.current ? `${videoRef.current.videoWidth}x${videoRef.current.videoHeight}` : "640x480"} • {stats.fps} FPS</span>
            </div>

            <div className="relative" style={{ height: '420px' }}>
              <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'contain' }} autoPlay muted playsInline />
              <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-red-500/20">
            <h3 className="text-lg font-bold text-white mb-4">Detection Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between"><span className="text-gray-300">Status:</span><span className={`font-medium ${isDetecting ? "text-green-400" : "text-gray-400"}`}>{isDetecting ? "🟢 Active" : "🔴 Stopped"}</span></div>
              <div className="flex justify-between"><span className="text-gray-300">FPS:</span><span className="text-white font-medium">{stats.fps}</span></div>
              <div className="flex justify-between"><span className="text-gray-300">Objects Detected:</span><span className="text-white font-medium">{currentDetections.length}</span></div>
              <div className="flex justify-between"><span className="text-gray-300">Suspicious Objects:</span><span className="text-red-400 font-medium">{currentDetections.filter((d) => d.suspicious).length}</span></div>
              <div className="flex justify-between"><span className="text-gray-300">Total Alerts:</span><span className="text-red-400 font-medium">{stats.suspiciousDetections}</span></div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-red-500/20">
            <h3 className="text-lg font-bold text-white mb-4">Live Detections</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {currentDetections.map((detection, index) => (
                <div key={index} className={`p-3 rounded-lg border ${detection.suspicious ? "bg-red-900/20 border-red-500/30" : "bg-green-900/20 border-green-500/30"}`}>
                  <div className="flex justify-between items-center"><span className="text-white font-medium">{detection.class}</span><span className="text-sm text-gray-300">{Math.round(detection.score * 100)}%</span></div>
                  {detection.suspicious && (<div className="text-xs text-red-400 mt-1 flex items-center"><AlertTriangle className="w-3 h-3 mr-1" />🚨 Suspicious Object</div>)}
                </div>
              ))}

              {currentDetections.length === 0 && (<div className="text-center text-gray-400 py-8">{isDetecting ? "👀 Scanning for objects..." : "Start detection to see results"}</div>)}
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-red-500/20">
            <h3 className="text-lg font-bold text-white mb-4">Model Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-300">Model:</span><span className="text-red-300">COCO-SSD</span></div>
              <div className="flex justify-between"><span className="text-gray-300">Backend:</span><span className="text-red-300">{tf.getBackend()}</span></div>
              <div className="flex justify-between"><span className="text-gray-300">Threshold:</span><span className="text-red-300">25% (Ultra Sensitive)</span></div>
              <div className="flex justify-between"><span className="text-gray-300">Classes:</span><span className="text-red-300">{settings.suspiciousClasses.length} suspicious</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeDetection;
