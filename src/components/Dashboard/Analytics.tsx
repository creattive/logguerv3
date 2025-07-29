import React, { useMemo } from 'react';
import { BarChart3, TrendingUp, Users, MapPin, Activity, Tag, Clock, X } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

interface AnalyticsProps {
  onClose: () => void;
}

const Analytics: React.FC<AnalyticsProps> = ({ onClose }) => {
  const { state } = useApp();

  const analytics = useMemo(() => {
    const entries = state.logEntries;
    
    // Tempo de tela por participante
    const participantStats = state.participants.map(participant => {
      const count = entries.filter(entry => 
        entry.participants.includes(participant.id)
      ).length;
      return { name: participant.name, count };
    }).sort((a, b) => b.count - a.count);

    // Locais mais frequentados
    const locationStats = state.locations.map(location => {
      const count = entries.filter(entry => entry.location === location.id).length;
      return { name: location.name, count, color: location.color };
    }).sort((a, b) => b.count - a.count);

    // Ações mais executadas
    const actionStats = state.actionCategories.map(action => {
      const count = entries.filter(entry => entry.actionCategory === action.id).length;
      return { name: action.name, count, color: action.color };
    }).sort((a, b) => b.count - a.count);

    // Tags mais usadas
    const tagStats = state.tags.map(tag => {
      const count = entries.filter(entry => entry.tags.includes(tag.id)).length;
      return { name: tag.name, count, color: tag.color };
    }).sort((a, b) => b.count - a.count);

    // Atividade por hora
    const hourlyActivity = Array.from({ length: 24 }, (_, hour) => {
      const count = entries.filter(entry => {
        const entryHour = new Date(entry.timestamp).getHours();
        return entryHour === hour;
      }).length;
      return { hour: `${hour.toString().padStart(2, '0')}:00`, count };
    });

    // Estatísticas gerais
    const totalEntries = entries.length;
    const activeParticipants = participantStats.filter(p => p.count > 0).length;
    const mostActiveLocation = locationStats[0]?.name || 'N/A';
    const mostCommonAction = actionStats[0]?.name || 'N/A';

    return {
      participantStats,
      locationStats,
      actionStats,
      tagStats,
      hourlyActivity,
      totalEntries,
      activeParticipants,
      mostActiveLocation,
      mostCommonAction
    };
  }, [state.logEntries, state.participants, state.locations, state.actionCategories, state.tags]);

  const maxCount = Math.max(
    ...analytics.participantStats.map(p => p.count),
    ...analytics.locationStats.map(l => l.count),
    ...analytics.actionStats.map(a => a.count)
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`max-w-6xl w-full max-h-[90vh] overflow-y-auto rounded-xl p-6 ${
        state.darkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'
      } shadow-2xl`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-2xl font-bold ${state.darkMode ? 'text-white' : 'text-gray-900'}`}>
            📊 Analytics Dashboard
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-all duration-200 ${
              state.darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
            }`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Estatísticas Gerais */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className={`p-4 rounded-lg ${state.darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <div className="flex items-center space-x-2 mb-2">
              <Activity className="w-5 h-5 text-blue-500" />
              <span className={`text-sm font-medium ${state.darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Total de Logs
              </span>
            </div>
            <div className={`text-2xl font-bold ${state.darkMode ? 'text-white' : 'text-gray-900'}`}>
              {analytics.totalEntries}
            </div>
          </div>

          <div className={`p-4 rounded-lg ${state.darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <div className="flex items-center space-x-2 mb-2">
              <Users className="w-5 h-5 text-green-500" />
              <span className={`text-sm font-medium ${state.darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Participantes Ativos
              </span>
            </div>
            <div className={`text-2xl font-bold ${state.darkMode ? 'text-white' : 'text-gray-900'}`}>
              {analytics.activeParticipants}
            </div>
          </div>

          <div className={`p-4 rounded-lg ${state.darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <div className="flex items-center space-x-2 mb-2">
              <MapPin className="w-5 h-5 text-purple-500" />
              <span className={`text-sm font-medium ${state.darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Local Mais Ativo
              </span>
            </div>
            <div className={`text-lg font-bold ${state.darkMode ? 'text-white' : 'text-gray-900'}`}>
              {analytics.mostActiveLocation}
            </div>
          </div>

          <div className={`p-4 rounded-lg ${state.darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              <span className={`text-sm font-medium ${state.darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Ação Mais Comum
              </span>
            </div>
            <div className={`text-lg font-bold ${state.darkMode ? 'text-white' : 'text-gray-900'}`}>
              {analytics.mostCommonAction}
            </div>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-2 gap-6">
          {/* Tempo de Tela por Participante */}
          <div className={`p-6 rounded-lg ${state.darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <h3 className={`text-lg font-semibold mb-4 flex items-center space-x-2 ${
              state.darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              <Users className="w-5 h-5" />
              <span>Tempo de Tela por Participante</span>
            </h3>
            <div className="space-y-3">
              {analytics.participantStats.map((participant, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-20 text-sm font-medium truncate">
                    {participant.name}
                  </div>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4 relative">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full transition-all duration-500"
                      style={{ width: `${maxCount > 0 ? (participant.count / maxCount) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="w-8 text-sm font-bold text-right">
                    {participant.count}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Locais Mais Frequentados */}
          <div className={`p-6 rounded-lg ${state.darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <h3 className={`text-lg font-semibold mb-4 flex items-center space-x-2 ${
              state.darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              <MapPin className="w-5 h-5" />
              <span>Locais Mais Frequentados</span>
            </h3>
            <div className="space-y-3">
              {analytics.locationStats.map((location, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: location.color }}
                  />
                  <div className="w-20 text-sm font-medium truncate">
                    {location.name}
                  </div>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4 relative">
                    <div
                      className="h-4 rounded-full transition-all duration-500"
                      style={{ 
                        backgroundColor: location.color,
                        width: `${maxCount > 0 ? (location.count / maxCount) * 100 : 0}%` 
                      }}
                    />
                  </div>
                  <div className="w-8 text-sm font-bold text-right">
                    {location.count}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ações Mais Executadas */}
          <div className={`p-6 rounded-lg ${state.darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <h3 className={`text-lg font-semibold mb-4 flex items-center space-x-2 ${
              state.darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              <Activity className="w-5 h-5" />
              <span>Ações Mais Executadas</span>
            </h3>
            <div className="space-y-3">
              {analytics.actionStats.map((action, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: action.color }}
                  />
                  <div className="w-20 text-sm font-medium truncate">
                    {action.name}
                  </div>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4 relative">
                    <div
                      className="h-4 rounded-full transition-all duration-500"
                      style={{ 
                        backgroundColor: action.color,
                        width: `${maxCount > 0 ? (action.count / maxCount) * 100 : 0}%` 
                      }}
                    />
                  </div>
                  <div className="w-8 text-sm font-bold text-right">
                    {action.count}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Nuvem de Tags */}
          <div className={`p-6 rounded-lg ${state.darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <h3 className={`text-lg font-semibold mb-4 flex items-center space-x-2 ${
              state.darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              <Tag className="w-5 h-5" />
              <span>Tags Mais Usadas</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {analytics.tagStats.map((tag, index) => (
                <div
                  key={index}
                  className="px-3 py-1 rounded-full text-white text-sm font-medium flex items-center space-x-2"
                  style={{ 
                    backgroundColor: tag.color,
                    fontSize: `${Math.max(0.75, Math.min(1.2, tag.count / 10))}rem`
                  }}
                >
                  <span>{tag.name}</span>
                  <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-xs">
                    {tag.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Atividade por Hora */}
        <div className={`mt-6 p-6 rounded-lg ${state.darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <h3 className={`text-lg font-semibold mb-4 flex items-center space-x-2 ${
            state.darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            <Clock className="w-5 h-5" />
            <span>Atividade por Hora do Dia</span>
          </h3>
          <div className="flex items-end space-x-1 h-32">
            {analytics.hourlyActivity.map((hour, index) => {
              const maxHourlyCount = Math.max(...analytics.hourlyActivity.map(h => h.count));
              const height = maxHourlyCount > 0 ? (hour.count / maxHourlyCount) * 100 : 0;
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-gradient-to-t from-cyan-500 to-blue-600 rounded-t transition-all duration-500 min-h-[2px]"
                    style={{ height: `${height}%` }}
                    title={`${hour.hour}: ${hour.count} logs`}
                  />
                  <div className={`text-xs mt-1 ${state.darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {index % 4 === 0 ? hour.hour : ''}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;