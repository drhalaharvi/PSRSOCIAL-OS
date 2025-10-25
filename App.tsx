
import React, { useState, useCallback } from 'react';
import type { Tab, Task, PostIdea } from './types';
import Header from './components/Header';
import MarketingPlan from './components/MarketingPlan';
import ImageEditor from './components/ImageEditor';
import ImageGenerator from './components/ImageGenerator';
import ImageUpscaler from './components/ImageUpscaler';
import VideoGenerator from './components/VideoGenerator';
import LocalInsights from './components/LocalInsights';
import ContentCalendar from './components/ContentCalendar';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('plan');
  const [tasks, setTasks] = useState<Task[]>([]);

  const addTask = useCallback((postIdea: PostIdea) => {
    setTasks(prevTasks => {
        const isAlreadyAdded = prevTasks.some(task => 
            task.postIdea.prompt === postIdea.prompt && 
            task.postIdea.platform === postIdea.platform
        );
        if (isAlreadyAdded) {
            return prevTasks;
        }
        const newTask: Task = {
            id: `task-${Date.now()}-${Math.random()}`,
            postIdea,
            completed: false,
        };
        return [...prevTasks, newTask];
    });
  }, []);

  const toggleTask = useCallback((taskId: string) => {
      setTasks(prevTasks =>
          prevTasks.map(task =>
              task.id === taskId ? { ...task, completed: !task.completed } : task
          )
      );
  }, []);


  const renderContent = () => {
    switch (activeTab) {
      case 'plan':
        return <MarketingPlan tasks={tasks} onAddTask={addTask} />;
      case 'calendar':
        return <ContentCalendar tasks={tasks} onToggleTask={toggleTask} />;
      case 'generate':
        return <ImageGenerator />;
      case 'image':
        return <ImageEditor />;
      case 'upscale':
        return <ImageUpscaler />;
      case 'video':
        return <VideoGenerator />;
      case 'local':
        return <LocalInsights />;
      default:
        return <MarketingPlan tasks={tasks} onAddTask={addTask} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="p-4 md:p-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
