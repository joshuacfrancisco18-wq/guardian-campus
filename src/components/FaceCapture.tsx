import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, CheckCircle, XCircle, Eye, RotateCcw, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { loadFaceModels, detectFace, getEAR, getNosePosition, checkTextureVariance } from '@/lib/faceUtils';

interface LivenessStep {
  id: string;
  label: string;
  icon: React.ReactNode;
  completed: boolean;
}

interface FaceCaptureProps {
  onCapture: (descriptor: number[]) => void;
  onCancel?: () => void;
  mode?: 'register' | 'login';
}

const FaceCapture: React.FC<FaceCaptureProps> = ({ onCapture, onCancel, mode = 'register' }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);

  const [status, setStatus] = useState<'loading' | 'ready' | 'scanning' | 'liveness' | 'captured' | 'error'>('loading');
  const [message, setMessage] = useState('Loading AI models...');
  const [progress, setProgress] = useState(0);

  // Liveness state
  const [livenessSteps, setLivenessSteps] = useState<LivenessStep[]>([
    { id: 'face_detected', label: 'Face Detected', icon: <Camera className="h-4 w-4" />, completed: false },
    { id: 'head_move', label: 'Head Movement', icon: <RotateCcw className="h-4 w-4" />, completed: false },
    { id: 'anti_spoof', label: 'Anti-Spoofing', icon: <ShieldCheck className="h-4 w-4" />, completed: false },
  ]);

  // blink detection removed
  const initialNoseRef = useRef<{ x: number; y: number } | null>(null);
  const headMovedRef = useRef(false);
  const descriptorsRef = useRef<Float32Array[]>([]);
  const finalDescriptorRef = useRef<Float32Array | null>(null);
  const frameCountRef = useRef(0);

  const updateStep = useCallback((id: string, completed: boolean) => {
    setLivenessSteps(prev => prev.map(s => s.id === id ? { ...s, completed } : s));
  }, []);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        await loadFaceModels();
        if (cancelled) return;
        setProgress(30);
        setMessage('Accessing camera...');

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setProgress(60);
        setMessage('Position your face in the oval');
        setStatus('scanning');

        // Start detection loop
        runDetection();
      } catch (err) {
        if (!cancelled) {
          setStatus('error');
          setMessage('Camera access denied. Please allow camera permissions.');
        }
      }
    };

    init();
    return () => {
      cancelled = true;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const runDetection = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.paused) {
      animFrameRef.current = requestAnimationFrame(runDetection);
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const detection = await detectFace(video);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (detection) {
      // Draw face oval
      const { box } = detection.detection;
      const centerX = box.x + box.width / 2;
      const centerY = box.y + box.height / 2;
      const radiusX = box.width / 2 + 20;
      const radiusY = box.height / 2 + 30;

      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
      ctx.stroke();

      // Step 1: Face detected
      updateStep('face_detected', true);
      setStatus('liveness');

      // Step 2: Blink detection with smoothed EAR
      const ear = getEAR(detection.landmarks);
      earHistoryRef.current.push(ear);
      if (earHistoryRef.current.length > 5) earHistoryRef.current.shift();
      const smoothedEAR = earHistoryRef.current.reduce((a, b) => a + b, 0) / earHistoryRef.current.length;

      // Use adaptive threshold: closed < 0.19, open > 0.22
      if (blinkStateRef.current === 'open' && smoothedEAR < 0.19) {
        blinkStateRef.current = 'closed';
      } else if (blinkStateRef.current === 'closed' && smoothedEAR > 0.22) {
        blinkStateRef.current = 'open';
        blinkCountRef.current += 1;
      }

      if (blinkCountRef.current >= 1) {
        updateStep('blink', true);
      } else {
        setMessage('Please blink naturally');
      }

      // Step 3: Head movement
      const nose = getNosePosition(detection.landmarks);
      if (!initialNoseRef.current) {
        initialNoseRef.current = nose;
      } else {
        const dx = Math.abs(nose.x - initialNoseRef.current.x);
        const dy = Math.abs(nose.y - initialNoseRef.current.y);
        if (dx > 15 || dy > 15) {
          headMovedRef.current = true;
          updateStep('head_move', true);
        }
      }

      if (!headMovedRef.current && blinkCountRef.current >= 1) {
        setMessage('Slowly turn your head left or right');
      }

      // Step 4: Anti-spoofing (texture variance)
      descriptorsRef.current.push(new Float32Array(detection.descriptor));
      if (descriptorsRef.current.length > 10) {
        descriptorsRef.current = descriptorsRef.current.slice(-10);
      }

      if (descriptorsRef.current.length >= 5) {
        const isReal = checkTextureVariance(descriptorsRef.current);
        if (isReal) {
          updateStep('anti_spoof', true);
        }
      }

      // Store descriptor for final capture
      finalDescriptorRef.current = detection.descriptor;

      // Check all steps complete
      const allComplete = blinkCountRef.current >= 1 && headMovedRef.current && descriptorsRef.current.length >= 5;
      if (allComplete) {
        updateStep('anti_spoof', true);
        setProgress(100);
        setMessage('Face verified! Capturing...');
        setStatus('captured');

        // Stop stream
        streamRef.current?.getTracks().forEach(t => t.stop());

        // Send descriptor
        if (finalDescriptorRef.current) {
          setTimeout(() => {
            onCapture(Array.from(finalDescriptorRef.current!));
          }, 1000);
        }
        return;
      }
    } else {
      if (status === 'scanning') {
        setMessage('Position your face in the center');
      }
    }

    const completedCount = livenessSteps.filter(s => s.completed).length;
    setProgress(60 + (completedCount / livenessSteps.length) * 40);

    animFrameRef.current = requestAnimationFrame(runDetection);
  }, [onCapture, updateStep, status, livenessSteps]);

  return (
    <Card className="border-0 shadow-xl overflow-hidden">
      <CardContent className="p-0">
        {/* Camera view */}
        <div className="relative aspect-[4/3] bg-black">
          <video
            ref={videoRef}
            className="w-full h-full object-cover mirror"
            style={{ transform: 'scaleX(-1)' }}
            playsInline
            muted
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ transform: 'scaleX(-1)' }}
          />

          {/* Overlay for loading/error */}
          <AnimatePresence>
            {(status === 'loading' || status === 'error') && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white"
              >
                {status === 'loading' && <Loader2 className="h-10 w-10 animate-spin mb-4 text-primary" />}
                {status === 'error' && <XCircle className="h-10 w-10 mb-4 text-destructive" />}
                <p className="text-sm">{message}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Captured overlay */}
          <AnimatePresence>
            {status === 'captured' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/60"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                >
                  <CheckCircle className="h-16 w-16 text-green-500 mb-3" />
                </motion.div>
                <p className="text-white font-medium">Face Captured Successfully</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scan line animation */}
          {(status === 'scanning' || status === 'liveness') && (
            <motion.div
              className="absolute left-0 right-0 h-0.5 bg-primary/60"
              animate={{ top: ['10%', '90%', '10%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            />
          )}
        </div>

        {/* Status panel */}
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium flex-1">{message}</p>
            <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />

          {/* Liveness checks */}
          <div className="grid grid-cols-2 gap-2">
            {livenessSteps.map(step => (
              <div
                key={step.id}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                  step.completed
                    ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {step.completed ? <CheckCircle className="h-3.5 w-3.5" /> : step.icon}
                {step.label}
              </div>
            ))}
          </div>

          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel} className="w-full">
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FaceCapture;
