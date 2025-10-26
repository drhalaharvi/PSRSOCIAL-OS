
import React, { useState, useCallback } from 'react';
import { getPostingRecommendations } from '../services/geminiService';
import { fileToDataUrl } from '../utils/fileUtils';
import type { Platform, PostingRecommendation } from '../types';
import Spinner from './ui/Spinner';
import Card from './ui/Card';
import Button from './ui/Button';
import FileInput from './ui/FileInput';

const availablePlatforms: Platform[] = ['Facebook', 'Instagram', 'LinkedIn', 'Google Business Profile'];

const MultiPostManager: React.FC = () => {
    const [postContent, setPostContent] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);
    const [recommendations, setRecommendations] = useState<PostingRecommendation[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            try {
                const dataUrl = await fileToDataUrl(file);
                setPreviewUrl(dataUrl);
            } catch (err) {
                setError('Failed to load image preview.');
                console.error(err);
            }
        }
    }, []);

    const handlePlatformChange = (platform: Platform) => {
        setSelectedPlatforms(prev =>
            prev.includes(platform)
                ? prev.filter(p => p !== platform)
                : [...prev, platform]
        );
    };

    const handleGetRecommendations = useCallback(async () => {
        if (!postContent.trim() || selectedPlatforms.length === 0) {
            setError('Please write some content and select at least one platform.');
            return;
        }
        setLoading(true);
        setError(null);
        setRecommendations(null);
        try {
            const result = await getPostingRecommendations(postContent, selectedPlatforms);
            setRecommendations(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [postContent, selectedPlatforms]);

    const handleSchedulePost = () => {
        // This is a simulation
        alert('Posts scheduled successfully! (Simulation)');
    };

    return (
        <div className="space-y-8">
            <Card>
                <h2 className="text-2xl font-bold text-indigo-400 mb-4">Multi-Platform Post Composer</h2>
                <p className="text-gray-400 mb-6">Draft your post, select your target platforms, and get AI-powered recommendations for optimal timing and formatting.</p>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="postContent" className="block text-sm font-medium text-gray-300 mb-2">Post Content</label>
                        <textarea
                            id="postContent"
                            value={postContent}
                            onChange={(e) => setPostContent(e.target.value)}
                            placeholder="What's on your mind?"
                            className="w-full h-32 p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 transition"
                        />
                    </div>
                    <FileInput
                        id="multi-post-image-upload"
                        label="Upload Media (Optional)"
                        onChange={handleFileChange}
                        accept="image/*"
                        description="Add an image to your post."
                    />
                    {previewUrl && (
                        <div className="mt-4">
                            <img src={previewUrl} alt="Post preview" className="rounded-lg max-h-48 w-auto" />
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Select Platforms</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {availablePlatforms.map(platform => (
                                <label key={platform} className="flex items-center p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition">
                                    <input
                                        type="checkbox"
                                        checked={selectedPlatforms.includes(platform)}
                                        onChange={() => handlePlatformChange(platform)}
                                        className="h-5 w-5 rounded border-gray-500 bg-gray-800 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="ml-3 text-sm font-medium text-gray-200">{platform}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <Button onClick={handleGetRecommendations} disabled={loading || !postContent.trim() || selectedPlatforms.length === 0} className="w-full md:w-auto">
                        {loading ? <><Spinner /> Getting Recommendations...</> : 'Get Recommendations'}
                    </Button>
                </div>
                 {error && <p className="text-red-400 mt-4">{error}</p>}
            </Card>

            {loading && (
                 <Card>
                    <div className="flex flex-col items-center justify-center p-8">
                        <Spinner />
                        <p className="mt-4 text-lg text-gray-300">Analyzing your post...</p>
                    </div>
                 </Card>
            )}

            {recommendations && recommendations.length > 0 && (
                <Card>
                    <h3 className="text-xl font-semibold text-indigo-400 mb-4">AI Recommendations</h3>
                    <div className="space-y-4">
                        {recommendations.map(rec => (
                            <div key={rec.platform} className="p-4 bg-gray-800 rounded-lg">
                                <h4 className="font-bold text-lg text-gray-200">{rec.platform}</h4>
                                <p className="text-gray-400 mt-2"><strong className="text-gray-300">Optimal Time:</strong> {rec.optimalTime}</p>
                                <p className="text-gray-400 mt-1"><strong className="text-gray-300">Format Suggestion:</strong> {rec.formatSuggestion}</p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 flex justify-end">
                        <Button onClick={handleSchedulePost}>
                            Schedule Posts (Simulated)
                        </Button>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default MultiPostManager;