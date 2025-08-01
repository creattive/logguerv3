/**
 * Utilitários para validação e análise de sinais LTC
 */

export interface LTCValidationResult {
  isValid: boolean;
  confidence: number;
  errors: string[];
  warnings: string[];
  frameRate: number | null;
  dropFrame: boolean | null;
}

export class LTCValidator {
  private static readonly VALID_FRAME_RATES = [23.976, 24, 25, 29.97, 30, 50, 59.94, 60];
  private static readonly SYNC_PATTERN = [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1];

  static validateTimecode(timecode: string): LTCValidationResult {
    const result: LTCValidationResult = {
      isValid: true,
      confidence: 100,
      errors: [],
      warnings: [],
      frameRate: null,
      dropFrame: null
    };

    // Verificar formato básico
    const timecodeRegex = /^(\d{2}):(\d{2}):(\d{2})[:;](\d{2})$/;
    const match = timecode.match(timecodeRegex);

    if (!match) {
      result.isValid = false;
      result.confidence = 0;
      result.errors.push('Formato de timecode inválido');
      return result;
    }

    const [, hours, minutes, seconds, frames] = match;
    const separator = timecode.includes(';') ? ';' : ':';
    
    result.dropFrame = separator === ';';

    // Validar valores
    const h = parseInt(hours);
    const m = parseInt(minutes);
    const s = parseInt(seconds);
    const f = parseInt(frames);

    if (h > 23) {
      result.errors.push('Horas inválidas (máximo 23)');
      result.isValid = false;
    }

    if (m > 59) {
      result.errors.push('Minutos inválidos (máximo 59)');
      result.isValid = false;
    }

    if (s > 59) {
      result.errors.push('Segundos inválidos (máximo 59)');
      result.isValid = false;
    }

    // Detectar frame rate baseado no valor máximo de frames
    if (f <= 23) {
      result.frameRate = 24;
    } else if (f <= 24) {
      result.frameRate = 25;
    } else if (f <= 29) {
      result.frameRate = result.dropFrame ? 29.97 : 30;
    } else {
      result.errors.push(`Valor de frame inválido: ${f}`);
      result.isValid = false;
    }

    // Validar drop frame
    if (result.dropFrame && result.frameRate !== 29.97) {
      result.warnings.push('Drop frame usado com taxa diferente de 29.97fps');
      result.confidence -= 20;
    }

    // Validar regras de drop frame
    if (result.dropFrame && result.frameRate === 29.97) {
      if (s === 0 && (f === 0 || f === 1) && m % 10 !== 0) {
        result.warnings.push('Possível erro de drop frame detectado');
        result.confidence -= 10;
      }
    }

    return result;
  }

  static validateLTCFrame(frameData: number[]): LTCValidationResult {
    const result: LTCValidationResult = {
      isValid: true,
      confidence: 100,
      errors: [],
      warnings: [],
      frameRate: null,
      dropFrame: null
    };

    if (frameData.length !== 80) {
      result.isValid = false;
      result.errors.push(`Frame LTC deve ter 80 bits, recebido: ${frameData.length}`);
      return result;
    }

    // Verificar sync pattern
    const syncStart = 64;
    let syncMatches = 0;
    
    for (let i = 0; i < this.SYNC_PATTERN.length; i++) {
      if (frameData[syncStart + i] === this.SYNC_PATTERN[i]) {
        syncMatches++;
      }
    }

    const syncConfidence = (syncMatches / this.SYNC_PATTERN.length) * 100;
    
    if (syncConfidence < 80) {
      result.isValid = false;
      result.errors.push(`Sync pattern inválido (${syncConfidence.toFixed(1)}% match)`);
    } else if (syncConfidence < 100) {
      result.warnings.push(`Sync pattern parcialmente corrompido (${syncConfidence.toFixed(1)}% match)`);
      result.confidence -= (100 - syncConfidence);
    }

    // Verificar paridade (se implementada)
    // TODO: Implementar verificação de paridade se necessário

    return result;
  }

  static analyzeSignalQuality(signalStrength: number, consistency: number): {
    quality: 'excellent' | 'good' | 'fair' | 'poor';
    recommendations: string[];
  } {
    const recommendations: string[] = [];
    let quality: 'excellent' | 'good' | 'fair' | 'poor';

    if (signalStrength >= 80 && consistency >= 90) {
      quality = 'excellent';
    } else if (signalStrength >= 60 && consistency >= 75) {
      quality = 'good';
    } else if (signalStrength >= 40 && consistency >= 60) {
      quality = 'fair';
      recommendations.push('Considere aumentar o nível do sinal LTC');
      recommendations.push('Verifique a qualidade dos cabos de áudio');
    } else {
      quality = 'poor';
      recommendations.push('Sinal LTC muito fraco - aumente o nível');
      recommendations.push('Verifique as conexões de áudio');
      recommendations.push('Considere usar um amplificador de sinal');
      recommendations.push('Verifique se não há interferência elétrica');
    }

    if (consistency < 80) {
      recommendations.push('Sinal inconsistente - verifique estabilidade da fonte');
    }

    return { quality, recommendations };
  }

  static formatValidationReport(result: LTCValidationResult): string {
    let report = `Status: ${result.isValid ? '✅ Válido' : '❌ Inválido'}\n`;
    report += `Confiança: ${result.confidence.toFixed(1)}%\n`;
    
    if (result.frameRate) {
      report += `Frame Rate: ${result.frameRate} fps\n`;
    }
    
    if (result.dropFrame !== null) {
      report += `Drop Frame: ${result.dropFrame ? 'Sim' : 'Não'}\n`;
    }

    if (result.errors.length > 0) {
      report += '\n❌ Erros:\n';
      result.errors.forEach(error => report += `  • ${error}\n`);
    }

    if (result.warnings.length > 0) {
      report += '\n⚠️ Avisos:\n';
      result.warnings.forEach(warning => report += `  • ${warning}\n`);
    }

    return report;
  }
}