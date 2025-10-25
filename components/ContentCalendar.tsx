
import React from 'react';
import type { Task } from '../types';
import Card from './ui/Card';

interface ContentCalendarProps {
    tasks: Task[];
    onToggleTask: (taskId: string) => void;
}

interface TaskItemProps {
    task: Task;
    onToggle: (taskId: string) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle }) => (
    <div className="flex items-start p-4 bg-gray-700 rounded-lg transition-colors duration-200">
        <input
            type="checkbox"
            id={`task-${task.id}`}
            checked={task.completed}
            onChange={() => onToggle(task.id)}
            className="mt-1 h-5 w-5 rounded border-gray-500 bg-gray-800 text-indigo-600 focus:ring-indigo-500 cursor-pointer flex-shrink-0"
            aria-label={`Mark task for ${task.postIdea.platform} as complete`}
        />
        <label htmlFor={`task-${task.id}`} className={`ml-4 w-full cursor-pointer ${task.completed ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
            <h4 className="font-bold">For {task.postIdea.platform}</h4>
            <p className={`text-sm mt-1 ${task.completed ? 'text-gray-500' : 'text-gray-400'}`}>
                <strong className="font-semibold">Prompt:</strong> {task.postIdea.prompt}
            </p>
            <p className={`text-sm mt-1 ${task.completed ? 'text-gray-500' : 'text-gray-400'}`}>
                <strong className="font-semibold">Visual Idea:</strong> {task.postIdea.visualIdea}
            </p>
        </label>
    </div>
);


const ContentCalendar: React.FC<ContentCalendarProps> = ({ tasks, onToggleTask }) => {
    const incompleteTasks = tasks.filter(task => !task.completed);
    const completedTasks = tasks.filter(task => task.completed);

    if (tasks.length === 0) {
        return (
            <Card>
                <div className="text-center p-8">
                    <h2 className="text-2xl font-bold text-indigo-400 mb-4">Content Calendar is Empty</h2>
                    <p className="text-gray-400">
                        Generate a marketing plan and save post ideas to start building your content schedule.
                    </p>
                </div>
            </Card>
        );
    }
    
    return (
        <div className="space-y-8">
            {incompleteTasks.length > 0 && (
                <Card>
                    <h2 className="text-2xl font-bold text-indigo-400 mb-4">To-Do ({incompleteTasks.length})</h2>
                    <div className="space-y-4">
                        {incompleteTasks.map(task => (
                            <TaskItem key={task.id} task={task} onToggle={onToggleTask} />
                        ))}
                    </div>
                </Card>
            )}

            {completedTasks.length > 0 && (
                 <Card>
                    <h2 className="text-2xl font-bold text-green-400 mb-4">Completed ({completedTasks.length})</h2>
                    <div className="space-y-4">
                        {completedTasks.map(task => (
                            <TaskItem key={task.id} task={task} onToggle={onToggleTask} />
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
};

export default ContentCalendar;
