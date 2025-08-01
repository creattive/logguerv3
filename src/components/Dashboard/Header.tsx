import React, { useState } from 'react';
import { Moon, Sun, LogOut, User, Clock, Edit3, RotateCcw, Settings, Mic, MicOff, Wifi, WifiOff, Volume2 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useFirebase } from '../../hooks/useFirebase';
import { useToast } from '../../hooks/useToast';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useLTCTimecode } from '../../hooks/useLTCTimecode';
import AdminPanel from './AdminPanel';
import KeyboardShortcutsHelp from './KeyboardShortcutsHelp';
import Analytics from './Analytics';

const Header: React.FC = () => {
  const { state, dispatch } = useApp();
  const { logout } = useFirebase();
  const { success, error } = useToast();
  useKeyboardShortcuts();
  const { 
    isLTCAvailable, 
    isLTCActive, 
    ltcTimecode, 
    ltcSignalStrength, 
    startLTCDetection, 
    stopLTCDetection,
    error: ltcError 
  } = useLTCTimecode();
  const [isEditingTimecode, setIsEditingTimecode] = useState(false);
  const [tempTimecode, setTempTimecode] = useState(state.currentTimecode);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Atualizar timecode externo quando recebido
  React.useEffect(() => {
    if (isLTCActive && ltcTimecode) {
      dispatch({ 
        type: 'SET_EXTERNAL_TIMECODE', 
        payload: { 
          isExternal: true, 
          source: 'ltc', 
          timecode: ltcTimecode 
        } 
      });
    } else if (!isLTCActive && state.isExternalTimecode) {
      // Sinal externo perdido - fazer fallback
      const fallbackMode = state.previousTimecodeMode || 'auto';
      dispatch({ 
        type: 'EXTERNAL_TIMECODE_LOST', 
        payload: { fallbackMode } 
      });
      
      const fallbackName = fallbackMode === 'manual' ? 'manual' : 'sistema';
      success('Timecode externo perdido', `Voltando para timecode ${fallbackName}`);
    }
  }, [isLTCActive, ltcTimecode, state.isExternalTimecode, state.previousTimecodeMode, dispatch, success]);

  // Mostrar erro de LTC se houver
  React.useEffect(() => {
    if (ltcError) {
      error('Erro no timecode externo', ltcError);
    }
  }, [ltcError, error]);

  const handleLogout = async () => {
    try {
      await logout();
      success('Logout realizado', 'Até logo!');
    } catch (error) {
      console.error('Logout error:', error);
      error('Erro no logout', 'Tente novamente');
    }
  };

  const handleTimecodeEdit = () => {
    if (isEditingTimecode) {
      // Validar formato do timecode (HH:MM:SS:FF)
      const timecodeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5]?[0-9]):([0-5]?[0-9]):([0-2]?[0-9]|3[0-1])$/;
      
      if (timecodeRegex.test(tempTimecode)) {
        // Salvar o timecode editado e ativar modo manual
        const now = Date.now();
        dispatch({ type: 'SET_TIMECODE_MODE', payload: 'manual' });
        dispatch({ 
          type: 'SET_MANUAL_TIMECODE', 
          payload: { 
            isManual: true, 
            startTime: now, 
            baseTimecode: tempTimecode 
          } 
        });
        setIsEditingTimecode(false);
        success('Timecode atualizado', `Novo timecode: ${tempTimecode}`);
      } else {
        error('Formato inválido', 'Use HH:MM:SS:FF (ex: 12:34:56:15)');
        setTempTimecode(state.currentTimecode);
      }
    } else {
      setTempTimecode(state.currentTimecode);
      setIsEditingTimecode(true);
    }
  };

  const handleSyncTimecode = () => {
    // Voltar para modo automático (horário do sistema)
    dispatch({ type: 'SET_TIMECODE_MODE', payload: 'auto' });
    dispatch({ 
      type: 'SET_MANUAL_TIMECODE', 
      payload: { 
        isManual: false, 
        startTime: undefined, 
        baseTimecode: undefined 
      } 
    });
    setIsEditingTimecode(false);
    success('Timecode sincronizado', 'Voltou para o horário do sistema');
  };

  const handleToggleLTC = async () => {
    if (isLTCActive) {
      stopLTCDetection();
      success('LTC desativado', 'Detecção de timecode externo parada');
    } else {
      try {
        await startLTCDetection();
        success('LTC ativado', 'Detecção de timecode externo iniciada');
      } catch (err: any) {
        error('Erro ao ativar LTC', err.message || 'Não foi possível iniciar a detecção');
      }
    }
  };

  const handleCancelEdit = () => {
    setTempTimecode(state.currentTimecode);
    setIsEditingTimecode(false);
  };

  // Atualizar tempTimecode quando o timecode do estado mudar (apenas se não estiver editando)
  React.useEffect(() => {
    if (!isEditingTimecode) {
      setTempTimecode(state.currentTimecode);
    }
  }, [state.currentTimecode, isEditingTimecode]);

  const isAdmin = state.currentUser?.role === 'admin';

  return (
    <>
      <header className={`${state.darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} border-b sticky top-0 z-50 transition-all duration-200 shadow-lg`}>
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            
            {/* Logo & User Info */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">📺</span>
                </div>
                <div>
                  <h1 className={`text-2xl font-bold ${state.darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Reality Show Logger
                  </h1>
                  <p className={`text-sm ${state.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Sistema de Logging Profissional
                  </p>
                </div>
              </div>

              {/* User Info */}
              <div className={`flex items-center space-x-3 px-4 py-2 rounded-xl ${state.darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isAdmin ? 'bg-gradient-to-r from-red-500 to-pink-600' : 'bg-gradient-to-r from-blue-500 to-purple-600'
                }`}>
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className={`text-sm font-semibold ${state.darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    {state.currentUser?.displayName || 'Operador'}
                  </div>
                  <div className={`text-xs ${
                    isAdmin ? 'text-red-500 font-bold' : state.darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {state.currentUser?.role?.toUpperCase() || 'LOGGER'}
                  </div>
                </div>
              </div>
            </div>

            {/* Timecode Central */}
            <div className="flex flex-col items-center space-y-2">
              <div className={`flex items-center space-x-4 px-6 py-3 rounded-2xl ${state.darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-100 border border-gray-200'} shadow-lg`}>
                <Clock className={`w-6 h-6 ${state.darkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
                
                {isEditingTimecode ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={tempTimecode}
                      onChange={(e) => setTempTimecode(e.target.value)}
                      className={`font-mono text-2xl font-bold bg-transparent border-none outline-none w-32 text-center ${state.darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}
                      placeholder="00:00:00:00"
                      pattern="[0-9]{2}:[0-9]{2}:[0-9]{2}:[0-9]{2}"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleTimecodeEdit();
                        } else if (e.key === 'Escape') {
                          handleCancelEdit();
                        }
                      }}
                      autoFocus
                    />
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className={`font-mono text-2xl font-bold ${state.darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>
                      {state.currentTimecode}
                    </span>
                    
                    {/* Indicadores de modo */}
                    <div className="flex items-center space-x-1">
                      {state.timecodeMode === 'external' && (
                        <div className="flex items-center space-x-1">
                          <span className={`text-xs px-2 py-1 rounded-full font-bold ${state.darkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'}`}>
                            EXT
                          </span>
                          {/* Indicador de força do sinal */}
                          <div className="flex items-center space-x-1">
                            <Volume2 className="w-3 h-3 text-green-500" />
                            <div className="w-8 h-2 bg-gray-300 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-green-500 transition-all duration-200"
                                style={{ width: `${ltcSignalStrength}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {state.timecodeMode === 'manual' && (
                        <span className={`text-xs px-2 py-1 rounded-full font-bold ${state.darkMode ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-800'}`}>
                          MANUAL
                        </span>
                      )}
                      
                      {state.timecodeMode === 'auto' && (
                        <span className={`text-xs px-2 py-1 rounded-full font-bold ${state.darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800'}`}>
                          AUTO
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  {/* Botão LTC */}
                  <button
                    onClick={handleToggleLTC}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      isLTCActive 
                        ? 'bg-green-500 text-white hover:bg-green-600' 
                        : state.darkMode 
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                    title={isLTCActive ? 'Desativar detecção LTC' : 'Ativar detecção LTC (timecode externo)'}
                  >
                    {isLTCActive ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                  </button>
                  
                  <button
                    onClick={handleTimecodeEdit}
                    disabled={state.timecodeMode === 'external'}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      isEditingTimecode 
                        ? 'bg-green-500 text-white hover:bg-green-600' 
                        : state.timecodeMode === 'external'
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-50'
                        : state.darkMode 
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                    title={
                      state.timecodeMode === 'external' 
                        ? 'Edição bloqueada - timecode externo ativo' 
                        : isEditingTimecode ? 'Salvar (Enter)' : 'Editar Timecode'
                    }
                  >
                    {isEditingTimecode ? '✓' : <Edit3 className="w-4 h-4" />}
                  </button>
                  
                  {isEditingTimecode && (
                    <button
                      onClick={handleCancelEdit}
                      className={`p-2 rounded-lg transition-all duration-200 ${state.darkMode ? 'bg-red-700 text-red-300 hover:bg-red-600' : 'bg-red-200 text-red-600 hover:bg-red-300'}`}
                      title="Cancelar (Esc)"
                    >
                      ✕
                    </button>
                  )}
                  
                  <button
                    onClick={handleSyncTimecode}
                    disabled={state.timecodeMode === 'external'}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      state.timecodeMode === 'external'
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-50'
                        : state.timecodeMode === 'auto'
                        ? state.darkMode 
                          ? 'bg-blue-700 text-blue-300 hover:bg-blue-600' 
                          : 'bg-blue-200 text-blue-600 hover:bg-blue-300'
                        : state.darkMode 
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                    title={
                      state.timecodeMode === 'external'
                        ? 'Sincronização bloqueada - timecode externo ativo'
                        : 'Sincronizar com horário do sistema'
                    }
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Status do timecode */}
              <div className={`text-xs text-center ${state.darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {state.timecodeMode === 'external' && (
                  <div className="flex items-center justify-center space-x-2">
                    <span>🎵 Timecode Externo (LTC)</span>
                    <span>•</span>
                    <span>Força: {Math.round(ltcSignalStrength)}%</span>
                  </div>
                )}
                {state.timecodeMode === 'manual' && (
                  <span>⚙️ Timecode Manual Ativo</span>
                )}
                {state.timecodeMode === 'auto' && (
                  <span>🕐 Timecode do Sistema</span>
                )}
              </div>
            </div>

            {/* Data atual */}
            <div className={`px-4 py-2 rounded-xl ${state.darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
              <div className="text-sm font-medium">
                {new Date().toLocaleDateString('pt-BR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-end space-x-4 pb-4">
            {/* Status de conectividade LTC */}
            {isLTCActive && (
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-xl ${
                state.darkMode ? 'bg-green-900/30 border border-green-800' : 'bg-green-100 border border-green-200'
              }`}>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className={`text-xs font-medium ${state.darkMode ? 'text-green-300' : 'text-green-700'}`}>
                  LTC ATIVO
                </span>
              </div>
            )}

            {/* Analytics Button */}
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className={`p-3 rounded-xl transition-all duration-200 ${
                showAnalytics 
                  ? 'bg-purple-500 text-white' 
                  : state.darkMode 
                  ? 'bg-gray-800 text-purple-400 hover:bg-gray-700' 
                  : 'bg-gray-100 text-purple-600 hover:bg-gray-200'
              }`}
              title="Analytics Dashboard"
            >
              📊
            </button>

            {/* Keyboard Shortcuts Help */}
            <KeyboardShortcutsHelp />

            <button
              onClick={() => dispatch({ type: 'TOGGLE_DARK_MODE' })}
              className={`p-3 rounded-xl transition-all duration-200 ${state.darkMode ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {state.darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Admin Settings Button */}
            {isAdmin && (
              <button
                onClick={() => setShowAdminPanel(!showAdminPanel)}
                className={`p-3 rounded-xl transition-all duration-200 ${
                  showAdminPanel 
                    ? 'bg-red-500 text-white' 
                    : state.darkMode 
                    ? 'bg-gray-800 text-red-400 hover:bg-gray-700' 
                    : 'bg-gray-100 text-red-600 hover:bg-gray-200'
                }`}
                title="Painel Administrativo"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={handleLogout}
              className={`p-3 rounded-xl transition-all duration-200 ${state.darkMode ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Admin Panel Modal */}
      {showAdminPanel && isAdmin && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <AdminPanel onClose={() => setShowAdminPanel(false)} />
          </div>
        </div>
      )}

      {/* Analytics Modal */}
      {showAnalytics && (
        <Analytics onClose={() => setShowAnalytics(false)} />
      )}
    </>
  );
};

export default Header;