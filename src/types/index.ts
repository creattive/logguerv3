export interface User {
  uid: string;
  email: string;
  displayName?: string;
  role: 'admin' | 'logger' | 'viewer';
  createdAt: string;
  lastActive: string;
}

export interface Participant {
  id: string;
  name: string;
  profilePicture?: string;
  bio?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Location {
  id: string;
  name: string;
  description?: string;
  color: string;
  createdAt: string;
}

export interface ActionCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  createdAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  category?: string;
  createdAt: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  timecode?: string;
  participants: string[];
  location: string;
  actionCategory: string;
  tags: string[];
  notes: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AppState {
  currentUser: User | null;
  participants: Participant[];
  locations: Location[];
  actionCategories: ActionCategory[];
  tags: Tag[];
  logEntries: LogEntry[];
  darkMode: boolean;
  isRecording: boolean;
  currentTimecode: string;
  isManualTimecode: boolean;
  manualTimecodeStart: number | null; // timestamp quando o modo manual foi ativado
  manualTimecodeBase: string | null; // timecode base definido pelo usuário
  selectedParticipants: string[];
  selectedLocation: string;
  selectedAction: string;
  selectedTags: string[];
}