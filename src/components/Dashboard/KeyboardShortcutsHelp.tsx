import React, { useState } from 'react';
import { Keyboard, X } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const KeyboardShortcutsHelp: React.FC = () => {
  const { state } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  const shortcuts = [
    {
      category: 'Participantes',
      items: state.participants.slice(0, 9).map((participant, index) => ({
        key: `ALT + ${index + 1}`,
        description: `Selecionar/Deselecionar ${participant.name}`
      }))
    },
    {
      category: 'Locais',
      items: state.locations.slice(0, 9).map((location, index) => ({
        key: `CTRL + ${index + 1}`,
        description: `Selecionar ${location.name}`
      }))
    },
    {
      category: 'Ações',
      items: state.actionCategories.slice(0, 9).map((action, index) => ({
        key: `SHIFT + ${index + 1}`,
        description: `Selecionar ${action.name}`
      }))
    },
    {
      category: 'Geral',
      items: [
        { key: 'F2', description: 'Focar no campo de notas' },
        { key: 'ESC', description: 'Limpar todas as seleções' },
        { key: 'ENTER', description: 'Enviar log (quando no campo de notas)' }
      ]
    }
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`p-3 rounded-xl transition-all duration-200 ${
          state.darkMode 
            ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
        title="Atalhos de Teclado"
      >
        <Keyboard className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`max-w-2xl w-full rounded-xl p-6 ${
            state.darkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'
          } shadow-2xl max-h-[80vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-2xl font-bold ${state.darkMode ? 'text-white' : 'text-gray-900'}`}>
                ⌨️ Atalhos de Teclado
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  state.darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                }`}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {shortcuts.map((category) => (
                <div key={category.category}>
                  <h3 className={`text-lg font-semibold mb-3 ${
                    state.darkMode ? 'text-cyan-400' : 'text-cyan-600'
                  }`}>
                    {category.category}
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {category.items.map((shortcut, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          state.darkMode ? 'bg-gray-800' : 'bg-gray-50'
                        }`}
                      >
                        <span className={`text-sm ${
                          state.darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {shortcut.description}
                        </span>
                        <kbd className={`px-2 py-1 text-xs font-mono rounded border ${
                          state.darkMode 
                            ? 'bg-gray-700 border-gray-600 text-gray-300'
                            : 'bg-white border-gray-300 text-gray-700'
                        }`}>
                          {shortcut.key}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className={`mt-6 p-4 rounded-lg ${
              state.darkMode ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'
            }`}>
              <p className={`text-sm ${
                state.darkMode ? 'text-blue-300' : 'text-blue-700'
              }`}>
                💡 <strong>Dica:</strong> Os atalhos não funcionam quando você está digitando em campos de texto.
                Use ESC para limpar todas as seleções rapidamente.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default KeyboardShortcutsHelp;