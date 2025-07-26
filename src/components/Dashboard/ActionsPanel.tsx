import React from 'react';
import { useApp } from '../../contexts/AppContext';

const ActionsPanel: React.FC = () => {
  const { state, dispatch } = useApp();
  const [selectedAction, setSelectedAction] = React.useState<string>('');

  const selectAction = (actionId: string) => {
    setSelectedAction(actionId);
    dispatch({ type: 'SET_SELECTED_ACTION', payload: actionId });
  };

  // Ações com ícones representativos
  const actionsWithIcons = state.actionCategories.map(action => ({
    ...action,
    icon: getActionIcon(action.name)
  }));

  function getActionIcon(name: string): string {
    const iconMap: { [key: string]: string } = {
      'fofoca': '🗣️',
      'cozinhando': '👨‍🍳',
      'dançando': '💃',
      'chorando': '😢',
      'gargalhando': '😂',
      'pulando': '🤸',
      'vt dia': '📺',
      'vt tarde': '🌅',
      'vt noite': '🌙',
      'confesso': '🎤',
      'correndo': '🏃',
      'malhando': '💪',
      'falando mal': '😤',
      'mesa': '🍽️'
    };

    const key = name.toLowerCase();
    for (const [keyword, icon] of Object.entries(iconMap)) {
      if (key.includes(keyword)) {
        return icon;
      }
    }
    return '🎬'; // ícone padrão
  }

  return (
    <div className={`${state.darkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-xl border-2 ${state.darkMode ? 'border-gray-700' : 'border-gray-200'} h-full`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-400 to-blue-500 rounded-t-2xl p-4">
        <h2 className="text-xl font-bold text-white text-center">
          TELA - AÇÃO
        </h2>
      </div>

      {/* Grid de Ações */}
      <div className="p-4">
        <div className="grid grid-cols-4 gap-3">
          {actionsWithIcons.map((action, index) => (
            <button
              key={action.id}
              onClick={() => selectAction(action.id)}
              className={`aspect-square rounded-xl border-3 transition-all duration-200 flex flex-col items-center justify-center p-2 relative ${
                selectedAction === action.id
                  ? 'border-green-500 bg-green-500/20 scale-95'
                  : 'border-gray-300 hover:border-blue-400 hover:scale-105'
              }`}
              style={{ backgroundColor: selectedAction === action.id ? undefined : action.color + '20' }}
              title={`${action.name} - SHIFT+${index + 1}`}
            >
              {/* Ícone */}
              <div className="text-2xl mb-1">
                {action.icon}
              </div>

              {/* Nome */}
              <div className={`text-xs font-bold text-center leading-tight ${state.darkMode ? 'text-white' : 'text-gray-800'}`}>
                {action.name.toUpperCase()}
                <div className="text-[10px] opacity-75 mt-1">SHIFT+{index + 1}</div>
              </div>

              {/* Indicador de seleção */}
              {selectedAction === action.id && (
                <div className="absolute top-1 right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Informações adicionais */}
        <div className="mt-4 grid grid-cols-4 gap-2 text-xs">
          <div className="text-center">
            <div className="font-bold">JUH | JULIETTE |</div>
            <div>MAH - MARCELA</div>
            <div>MARC - MARCELO</div>
            <div>RAFA - RAFAEL</div>
          </div>
          <div className="text-center">
            <div className="font-bold">JUH | JULIETTE |</div>
            <div>MAH - MARCELA</div>
            <div>MARC - MARCELO</div>
            <div>RAFA - RAFAEL</div>
          </div>
          <div className="text-center">
            <div className="font-bold">JUH | JULIETTE |</div>
            <div>MAH - MARCELA</div>
            <div>MARC - MARCELO</div>
            <div>RAFA - RAFAEL</div>
          </div>
          <div className="text-center">
            <div className="font-bold">JUH | JULIETTE |</div>
            <div>MAH - MARCELA</div>
            <div>MARC - MARCELO</div>
            <div>RAFA - RAFAEL</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionsPanel;