import React, { useState } from 'react';
import { Search, Filter, Calendar, User, MapPin, Tag, FileText, Download, Clock, Edit, Save, X, AlertCircle, Trash2, CheckSquare, Square } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useToast } from '../../hooks/useToast';
import { useFirebase } from '../../hooks/useFirebase';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const ActivityFeed: React.FC = () => {
  const { state, updateLogEntry } = useApp();
  const { deleteLogEntry } = useFirebase();
  const { success, error } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterParticipant, setFilterParticipant] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterDateRange, setFilterDateRange] = useState({ start: '', end: '' });
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletingSingle, setDeletingSingle] = useState<string | null>(null);

  const filteredEntries = state.logEntries.filter(entry => {
    const matchesSearch = entry.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.participants.some(id => 
                           state.participants.find(p => p.id === id)?.name.toLowerCase().includes(searchTerm.toLowerCase())
                         );
    
    const matchesParticipant = !filterParticipant || entry.participants.includes(filterParticipant);
    const matchesLocation = !filterLocation || entry.location === filterLocation;
    
    const entryDate = new Date(entry.timestamp);
    const matchesDateRange = (!filterDateRange.start || entryDate >= new Date(filterDateRange.start)) &&
                            (!filterDateRange.end || entryDate <= new Date(filterDateRange.end));

    return matchesSearch && matchesParticipant && matchesLocation && matchesDateRange;
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const exportToPDF = () => {
    try {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('Reality Show Log Export', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30);
    doc.text(`Total Entries: ${filteredEntries.length}`, 20, 40);

    const tableData = filteredEntries.map(entry => [
      new Date(entry.timestamp).toLocaleString(),
      entry.timecode || 'N/A',
      entry.participants.map(id => state.participants.find(p => p.id === id)?.name).join(', ') || 'None',
      state.locations.find(l => l.id === entry.location)?.name || 'Unknown',
      state.actionCategories.find(a => a.id === entry.actionCategory)?.name || 'Unknown',
      entry.tags.map(id => state.tags.find(t => t.id === id)?.name).join(', ') || 'None',
      entry.notes.substring(0, 50) + (entry.notes.length > 50 ? '...' : '')
    ]);

    (doc as any).autoTable({
      head: [['Timestamp', 'Timecode', 'Participants', 'Location', 'Action', 'Tags', 'Notes']],
      body: tableData,
      startY: 50,
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 20 },
        2: { cellWidth: 25 },
        3: { cellWidth: 20 },
        4: { cellWidth: 20 },
        5: { cellWidth: 20 },
        6: { cellWidth: 40 }
      }
    });

    doc.save('reality-show-log.pdf');
      success('Exportação concluída', 'Relatório PDF gerado com sucesso!');
    } catch (err) {
      error('Erro na exportação', 'Não foi possível gerar o PDF');
    }
  };

  const handleEditEntry = (entryId: string, currentNotes: string) => {
    console.log('🔧 Iniciando edição da entrada:', entryId);
    setEditingEntry(entryId);
    setEditNotes(currentNotes);
    setValidationError(null);
  };

  const handleSaveEdit = async (entryId: string) => {
    if (saving) return;
    
    const trimmedNotes = editNotes.trim();
    if (!trimmedNotes) {
      setValidationError('As notas não podem estar vazias');
      return;
    }
    
    setSaving(true);
    setValidationError(null);
    
    try {
      console.log('🔄 Iniciando atualização da entrada:', entryId);
      console.log('📝 Novas notas:', trimmedNotes);
      
      await updateLogEntry(entryId, {
        notes: trimmedNotes
      });
      
      console.log('✅ Entrada atualizada com sucesso');
      setEditingEntry(null);
      setEditNotes('');
      success('Entrada atualizada', 'Alterações salvas com sucesso!');
      
    } catch (err: any) {
      console.error('❌ Erro ao atualizar entrada:', err);
      error('Erro ao salvar', err.message || 'Erro desconhecido ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
    setEditNotes('');
    setValidationError(null);
  };

  const toggleEntrySelection = (entryId: string) => {
    setSelectedEntries(prev => 
      prev.includes(entryId) 
        ? prev.filter(id => id !== entryId)
        : [...prev, entryId]
    );
  };

  const selectAllEntries = () => {
    if (selectedEntries.length === filteredEntries.length) {
      setSelectedEntries([]);
    } else {
      setSelectedEntries(filteredEntries.map(entry => entry.id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedEntries.length === 0) return;
    
    setDeleting(true);
    let deletedCount = 0;
    let errorCount = 0;

    try {
      for (const entryId of selectedEntries) {
        try {
          await deleteLogEntry(entryId);
          deletedCount++;
        } catch (err) {
          console.error(`Erro ao deletar entrada ${entryId}:`, err);
          errorCount++;
        }
      }

      if (deletedCount > 0) {
        success('Entradas excluídas', `${deletedCount} entrada(s) excluída(s) com sucesso!`);
      }
      
      if (errorCount > 0) {
        error('Alguns erros ocorreram', `${errorCount} entrada(s) não puderam ser excluídas`);
      }

      setSelectedEntries([]);
      setShowDeleteConfirm(false);
      
    } catch (err: any) {
      console.error('Erro ao excluir entradas:', err);
      error('Erro na exclusão', 'Não foi possível excluir as entradas selecionadas');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteSingle = async (entryId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta entrada?')) {
      return;
    }

    setDeletingSingle(entryId);
    
    try {
      await deleteLogEntry(entryId);
      success('Entrada excluída', 'Entrada removida com sucesso!');
    } catch (err: any) {
      console.error('Erro ao excluir entrada:', err);
      error('Erro na exclusão', err.message || 'Não foi possível excluir a entrada');
    } finally {
      setDeletingSingle(null);
    }
  };

  const isAdmin = state.currentUser?.role === 'admin';
  const canEdit = isAdmin || state.currentUser?.role === 'logger';
  const canDelete = isAdmin || state.currentUser?.role === 'logger';

  return (
    <div className={`${state.darkMode ? 'bg-gray-900/50' : 'bg-white'} rounded-xl shadow-lg border ${state.darkMode ? 'border-gray-700' : 'border-gray-200'} h-full flex flex-col mb-48`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-xl font-bold ${state.darkMode ? 'text-white' : 'text-gray-900'}`}>
            Feed de Atividades
          </h2>
          <div className="flex items-center space-x-3">
            {/* Botões de seleção e exclusão */}
            {canDelete && (
              <>
                <button
                  onClick={selectAllEntries}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    selectedEntries.length === filteredEntries.length
                      ? 'bg-blue-500 text-white'
                      : state.darkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {selectedEntries.length === filteredEntries.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                </button>
                
                {selectedEntries.length > 0 && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center space-x-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Excluir ({selectedEntries.length})</span>
                  </button>
                )}
              </>
            )}
            
            <button
              onClick={exportToPDF}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200"
            >
              <Download className="w-4 h-4" />
              <span>Exportar</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${state.darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-all duration-200 ${
                state.darkMode 
                  ? 'bg-gray-800 border-gray-600 text-white focus:border-cyan-500'
                  : 'bg-white border-gray-300 text-gray-900 focus:border-cyan-500'
              } focus:ring-2 focus:ring-cyan-500/20`}
            />
          </div>

          <select
            value={filterParticipant}
            onChange={(e) => setFilterParticipant(e.target.value)}
            className={`px-3 py-2 rounded-lg border transition-all duration-200 ${
              state.darkMode 
                ? 'bg-gray-800 border-gray-600 text-white focus:border-cyan-500'
                : 'bg-white border-gray-300 text-gray-900 focus:border-cyan-500'
            } focus:ring-2 focus:ring-cyan-500/20`}
          >
            <option value="">Todos os Participantes</option>
            {state.participants.map(participant => (
              <option key={participant.id} value={participant.id}>
                {participant.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Activity List */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4">
          {filteredEntries.length === 0 ? (
            <div className={`text-center py-8 ${state.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Nenhuma entrada encontrada</p>
              <p className="text-sm">Comece a registrar atividades para vê-las aqui</p>
            </div>
          ) : (
            filteredEntries.map(entry => (
              <div
                key={entry.id}
                className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md relative ${
                  selectedEntries.includes(entry.id)
                    ? 'border-blue-500 bg-blue-500/10'
                    : 
                  state.darkMode 
                    ? 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                    : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Checkbox de seleção */}
                {canDelete && (
                  <div className="absolute top-2 left-2">
                    <button
                      onClick={() => toggleEntrySelection(entry.id)}
                      className={`w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center ${
                        selectedEntries.includes(entry.id)
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : state.darkMode
                          ? 'border-gray-600 hover:border-gray-500'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {selectedEntries.includes(entry.id) && (
                        <CheckSquare className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                )}

                {/* Entry Header */}
                <div className={`flex items-center justify-between mb-3 ${canDelete ? 'ml-6' : ''}`}>
                  <div className="flex items-center space-x-3">
                    <div className={`flex items-center space-x-2 text-sm ${state.darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>
                      <Clock className="w-4 h-4" />
                      <span className="font-mono font-semibold">{entry.timecode}</span>
                    </div>
                    <div className={`text-sm ${state.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {new Date(entry.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {entry.tags.map(tagId => {
                      const tag = state.tags.find(t => t.id === tagId);
                      return tag ? (
                        <span
                          key={tagId}
                          className="px-2 py-1 text-xs font-medium text-white rounded-full"
                          style={{ backgroundColor: tag.color }}
                        >
                          {tag.name}
                        </span>
                      ) : null;
                    })}
                    {canEdit && (
                      <button
                        onClick={() => handleEditEntry(entry.id, entry.notes)}
                        disabled={editingEntry === entry.id && saving}
                        className={`p-1 rounded transition-all duration-200 ${
                          state.darkMode 
                            ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                        } disabled:opacity-50`}
                        title="Editar entrada"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteSingle(entry.id)}
                        disabled={deletingSingle === entry.id}
                        className={`p-1 rounded transition-all duration-200 ${
                          deletingSingle === entry.id
                            ? 'text-red-400 cursor-wait'
                            : state.darkMode 
                            ? 'text-red-400 hover:text-red-300 hover:bg-red-900/20' 
                            : 'text-red-500 hover:text-red-700 hover:bg-red-100'
                        } disabled:opacity-50`}
                        title="Excluir entrada"
                      >
                        {deletingSingle === entry.id ? (
                          <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin"></div>
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Entry Details */}
                <div className={`grid grid-cols-2 gap-4 mb-3 text-sm ${canDelete ? 'ml-6' : ''}`}>
                  <div className="flex items-center space-x-2">
                    <User className={`w-4 h-4 ${state.darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    <span className={`${state.darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {entry.participants.map(id => state.participants.find(p => p.id === id)?.name).join(', ') || 'Nenhum'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <MapPin className={`w-4 h-4 ${state.darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    <span className={`${state.darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {state.locations.find(l => l.id === entry.location)?.name || 'Desconhecido'}
                    </span>
                  </div>
                </div>

                {/* Action Category */}
                <div className={`flex items-center space-x-2 mb-3 ${canDelete ? 'ml-6' : ''}`}>
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: state.actionCategories.find(a => a.id === entry.actionCategory)?.color || '#gray' }}
                  />
                  <span className={`text-sm font-medium ${state.darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {state.actionCategories.find(a => a.id === entry.actionCategory)?.name || 'Desconhecido'}
                  </span>
                </div>

                {/* Notes - Editable */}
                <div className={canDelete ? 'ml-6' : ''}>
                  {editingEntry === entry.id ? (
                  <div className="space-y-3">
                    <textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      className={`w-full p-3 rounded-lg border transition-all duration-200 ${
                        state.darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-cyan-500'
                          : 'bg-white border-gray-300 text-gray-900 focus:border-cyan-500'
                      } focus:ring-2 focus:ring-cyan-500/20`}
                      rows={3}
                      disabled={saving}
                      placeholder="Digite suas alterações..."
                    />
                    
                    {/* Error Message */}
                    {validationError && (
                      <div className="flex items-center space-x-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        <span className="text-red-500 text-sm">{validationError}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleSaveEdit(entry.id)}
                        disabled={saving || !editNotes.trim()}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>Salvando...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            <span>Salvar</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={saving}
                        className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-all duration-200 disabled:opacity-50 ${
                          state.darkMode 
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        <X className="w-4 h-4" />
                        <span>Cancelar</span>
                      </button>
                    </div>
                  </div>
                  ) : (
                  <div className={`text-sm ${state.darkMode ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
                    {entry.notes}
                  </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal de confirmação de exclusão */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`max-w-md w-full rounded-xl p-6 ${
            state.darkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'
          } shadow-2xl`}>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className={`text-lg font-semibold ${state.darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Confirmar Exclusão
                </h3>
                <p className={`text-sm ${state.darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Esta ação não pode ser desfeita
                </p>
              </div>
            </div>
            
            <p className={`mb-6 ${state.darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Tem certeza que deseja excluir <strong>{selectedEntries.length}</strong> entrada(s) selecionada(s)?
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className={`flex-1 px-4 py-2 rounded-lg border transition-all duration-200 ${
                  state.darkMode 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-800'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                } disabled:opacity-50`}
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteSelected}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Excluir</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;