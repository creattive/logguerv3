import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, AlertCircle } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useToast } from '../../hooks/useToast';
import { v4 as uuidv4 } from 'uuid';

const NotesPanel: React.FC = () => {
  const { state, addLogEntry, dispatch } = useApp();
  const { success, error, warning } = useToast();
  const [notes, setNotes] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // Limpar o reconhecimento quando o componente desmontar
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Verificar se as seleções obrigatórias foram feitas
  const hasRequiredSelections = () => {
    const hasLocation = state.selectedLocation && state.selectedLocation.trim() !== '';
    const hasAction = state.selectedAction && state.selectedAction.trim() !== '';
    return hasLocation && hasAction;
  };

  const handleVoiceRecording = () => {
    // Verificar seleções antes de permitir gravação
    if (!hasRequiredSelections()) {
      const missing = [];
      if (!state.selectedLocation) missing.push('LOCAL');
      if (!state.selectedAction) missing.push('AÇÃO');
      
      warning('Seleções obrigatórias', `Selecione ${missing.join(' e ')} antes de gravar!`);
      return;
    }

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      
      if (isListening) {
        recognitionRef.current.stop();
        setIsListening(false);
        setInterimTranscript('');
        return;
      }

      // Configurar o reconhecimento de fala
      recognitionRef.current = new SpeechRecognition();
      const recognition = recognitionRef.current;
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'pt-BR';

      recognition.onstart = () => {
        setIsListening(true);
        setInterimTranscript('');
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript;
          } else {
            interim += transcript;
          }
        }

        // Atualizar o texto final quando houver resultados finais
        if (final) {
          setNotes(prev => prev + (prev ? ' ' : '') + final);
          setInterimTranscript('');
        } else {
          // Mostrar resultados intermediários
          setInterimTranscript(interim);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Erro no reconhecimento:', event.error);
        setIsListening(false);
        setInterimTranscript('');
      };

      recognition.onend = () => {
        setIsListening(false);
        // Se houver texto intermediário quando terminar, adicionar ao final
        if (interimTranscript) {
          setNotes(prev => prev + (prev ? ' ' : '') + interimTranscript);
          setInterimTranscript('');
        }
      };

      recognition.start();
    } else {
      error('Navegador não suportado', 'Seu navegador não suporta reconhecimento de voz. Tente o Chrome ou Edge.');
    }
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      console.log('🎯 Enter pressionado, chamando handleSubmit');
      handleSubmit();
    }
  };

  const handleTextareaFocus = () => {
    if (!hasRequiredSelections()) {
      const missing = [];
      if (!state.selectedLocation) missing.push('LOCAL');
      if (!state.selectedAction) missing.push('AÇÃO');
      
      warning('Seleções obrigatórias', `Selecione ${missing.join(' e ')} antes de digitar!`);
      
      // Remove o foco do textarea
      if (textareaRef.current) {
        textareaRef.current.blur();
      }
    }
  };

  const handleTextareaClick = () => {
    if (!hasRequiredSelections()) {
      const missing = [];
      if (!state.selectedLocation) missing.push('LOCAL');
      if (!state.selectedAction) missing.push('AÇÃO');
      
      warning('Seleções obrigatórias', `Selecione ${missing.join(' e ')} antes de digitar!`);
    }
  };

  const handleSubmit = async () => {
    console.log('🚀 handleSubmit chamado');
    console.log('📝 Notas atuais:', notes);
    console.log('🔍 Estado atual:', {
      selectedLocation: state.selectedLocation,
      selectedAction: state.selectedAction,
      selectedParticipants: state.selectedParticipants,
      selectedTags: state.selectedTags
    });

    if (!notes.trim()) {
      warning('Campo obrigatório', 'Digite algo antes de enviar!');
      return;
    }

    // Verificar se tem seleções obrigatórias
    if (!hasRequiredSelections()) {
      const missing = [];
      if (!state.selectedLocation) missing.push('Local');
      if (!state.selectedAction) missing.push('Ação');
      
      warning('Seleções obrigatórias', `Selecione: ${missing.join(' e ')} antes de enviar!`);
      return;
    }

    setLoading(true);

    try {
      console.log('📝 Criando entrada de log...');
      await addLogEntry({
        timestamp: new Date().toISOString(),
        timecode: state.currentTimecode,
        participants: state.selectedParticipants || [],
        location: state.selectedLocation,
        actionCategory: state.selectedAction,
        tags: state.selectedTags || [],
        notes: notes.trim()
      });

      console.log('✅ Log enviado com sucesso!');

      // Limpar apenas as notas, manter seleções
      setNotes('');
      setInterimTranscript('');
      
      success('Log adicionado', 'Entrada registrada com sucesso!');
      
      // Focar novamente no textarea
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    } catch (err: any) {
      console.error('❌ Erro ao adicionar log:', err);
      error('Erro ao salvar', `Não foi possível salvar a entrada: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const getSelectionStatus = () => {
    const hasLocation = state.selectedLocation && state.selectedLocation.trim() !== '';
    const hasAction = state.selectedAction && state.selectedAction.trim() !== '';
    
    if (hasLocation && hasAction) {
      return { status: 'ready', message: 'Pronto para digitar!' };
    } else {
      const missing = [];
      if (!hasLocation) missing.push('Local');
      if (!hasAction) missing.push('Ação');
      return { status: 'waiting', message: `Selecione: ${missing.join(' e ')}` };
    }
  };

  const selectionStatus = getSelectionStatus();
  const canType = selectionStatus.status === 'ready';

  return (
    <div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 w-[600px] max-w-[90vw] z-40 ${state.darkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl border-2 ${state.darkMode ? 'border-gray-700' : 'border-gray-200'} flex flex-col`}>
      {/* Header */}
      <div className={`rounded-t-2xl p-4 ${
        canType 
          ? 'bg-gradient-to-r from-green-400 to-emerald-500' 
          : 'bg-gradient-to-r from-red-400 to-red-500'
      }`}>
        <h2 className="text-xl font-bold text-white text-center">
          COMEÇE A DIGITAR OU USE O MIC IA GERAR O QUE VOCÊ FALA.
        </h2>
        <p className="text-white/90 text-sm text-center mt-1">
          {canType ? 'ENTER para enviar • SHIFT+ENTER para quebrar linha' : selectionStatus.message}
        </p>
      </div>

      {/* Área de digitação */}
      <div className="flex-1 p-4 flex flex-col">
        {/* Alerta de seleções obrigatórias */}
        {!canType && (
          <div className="mb-4 flex items-center space-x-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="text-red-500 font-medium text-sm">Seleções obrigatórias pendentes</p>
              <p className="text-red-400 text-xs">
                Selecione {!state.selectedLocation && !state.selectedAction ? 'LOCAL e AÇÃO' : 
                          !state.selectedLocation ? 'LOCAL' : 'AÇÃO'} para começar a digitar
              </p>
            </div>
          </div>
        )}

        <div className="relative">
          <textarea
            ref={textareaRef}
            value={notes + (interimTranscript ? ' ' + interimTranscript : '')}
            onChange={handleNotesChange}
            onKeyDown={handleKeyDown}
            onFocus={handleTextareaFocus}
            onClick={handleTextareaClick}
            className={`w-full h-32 p-4 rounded-xl border-2 transition-all duration-200 resize-none text-lg ${
              !canType
                ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                : state.darkMode 
                ? 'bg-gray-800 border-gray-600 text-white focus:border-cyan-500'
                : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-cyan-500'
            } focus:ring-2 focus:ring-cyan-500/20`}
            placeholder={canType ? "Digite aqui o que está acontecendo ou Clicando no Mic, você fala e a IA transcreve em tempo real)" : "Selecione LOCAL e AÇÃO primeiro..."}
            disabled={loading || !canType}
            readOnly={!canType}
          />

          {/* Indicador de gravação */}
          {isListening && (
            <div className="absolute top-4 left-4 flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
              <span className={`text-sm ${state.darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Estou capturando sua voz...
              </span>
            </div>
          )}

          {/* Botão de voz */}
          <button
            onClick={handleVoiceRecording}
            disabled={!canType}
            className={`absolute top-4 right-4 p-3 rounded-xl transition-all duration-200 ${
              !canType
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : isListening
                ? 'bg-red-500 text-white'
                : state.darkMode 
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
            title={canType ? "Gravação de voz" : "Selecione LOCAL e AÇÃO primeiro"}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
        </div>

        {/* Botão de envio */}
        <div className="mt-4 flex items-center justify-between">
          <div className={`text-sm ${state.darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {notes.length + interimTranscript.length} caracteres
            {isListening && (
              <span className="ml-2 text-cyan-500">● Gravando</span>
            )}
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={loading || !notes.trim() || !canType}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-bold transition-all duration-200 ${
              !canType || !notes.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700 focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2'
            } disabled:opacity-50 disabled:cursor-not-allowed ${
              loading ? 'cursor-wait' : ''
            }`}
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

        {/* Status das seleções */}
        <div className={`mt-3 p-3 rounded-lg ${state.darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <div className={`font-bold ${state.selectedLocation ? 'text-green-500' : 'text-red-500'}`}>
                LOCAL {state.selectedLocation ? '✓' : '✗'}
              </div>
              <div className={`text-xs ${state.darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {state.selectedLocation ? 
                  state.locations.find(l => l.id === state.selectedLocation)?.name || 'Selecionado' : 
                  'Não selecionado'
                }
              </div>
            </div>
            
            <div className="text-center">
              <div className={`font-bold ${state.selectedAction ? 'text-green-500' : 'text-red-500'}`}>
                AÇÃO {state.selectedAction ? '✓' : '✗'}
              </div>
              <div className={`text-xs ${state.darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {state.selectedAction ? 
                  state.actionCategories.find(a => a.id === state.selectedAction)?.name || 'Selecionado' : 
                  'Não selecionado'
                }
              </div>
            </div>
            
            <div className="text-center">
              <div className={`font-bold ${state.selectedParticipants.length > 0 ? 'text-blue-500' : 'text-gray-500'}`}>
                PARTICIPANTES ({state.selectedParticipants.length})
              </div>
              <div className={`text-xs ${state.darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {state.selectedParticipants.length > 0 ? 'Selecionados' : 'Opcional'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotesPanel;