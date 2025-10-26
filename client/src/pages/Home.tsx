import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useBlinkDetector } from "@/hooks/useBlinkDetector";
import { useWakeLock } from "@/hooks/useWakeLock";
import { useNetworkBlock } from "@/hooks/useNetworkBlock";
import { useTheme } from "@/contexts/ThemeContext";
import { useEffect, useRef, useState } from "react";
import {
  Eye,
  EyeOff,
  Play,
  Square,
  ShieldCheck,
  AlertTriangle,
  Camera,
  CameraOff,
  Moon,
  Sun,
} from "lucide-react";

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [measurementDuration, setMeasurementDuration] = useState(60);
  const [remainingTime, setRemainingTime] = useState(0);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const {
    isInitialized,
    isDetecting,
    error: detectorError,
    stats,
    startDetection,
    stopDetection,
  } = useBlinkDetector();

  const { isSupported: wakeLockSupported, requestWakeLock, releaseWakeLock } =
    useWakeLock();

  const {
    isBlocked: networkBlocked,
    blockedAttempts,
    enableNetworkBlock,
    disableNetworkBlock,
  } = useNetworkBlock();

  const handleStartMeasurement = async () => {
    if (!videoRef.current || !isInitialized) return;

    // Enable network blocking
    enableNetworkBlock();

    // Request wake lock
    if (wakeLockSupported) {
      await requestWakeLock();
    }

    // Start detection
    const success = await startDetection(videoRef.current);
    if (!success) {
      disableNetworkBlock();
      releaseWakeLock();
      return;
    }

    setIsMeasuring(true);
    setRemainingTime(measurementDuration);

    // Start countdown timer
    timerRef.current = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          handleStopMeasurement();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleStopMeasurement = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    stopDetection();
    disableNetworkBlock();
    releaseWakeLock();
    setIsMeasuring(false);
    setRemainingTime(0);
  };

  const toggleCamera = () => {
    if (videoRef.current) {
      const stream = videoRef.current.srcObject as MediaStream;
      if (stream) {
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.enabled = !cameraEnabled;
          setCameraEnabled(!cameraEnabled);
        }
      }
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container max-w-6xl py-8 px-4">
        {/* Header */}
        <div className="text-center mb-8 relative">
          <div className="absolute top-0 right-0">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              className="gap-2"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </Button>
          </div>
          <div className="flex items-center justify-center gap-3 mb-4">
            <Eye className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              瞬きカウンター
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            スマートフォンやPCを使用している際に減少しがちな「瞬き回数」を定量的に可視化します。
            すべての処理は端末内で完結し、データは一切送信されません。
          </p>
        </div>

        {/* Security Status */}
        <div className="mb-6">
          <Alert
            className={
              networkBlocked
                ? "border-green-500 bg-green-50 dark:bg-green-950"
                : "border-blue-500 bg-blue-50 dark:bg-blue-950"
            }
          >
            <ShieldCheck
              className={`h-4 w-4 ${networkBlocked ? "text-green-600" : "text-blue-600"}`}
            />
            <AlertDescription>
              {networkBlocked ? (
                <span className="text-green-700 dark:text-green-400">
                  🔒 通信遮断モード有効 - すべてのネットワーク送信がブロックされています
                  {blockedAttempts > 0 && ` (${blockedAttempts}件の送信を遮断)`}
                </span>
              ) : (
                <span className="text-blue-700 dark:text-blue-400">
                  測定開始時に自動的に通信遮断モードが有効化されます
                </span>
              )}
            </AlertDescription>
          </Alert>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Video Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                カメラプレビュー
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                {!isDetecting && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800/50">
                    <p className="text-white text-sm">
                      測定を開始するとカメラが起動します
                    </p>
                  </div>
                )}
                {isDetecting && (
                  <div className="absolute top-4 right-4">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={toggleCamera}
                      className="gap-2"
                    >
                      {cameraEnabled ? (
                        <>
                          <CameraOff className="w-4 h-4" />
                          カメラOFF
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4" />
                          カメラON
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>

              {detectorError && (
                <Alert className="mt-4 border-red-500 bg-red-50 dark:bg-red-950">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700 dark:text-red-400">
                    {detectorError}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Controls and Stats */}
          <div className="space-y-6">
            {/* Measurement Controls */}
            <Card>
              <CardHeader>
                <CardTitle>測定設定</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">測定時間 (秒)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="10"
                    max="600"
                    value={measurementDuration}
                    onChange={(e) =>
                      setMeasurementDuration(Number(e.target.value))
                    }
                    disabled={isMeasuring}
                  />
                  <p className="text-sm text-gray-500">
                    推奨: 60秒 (1分) または 180秒 (3分)
                  </p>
                </div>

                <div className="flex gap-2">
                  {!isMeasuring ? (
                    <Button
                      onClick={handleStartMeasurement}
                      disabled={!isInitialized}
                      className="flex-1 gap-2"
                    >
                      <Play className="w-4 h-4" />
                      測定開始
                    </Button>
                  ) : (
                    <Button
                      onClick={handleStopMeasurement}
                      variant="destructive"
                      className="flex-1 gap-2"
                    >
                      <Square className="w-4 h-4" />
                      測定停止
                    </Button>
                  )}
                </div>

                {!isInitialized && (
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    顔認識モデルを初期化中...
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Real-time Stats */}
            <Card>
              <CardHeader>
                <CardTitle>リアルタイム統計</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isMeasuring && (
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      残り時間
                    </p>
                    <p className="text-3xl font-bold text-blue-600">
                      {formatTime(remainingTime)}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      瞬き回数
                    </p>
                    <p className="text-4xl font-bold text-purple-600">
                      {stats.blinkCount}
                    </p>
                  </div>

                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-950 dark:to-teal-950 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      瞬き/分
                    </p>
                    <p className="text-4xl font-bold text-green-600">
                      {stats.blinksPerMinute}
                    </p>
                  </div>
                </div>

                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    経過時間
                  </p>
                  <p className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
                    {formatTime(stats.elapsedSeconds)}
                  </p>
                </div>

                {!isMeasuring && stats.blinkCount > 0 && (
                  <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
                    <Eye className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-700 dark:text-blue-400">
                      <strong>測定完了!</strong> 通常の瞬き回数は15-20回/分です。
                      {stats.blinksPerMinute < 10 && (
                        <span className="block mt-1">
                          ⚠️ 瞬きが少なめです。定期的に目を休めましょう。
                        </span>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Privacy Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <ShieldCheck className="w-4 h-4" />
                  プライバシー保護
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <ul className="list-disc list-inside space-y-1">
                  <li>すべての処理は端末内で完結</li>
                  <li>映像・データは一切送信されません</li>
                  <li>測定中は通信APIを自動遮断</li>
                  <li>データは保存されず、終了時に破棄</li>
                  {wakeLockSupported && (
                    <li>測定中は画面スリープを防止</li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            このアプリは研究・教育・ヘルスケア目的で安全にご利用いただけます。
          </p>
          <p className="mt-1">
            MediaPipe Face Landmarker を使用 | 完全ローカル動作
          </p>
        </div>
      </div>
    </div>
  );
}

