import React, { useState } from 'react';
import { Plus, Edit, Trash2, Users, MapPin, Tag, Settings, X, Save, UserPlus, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { doc, setDoc, deleteDoc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../../config/firebase';

interface AdminPanelProps {
  onClose: () => void;
}

interface AddEntityModalProps {
  type: 'participant' | 'location' | 'actionCategory' | 'tag' | 'user';
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  editData?: any;
}

const AddEntityModal: React.FC<AddEntityModalProps> = ({ type, isOpen, onClose, onSave, editData }) => {
  const { state } = useApp();
  const [formData, setFormData] = useState<any>(editData || {
    name: '',
    description: '',
    color: '#3B82F6',
    bio: '',
    email: '',
    password: '',
    displayName: '',
    role: 'logger',
    isActive: true
  });
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      await onSave(formData);
      setFormData({
        name: '',
        description: '',
        color: '#3B82F6',
        bio: '',
        email: '',
        password: '',
        displayName: '',
        role: 'logger',
        isActive: true
      });
      onClose();
    } catch (error) {
      console.error('Error saving:', error);
      alert('Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const getTitle = () => {
    const action = editData ? 'Editar' : 'Adicionar';
    switch (type) {
      case 'participant': return `${action} Participante`;
      case 'location': return `${action} Ambiente`;
      case 'actionCategory': return `${action} Ação`;
      case 'tag': return `${action} Tag`;
      case 'user': return `${action} Usuário`;
      default: return `${action} Item`;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`max-w-md w-full rounded-xl p-6 ${state.darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} shadow-2xl`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${state.darkMode ? 'text-white' : 'text-gray-900'}`}>
            {getTitle()}
          </h3>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-all duration-200 ${state.darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {type === 'user' ? (
            <>
              <div>
                <label className={`block text-sm font-medium mb-2 ${state.darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-lg border transition-all duration-200 ${
                    state.darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-cyan-500'
                      : 'bg-white border-gray-300 text-gray-900 focus:border-cyan-500'
                  } focus:ring-2 focus:ring-cyan-500/20`}
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${state.darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-lg border transition-all duration-200 ${
                    state.darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-cyan-500'
                      : 'bg-white border-gray-300 text-gray-900 focus:border-cyan-500'
                  } focus:ring-2 focus:ring-cyan-500/20`}
                  required={!editData}
                  disabled={!!editData}
                />
              </div>

              {!editData && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${state.darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className={`w-full px-3 py-2 pr-10 rounded-lg border transition-all duration-200 ${
                        state.darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-cyan-500'
                          : 'bg-white border-gray-300 text-gray-900 focus:border-cyan-500'
                      } focus:ring-2 focus:ring-cyan-500/20`}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className={`block text-sm font-medium mb-2 ${state.darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Função
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-lg border transition-all duration-200 ${
                    state.darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-cyan-500'
                      : 'bg-white border-gray-300 text-gray-900 focus:border-cyan-500'
                  } focus:ring-2 focus:ring-cyan-500/20`}
                >
                  <option value="viewer">Visualizador</option>
                  <option value="logger">Logger</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className={`block text-sm font-medium mb-2 ${state.darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Nome
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-lg border transition-all duration-200 ${
                    state.darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-cyan-500'
                      : 'bg-white border-gray-300 text-gray-900 focus:border-cyan-500'
                  } focus:ring-2 focus:ring-cyan-500/20`}
                  required
                />
              </div>

              {type === 'participant' && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${state.darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Bio
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-lg border transition-all duration-200 ${
                      state.darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-cyan-500'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-cyan-500'
                    } focus:ring-2 focus:ring-cyan-500/20`}
                    rows={3}
                  />
                </div>
              )}

              {(type === 'location' || type === 'actionCategory') && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${state.darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Descrição
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-lg border transition-all duration-200 ${
                      state.darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-cyan-500'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-cyan-500'
                    } focus:ring-2 focus:ring-cyan-500/20`}
                    rows={2}
                  />
                </div>
              )}

              {(type === 'location' || type === 'actionCategory' || type === 'tag') && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${state.darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Cor
                  </label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="w-full h-10 rounded-lg border border-gray-300 cursor-pointer"
                  />
                </div>
              )}
            </>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className={`flex-1 px-4 py-2 rounded-lg border transition-all duration-200 ${
                state.darkMode 
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              } disabled:opacity-50`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Salvando...</span>
                </>
              ) : (
                <span>{editData ? 'Atualizar' : 'Salvar'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const { state } = useApp();
  const [activeTab, setActiveTab] = useState<'participants' | 'locations' | 'actions' | 'tags' | 'users' | 'logs'>('participants');
  const [modalType, setModalType] = useState<'participant' | 'location' | 'actionCategory' | 'tag' | 'user' | null>(null);
  const [editData, setEditData] = useState<any>(null);

  const handleAddEntity = async (type: string, data: any) => {
    try {
      console.log('🔄 Salvando:', type, data);

      if (type === 'user') {
        // Criar usuário no Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        
        // Salvar dados do usuário no Firestore
        const userRef = doc(db, 'users', userCredential.user.uid);
        await setDoc(userRef, {
          email: data.email,
          displayName: data.displayName,
          role: data.role,
          createdAt: serverTimestamp(),
          lastActive: serverTimestamp()
        });
        
        console.log('✅ Usuário criado com sucesso');
      } else {
        // Para outros tipos, usar a coleção correta
        const collectionName = type === 'actionCategory' ? 'actionCategories' : `${type}s`;
        
        if (editData) {
          // Atualizar documento existente
          const docRef = doc(db, collectionName, editData.id);
          await updateDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp()
          });
          console.log('✅ Item atualizado com sucesso');
        } else {
          // Criar novo documento
          const docRef = await addDoc(collection(db, collectionName), {
            ...data,
            isActive: true,
            createdAt: serverTimestamp()
          });
          console.log('✅ Item criado com sucesso, ID:', docRef.id);
        }
      }
    } catch (error: any) {
      console.error(`❌ Error ${editData ? 'updating' : 'adding'} ${type}:`, error);
      throw error; // Re-throw para o modal tratar
    }
  };

  const handleDeleteEntity = async (type: string, id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este item?')) {
      try {
        const collectionName = type === 'actionCategory' ? 'actionCategories' : `${type}s`;
        const docRef = doc(db, collectionName, id);
        await deleteDoc(docRef);
        console.log('✅ Item excluído com sucesso');
      } catch (error) {
        console.error(`❌ Error deleting ${type}:`, error);
        alert(`Erro ao excluir ${type}. Tente novamente.`);
      }
    }
  };

  const handleEdit = (type: string, data: any) => {
    console.log('🔧 Editando:', type, data);
    setEditData(data);
    setModalType(type as any);
  };

  const tabs = [
    { id: 'participants', label: 'Participantes', icon: Users },
    { id: 'locations', label: 'Ambientes', icon: MapPin },
    { id: 'actions', label: 'Ações', icon: Settings },
    { id: 'tags', label: 'Tags', icon: Tag },
    { id: 'users', label: 'Usuários', icon: UserPlus },
    { id: 'logs', label: 'Logs', icon: Eye }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'participants':
        return (
          <div className="space-y-3">
            {state.participants.map(participant => (
              <div
                key={participant.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  state.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <img 
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${participant.name}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`}
                    alt={participant.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <div className={`font-medium ${state.darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {participant.name}
                    </div>
                    {participant.bio && (
                      <div className={`text-sm ${state.darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {participant.bio}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit('participant', participant)}
                    className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all duration-200"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteEntity('participant', participant.id)}
                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        );

      case 'locations':
        return (
          <div className="space-y-3">
            {state.locations.map(location => (
              <div
                key={location.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  state.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: location.color }}
                  />
                  <div>
                    <div className={`font-medium ${state.darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {location.name}
                    </div>
                    {location.description && (
                      <div className={`text-sm ${state.darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {location.description}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit('location', location)}
                    className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all duration-200"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteEntity('location', location.id)}
                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        );

      case 'actions':
        return (
          <div className="space-y-3">
            {state.actionCategories.map(action => (
              <div
                key={action.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  state.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: action.color }}
                  />
                  <div>
                    <div className={`font-medium ${state.darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {action.name}
                    </div>
                    {action.description && (
                      <div className={`text-sm ${state.darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {action.description}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit('actionCategory', action)}
                    className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all duration-200"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteEntity('actionCategory', action.id)}
                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        );

      case 'tags':
        return (
          <div className="flex flex-wrap gap-2">
            {state.tags.map(tag => (
              <div
                key={tag.id}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-full text-white text-sm"
                style={{ backgroundColor: tag.color }}
              >
                <span>{tag.name}</span>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleEdit('tag', tag)}
                    className="hover:bg-white/20 rounded-full p-0.5 transition-all duration-200"
                  >
                    <Edit className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDeleteEntity('tag', tag.id)}
                    className="hover:bg-white/20 rounded-full p-0.5 transition-all duration-200"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        );

      case 'users':
        return (
          <div className="space-y-3">
            <div className={`p-4 rounded-lg border ${state.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <p className={`text-sm ${state.darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Gerenciamento de usuários do sistema. Apenas administradores podem criar e gerenciar usuários.
              </p>
            </div>
          </div>
        );

      case 'logs':
        return (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {state.logEntries.slice(0, 50).map(entry => (
              <div
                key={entry.id}
                className={`p-3 rounded-lg border ${state.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`text-sm font-mono ${state.darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>
                    {entry.timecode}
                  </div>
                  <div className={`text-xs ${state.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {new Date(entry.timestamp).toLocaleString()}
                  </div>
                </div>
                <div className={`text-sm ${state.darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {entry.notes}
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <span className={`text-xs px-2 py-1 rounded ${state.darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                    {state.participants.find(p => entry.participants.includes(p.id))?.name || 'N/A'}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${state.darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                    {state.locations.find(l => l.id === entry.location)?.name || 'N/A'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`${state.darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-2xl border p-6 relative`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-2xl font-bold ${state.darkMode ? 'text-white' : 'text-gray-900'}`}>
          🔧 Painel Administrativo
        </h2>
        <button
          onClick={onClose}
          className={`p-2 rounded-lg transition-all duration-200 ${state.darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 mb-6">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-red-500 text-white'
                  : state.darkMode
                  ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Add Button */}
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-lg font-medium ${state.darkMode ? 'text-white' : 'text-gray-900'}`}>
          {tabs.find(t => t.id === activeTab)?.label}
        </h3>
        {activeTab !== 'logs' && (
          <button
            onClick={() => {
              setEditData(null);
              const typeMap = {
                participants: 'participant',
                locations: 'location',
                actions: 'actionCategory',
                tags: 'tag',
                users: 'user'
              };
              setModalType(typeMap[activeTab] as any);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg hover:from-red-600 hover:to-pink-700 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar</span>
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="min-h-32">
        {renderTabContent()}
      </div>

      {/* Add/Edit Entity Modal */}
      {modalType && (
        <AddEntityModal
          type={modalType}
          isOpen={!!modalType}
          onClose={() => {
            setModalType(null);
            setEditData(null);
          }}
          onSave={(data) => handleAddEntity(modalType, data)}
          editData={editData}
        />
      )}
    </div>
  );
};

export default AdminPanel;