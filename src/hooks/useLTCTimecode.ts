import { useState, useEffect, useRef, useCallback } from 'react';
import { RealLTCDecoder, LTCFrame } from '../utils/ltcDecoder';

interface LTCTimecodeHook {
  isLTCAvailable: boolean;
  isLTCActive: boolean;
  ltcTimecode: string | null;
  ltcSignalStrength: number;
  ltcFrame: LTCFrame | null;
  frameRate: number;
  dropFrame: boolean;
  startLTCDetection: () => Promise<void>;
  stopLTCDetection: () => Promise<void>;
  setFrameRate: (rate: number) => void;
  setThreshold: (threshold: number) => void;
  error: string | null;
}


export const useLTCTimecode = (): LTCTimecodeHook => {
  const [state, setState] = useState({
    isLTCAvailable: false,
    isLTCActive: false,
    ltcTimecode: null as string | null,
    ltcSignalStrength: 0,
    ltcFrame: null as LTCFrame | null,
    frameRate: 30,
    dropFrame: false,
    error: null as string | null
  });

  const decoderRef = useRef<RealLTCDecoder | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initializingRef = useRef(false);

  const handleTimecodeUpdate = useCallback((timecode: string, frame: LTCFrame, strength: number) => {
    console.log('🎵 LTC Timecode received:', { timecode, frame, strength });
    
    setState(prev => ({
      ...prev,
      ltcTimecode: timecode,
      ltcSignalStrength: strength,
      ltcFrame: frame,
      frameRate: frame.frameRate,
      dropFrame: frame.dropFrame,
      isLTCActive: true,
      error: null
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
        ltcFrame: null,
        ltcSignalStrength: 0
      }));
    }, 3000); // Timeout aumentado para 3 segundos
  }, []);

  const handleLTCError = useCallback((error: string) => {
    console.error('🎵 LTC Error:', error);
    setState(prev => ({
      ...prev,
      error,
      isLTCActive: false
    }));
  }, []);

  const startLTCDetection = useCallback(async (): Promise<void> => {
    if (initializingRef.current) return;
    
    try {
      initializingRef.current = true;
      setState(prev => ({ ...prev, error: null }));

      if (!decoderRef.current) {
        decoderRef.current = new RealLTCDecoder({
          sampleRate: 48000,
          frameRate: 30,
          dropFrame: false,
          threshold: 0.3,
          filterFreq: 2400
        });
        
        console.log('🎵 Created new Real LTC Decoder');
      }

      await decoderRef.current.initialize();
      decoderRef.current.start(handleTimecodeUpdate, handleLTCError);
      
      setState(prev => ({
        ...prev,
        isLTCAvailable: true,
        isLTCActive: true,
        error: null
      }));
      
      console.log('🎵 Real LTC Detection started successfully');
    } catch (err: any) {
      console.error('🎵 Failed to start LTC detection:', err);
      setState(prev => ({
        ...prev,
        error: err.message || 'Falha ao iniciar detecção LTC',
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
  }, [handleTimecodeUpdate, handleLTCError]);

  const stopLTCDetection = useCallback(async (): Promise<void> => {
    console.log('🎵 Stopping LTC detection...');
    
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
      ltcFrame: null,
      ltcSignalStrength: 0
    }));
    
    console.log('🎵 LTC detection stopped');
  }, []);

  const setFrameRate = useCallback((rate: number) => {
    if (decoderRef.current) {
      decoderRef.current.setFrameRate(rate);
      setState(prev => ({ ...prev, frameRate: rate }));
      console.log('🎵 LTC Frame rate set to:', rate);
    }
  }, []);

  const setThreshold = useCallback((threshold: number) => {
    if (decoderRef.current) {
      decoderRef.current.setThreshold(threshold);
      console.log('🎵 LTC Threshold set to:', threshold);
    }
  }, []);

  useEffect(() => {
    const checkBrowserSupport = () => {
      const hasWebAudio = !!(window.AudioContext || (window as any).webkitAudioContext);
      const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      const isSecureContext = window.isSecureContext;

      if (!hasWebAudio || !hasMediaDevices || !isSecureContext) {
        setState(prev => ({
          ...prev,
          error: !hasWebAudio ? 'Web Audio API não suportado' :
                !hasMediaDevices ? 'Acesso ao microfone não suportado' :
                'LTC requer HTTPS ou localhost'
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
    stopLTCDetection,
    setFrameRate,
    setThreshold
  };
};