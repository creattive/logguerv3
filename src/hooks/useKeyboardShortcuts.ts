import { useEffect } from 'react';
import { useApp } from '../contexts/AppContext';

export const useKeyboardShortcuts = () => {
  const { state, dispatch } = useApp();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignorar se estiver digitando em um input/textarea
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Atalhos para participantes (ALT + número)
      if (event.altKey && !event.ctrlKey && !event.shiftKey) {
        const num = parseInt(event.key);
        if (num >= 1 && num <= state.participants.length) {
          event.preventDefault();
          const participant = state.participants[num - 1];
          const currentSelected = state.selectedParticipants;
          const newSelected = currentSelected.includes(participant.id)
            ? currentSelected.filter(id => id !== participant.id)
            : [...currentSelected, participant.id];
          
          dispatch({ type: 'SET_SELECTED_PARTICIPANTS', payload: newSelected });
        }
      }

      // Atalhos para locais (CTRL + número)
      if (event.ctrlKey && !event.altKey && !event.shiftKey) {
        const num = parseInt(event.key);
        if (num >= 1 && num <= state.locations.length) {
          event.preventDefault();
          const location = state.locations[num - 1];
          dispatch({ type: 'SET_SELECTED_LOCATION', payload: location.id });
        }
      }

      // Atalhos para ações (SHIFT + número)
      if (event.shiftKey && !event.ctrlKey && !event.altKey) {
        const num = parseInt(event.key);
        if (num >= 1 && num <= state.actionCategories.length) {
          event.preventDefault();
          const action = state.actionCategories[num - 1];
          dispatch({ type: 'SET_SELECTED_ACTION', payload: action.id });
        }
      }

      // Atalho para focar no campo de notas (F2)
      if (event.key === 'F2') {
        event.preventDefault();
        const notesTextarea = document.querySelector('textarea[placeholder*="Digite aqui"]') as HTMLTextAreaElement;
        if (notesTextarea) {
          notesTextarea.focus();
        }
      }

      // Atalho para limpar todas as seleções (ESC)
      if (event.key === 'Escape') {
        dispatch({ type: 'SET_SELECTED_PARTICIPANTS', payload: [] });
        dispatch({ type: 'SET_SELECTED_LOCATION', payload: '' });
        dispatch({ type: 'SET_SELECTED_ACTION', payload: '' });
        dispatch({ type: 'SET_SELECTED_TAGS', payload: [] });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.participants, state.locations, state.actionCategories, state.selectedParticipants, dispatch]);
};