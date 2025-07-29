import React, { useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  MapPin, 
  Activity, 
  Tag, 
  Clock, 
  X,
  Calendar,
  AlertTriangle,
  Percent,
  Award,
  Clock4,
  PieChart
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import dynamic from 'next/dynamic';

// Carregar componentes de gráfico dinamicamente (para melhor performance)
const DynamicBarChart = dynamic(() => import('react-apexcharts'), { ssr: false });
const DynamicPieChart = dynamic(() => import('react-apexcharts'), { ssr: false });
const DynamicLineChart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface AnalyticsProps {
  onClose: () => void;
}

const Analytics: React.FC<AnalyticsProps> = ({ onClose }) => {
  const { state } = useApp();

  const analytics = useMemo(() => {
    const entries = state.logEntries;
    if (entries.length === 0) return null;

    // Tempo de tela por participante (com porcentagem)
    const participantStats = state.participants.map(participant => {
      const count = entries.filter(entry => 
        entry.participants.includes(participant.id)
      ).length;
      return { 
        id: participant.id,
        name: participant.name,
        count,
        percentage: (count / entries.length) * 100
      };
    }).sort((a, b) => b.count - a.count);

    // Locais mais frequentados (com duração média)
    const locationStats = state.locations.map(location => {
      const locationEntries = entries.filter(entry => entry.location === location.id);
      const count = locationEntries.length;
      
      // Calcular tempo médio por local (se houver dados de tempo)
      const avgDuration = locationEntries.length > 0 
        ? locationEntries.reduce((sum, entry) => {
            const duration = entry.duration || 0; // assumindo que duration está em segundos
            return sum + duration;
          }, 0) / locationEntries.length
        : 0;

      return { 
        id: location.id,
        name: location.name, 
        color: location.color,
        count,
        percentage: (count / entries.length) * 100,
        avgDuration: formatDuration(avgDuration)
      };
    }).sort((a, b) => b.count - a.count);

    // Ações mais executadas (com tendência)
    const actionStats = state.actionCategories.map(action => {
      const actionEntries = entries.filter(entry => entry.actionCategory === action.id);
      const count = actionEntries.length;
      
      // Calcular tendência (últimos 7 dias vs período anterior)
      const now = new Date();
      const lastWeekEntries = actionEntries.filter(entry => {
        const entryDate = new Date(entry.timestamp);
        return entryDate > new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      });
      
      const prevWeekEntries = actionEntries.filter(entry => {
        const entryDate = new Date(entry.timestamp);
        return entryDate > new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) && 
               entryDate <= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      });
      
      const trend = prevWeekEntries.length > 0 
        ? ((lastWeekEntries.length - prevWeekEntries.length) / prevWeekEntries.length) * 100
        : lastWeekEntries.length > 0 ? 100 : 0;

      return { 
        id: action.id,
        name: action.name, 
        color: action.color,
        count,
        percentage: (count / entries.length) * 100,
        trend
      };
    }).sort((a, b) => b.count - a.count);

    // Tags mais usadas (com correlações)
    const tagStats = state.tags.map(tag => {
      const count = entries.filter(entry => entry.tags.includes(tag.id)).length;
      
      // Encontrar tags mais frequentemente usadas juntas
      const correlatedTags = {};
      entries.forEach(entry => {
        if (entry.tags.includes(tag.id)) {
          entry.tags.forEach(otherTagId => {
            if (otherTagId !== tag.id) {
              correlatedTags[otherTagId] = (correlatedTags[otherTagId] || 0) + 1;
            }
          });
        }
      });
      
      const topCorrelatedTag = Object.entries(correlatedTags)
        .sort((a, b) => b[1] - a[1])
        .map(([tagId, count]) => {
          const tag = state.tags.find(t => t.id === tagId);
          return tag ? { name: tag.name, count } : null;
        })
        .filter(Boolean)[0];

      return { 
        id: tag.id,
        name: tag.name, 
        color: tag.color,
        count,
        percentage: (count / entries.length) * 100,
        topCorrelatedTag: topCorrelatedTag || null
      };
    }).sort((a, b) => b.count - a.count);

    // Atividade por hora (com comparação diária/semanal)
    const hourlyActivity = Array.from({ length: 24 }, (_, hour) => {
      const count = entries.filter(entry => {
        const entryHour = new Date(entry.timestamp).getHours();
        return entryHour === hour;
      }).length;
      return { hour: `${hour.toString().padStart(2, '0')}:00`, count };
    });

    // Atividade por dia da semana
    const dailyActivity = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map((day, index) => {
      const count = entries.filter(entry => {
        const entryDay = new Date(entry.timestamp).getDay();
        return entryDay === index;
      }).length;
      return { day, count };
    });

    // Duração média por tipo de ação
    const avgDurationByAction = state.actionCategories.map(action => {
      const actionEntries = entries.filter(entry => entry.actionCategory === action.id);
      const avgDuration = actionEntries.length > 0 
        ? actionEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0) / actionEntries.length
        : 0;
      return {
        action: action.name,
        duration: avgDuration,
        formattedDuration: formatDuration(avgDuration)
      };
    }).sort((a, b) => b.duration - a.duration);

    // Estatísticas gerais aprimoradas
    const totalEntries = entries.length;
    const activeParticipants = participantStats.filter(p => p.count > 0).length;
    const mostActiveLocation = locationStats[0]?.name || 'N/A';
    const mostCommonAction = actionStats[0]?.name || 'N/A';
    const busiestHour = hourlyActivity.reduce((max, hour) => hour.count > max.count ? hour : max, hourlyActivity[0]);
    const avgEntriesPerDay = totalEntries / (30 || 1); // assumindo dados de 30 dias

    // Calcular engajamento (participantes ativos por dia)
    const engagementByDay: Record<string, Set<string>> = {};
    entries.forEach(entry => {
      const date = new Date(entry.timestamp).toLocaleDateString();
      if (!engagementByDay[date]) {
        engagementByDay[date] = new Set();
      }
      entry.participants.forEach(participantId => {
        engagementByDay[date].add(participantId);
      });
    });

    const avgDailyEngagement = Object.values(engagementByDay).reduce(
      (sum, participants) => sum + participants.size, 0
    ) / Object.keys(engagementByDay).length;

    return {
      participantStats,
      locationStats,
      actionStats,
      tagStats,
      hourlyActivity,
      dailyActivity,
      avgDurationByAction,
      totalEntries,
      activeParticipants,
      mostActiveLocation,
      mostCommonAction,
      busiestHour,
      avgEntriesPerDay,
      avgDailyEngagement
    };
  }, [state.logEntries, state.participants, state.locations, state.actionCategories, state.tags]);

  // Função para formatar duração
  function formatDuration(seconds: number): string {
    if (!seconds) return '0s';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    return [
      hours > 0 ? `${hours}h` : '',
      minutes > 0 ? `${minutes}m` : '',
      secs > 0 ? `${secs}s` : ''
    ].filter(Boolean).join(' ') || '0s';
  }

  if (!analytics) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className={`max-w-2xl w-full rounded-xl p-6 ${
          state.darkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'
        } shadow-2xl text-center`}>
          <h2 className="text-xl font-bold mb-4">📊 Sem dados para análise</h2>
          <p className="text-gray-500">Comece a registrar entradas para ver as análises</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  // Configurações dos gráficos
  const barChartOptions = {
    chart: {
      type: 'bar',
      height: 350,
      toolbar: {
        show: false
      },
      background: 'transparent'
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: false,
        distributed: true
      }
    },
    dataLabels: {
      enabled: false
    },
    xaxis: {
      categories: analytics.participantStats.map(p => p.name),
      labels: {
        style: {
          colors: state.darkMode ? '#fff' : '#000'
        }
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: state.darkMode ? '#fff' : '#000'
        }
      }
    },
    tooltip: {
      theme: state.darkMode ? 'dark' : 'light'
    },
    grid: {
      borderColor: state.darkMode ? '#374151' : '#e5e7eb'
    }
  };

  const pieChartOptions = {
    chart: {
      type: 'pie',
      height: 350,
      toolbar: {
        show: false
      },
      background: 'transparent'
    },
    labels: analytics.locationStats.map(l => l.name),
    colors: analytics.locationStats.map(l => l.color),
    legend: {
      position: 'bottom',
      labels: {
        colors: state.darkMode ? '#fff' : '#000'
      }
    },
    dataLabels: {
      enabled: true,
      formatter: function(val: number, opts: any) {
        return opts.w.config.labels[opts.seriesIndex] + ': ' + Math.round(val) + '%';
      },
      style: {
        colors: [state.darkMode ? '#fff' : '#000']
      }
    },
    tooltip: {
      theme: state.darkMode ? 'dark' : 'light',
      y: {
        formatter: function(val: number) {
          return val + '%';
        }
      }
    }
  };

  const lineChartOptions = {
    chart: {
      type: 'line',
      height: 350,
      toolbar: {
        show: false
      },
      background: 'transparent'
    },
    stroke: {
      curve: 'smooth',
      width: 3
    },
    xaxis: {
      categories: analytics.hourlyActivity.map(h => h.hour),
      labels: {
        style: {
          colors: state.darkMode ? '#fff' : '#000'
        }
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: state.darkMode ? '#fff' : '#000'
        }
      }
    },
    tooltip: {
      theme: state.darkMode ? 'dark' : 'light'
    },
    grid: {
      borderColor: state.darkMode ? '#374151' : '#e5e7eb'
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className={`max-w-7xl w-full max-h-[95vh] overflow-y-auto rounded-xl p-6 ${
        state.darkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'
      } shadow-2xl`}>
        <div className="flex items-center justify-between mb-6 sticky top-0 bg-inherit py-2 z-10">
          <h2 className={`text-2xl font-bold flex items-center gap-2 ${
            state.darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            <BarChart3 className="w-6 h-6 text-blue-500" />
            <span>Dashboard de Análise Avançada</span>
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-all duration-200 ${
              state.darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
            }`}
            aria-label="Fechar painel"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Resumo Executivo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className={`p-4 rounded-lg border-l-4 border-blue-500 ${
            state.darkMode ? 'bg-gray-800' : 'bg-gray-50'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${
                state.darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Total de Registros
              </span>
              <Activity className="w-5 h-5 text-blue-500" />
            </div>
            <div className={`text-3xl font-bold ${
              state.darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {analytics.totalEntries}
            </div>
            <div className={`text-xs mt-1 ${
              state.darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              ~{Math.round(analytics.avgEntriesPerDay)} por dia
            </div>
          </div>

          <div className={`p-4 rounded-lg border-l-4 border-green-500 ${
            state.darkMode ? 'bg-gray-800' : 'bg-gray-50'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${
                state.darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Participantes Ativos
              </span>
              <Users className="w-5 h-5 text-green-500" />
            </div>
            <div className={`text-3xl font-bold ${
              state.darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {analytics.activeParticipants}
            </div>
            <div className={`text-xs mt-1 ${
              state.darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              ~{Math.round(analytics.avgDailyEngagement)} por dia
            </div>
          </div>

          <div className={`p-4 rounded-lg border-l-4 border-purple-500 ${
            state.darkMode ? 'bg-gray-800' : 'bg-gray-50'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${
                state.darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Hora de Pico
              </span>
              <Clock4 className="w-5 h-5 text-purple-500" />
            </div>
            <div className={`text-3xl font-bold ${
              state.darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {analytics.busiestHour.hour}
            </div>
            <div className={`text-xs mt-1 ${
              state.darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {analytics.busiestHour.count} registros
            </div>
          </div>

          <div className={`p-4 rounded-lg border-l-4 border-orange-500 ${
            state.darkMode ? 'bg-gray-800' : 'bg-gray-50'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${
                state.darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Ação Mais Frequente
              </span>
              <Award className="w-5 h-5 text-orange-500" />
            </div>
            <div className={`text-xl font-bold truncate ${
              state.darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {analytics.mostCommonAction}
            </div>
            <div className={`text-xs mt-1 ${
              state.darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {analytics.actionStats[0]?.percentage.toFixed(1)}% do total
            </div>
          </div>
        </div>

        {/* Seção de Gráficos Principais */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Gráfico de Participantes (Bar Chart) */}
          <div className={`p-6 rounded-lg ${
            state.darkMode ? 'bg-gray-800' : 'bg-gray-50'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
              state.darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              <Users className="w-5 h-5 text-blue-500" />
              <span>Participantes Mais Ativos</span>
            </h3>
            <div className="h-[350px]">
              <DynamicBarChart
                options={{
                  ...barChartOptions,
                  colors: ['#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#F43F5E']
                }}
                series={[{
                  name: 'Registros',
                  data: analytics.participantStats.map(p => p.count)
                }]}
                type="bar"
                height="100%"
              />
            </div>
          </div>

          {/* Distribuição por Local (Pie Chart) */}
          <div className={`p-6 rounded-lg ${
            state.darkMode ? 'bg-gray-800' : 'bg-gray-50'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
              state.darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              <MapPin className="w-5 h-5 text-green-500" />
              <span>Distribuição por Local</span>
            </h3>
            <div className="h-[350px]">
              <DynamicPieChart
                options={pieChartOptions}
                series={analytics.locationStats.map(l => l.percentage)}
                type="pie"
                height="100%"
              />
            </div>
          </div>
        </div>

        {/* Seção de Análise Temporal */}
        <div className={`p-6 rounded-lg mb-8 ${
          state.darkMode ? 'bg-gray-800' : 'bg-gray-50'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
            state.darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            <Clock className="w-5 h-5 text-purple-500" />
            <span>Padrões de Atividade Temporal</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Atividade por Hora */}
            <div>
              <h4 className={`text-md font-medium mb-2 ${
                state.darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Por Hora do Dia
              </h4>
              <div className="h-[250px]">
                <DynamicLineChart
                  options={{
                    ...lineChartOptions,
                    colors: ['#8B5CF6'],
                    markers: {
                      size: 5
                    }
                  }}
                  series={[{
                    name: 'Registros',
                    data: analytics.hourlyActivity.map(h => h.count)
                  }]}
                  type="line"
                  height="100%"
                />
              </div>
            </div>

            {/* Atividade por Dia da Semana */}
            <div>
              <h4 className={`text-md font-medium mb-2 ${
                state.darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Por Dia da Semana
              </h4>
              <div className="h-[250px]">
                <DynamicBarChart
                  options={{
                    ...barChartOptions,
                    xaxis: {
                      categories: analytics.dailyActivity.map(d => d.day),
                      labels: {
                        style: {
                          colors: state.darkMode ? '#fff' : '#000'
                        }
                      }
                    },
                    colors: ['#EC4899']
                  }}
                  series={[{
                    name: 'Registros',
                    data: analytics.dailyActivity.map(d => d.count)
                  }]}
                  type="bar"
                  height="100%"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Seção de Análise Detalhada */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ações com Tendência */}
          <div className={`p-6 rounded-lg ${
            state.darkMode ? 'bg-gray-800' : 'bg-gray-50'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
              state.darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              <TrendingUp className="w-5 h-5 text-orange-500" />
              <span>Ações com Maior Tendência</span>
            </h3>
            <div className="space-y-4">
              {analytics.actionStats.slice(0, 5).map((action, index) => (
                <div key={action.id} className="flex items-start">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3 mt-1" 
                       style={{ backgroundColor: action.color }}>
                    <span className="text-white text-xs font-bold">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-baseline">
                      <span className={`font-medium ${
                        state.darkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {action.name}
                      </span>
                      <span className={`text-sm ${
                        state.darkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        {action.count} registros ({action.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="mt-1">
                      <div className={`text-xs flex items-center ${
                        action.trend > 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {action.trend > 0 ? (
                          <span>▲ {Math.abs(action.trend).toFixed(1)}% aumento na última semana</span>
                        ) : (
                          <span>▼ {Math.abs(action.trend).toFixed(1)}% redução na última semana</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Duração Média por Ação */}
          <div className={`p-6 rounded-lg ${
            state.darkMode ? 'bg-gray-800' : 'bg-gray-50'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
              state.darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              <Clock className="w-5 h-5 text-cyan-500" />
              <span>Duração Média por Ação</span>
            </h3>
            <div className="space-y-3">
              {analytics.avgDurationByAction.slice(0, 5).map((action, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-8 text-sm font-medium text-gray-500 mr-2">
                    {index + 1}.
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-baseline">
                      <span className={`font-medium ${
                        state.darkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {action.action}
                      </span>
                      <span className={`text-sm font-bold ${
                        state.darkMode ? 'text-cyan-400' : 'text-cyan-600'
                      }`}>
                        {action.formattedDuration}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                      <div 
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full" 
                        style={{ 
                          width: `${(action.duration / Math.max(...analytics.avgDurationByAction.map(a => a.duration))) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tags e Correlações */}
        <div className={`mt-6 p-6 rounded-lg ${
          state.darkMode ? 'bg-gray-800' : 'bg-gray-50'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
            state.darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            <Tag className="w-5 h-5 text-pink-500" />
            <span>Análise de Tags e Correlações</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.tagStats.slice(0, 6).map(tag => (
              <div key={tag.id} className={`p-4 rounded-lg border ${
                state.darkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className={`font-medium ${
                      state.darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {tag.name}
                    </span>
                  </div>
                  <span className={`text-sm ${
                    state.darkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {tag.count} ({tag.percentage.toFixed(1)}%)
                  </span>
                </div>
                
                {tag.topCorrelatedTag && (
                  <div className={`text-xs mt-2 p-2 rounded ${
                    state.darkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    <span className="text-gray-500">Frequentemente usada com: </span>
                    <span className="font-medium">
                      {tag.topCorrelatedTag.name} ({tag.topCorrelatedTag.count}x)
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Rodapé com métricas adicionais */}
        <div className={`mt-6 p-4 rounded-lg text-center ${
          state.darkMode ? 'bg-gray-800' : 'bg-gray-100'
        }`}>
          <p className={`text-sm ${
            state.darkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Última atualização: {new Date().toLocaleString()} | 
            Dados desde: {new Date(state.logEntries[0]?.timestamp).toLocaleDateString() || 'N/A'} | 
            Total de locais: {analytics.locationStats.length} | 
            Total de ações: {analytics.actionStats.length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Analytics;