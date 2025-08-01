import React, { useState, useEffect } from 'react';
import { Activity, Signal, AlertTriangle, CheckCircle, Settings } from 'lucide-react';
import { useLTCTimecode } from '../../hooks/useLTCTimecode';
import { LTCValidator } from '../../utils/ltcValidator';
import { useApp } from '../../contexts/AppContext';

interface LTCMonitorProps {
  isVisible: boolean;
  onClose: () => void;
}

const LTCMonitor: React.FC<LTCMonitorProps> = ({ isVisible, onClose }) => {
  const { state } = useApp();
  const { 
    isLTCActive, 
    ltcTimecode, 
    ltcSignalStrength, 
    ltcFrame,
    frameRate,
    dropFrame,
    error 
  } = useLTCTimecode();
  
  const [signalHistory, setSignalHistory] = useState<number[]>([]);
  const [timecodeHistory, setTimecodeHistory] = useState<string[]>([]);
  const [validationResult, setValidationResult] = useState<any>(null);

  // Atualizar histórico de sinal
  useEffect(() => {
    if (isLTCActive) {
      setSignalHistory(prev => {
        const newHistory = [...prev, ltcSignalStrength];
        return newHistory.slice(-50); // Manter últimos 50 valores
      });
    }
  }, [ltcSignalStrength, isLTCActive]);

  // Atualizar histórico de timecode
  useEffect(() => {
    if (ltcTimecode) {
      setTimecodeHistory(prev => {
        const newHistory = [...prev, ltcTimecode];
        return newHistory.slice(-10); // Manter últimos 10 timecodes
      });

      // Validar timecode
      const validation = LTCValidator.validateTimecode(ltcTimecode);
      setValidationResult(validation);
    }
  }, [ltcTimecode]);

  if (!isVisible) return null;

  const avgSignalStrength = signalHistory.length > 0 
    ? signalHistory.reduce((a, b) => a + b, 0) / signalHistory.length 
    : 0;

  const signalConsistency = signalHistory.length > 1
    ? 100 - (Math.max(...signalHistory) - Math.min(...signalHistory))
    : 100;

  const qualityAnalysis = LTCValidator.analyzeSignalQuality(avgSignalStrength, signalConsistency);

  return (
    <div className="fixed bottom-4 right-4 w-80 max-h-96 overflow-y-auto bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Monitor LTC
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Status */}
      <div className="p-4 space-y-4">
        {/* Status Geral */}
        <div className={`p-3 rounded-lg ${
          isLTCActive 
            ? 'bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
            : 'bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
        }`}>
          <div className="flex items-center space-x-2">
            {isLTCActive ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600" />
            )}
            <span className={`text-sm font-medium ${
              isLTCActive ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'
            }`}>
              {isLTCActive ? 'LTC Ativo' : 'LTC Inativo'}
            </span>
          </div>
          {error && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              {error}
            </p>
          )}
        </div>

        {/* Informações do Timecode */}
        {ltcTimecode && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Timecode:</span>
              <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
                {ltcTimecode}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Frame Rate:</span>
              <span className="font-medium">
                {frameRate} fps {dropFrame ? '(Drop)' : '(Non-Drop)'}
              </span>
            </div>
          </div>
        )}

        {/* Força do Sinal */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Força do Sinal:</span>
            <span className="font-medium">{Math.round(ltcSignalStrength)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-200 ${
                ltcSignalStrength > 70 ? 'bg-green-500' :
                ltcSignalStrength > 40 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(100, ltcSignalStrength)}%` }}
            />
          </div>
        </div>

        {/* Gráfico de Sinal */}
        {signalHistory.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Histórico do Sinal:
            </span>
            <div className="flex items-end space-x-1 h-16">
              {signalHistory.slice(-20).map((strength, index) => (
                <div
                  key={index}
                  className={`flex-1 rounded-t transition-all duration-200 ${
                    strength > 70 ? 'bg-green-500' :
                    strength > 40 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ height: `${Math.max(2, (strength / 100) * 100)}%` }}
                  title={`${Math.round(strength)}%`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Qualidade do Sinal */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Qualidade:</span>
            <span className={`font-medium capitalize ${
              qualityAnalysis.quality === 'excellent' ? 'text-green-600' :
              qualityAnalysis.quality === 'good' ? 'text-blue-600' :
              qualityAnalysis.quality === 'fair' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {qualityAnalysis.quality === 'excellent' ? 'Excelente' :
               qualityAnalysis.quality === 'good' ? 'Boa' :
               qualityAnalysis.quality === 'fair' ? 'Regular' : 'Ruim'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Consistência:</span>
            <span className="font-medium">{Math.round(signalConsistency)}%</span>
          </div>
        </div>

        {/* Validação */}
        {validationResult && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              {validationResult.isValid ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-500" />
              )}
              <span className="text-sm font-medium">
                Validação: {validationResult.confidence.toFixed(1)}%
              </span>
            </div>
            
            {validationResult.errors.length > 0 && (
              <div className="text-xs text-red-600 dark:text-red-400">
                {validationResult.errors.map((error, index) => (
                  <div key={index}>• {error}</div>
                ))}
              </div>
            )}
            
            {validationResult.warnings.length > 0 && (
              <div className="text-xs text-yellow-600 dark:text-yellow-400">
                {validationResult.warnings.map((warning, index) => (
                  <div key={index}>• {warning}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recomendações */}
        {qualityAnalysis.recommendations.length > 0 && (
          <div className="space-y-1">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Recomendações:
            </span>
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              {qualityAnalysis.recommendations.map((rec, index) => (
                <div key={index}>• {rec}</div>
              ))}
            </div>
          </div>
        )}

        {/* Histórico de Timecodes */}
        {timecodeHistory.length > 0 && (
          <div className="space-y-1">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Últimos Timecodes:
            </span>
            <div className="text-xs font-mono space-y-1 max-h-20 overflow-y-auto">
              {timecodeHistory.slice(-5).reverse().map((tc, index) => (
                <div key={index} className="text-gray-600 dark:text-gray-400">
                  {tc}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LTCMonitor;