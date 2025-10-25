
import React, { useState, useCallback } from 'react';
import { generateMarketingPlan } from '../services/geminiService';
import type { MarketingPlanResponse, GroundingMetadata, Task, PostIdea } from '../types';
import Spinner from './ui/Spinner';
import Card from './ui/Card';
import Button from './ui/Button';
import GroundingSources from './ui/GroundingSources';

interface MarketingPlanProps {
    tasks: Task[];
    onAddTask: (postIdea: PostIdea) => void;
}

const MarketingPlan: React.FC<MarketingPlanProps> = ({ tasks, onAddTask }) => {
    const [businessInfo, setBusinessInfo] = useState('');
    const [competitorsInfo, setCompetitorsInfo] = useState('');
    const [plan, setPlan] = useState<MarketingPlanResponse | null>(null);
    const [grounding, setGrounding] = useState<GroundingMetadata | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!businessInfo.trim() || !competitorsInfo.trim()) {
            setError('Please fill in both your business and competitor information.');
            return;
        }
        setLoading(true);
        setError(null);
        setPlan(null);
        setGrounding(null);
        try {
            const { plan: newPlan, groundingMetadata } = await generateMarketingPlan(businessInfo, competitorsInfo);
            setPlan(newPlan);
            setGrounding(groundingMetadata);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [businessInfo, competitorsInfo]);

    return (
        <div className="space-y-8">
            <Card>
                <h2 className="text-2xl font-bold text-indigo-400 mb-4">Generate Your Marketing Plan</h2>
                <p className="text-gray-400 mb-6">Describe your business and key competitors. Our AI will analyze the market and generate a strategic social media plan using Thinking Mode and Google Search for up-to-date insights.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="businessInfo" className="block text-sm font-medium text-gray-300 mb-2">Your Business</label>
                        <textarea
                            id="businessInfo"
                            value={businessInfo}
                            onChange={(e) => setBusinessInfo(e.target.value)}
                            placeholder="e.g., An artisanal coffee shop in downtown focused on sustainable, single-origin beans."
                            className="w-full h-24 p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                            rows={3}
                        />
                    </div>
                    <div>
                        <label htmlFor="competitorsInfo" className="block text-sm font-medium text-gray-300 mb-2">Your Competitors</label>
                        <textarea
                            id="competitorsInfo"
                            value={competitorsInfo}
                            onChange={(e) => setCompetitorsInfo(e.target.value)}
                            placeholder="e.g., Starbucks (global chain), The Daily Grind (local competitor known for low prices)."
                            className="w-full h-24 p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                            rows={3}
                        />
                    </div>
                    <Button type="submit" disabled={loading} className="w-full md:w-auto">
                        {loading ? <><Spinner /> Generating...</> : 'Generate Plan'}
                    </Button>
                </form>
                 {error && <p className="text-red-400 mt-4">{error}</p>}
            </Card>

            {loading && (
                 <Card>
                    <div className="flex flex-col items-center justify-center p-8">
                        <Spinner />
                        <p className="mt-4 text-lg text-gray-300">Engaging Thinking Mode... this may take a moment.</p>
                    </div>
                 </Card>
            )}

            {plan && (
                <div className="space-y-6">
                    <Card>
                        <h3 className="text-xl font-semibold text-indigo-400 mb-4">Competitor Analysis</h3>
                        <div className="space-y-4">
                            {plan.competitorAnalysis.map((comp, index) => (
                                <div key={index} className="p-4 bg-gray-800 rounded-lg">
                                    <h4 className="font-bold text-lg text-gray-200">{comp.competitorName}</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                        <div>
                                            <h5 className="text-green-400 font-semibold">Strengths</h5>
                                            <ul className="list-disc list-inside text-gray-400">
                                                {comp.strengths.map((s, i) => <li key={i}>{s}</li>)}
                                            </ul>
                                        </div>
                                        <div>
                                            <h5 className="text-red-400 font-semibold">Weaknesses</h5>
                                            <ul className="list-disc list-inside text-gray-400">
                                                {comp.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card>
                         <h3 className="text-xl font-semibold text-indigo-400 mb-4">Content Pillars</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {plan.contentPillars.map((pillar, index) => (
                                <div key={index} className="p-4 bg-gray-800 rounded-lg">
                                    <h4 className="font-bold text-lg text-gray-200">{pillar.pillar}</h4>
                                    <p className="text-gray-400 mt-1">{pillar.description}</p>
                                </div>
                            ))}
                         </div>
                    </Card>

                    <Card>
                        <h3 className="text-xl font-semibold text-indigo-400 mb-4">Post Ideas</h3>
                        <div className="space-y-4">
                            {plan.postIdeas.map((idea, index) => {
                                const isSaved = tasks.some(task => task.postIdea.prompt === idea.prompt && task.postIdea.platform === idea.platform);
                                return (
                                <div key={index} className="p-4 bg-gray-800 rounded-lg">
                                    <h4 className="font-bold text-lg text-gray-200">For {idea.platform}</h4>
                                    <p className="text-gray-400 mt-2"><strong className="text-gray-300">Prompt:</strong> {idea.prompt}</p>
                                    <p className="text-gray-400 mt-1"><strong className="text-gray-300">Visual Idea:</strong> {idea.visualIdea}</p>
                                     <div className="mt-3 flex justify-end">
                                        <Button
                                            onClick={() => onAddTask(idea)}
                                            disabled={isSaved}
                                            className="!px-3 !py-1 text-sm"
                                        >
                                            {isSaved ? '✓ Saved' : 'Save as Task'}
                                        </Button>
                                    </div>
                                </div>
                            )})}
                        </div>
                    </Card>
                    
                    {grounding && <GroundingSources metadata={grounding} />}
                </div>
            )}
        </div>
    );
};

export default MarketingPlan;
