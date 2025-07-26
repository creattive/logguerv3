import React from 'react';
import Header from './Header';
import ParticipantsPanel from './ParticipantsPanel';
import LocationsPanel from './LocationsPanel';
import ActionsPanel from './ActionsPanel';
import TagsPanel from './TagsPanel';
import NotesPanel from './NotesPanel';
import ActivityFeed from './ActivityFeed';
import { useApp } from '../../contexts/AppContext';

const Dashboard: React.FC = () => {
  const { state } = useApp();

  return (
    <div className={`min-h-screen transition-colors duration-200 ${state.darkMode ? 'bg-gray-950' : 'bg-gray-100'}`}>
      <Header />
      
      <main className="max-w-[1600px] mx-auto px-6 py-6">
        {/* Layout exato do wireframe */}
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-120px)]">
          
          {/* Coluna 1-3: Participantes */}
          <div className="col-span-3">
            <ParticipantsPanel />
          </div>

          {/* Coluna 4-6: Ambientes */}
          <div className="col-span-3">
            <LocationsPanel />
          </div>

          {/* Coluna 7-12: Ações */}
          <div className="col-span-6">
            <ActionsPanel />
          </div>

          {/* Segunda linha */}
          {/* Coluna 1-6: Tags */}
          <div className="col-span-6">
            <TagsPanel />
          </div>

          {/* Coluna 7-12: Espaço vazio para futuras funcionalidades */}
          <div className="col-span-6">
            {/* Reservado */}
          </div>

          {/* Terceira linha */}
          {/* Coluna 1-6: Área de digitação */}
          <div className="col-span-6">
            <NotesPanel />
          </div>

          {/* Coluna 7-12: Feed de atividades */}
          <div className="col-span-6">
            <ActivityFeed />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;