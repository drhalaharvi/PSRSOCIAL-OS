
import React, { useState, useCallback } from 'react';
import { generateMarketAnalysis } from '../services/geminiService';
import type { MarketingPlanResponse, GroundingMetadata, PostIdea } from '../types';
import Spinner from './ui/Spinner';
import Card from './ui/Card';
import Button from './ui/Button';
import GroundingSources from './ui/GroundingSources';

interface BrandMarketAnalysisProps {
    onAddTask: (postIdea: PostIdea) => void;
}

const BrandMarketAnalysis: React.FC<BrandMarketAnalysisProps> = ({ onAddTask }) => {
    const [brandMission, setBrandMission] = useState('');
    const [targetAudience, setTargetAudience] = useState('');
    const [brandTone, setBrandTone] = useState('');
    const [competitorsInfo, setCompetitorsInfo] = useState('');
    
    const [analysis, setAnalysis] = useState<MarketingPlanResponse | null>(null);
    const [grounding, setGrounding] = useState<GroundingMetadata | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!brandMission.trim() || !targetAudience.trim() || !brandTone.trim() || !competitorsInfo.trim()) {
            setError('Please fill in all fields to generate a thorough analysis.');
            return;
        }
        setLoading(true);
        setError(null);
        setAnalysis(null);
        setGrounding(null);
        try {
            const brandInfo = { mission: brandMission, audience: targetAudience, tone: brandTone };
            const { plan: newAnalysis, groundingMetadata } = await generateMarketAnalysis(brandInfo, competitorsInfo);
            setAnalysis(newAnalysis);
            setGrounding(groundingMetadata);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [brandMission, targetAudience, brandTone, competitorsInfo]);
    
    const renderCompetitorStrategies = () => (
        <Card>
            <h3 className="text-xl font-semibold text-indigo-400 mb-4">Competitor Deep Dive</h3>
            <div className="space-y-6">
                {analysis?.competitorStrategies.map((comp, index) => (
                    <div key={index} className="p-4 bg-gray-800 rounded-lg">
                        <h4 className="font-bold text-lg text-gray-200">{comp.competitorName}</h4>
                        <div className="mt-3 space-y-3">
                            <div>
                                <h5 className="text-gray-300 font-semibold">Key Content Themes</h5>
                                <ul className="list-disc list-inside text-gray-400">
                                    {comp.contentThemes.map((s, i) => <li key={i}>{s}</li>)}
                                </ul>
                            </div>
                             <div>
                                <h5 className="text-gray-300 font-semibold">Common Post Types</h5>
                                <ul className="list-disc list-inside text-gray-400">
                                    {comp.commonPostTypes.map((s, i) => <li key={i}>{s}</li>)}
                                </ul>
                            </div>
                            <div>
                                <h5 className="text-gray-300 font-semibold">Platform Strategies</h5>
                                {comp.platformStrategies.map((ps, i) => (
                                   <div key={i} className="mt-2 pl-2 border-l-2 border-gray-700">
                                       <p className="text-gray-400"><strong className="text-gray-300">{ps.platform}:</strong> {ps.strategy}</p>
                                       {ps.postingFrequency && (
                                           <p className="text-gray-400 text-sm mt-1"><strong className="text-gray-300">Approx. posting frequency:</strong> {ps.postingFrequency}</p>
                                       )}
                                   </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );

    const renderTrendingTopics = () => (
         <Card>
             <h3 className="text-xl font-semibold text-indigo-400 mb-4">Trending Topics & Keywords</h3>
             <div className="space-y-4">
                {analysis?.trendingTopics.map((topic, index) => (
                    <div key={index} className="p-4 bg-gray-800 rounded-lg">
                        <h4 className="font-bold text-lg text-gray-200">{topic.topic}</h4>
                        <p className="text-gray-400 mt-1">{topic.relevance}</p>
                    </div>
                ))}
             </div>
        </Card>
    );

    const renderPostIdeas = () => (
        <Card>
            <h3 className="text-xl font-semibold text-indigo-400 mb-4">Actionable Post Ideas</h3>
            <div className="space-y-4">
                {analysis?.postIdeas.map((idea, index) => (
                <div key={index} className="p-4 bg-gray-800 rounded-lg">
                    <h4 className="font-bold text-lg text-gray-200">For {idea.platform}</h4>
                    <p className="text-gray-400 mt-2"><strong className="text-gray-300">Prompt:</strong> {idea.prompt}</p>
                    <p className="text-gray-400 mt-1"><strong className="text-gray-300">Visual Idea:</strong> {idea.visualIdea}</p>
                     <div className="mt-3 flex justify-end">
                        <Button
                            onClick={() => onAddTask(idea)}
                            className="!px-3 !py-1 text-sm"
                        >
                            Save for Calendar
                        </Button>
                    </div>
                </div>
                ))}
            </div>
        </Card>
    );

    return (
        <div className="space-y-8">
            <Card>
                <h2 className="text-2xl font-bold text-indigo-400 mb-4">Brand & Market Analysis</h2>
                <p className="text-gray-400 mb-6">Define your brand and competitors. Our AI will perform a deep-dive analysis to uncover strategic insights and content opportunities.</p>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <fieldset className="border border-gray-600 p-4 rounded-md">
                        <legend className="px-2 text-lg font-semibold text-gray-300">Your Brand Identity</legend>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="brandMission" className="block text-sm font-medium text-gray-300 mb-2">Brand Mission</label>
                                <input id="brandMission" value={brandMission} onChange={(e) => setBrandMission(e.target.value)} placeholder="e.g., To provide the best sustainable coffee experience." className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md"/>
                            </div>
                            <div>
                                <label htmlFor="targetAudience" className="block text-sm font-medium text-gray-300 mb-2">Target Audience</label>
                                <input id="targetAudience" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} placeholder="e.g., Eco-conscious millennials, remote workers aged 25-40." className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md"/>
                            </div>
                            <div>
                                <label htmlFor="brandTone" className="block text-sm font-medium text-gray-300 mb-2">Brand Voice & Tone</label>
                                <input id="brandTone" value={brandTone} onChange={(e) => setBrandTone(e.target.value)} placeholder="e.g., Friendly, informative, witty, and passionate." className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md"/>
                            </div>
                        </div>
                    </fieldset>
                    <div>
                        <label htmlFor="competitorsInfo" className="block text-sm font-medium text-gray-300 mb-2">Your Competitors</label>
                        <textarea id="competitorsInfo" value={competitorsInfo} onChange={(e) => setCompetitorsInfo(e.target.value)} placeholder="List 2-3 key competitors, e.g., Starbucks, The Daily Grind." className="w-full h-24 p-2 bg-gray-700 border border-gray-600 rounded-md" />
                    </div>
                    <Button type="submit" disabled={loading} className="w-full md:w-auto">
                        {loading ? <><Spinner /> Analyzing...</> : 'Generate Analysis'}
                    </Button>
                </form>
                 {error && <p className="text-red-400 mt-4">{error}</p>}
            </Card>

            {loading && (
                 <Card>
                    <div className="flex flex-col items-center justify-center p-8">
                        <Spinner />
                        <p className="mt-4 text-lg text-gray-300">Conducting deep-dive analysis... this may take a moment.</p>
                    </div>
                 </Card>
            )}

            {analysis && (
                <div className="space-y-6">
                    {renderCompetitorStrategies()}
                    {renderTrendingTopics()}
                    {renderPostIdeas()}
                    {grounding && <GroundingSources metadata={grounding} />}
                </div>
            )}
        </div>
    );
};

export default BrandMarketAnalysis;