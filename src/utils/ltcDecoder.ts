/**
 * Real LTC (Linear Timecode) Decoder Implementation
 * Decodifica sinais LTC reais de áudio para timecode SMPTE
 */

export interface LTCFrame {
  hours: number;
  minutes: number;
  seconds: number;
  frames: number;
  dropFrame: boolean;
  colorFrame: boolean;
  frameRate: number;
  userBits: number[];
}

export interface LTCDecoderConfig {
  sampleRate: number;
  frameRate: number; // 24, 25, 29.97, 30
  dropFrame: boolean;
  threshold: number; // Threshold para detecção de bits (0.0 - 1.0)
  filterFreq: number; // Frequência de corte do filtro passa-baixa
}

export class RealLTCDecoder {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private isRunning = false;
  private animationFrameId: number | null = null;
  
  // Configurações do decodificador
  private config: LTCDecoderConfig;
  
  // Buffer para processamento de áudio
  private audioBuffer: Float32Array = new Float32Array(0);
  private bufferSize = 4096;
  
  // Estado do decodificador LTC
  private bitBuffer: number[] = [];
  private syncPattern = [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1]; // LTC sync word
  private lastTransition = 0;
  private bitPeriod = 0;
  private signalLevel = 0;
  
  // Callbacks
  private onTimecodeCallback: ((timecode: string, frame: LTCFrame, strength: number) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;

  constructor(config: Partial<LTCDecoderConfig> = {}) {
    this.config = {
      sampleRate: 48000,
      frameRate: 30,
      dropFrame: false,
      threshold: 0.3,
      filterFreq: 2400,
      ...config
    };
    
    // Calcular período do bit baseado na taxa de frames
    this.bitPeriod = this.config.sampleRate / (this.config.frameRate * 80); // 80 bits por frame LTC
  }

  async initialize(): Promise<void> {
    try {
      // Solicitar acesso ao microfone com configurações específicas para LTC
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.config.sampleRate,
          channelCount: 1,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          latency: 0.01 // Baixa latência para timecode preciso
        }
      });

      // Criar contexto de áudio
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: this.config.sampleRate,
        latencyHint: 'interactive'
      });
      
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      // Configurar nós de áudio
      this.microphone = this.audioContext.createMediaStreamSource(this.stream);
      this.analyser = this.audioContext.createAnalyser();
      
      // Configurar analisador para LTC
      this.analyser.fftSize = 8192;
      this.analyser.smoothingTimeConstant = 0;
      this.analyser.minDecibels = -90;
      this.analyser.maxDecibels = -10;
      
      // Conectar nós
      this.microphone.connect(this.analyser);
      
      console.log('🎵 Real LTC Decoder initialized successfully');
      console.log('📊 Config:', this.config);
      
    } catch (error) {
      console.error('❌ Error initializing Real LTC Decoder:', error);
      throw new Error(`Failed to initialize LTC decoder: ${error}`);
    }
  }

  start(
    onTimecode: (timecode: string, frame: LTCFrame, strength: number) => void,
    onError?: (error: string) => void
  ): void {
    if (!this.analyser || this.isRunning) return;

    this.onTimecodeCallback = onTimecode;
    this.onErrorCallback = onError || null;
    this.isRunning = true;
    
    // Reset decoder state
    this.bitBuffer = [];
    this.lastTransition = 0;
    this.signalLevel = 0;
    
    console.log('🎵 Starting Real LTC decoding...');
    this.processAudio();
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    this.onTimecodeCallback = null;
    this.onErrorCallback = null;
    
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
    this.signalLevel = 0;
    
    console.log('🎵 Real LTC Decoder stopped');
  }

  private processAudio(): void {
    if (!this.isRunning || !this.analyser) return;

    try {
      // Obter dados de áudio em tempo real
      const bufferLength = this.analyser.fftSize;
      const timeDataArray = new Float32Array(bufferLength);
      const freqDataArray = new Uint8Array(this.analyser.frequencyBinCount);
      
      this.analyser.getFloatTimeDomainData(timeDataArray);
      this.analyser.getByteFrequencyData(freqDataArray);
      
      // Calcular força do sinal na faixa LTC (1-2.4kHz)
      this.signalLevel = this.calculateLTCSignalStrength(freqDataArray);
      
      // Processar dados de áudio para decodificação LTC
      if (this.signalLevel > this.config.threshold * 100) {
        this.decodeLTCFromAudio(timeDataArray);
      }
      
    } catch (error) {
      console.error('Error processing audio:', error);
      if (this.onErrorCallback) {
        this.onErrorCallback(`Audio processing error: ${error}`);
      }
    }

    this.animationFrameId = requestAnimationFrame(() => this.processAudio());
  }

  private calculateLTCSignalStrength(freqData: Uint8Array): number {
    // LTC está tipicamente entre 1kHz e 2.4kHz
    const nyquist = this.config.sampleRate / 2;
    const binSize = nyquist / freqData.length;
    
    const startBin = Math.floor(1000 / binSize); // 1kHz
    const endBin = Math.floor(2400 / binSize);   // 2.4kHz
    
    let totalEnergy = 0;
    let ltcBandEnergy = 0;
    
    for (let i = 0; i < freqData.length; i++) {
      totalEnergy += freqData[i];
      if (i >= startBin && i <= endBin) {
        ltcBandEnergy += freqData[i];
      }
    }
    
    const averageEnergy = totalEnergy / freqData.length;
    const ltcRatio = totalEnergy > 0 ? ltcBandEnergy / totalEnergy : 0;
    
    // Calcular força do sinal (0-100)
    const strength = Math.min(100, (averageEnergy / 128) * 100 * (ltcRatio * 5));
    
    return strength;
  }

  private decodeLTCFromAudio(audioData: Float32Array): void {
    // Aplicar filtro passa-baixa para limpar o sinal
    const filteredData = this.applyLowPassFilter(audioData);
    
    // Detectar transições de bit
    const bits = this.detectBitTransitions(filteredData);
    
    // Adicionar bits ao buffer
    this.bitBuffer.push(...bits);
    
    // Manter buffer em tamanho razoável (máximo 160 bits = 2 frames)
    if (this.bitBuffer.length > 160) {
      this.bitBuffer = this.bitBuffer.slice(-160);
    }
    
    // Procurar por sync pattern e decodificar frame
    this.searchAndDecodeFrame();
  }

  private applyLowPassFilter(data: Float32Array): Float32Array {
    // Implementação simples de filtro passa-baixa
    const filtered = new Float32Array(data.length);
    const alpha = 2 * Math.PI * this.config.filterFreq / this.config.sampleRate;
    const a = alpha / (alpha + 1);
    
    filtered[0] = data[0];
    for (let i = 1; i < data.length; i++) {
      filtered[i] = a * data[i] + (1 - a) * filtered[i - 1];
    }
    
    return filtered;
  }

  private detectBitTransitions(audioData: Float32Array): number[] {
    const bits: number[] = [];
    const threshold = this.config.threshold;
    
    // Detectar zero-crossings e transições
    for (let i = 1; i < audioData.length; i++) {
      const current = audioData[i];
      const previous = audioData[i - 1];
      
      // Detectar transição de zero
      if ((previous < -threshold && current > threshold) || 
          (previous > threshold && current < -threshold)) {
        
        const timeSinceLastTransition = i - this.lastTransition;
        
        if (timeSinceLastTransition > this.bitPeriod * 0.5) {
          // Determinar se é bit 0 ou 1 baseado no período
          const bit = timeSinceLastTransition > this.bitPeriod * 1.5 ? 0 : 1;
          bits.push(bit);
          this.lastTransition = i;
        }
      }
    }
    
    return bits;
  }

  private searchAndDecodeFrame(): void {
    // Procurar pelo sync pattern no buffer de bits
    for (let i = 0; i <= this.bitBuffer.length - 80; i++) {
      if (this.matchesSyncPattern(i)) {
        // Encontrou sync pattern, tentar decodificar frame
        const frameData = this.bitBuffer.slice(i, i + 80);
        const ltcFrame = this.decodeLTCFrame(frameData);
        
        if (ltcFrame) {
          const timecodeString = this.formatTimecode(ltcFrame);
          
          if (this.onTimecodeCallback) {
            this.onTimecodeCallback(timecodeString, ltcFrame, this.signalLevel);
          }
          
          // Remover bits processados do buffer
          this.bitBuffer = this.bitBuffer.slice(i + 80);
          return;
        }
      }
    }
  }

  private matchesSyncPattern(startIndex: number): boolean {
    if (startIndex + this.syncPattern.length > this.bitBuffer.length) {
      return false;
    }
    
    // Sync pattern está nos bits 64-79 do frame LTC
    const syncStart = startIndex + 64;
    
    for (let i = 0; i < this.syncPattern.length; i++) {
      if (this.bitBuffer[syncStart + i] !== this.syncPattern[i]) {
        return false;
      }
    }
    
    return true;
  }

  private decodeLTCFrame(frameData: number[]): LTCFrame | null {
    if (frameData.length !== 80) return null;
    
    try {
      // Decodificar campos do timecode (BCD format)
      const frames = this.decodeBCD(frameData.slice(0, 8));
      const seconds = this.decodeBCD(frameData.slice(8, 16));
      const minutes = this.decodeBCD(frameData.slice(16, 24));
      const hours = this.decodeBCD(frameData.slice(24, 32));
      
      // Flags especiais
      const dropFrame = frameData[10] === 1;
      const colorFrame = frameData[11] === 1;
      
      // User bits (podem conter informações adicionais)
      const userBits = [
        frameData[4], frameData[5], frameData[6], frameData[7],
        frameData[12], frameData[13], frameData[14], frameData[15],
        frameData[20], frameData[21], frameData[22], frameData[23],
        frameData[28], frameData[29], frameData[30], frameData[31]
      ];
      
      // Validar valores
      if (frames >= this.config.frameRate || seconds >= 60 || 
          minutes >= 60 || hours >= 24) {
        return null;
      }
      
      return {
        hours,
        minutes,
        seconds,
        frames,
        dropFrame,
        colorFrame,
        frameRate: this.config.frameRate,
        userBits
      };
      
    } catch (error) {
      console.warn('Error decoding LTC frame:', error);
      return null;
    }
  }

  private decodeBCD(bits: number[]): number {
    // Decodificar BCD (Binary Coded Decimal)
    let value = 0;
    for (let i = 0; i < bits.length; i++) {
      if (bits[i] === 1) {
        value += Math.pow(2, i);
      }
    }
    
    // Converter BCD para decimal
    const tens = Math.floor(value / 16);
    const units = value % 16;
    
    return tens * 10 + units;
  }

  private formatTimecode(frame: LTCFrame): string {
    const separator = frame.dropFrame ? ';' : ':';
    
    return `${String(frame.hours).padStart(2, '0')}:${String(frame.minutes).padStart(2, '0')}:${String(frame.seconds).padStart(2, '0')}${separator}${String(frame.frames).padStart(2, '0')}`;
  }

  // Métodos públicos para configuração
  setFrameRate(frameRate: number): void {
    this.config.frameRate = frameRate;
    this.bitPeriod = this.config.sampleRate / (frameRate * 80);
  }

  setThreshold(threshold: number): void {
    this.config.threshold = Math.max(0, Math.min(1, threshold));
  }

  getSignalStrength(): number {
    return this.signalLevel;
  }

  getConfig(): LTCDecoderConfig {
    return { ...this.config };
  }
}