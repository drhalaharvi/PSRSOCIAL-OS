
import React from 'react';
import type { Tab } from '../types';

interface HeaderProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const tabs: { id: Tab; label: string }[] = [
    { id: 'plan', label: 'Brand & Market Analysis' },
    { id: 'calendar', label: 'Content Calendar' },
    { id: 'multi-post', label: 'Multi-Platform Post' },
    { id: 'writer', label: 'Post Writer' },
    { id: 'generate', label: 'Image Generation' },
    { id: 'image', label: 'Image Editor' },
    { id: 'upscale', label: 'Image Upscaler' },
    { id: 'video', label: 'Video Generator' },
    { id: 'local', label: 'Local Insights' },
  ];

  const TabButton: React.FC<{ id: Tab, label: string }> = ({ id, label }) => {
    const isActive = activeTab === id;
    return (
      <button
        onClick={() => setActiveTab(id)}
        className={`px-4 py-2 text-sm md:text-base font-medium rounded-md transition-colors duration-200 ${
          isActive
            ? 'bg-indigo-600 text-white'
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <header className="bg-gray-800 shadow-md">
      <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-4 md:mb-0">
          Social Marketing <span className="text-indigo-400">Co-Pilot</span>
        </h1>
        <nav className="flex flex-wrap justify-center space-x-2 md:space-x-4 bg-gray-900 p-2 rounded-lg">
          {tabs.map(tab => (
            <TabButton key={tab.id} id={tab.id} label={tab.label} />
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Header;
