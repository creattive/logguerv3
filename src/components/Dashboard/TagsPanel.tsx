import React from 'react';
import { useApp } from '../../contexts/AppContext';

const TagsPanel: React.FC = () => {
  const { state, dispatch } = useApp();
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);

  const toggleTag = (tagId: string) => {
    const newSelectedTags = selectedTags.includes(tagId) 
      ? selectedTags.filter(id => id !== tagId)
      : [...selectedTags, tagId];
    
    setSelectedTags(newSelectedTags);
    dispatch({ type: 'SET_SELECTED_TAGS', payload: newSelectedTags });
  };

  return (
    <div className={`${state.darkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-xl border-2 ${state.darkMode ? 'border-gray-700' : 'border-gray-200'} h-full`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-400 to-pink-500 rounded-t-2xl p-4">
        <h2 className="text-xl font-bold text-white text-center">
          TAGS
        </h2>
      </div>

      {/* Tags */}
      <div className="p-4">
        <div className="flex flex-wrap gap-3">
          {state.tags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => toggleTag(tag.id)}
              className={`px-4 py-2 rounded-full font-bold text-sm transition-all duration-200 border-2 ${
                selectedTags.includes(tag.id)
                  ? 'border-green-500 scale-95 shadow-lg'
                  : 'border-transparent hover:scale-105'
              }`}
              style={{ 
                backgroundColor: tag.color,
                color: 'white'
              }}
            >
              {tag.name.toUpperCase()}
              {selectedTags.includes(tag.id) && (
                <span className="ml-2">✓</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TagsPanel;