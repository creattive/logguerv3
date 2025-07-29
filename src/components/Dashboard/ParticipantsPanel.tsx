import React from 'react';
import { useApp } from '../../contexts/AppContext';

const ParticipantsPanel: React.FC = () => {
  const { state, dispatch } = useApp();
  const [selectedParticipants, setSelectedParticipants] = React.useState<string[]>([]);
  
  // Sincronizar com o estado global
  React.useEffect(() => {
    setSelectedParticipants(state.selectedParticipants);
  }, [state.selectedParticipants]);

  const toggleParticipant = (participantId: string) => {
    const newSelection = selectedParticipants.includes(participantId) 
      ? selectedParticipants.filter(id => id !== participantId)
      : [...selectedParticipants, participantId];
    
    console.log('👥 Atualizando seleção de participantes:', newSelection);
    setSelectedParticipants(newSelection);
    dispatch({ type: 'SET_SELECTED_PARTICIPANTS', payload: newSelection });
  };

  // Participantes com avatars padrão
  const participantsWithAvatars = state.participants.map(participant => ({
    ...participant,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${participant.name}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`
  }));

  return (
    <div className={`${state.darkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-xl border-2 ${state.darkMode ? 'border-gray-700' : 'border-gray-200'} h-full`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-t-2xl p-4">
        <h2 className="text-xl font-bold text-black text-center">
          PARTICIPANTES
        </h2>
      </div>

      {/* Grid de Participantes */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-3">
          {participantsWithAvatars.map((participant, index) => (
            <button
              key={participant.id}
              onClick={() => toggleParticipant(participant.id)}
              className={`relative aspect-square rounded-xl border-3 transition-all duration-200 overflow-hidden group ${
                selectedParticipants.includes(participant.id)
                  ? 'border-green-500 bg-green-500/20 scale-95'
                  : 'border-gray-300 hover:border-blue-400 hover:scale-105'
              }`}
              title={`${participant.name} - ALT+${index + 1}`}
            >
              {/* Avatar */}
              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                <img 
                  src={participant.avatar} 
                  alt={participant.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Nome */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs font-bold p-1 text-center">
                {participant.name.split(' ')[0]}
                <div className="text-[10px] opacity-75">ALT+{index + 1}</div>
              </div>

              {/* Indicador de seleção */}
              {selectedParticipants.includes(participant.id) && (
                <div className="absolute top-1 right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
              )}

              {/* Coração para favoritos */}
              <div className="absolute top-1 left-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">❤️</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ParticipantsPanel;