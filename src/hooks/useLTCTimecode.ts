import { useState, useEffect, useRef, useCallback } from 'react';

interface LTCTimecodeHook {
  isLTCAvailable: boolean;
  isLTCActive: boolean;
  ltcTimecode: string | null;
  ltcSignalStrength: number;
  startLTCDetection: () => Promise<void>;
  stopLTCDetection: () => Promise<void>;
  error: string | null;
}

class LTCDecoder {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private isRunning = false;
  private onTimecodeCallback: ((timecode: string, strength: number) => void) | null = null;
  private lastValidTimecode: string | null = null;
  private signalStrength = 0;
  private stream: MediaStream | null = null;
  private animationFrameId: number | null = null;

  async initialize(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 48000,
          channelCount: 1,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        } 
      });

      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      this.analyser = this.audioContext.createAnalyser();
      this.microphone = this.audioContext.createMediaStreamSource(this.stream);

      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.1;
      this.microphone.connect(this.analyser);

      console.log('🎵 LTC Decoder initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing LTC Decoder:', error);
      throw error;
    }
  }

  start(onTimecode: (timecode: string, strength: number) => void): void {
    if (!this.analyser || this.isRunning) return;

    this.onTimecodeCallback = onTimecode;
    this.isRunning = true;
    this.processAudio();
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    this.onTimecodeCallback = null;
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        await this.audioContext.close();
      } catch (error) {
        console.warn('Error closing audio context:', error);
      }
      this.audioContext = null;
    }
    
    this.analyser = null;
    this.signalStrength = 0;
    this.lastValidTimecode = null;
  }

  private processAudio(): void {
    if (!this.isRunning || !this.analyser) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    try {
      this.analyser.getByteFrequencyData(dataArray);
    } catch (error) {
      console.error('Error getting frequency data:', error);
      return;
    }

    const ltcDetected = this.detectLTCSignal(dataArray);
    
    if (ltcDetected.detected) {
      this.signalStrength = ltcDetected.strength;
      const timecode = this.decodeLTCTimecode(dataArray);
      
      if (timecode && this.onTimecodeCallback) {
        this.lastValidTimecode = timecode;
        this.onTimecodeCallback(timecode, this.signalStrength);
      }
    } else {
      this.signalStrength = Math.max(0, this.signalStrength - 2);
    }

    this.animationFrameId = requestAnimationFrame(() => this.processAudio());
  }

  private detectLTCSignal(dataArray: Uint8Array): { detected: boolean; strength: number } {
    let totalEnergy = 0;
    let ltcBandEnergy = 0;
    
    for (let i = 0; i < dataArray.length; i++) {
      totalEnergy += dataArray[i];
      if (i >= 50 && i <= 150) {
        ltcBandEnergy += dataArray[i];
      }
    }

    const averageEnergy = totalEnergy / dataArray.length;
    const ltcRatio = totalEnergy > 0 ? ltcBandEnergy / totalEnergy : 0;
    
    const detected = averageEnergy > 20 && ltcRatio > 0.08;
    const strength = Math.min(100, (averageEnergy / 128) * 100);

    return { detected, strength };
  }

  private decodeLTCTimecode(dataArray: Uint8Array): string | null {
    // Simulated LTC decoding - replace with real decoding logic
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const frames = Math.floor(now.getMilliseconds() / 33.33);

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;
  }
}

export const useLTCTimecode = (): LTCTimecodeHook => {
  const [state, setState] = useState({
    isLTCAvailable: false,
    isLTCActive: false,
    ltcTimecode: null as string | null,
    ltcSignalStrength: 0,
    error: null as string | null
  });

  const decoderRef = useRef<LTCDecoder | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initializingRef = useRef(false);

  const handleTimecodeUpdate = useCallback((timecode: string, strength: number) => {
    setState(prev => ({
      ...prev,
      ltcTimecode: timecode,
      ltcSignalStrength: strength,
      isLTCActive: true
    }));
    
    lastUpdateRef.current = Date.now();

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setState(prev => ({
        ...prev,
        isLTCActive: false,
        ltcTimecode: null,
        ltcSignalStrength: 0
      }));
    }, 2000);
  }, []);

  const startLTCDetection = useCallback(async (): Promise<void> => {
    if (initializingRef.current) return;
    
    try {
      initializingRef.current = true;
      setState(prev => ({ ...prev, error: null }));

      if (!decoderRef.current) {
        decoderRef.current = new LTCDecoder();
      }

      await decoderRef.current.initialize();
      decoderRef.current.start(handleTimecodeUpdate);
      
      setState(prev => ({
        ...prev,
        isLTCAvailable: true,
        isLTCActive: true
      }));
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        error: err.message || 'Failed to start LTC detection',
        isLTCAvailable: false,
        isLTCActive: false
      }));
      
      if (decoderRef.current) {
        try {
          await decoderRef.current.stop();
        } catch (stopError) {
          console.warn('Error stopping decoder:', stopError);
        }
        decoderRef.current = null;
      }
    } finally {
      initializingRef.current = false;
    }
  }, [handleTimecodeUpdate]);

  const stopLTCDetection = useCallback(async (): Promise<void> => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (decoderRef.current) {
      try {
        await decoderRef.current.stop();
      } catch (error) {
        console.warn('Error stopping decoder:', error);
      }
      decoderRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isLTCActive: false,
      ltcTimecode: null,
      ltcSignalStrength: 0
    }));
  }, []);

  useEffect(() => {
    const checkBrowserSupport = () => {
      const hasWebAudio = !!(window.AudioContext || (window as any).webkitAudioContext);
      const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      const isSecureContext = window.isSecureContext;

      if (!hasWebAudio || !hasMediaDevices || !isSecureContext) {
        setState(prev => ({
          ...prev,
          error: !hasWebAudio ? 'Web Audio API not supported' :
                !hasMediaDevices ? 'Microphone access not supported' :
                'LTC requires HTTPS or localhost'
        }));
      }
    };

    checkBrowserSupport();

    return () => {
      stopLTCDetection();
    };
  }, [stopLTCDetection]);

  return {
    ...state,
    startLTCDetection,
    stopLTCDetection
  };
};