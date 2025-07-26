import React, { useState } from 'react';
import { Plus, Users, MapPin, Tag, FileText, Mic, MicOff, Send, Clock } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { v4 as uuidv4 } from 'uuid';

const LoggingPanel: React.FC = () => {
  const { state, addLogEntry } = useApp();
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedActionCategory, setSelectedActionCategory] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleVoiceRecording = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      if (isListening) {
        recognition.stop();
        setIsListening(false);
      } else {
        recognition.start();
        setIsListening(true);

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setNotes(prev => prev + (prev ? ' ' : '') + transcript);
          setIsListening(false);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocation || !selectedActionCategory || notes.trim() === '') {
      return;
    }

    setLoading(true);

    try {
      await addLogEntry({
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        timecode: state.currentTimecode,
        participants: selectedParticipants,
        location: selectedLocation,
        actionCategory: selectedActionCategory,
        tags: selectedTags,
        notes: notes.trim(),
        updatedAt: new Date().toISOString()
      });

      // Reset form
      setSelectedParticipants([]);
      setSelectedLocation('');
      setSelectedActionCategory('');
      setSelectedTags([]);
      setNotes('');
    } catch (error) {
      console.error('Error adding log entry:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleParticipant = (participantId: string) => {
    setSelectedParticipants(prev => 
      prev.includes(participantId) 
        ? prev.filter(id => id !== participantId)
        : [...prev, participantId]
    );
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  return (
    <div className={`${state.darkMode ? 'bg-gray-900/50' : 'bg-white'} rounded-xl shadow-lg border ${state.darkMode ? 'border-gray-700' : 'border-gray-200'} h-fit`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className={`text-xl font-bold ${state.darkMode ? 'text-white' : 'text-gray-900'}`}>
            New Log Entry
          </h2>
          <div className="flex items-center space-x-2">
            <Clock className={`w-4 h-4 ${state.darkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
            <span className={`text-sm font-mono font-semibold ${state.darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>
              {state.currentTimecode}
            </span>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Participants Grid */}
        <div>
          <label className={`flex items-center space-x-2 text-sm font-medium mb-3 ${state.darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <Users className="w-4 h-4" />
            <span>Participants</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {state.participants.map(participant => (
              <button
                key={participant.id}
                type="button"
                onClick={() => toggleParticipant(participant.id)}
                className={`p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                  selectedParticipants.includes(participant.id)
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                    : state.darkMode 
                    ? 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
                    : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-sm truncate">
                  {participant.name}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Location & Action in same row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={`flex items-center space-x-2 text-sm font-medium mb-2 ${state.darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <MapPin className="w-4 h-4" />
              <span>Location</span>
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border transition-all duration-200 ${
                state.darkMode 
                  ? 'bg-gray-800 border-gray-600 text-white focus:border-cyan-500'
                  : 'bg-white border-gray-300 text-gray-900 focus:border-cyan-500'
              } focus:ring-2 focus:ring-cyan-500/20`}
              required
            >
              <option value="">Select...</option>
              {state.locations.map(location => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={`flex items-center space-x-2 text-sm font-medium mb-2 ${state.darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <Plus className="w-4 h-4" />
              <span>Action</span>
            </label>
            <select
              value={selectedActionCategory}
              onChange={(e) => setSelectedActionCategory(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border transition-all duration-200 ${
                state.darkMode 
                  ? 'bg-gray-800 border-gray-600 text-white focus:border-cyan-500'
                  : 'bg-white border-gray-300 text-gray-900 focus:border-cyan-500'
              } focus:ring-2 focus:ring-cyan-500/20`}
              required
            >
              <option value="">Select...</option>
              {state.actionCategories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className={`flex items-center space-x-2 text-sm font-medium mb-3 ${state.darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <Tag className="w-4 h-4" />
            <span>Tags</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {state.tags.map(tag => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedTags.includes(tag.id)
                    ? 'text-white'
                    : state.darkMode 
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={selectedTags.includes(tag.id) ? { backgroundColor: tag.color } : {}}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>

        {/* Notes with Voice */}
        <div>
          <label className={`flex items-center space-x-2 text-sm font-medium mb-3 ${state.darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <FileText className="w-4 h-4" />
            <span>Notes</span>
          </label>
          <div className="relative">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`w-full px-4 py-3 pr-12 rounded-lg border transition-all duration-200 resize-none ${
                state.darkMode 
                  ? 'bg-gray-800 border-gray-600 text-white focus:border-cyan-500'
                  : 'bg-white border-gray-300 text-gray-900 focus:border-cyan-500'
              } focus:ring-2 focus:ring-cyan-500/20`}
              rows={4}
              placeholder="Describe what happened..."
              required
            />
            <button
              type="button"
              onClick={handleVoiceRecording}
              className={`absolute right-3 top-3 p-2 rounded-lg transition-all duration-200 ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse'
                  : state.darkMode 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !selectedLocation || !selectedActionCategory || !notes.trim()}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-700 focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Adding...</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>Add Entry</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default LoggingPanel;