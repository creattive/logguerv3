import React from 'react';
import { useApp } from '../../contexts/AppContext';

const LocationsPanel: React.FC = () => {
  const { state, dispatch } = useApp();
  const [selectedLocation, setSelectedLocation] = React.useState<string>('');

  const selectLocation = (locationId: string) => {
    setSelectedLocation(locationId);
    dispatch({ type: 'SET_SELECTED_LOCATION', payload: locationId });
  };

  // Locais com ícones representativos
  const locationsWithIcons = state.locations.map(location => ({
    ...location,
    icon: getLocationIcon(location.name)
  }));

  function getLocationIcon(name: string): string {
    const iconMap: { [key: string]: string } = {
      'sala': '🛋️',
      'cozinha': '🍳',
      'quarto': '🛏️',
      'confessional': '🎤',
      'jardim': '🌿',
      'piscina': '🏊',
      'academia': '💪',
      'banheiro': '🚿',
      'varanda': '🌅',
      'mesa': '🍽️'
    };

    const key = name.toLowerCase();
    for (const [keyword, icon] of Object.entries(iconMap)) {
      if (key.includes(keyword)) {
        return icon;
      }
    }
    return '📍'; // ícone padrão
  }

  return (
    <div className={`${state.darkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-xl border-2 ${state.darkMode ? 'border-gray-700' : 'border-gray-200'} h-full`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-400 to-red-500 rounded-t-2xl p-4">
        <h2 className="text-xl font-bold text-white text-center">
          ONDE ELE ESTÁ?
        </h2>
      </div>

      {/* Grid de Locais */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-3">
          {locationsWithIcons.map((location, index) => (
            <button
              key={location.id}
              onClick={() => selectLocation(location.id)}
              className={`aspect-square rounded-xl border-3 transition-all duration-200 flex flex-col items-center justify-center p-2 ${
                selectedLocation === location.id
                  ? 'border-green-500 bg-green-500/20 scale-95'
                  : 'border-gray-300 hover:border-blue-400 hover:scale-105'
              }`}
              style={{ backgroundColor: selectedLocation === location.id ? undefined : location.color + '20' }}
              title={`${location.name} - CTRL+${index + 1}`}
            >
              {/* Ícone */}
              <div className="text-3xl mb-1">
                {location.icon}
              </div>

              {/* Nome */}
              <div className={`text-xs font-bold text-center ${state.darkMode ? 'text-white' : 'text-gray-800'}`}>
                {location.name.toUpperCase()}
                <div className="text-[10px] opacity-75 mt-1">CTRL+{index + 1}</div>
              </div>

              {/* Indicador de seleção */}
              {selectedLocation === location.id && (
                <div className="absolute top-1 right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LocationsPanel;