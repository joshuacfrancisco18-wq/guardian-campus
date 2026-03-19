import * as faceapi from 'face-api.js';

let modelsLoaded = false;

export const loadFaceModels = async () => {
  if (modelsLoaded) return;
  const MODEL_URL = '/models';
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
  ]);
  modelsLoaded = true;
};

export const detectFace = async (video: HTMLVideoElement) => {
  return faceapi
    .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
    .withFaceLandmarks()
    .withFaceDescriptor()
    .withFaceExpressions();
};

// Eye Aspect Ratio for blink detection
export const getEAR = (landmarks: faceapi.FaceLandmarks68) => {
  const pts = landmarks.positions;
  // Left eye: points 36-41, Right eye: points 42-47
  const leftEAR = eyeAspectRatio(pts, [36, 37, 38, 39, 40, 41]);
  const rightEAR = eyeAspectRatio(pts, [42, 43, 44, 45, 46, 47]);
  return (leftEAR + rightEAR) / 2;
};

const eyeAspectRatio = (pts: faceapi.Point[], indices: number[]) => {
  const p = indices.map(i => pts[i]);
  const vertical1 = dist(p[1], p[5]);
  const vertical2 = dist(p[2], p[4]);
  const horizontal = dist(p[0], p[3]);
  return (vertical1 + vertical2) / (2 * horizontal);
};

const dist = (a: faceapi.Point, b: faceapi.Point) =>
  Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);

// Head pose estimation from nose tip position
export const getNosePosition = (landmarks: faceapi.FaceLandmarks68) => {
  const nose = landmarks.positions[30]; // Nose tip
  return { x: nose.x, y: nose.y };
};

// Anti-spoofing: check face texture variance (real faces have more variance across frames)
export const checkTextureVariance = (descriptors: Float32Array[]): boolean => {
  if (descriptors.length < 3) return false;
  let totalVariance = 0;
  for (let i = 1; i < descriptors.length; i++) {
    let diff = 0;
    for (let j = 0; j < descriptors[i].length; j++) {
      diff += Math.abs(descriptors[i][j] - descriptors[i - 1][j]);
    }
    totalVariance += diff / descriptors[i].length;
  }
  const avgVariance = totalVariance / (descriptors.length - 1);
  // Real faces have micro-variations; photos/screens have very low variance
  return avgVariance > 0.001 && avgVariance < 0.5;
};

// Euclidean distance between two descriptors
export const euclideanDistance = (a: Float32Array, b: Float32Array): number => {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += (a[i] - b[i]) ** 2;
  }
  return Math.sqrt(sum);
};
