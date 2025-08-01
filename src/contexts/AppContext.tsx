import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AppState, LogEntry, Participant, Location, ActionCategory, Tag } from '../types';
import { useFirebase } from '../hooks/useFirebase';

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  addLogEntry: (entry: Omit<LogEntry, 'id' | 'createdAt' | 'createdBy'>) => Promise<void>;
  updateLogEntry: (entryId: string, updates: Partial<LogEntry>) => Promise<void>;
}

type AppAction = 
  | { type: 'SET_USER'; payload: any }
  | { type: 'SET_PARTICIPANTS'; payload: Participant[] }
  | { type: 'SET_LOCATIONS'; payload: Location[] }
  | { type: 'SET_ACTION_CATEGORIES'; payload: ActionCategory[] }
  | { type: 'SET_TAGS'; payload: Tag[] }
  | { type: 'SET_LOG_ENTRIES'; payload: LogEntry[] }
  | { type: 'TOGGLE_DARK_MODE' }
  | { type: 'SET_RECORDING'; payload: boolean }
  | { type: 'SET_TIMECODE'; payload: string }
  | { type: 'SET_MANUAL_TIMECODE'; payload: { isManual: boolean; startTime?: number; baseTimecode?: string } }
  | { type: 'SET_EXTERNAL_TIMECODE'; payload: { isExternal: boolean; source?: 'ltc' | null; timecode?: string } }
  | { type: 'SET_TIMECODE_MODE'; payload: 'auto' | 'manual' | 'external' }
  | { type: 'EXTERNAL_TIMECODE_LOST'; payload: { fallbackMode: 'auto' | 'manual' } }
  | { type: 'SET_SELECTED_PARTICIPANTS'; payload: string[] }
  | { type: 'SET_SELECTED_LOCATION'; payload: string }
  | { type: 'SET_SELECTED_ACTION'; payload: string }
  | { type: 'SET_SELECTED_TAGS'; payload: string[] };

const initialState: AppState = {
  currentUser: null,
  participants: [],
  locations: [],
  actionCategories: [],
  tags: [],
  logEntries: [],
  darkMode: localStorage.getItem('darkMode') === 'true',
  isRecording: false,
  currentTimecode: '00:00:00:00',
  isManualTimecode: false,
  manualTimecodeStart: null,
  manualTimecodeBase: null,
  isExternalTimecode: false,
  externalTimecodeSource: null,
  lastExternalTimecode: null,
  timecodeMode: 'auto',
  previousTimecodeMode: null,
  selectedParticipants: [],
  selectedLocation: '',
  selectedAction: '',
  selectedTags: []
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, currentUser: action.payload };
    case 'SET_PARTICIPANTS':
      return { ...state, participants: action.payload };
    case 'SET_LOCATIONS':
      return { ...state, locations: action.payload };
    case 'SET_ACTION_CATEGORIES':
      return { ...state, actionCategories: action.payload };
    case 'SET_TAGS':
      return { ...state, tags: action.payload };
    case 'SET_LOG_ENTRIES':
      return { ...state, logEntries: action.payload };
    case 'TOGGLE_DARK_MODE':
      const newDarkMode = !state.darkMode;
      localStorage.setItem('darkMode', newDarkMode.toString());
      return { ...state, darkMode: newDarkMode };
    case 'SET_RECORDING':
      return { ...state, isRecording: action.payload };
    case 'SET_TIMECODE':
      return { ...state, currentTimecode: action.payload };
    case 'SET_MANUAL_TIMECODE':
      return { 
        ...state, 
        isManualTimecode: action.payload.isManual,
        manualTimecodeStart: action.payload.startTime || null,
        manualTimecodeBase: action.payload.baseTimecode || null
      };
    case 'SET_EXTERNAL_TIMECODE':
      return {
        ...state,
        isExternalTimecode: action.payload.isExternal,
        externalTimecodeSource: action.payload.source || null,
        lastExternalTimecode: action.payload.timecode || null,
        timecodeMode: action.payload.isExternal ? 'external' : state.previousTimecodeMode || 'auto',
        previousTimecodeMode: action.payload.isExternal ? state.timecodeMode : state.previousTimecodeMode
      };
    case 'SET_TIMECODE_MODE':
      return {
        ...state,
        timecodeMode: action.payload,
        isManualTimecode: action.payload === 'manual',
        isExternalTimecode: action.payload === 'external'
      };
    case 'EXTERNAL_TIMECODE_LOST':
      return {
        ...state,
        isExternalTimecode: false,
        externalTimecodeSource: null,
        lastExternalTimecode: null,
        timecodeMode: action.payload.fallbackMode,
        isManualTimecode: action.payload.fallbackMode === 'manual',
        previousTimecodeMode: null
      };
    case 'SET_SELECTED_PARTICIPANTS':
      return { ...state, selectedParticipants: action.payload };
    case 'SET_SELECTED_LOCATION':
      return { ...state, selectedLocation: action.payload };
    case 'SET_SELECTED_ACTION':
      return { ...state, selectedAction: action.payload };
    case 'SET_SELECTED_TAGS':
      return { ...state, selectedTags: action.payload };
    default:
      return state;
  }
};

// Função para converter timecode em segundos
const timecodeToSeconds = (timecode: string): number => {
  const parts = timecode.split(':').map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) {
    console.warn('Formato de timecode inválido:', timecode);
    return 0;
  }
  const [hours, minutes, seconds, frames] = parts;
  return hours * 3600 + minutes * 60 + seconds + frames / 30; // 30fps
};

// Função para converter segundos em timecode
const secondsToTimecode = (totalSeconds: number): string => {
  if (isNaN(totalSeconds) || totalSeconds < 0) {
    return '00:00:00:00';
  }
  
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const frames = Math.floor((totalSeconds % 1) * 30); // 30fps
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { currentUser, addLogEntry: firebaseAddLogEntry, updateLogEntry: firebaseUpdateLogEntry, useRealtimeData } = useFirebase();

  const [participants, participantsLoading] = useRealtimeData<Participant>('participants');
  const [locations, locationsLoading] = useRealtimeData<Location>('locations');
  const [actionCategories, actionCategoriesLoading] = useRealtimeData<ActionCategory>('actionCategories');
  const [tags, tagsLoading] = useRealtimeData<Tag>('tags');
  const [logEntries, logEntriesLoading] = useRealtimeData<LogEntry>('logEntries');

  useEffect(() => {
    dispatch({ type: 'SET_USER', payload: currentUser });
  }, [currentUser]);

  useEffect(() => {
    if (!participantsLoading) {
      dispatch({ type: 'SET_PARTICIPANTS', payload: participants });
    }
  }, [participants, participantsLoading]);

  useEffect(() => {
    if (!locationsLoading) {
      dispatch({ type: 'SET_LOCATIONS', payload: locations });
    }
  }, [locations, locationsLoading]);

  useEffect(() => {
    if (!actionCategoriesLoading) {
      dispatch({ type: 'SET_ACTION_CATEGORIES', payload: actionCategories });
    }
  }, [actionCategories, actionCategoriesLoading]);

  useEffect(() => {
    if (!tagsLoading) {
      dispatch({ type: 'SET_TAGS', payload: tags });
    }
  }, [tags, tagsLoading]);

  useEffect(() => {
    if (!logEntriesLoading) {
      dispatch({ type: 'SET_LOG_ENTRIES', payload: logEntries });
    }
  }, [logEntries, logEntriesLoading]);

  // Timecode contínuo - automático ou manual
  useEffect(() => {
    const updateTimecode = () => {
      try {
        if (state.timecodeMode === 'external' && state.lastExternalTimecode) {
          // Modo externo: usar o último timecode recebido
          dispatch({ type: 'SET_TIMECODE', payload: state.lastExternalTimecode });
        } else if (state.timecodeMode === 'manual' && state.manualTimecodeStart && state.manualTimecodeBase) {
          // Modo manual: calcular timecode baseado no tempo decorrido
          const now = Date.now();
          const elapsedSeconds = (now - state.manualTimecodeStart) / 1000;
          const baseSeconds = timecodeToSeconds(state.manualTimecodeBase);
          const newTimecode = secondsToTimecode(baseSeconds + elapsedSeconds);
          dispatch({ type: 'SET_TIMECODE', payload: newTimecode });
        } else if (state.timecodeMode === 'auto') {
          // Modo automático: usar horário do sistema
          const now = new Date();
          const hours = String(now.getHours()).padStart(2, '0');
          const minutes = String(now.getMinutes()).padStart(2, '0');
          const seconds = String(now.getSeconds()).padStart(2, '0');
          const frames = String(Math.floor(now.getMilliseconds() / 33.33)).padStart(2, '0'); // 30fps
          
          const timecode = `${hours}:${minutes}:${seconds}:${frames}`;
          dispatch({ type: 'SET_TIMECODE', payload: timecode });
        }
      } catch (error) {
        console.error('Erro ao atualizar timecode:', error);
        // Fallback para timecode do sistema em caso de erro
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const frames = String(Math.floor(now.getMilliseconds() / 33.33)).padStart(2, '0');
        const fallbackTimecode = `${hours}:${minutes}:${seconds}:${frames}`;
        dispatch({ type: 'SET_TIMECODE', payload: fallbackTimecode });
      }
    };

    // Atualizar imediatamente
    updateTimecode();
    
    // Atualizar a cada 33ms (30fps)
    const interval = setInterval(updateTimecode, 33);

    return () => clearInterval(interval);
  }, [state.timecodeMode, state.isManualTimecode, state.manualTimecodeStart, state.manualTimecodeBase, state.lastExternalTimecode]);

  const addLogEntry = async (entry: Omit<LogEntry, 'id' | 'createdAt' | 'createdBy'>) => {
    try {
      console.log('🔄 AppContext: Enviando entrada para Firebase:', entry);
      const result = await firebaseAddLogEntry(entry);
      console.log('✅ AppContext: Entrada enviada com sucesso:', result);
      return result;
    } catch (error) {
      console.error('❌ AppContext: Erro ao enviar entrada:', error);
      throw error;
    }
  };

  const updateLogEntry = async (entryId: string, updates: Partial<LogEntry>) => {
    await firebaseUpdateLogEntry(entryId, updates);
  };

  return (
    <AppContext.Provider value={{ state, dispatch, addLogEntry, updateLogEntry }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};