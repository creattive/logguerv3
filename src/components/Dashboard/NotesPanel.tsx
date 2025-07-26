import React, { useState, useRef } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useToast } from '../../hooks/useToast';
import { v4 as uuidv4 } from 'uuid';

const NotesPanel: React.FC = () => {
  const { state, addLogEntry, dispatch } = useApp();
  const { success, error, warning } = useToast();
  const [notes, setNotes] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleVoiceRecording = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'pt-BR';

      if (isListening) {
        recognition.stop();
        setIsListening(false);
      } else {
        recognition.start();
        setIsListening(true);

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setNotes(prev => prev + (prev ? ' ' : '') + transcript);
          setIsListening(false);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!notes.trim()) return;

    console.log('🔄 Tentando enviar log:', {
      notes: notes.trim(),
      selectedLocation: state.selectedLocation,
      selectedAction: state.selectedAction,
      selectedParticipants: state.selectedParticipants
    });

    // Verificar se tem seleções obrigatórias
    const hasLocation = state.selectedLocation && state.selectedLocation.trim() !== '';
    const hasAction = state.selectedAction && state.selectedAction.trim() !== '';
    
    if (!hasLocation || !hasAction) {
      const missing = [];
      if (!hasLocation) missing.push('Local');
      if (!hasAction) missing.push('Ação');
      
      warning('Seleções obrigatórias', `Selecione: ${missing.join(' e ')} antes de enviar!`);
      return;
    }

    setLoading(true);

    try {
      await addLogEntry({
        timestamp: new Date().toISOString(),
        timecode: state.currentTimecode,
        participants: state.selectedParticipants || [],
        location: state.selectedLocation,
        actionCategory: state.selectedAction,
        tags: state.selectedTags || [],
        notes: notes.trim(),
        updatedAt: new Date().toISOString()
      });

      console.log('✅ Log enviado com sucesso!');

      // Limpar apenas as notas, manter seleções
      setNotes('');
      
      success('Log adicionado', 'Entrada registrada com sucesso!');
      
      // Focar novamente no textarea
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    } catch (error) {
      console.error('❌ Erro ao adicionar log:', error);
      error('Erro ao salvar', 'Não foi possível salvar a entrada. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${state.darkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-xl border-2 ${state.darkMode ? 'border-gray-700' : 'border-gray-200'} h-full flex flex-col`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-green-400 to-emerald-500 rounded-t-2xl p-4">
        <h2 className="text-xl font-bold text-white text-center">
          ESPAÇO PARA O LOGUES ESCREVER
        </h2>
        <p className="text-white/90 text-sm text-center mt-1">
          ENTER para enviar • SHIFT+ENTER para quebrar linha
        </p>
      </div>

      {/* Área de digitação */}
      <div className="flex-1 p-4 flex flex-col">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`w-full h-full p-4 rounded-xl border-2 transition-all duration-200 resize-none text-lg ${
              state.darkMode 
                ? 'bg-gray-800 border-gray-600 text-white focus:border-cyan-500'
                : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-cyan-500'
            } focus:ring-2 focus:ring-cyan-500/20`}
            placeholder="Digite aqui o que está acontecendo... 
            
Pressione ENTER para enviar rapidamente ou SHIFT+ENTER para quebrar linha."
            disabled={loading}
          />

          {/* Botão de voz */}
          <button
            onClick={handleVoiceRecording}
            className={`absolute top-4 right-4 p-3 rounded-xl transition-all duration-200 ${
              isListening
                ? 'bg-red-500 text-white animate-pulse'
                : state.darkMode 
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
            title="Gravação de voz"
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
        </div>

        {/* Botão de envio */}
        <div className="mt-4 flex items-center justify-between">
          <div className={`text-sm ${state.darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {notes.length} caracteres
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={loading || !notes.trim()}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-bold hover:from-cyan-600 hover:to-blue-700 focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Enviando...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>ENVIAR</span>
              </>
            )}
          </button>
        </div>

        {/* Instruções */}
        <div className={`mt-3 p-3 rounded-lg ${state.darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <p className={`text-sm text-center ${state.darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            ⚠️ Selecione um LOCAL e uma AÇÃO antes de enviar
            <br />
            Após ENTER, o conteúdo é gravado com timecode
          </p>
          
          {/* Debug info */}
          {process.env.NODE_ENV === 'development' && (
            <div className={`mt-2 text-xs ${state.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Debug: Local={state.selectedLocation ? '✓' : '✗'} | Ação={state.selectedAction ? '✓' : '✗'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotesPanel;