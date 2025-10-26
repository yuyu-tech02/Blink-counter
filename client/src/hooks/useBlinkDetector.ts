import { useEffect, useRef, useState } from "react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

export interface BlinkStats {
  blinkCount: number;
  blinksPerMinute: number;
  elapsedSeconds: number;
}

interface UseBlinkDetectorOptions {
  onBlinkDetected?: () => void;
  onStatsUpdate?: (stats: BlinkStats) => void;
  smoothingWindow?: number;
  blinkThreshold?: number;
}

export function useBlinkDetector(options: UseBlinkDetectorOptions = {}) {
  const {
    onBlinkDetected,
    onStatsUpdate,
    smoothingWindow = 3,
    blinkThreshold = 0.3,
  } = options;

  const [isInitialized, setIsInitialized] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<BlinkStats>({
    blinkCount: 0,
    blinksPerMinute: 0,
    elapsedSeconds: 0,
  });

  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Blink detection state
  const blinkCountRef = useRef(0);
  const leftEyeScoresRef = useRef<number[]>([]);
  const rightEyeScoresRef = useRef<number[]>([]);
  const wasBlinkingRef = useRef(false);
  const blinkStartTimeRef = useRef<number | null>(null);
  const lastNosePositionRef = useRef<{ x: number; y: number } | null>(null);

  // Initialize MediaPipe Face Landmarker
  useEffect(() => {
    let mounted = true;

    async function initializeFaceLandmarker() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm"
        );

        if (!mounted) return;

        const landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU",
          },
          outputFaceBlendshapes: true,
          runningMode: "VIDEO",
          numFaces: 1,
        });

        if (!mounted) return;

        faceLandmarkerRef.current = landmarker;
        setIsInitialized(true);
        setError(null);
      } catch (err) {
        if (!mounted) return;
        console.error("Failed to initialize Face Landmarker:", err);
        setError("顔認識モデルの初期化に失敗しました");
      }
    }

    initializeFaceLandmarker();

    return () => {
      mounted = false;
      if (faceLandmarkerRef.current) {
        faceLandmarkerRef.current.close();
        faceLandmarkerRef.current = null;
      }
    };
  }, []);

  // Start camera and detection
  const startDetection = async (videoElement: HTMLVideoElement) => {
    if (!isInitialized || !faceLandmarkerRef.current) {
      setError("顔認識モデルが初期化されていません");
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });

      videoElement.srcObject = stream;
      await videoElement.play();

      videoRef.current = videoElement;
      streamRef.current = stream;
      startTimeRef.current = Date.now();
      blinkCountRef.current = 0;
      leftEyeScoresRef.current = [];
      rightEyeScoresRef.current = [];
      wasBlinkingRef.current = false;
      blinkStartTimeRef.current = null;
      lastNosePositionRef.current = null;

      setIsDetecting(true);
      setError(null);
      setStats({
        blinkCount: 0,
        blinksPerMinute: 0,
        elapsedSeconds: 0,
      });

      detectBlinks();
      return true;
    } catch (err) {
      console.error("Failed to start camera:", err);
      setError("カメラの起動に失敗しました。権限を確認してください。");
      return false;
    }
  };

  // Stop detection and release camera
  const stopDetection = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current = null;
    }

    setIsDetecting(false);
    startTimeRef.current = null;
  };

  // Blink detection loop
  const detectBlinks = () => {
    if (
      !faceLandmarkerRef.current ||
      !videoRef.current ||
      !startTimeRef.current
    ) {
      return;
    }

    const video = videoRef.current;
    const landmarker = faceLandmarkerRef.current;

    try {
      const nowMs = performance.now();
      const results = landmarker.detectForVideo(video, nowMs);

      if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
        const blendshapes = results.faceBlendshapes[0].categories;

        const leftEyeBlink = blendshapes.find(
          (b) => b.categoryName === "eyeBlinkLeft"
        );
        const rightEyeBlink = blendshapes.find(
          (b) => b.categoryName === "eyeBlinkRight"
        );

        if (leftEyeBlink && rightEyeBlink) {
          // Add scores to smoothing window
          leftEyeScoresRef.current.push(leftEyeBlink.score);
          rightEyeScoresRef.current.push(rightEyeBlink.score);

          if (leftEyeScoresRef.current.length > smoothingWindow) {
            leftEyeScoresRef.current.shift();
          }
          if (rightEyeScoresRef.current.length > smoothingWindow) {
            rightEyeScoresRef.current.shift();
          }

          // Calculate smoothed average
          const avgLeft =
            leftEyeScoresRef.current.reduce((a, b) => a + b, 0) /
            leftEyeScoresRef.current.length;
          const avgRight =
            rightEyeScoresRef.current.reduce((a, b) => a + b, 0) /
            rightEyeScoresRef.current.length;

          // Check for head movement using nose position
          let isHeadStable = true;
          if (results.faceLandmarks && results.faceLandmarks.length > 0) {
            const noseTip = results.faceLandmarks[0][1]; // Nose tip landmark
            if (lastNosePositionRef.current) {
              const movement = Math.sqrt(
                Math.pow(noseTip.x - lastNosePositionRef.current.x, 2) +
                  Math.pow(noseTip.y - lastNosePositionRef.current.y, 2)
              );
              // If head moved more than 5% of frame, consider it unstable
              isHeadStable = movement < 0.05;
            }
            lastNosePositionRef.current = { x: noseTip.x, y: noseTip.y };
          }

          // Check if both eyes are closing synchronously
          const eyeSyncDiff = Math.abs(avgLeft - avgRight);
          const areBothEyesClosing = eyeSyncDiff < 0.15; // Both eyes should close together

          const avgBlink = (avgLeft + avgRight) / 2;
          const isBlinking = avgBlink > blinkThreshold;

          // Only count as blink if:
          // 1. Both eyes are closing synchronously
          // 2. Head is relatively stable
          // 3. Blink threshold is met
          if (isBlinking && !wasBlinkingRef.current && areBothEyesClosing && isHeadStable) {
            // Blink started
            blinkStartTimeRef.current = nowMs;
          } else if (!isBlinking && wasBlinkingRef.current && blinkStartTimeRef.current) {
            // Blink ended - check duration
            const blinkDuration = nowMs - blinkStartTimeRef.current;
            // Valid blink duration: 50ms - 500ms
            if (blinkDuration >= 50 && blinkDuration <= 500) {
              blinkCountRef.current++;
              onBlinkDetected?.();
            }
            blinkStartTimeRef.current = null;
          }

          wasBlinkingRef.current = isBlinking;
        }
      }

      // Update stats
      const elapsedMs = Date.now() - startTimeRef.current;
      const elapsedSeconds = Math.floor(elapsedMs / 1000);
      const blinksPerMinute =
        elapsedSeconds > 0
          ? Math.round((blinkCountRef.current / elapsedSeconds) * 60)
          : 0;

      const newStats = {
        blinkCount: blinkCountRef.current,
        blinksPerMinute,
        elapsedSeconds,
      };

      setStats(newStats);
      onStatsUpdate?.(newStats);
    } catch (err) {
      console.error("Detection error:", err);
    }

    animationFrameRef.current = requestAnimationFrame(detectBlinks);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopDetection();
    };
  }, []);

  return {
    isInitialized,
    isDetecting,
    error,
    stats,
    startDetection,
    stopDetection,
  };
}

