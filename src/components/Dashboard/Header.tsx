import React, { useState } from 'react';
import { Moon, Sun, LogOut, User, Clock, Edit3, RotateCcw, Settings } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useFirebase } from '../../hooks/useFirebase';
import { useToast } from '../../hooks/useToast';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import AdminPanel from './AdminPanel';
import KeyboardShortcutsHelp from './KeyboardShortcutsHelp';
import Analytics from './Analytics';

const Header: React.FC = () => {
  const { state, dispatch } = useApp();
  const { logout } = useFirebase();
  const { success, error } = useToast();
  useKeyboardShortcuts();
  const [isEditingTimecode, setIsEditingTimecode] = useState(false);
  const [tempTimecode, setTempTimecode] = useState(state.currentTimecode);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

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
                    LOGGER PRO - REALITYSHOW
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
            <div className="flex items-center space-x-4">
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
                    {state.isManualTimecode && (
                      <span className={`text-xs px-2 py-1 rounded-full font-bold ${state.darkMode ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-800'}`}>
                        MANUAL
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleTimecodeEdit}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      isEditingTimecode 
                        ? 'bg-green-500 text-white hover:bg-green-600' 
                        : state.darkMode 
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                    title={isEditingTimecode ? 'Salvar (Enter)' : 'Editar Timecode'}
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
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      state.isManualTimecode 
                        ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
                        : state.darkMode 
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                    title="Sincronizar com horário do sistema"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
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
            <div className="flex items-center space-x-4">
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