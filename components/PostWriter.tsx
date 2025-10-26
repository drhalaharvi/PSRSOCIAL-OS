
import React, { useState, useCallback } from 'react';
import { generatePostContent } from '../services/geminiService';
import Spinner from './ui/Spinner';
import Card from './ui/Card';
import Button from './ui/Button';

const tones = ['Professional', 'Casual', 'Witty', 'Empathetic', 'Promotional'];
const platforms = ['Facebook', 'Instagram', 'LinkedIn', 'X (Twitter)', 'TikTok'];

const PostWriter: React.FC = () => {
    const [topic, setTopic] = useState('');
    const [tone, setTone] = useState(tones[1]); // Default to Casual
    const [platform, setPlatform] = useState(platforms[0]); // Default to Facebook
    const [generatedPost, setGeneratedPost] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copySuccess, setCopySuccess] = useState('');

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic.trim()) {
            setError('Please enter a topic or some keywords.');
            return;
        }
        setLoading(true);
        setError(null);
        setGeneratedPost('');
        setCopySuccess('');

        try {
            const post = await generatePostContent(topic, tone, platform);
            setGeneratedPost(post);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred while generating the post.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [topic, tone, platform]);

    const handleCopyToClipboard = () => {
        if (!generatedPost) return;
        navigator.clipboard.writeText(generatedPost).then(() => {
            setCopySuccess('Copied!');
            setTimeout(() => setCopySuccess(''), 2000);
        }, (err) => {
            console.error('Could not copy text: ', err);
            setCopySuccess('Failed to copy');
            setTimeout(() => setCopySuccess(''), 2000);
        });
    };

    return (
        <div className="space-y-8">
            <Card>
                <h2 className="text-2xl font-bold text-indigo-400 mb-4">AI Post Writer</h2>
                <p className="text-gray-400 mb-6">Never stare at a blank page again. Generate engaging social media posts in seconds by providing a topic and selecting a tone.</p>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="topic" className="block text-sm font-medium text-gray-300 mb-2">Topic or Keywords</label>
                        <textarea
                            id="topic"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="e.g., launch of our new eco-friendly coffee cups"
                            className="w-full h-24 p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Tone of Voice</label>
                        <div className="flex flex-wrap gap-2">
                            {tones.map(t => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setTone(t)}
                                    className={`px-3 py-2 text-xs md:text-sm font-medium rounded-md transition-all duration-200 border-2 ${
                                        tone === t
                                            ? 'bg-indigo-600 border-indigo-500 text-white ring-2 ring-offset-2 ring-offset-gray-800 ring-indigo-500'
                                            : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:border-gray-500'
                                    }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label htmlFor="platform" className="block text-sm font-medium text-gray-300 mb-2">Platform</label>
                        <select
                            id="platform"
                            value={platform}
                            onChange={(e) => setPlatform(e.target.value)}
                            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500"
                        >
                            {platforms.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <Button type="submit" disabled={loading} className="w-full md:w-auto">
                        {loading ? <><Spinner /> Generating Post...</> : 'Generate Post'}
                    </Button>
                </form>
                {error && <p className="text-red-400 mt-4">{error}</p>}
            </Card>

            {loading && (
                <Card>
                    <div className="flex flex-col items-center justify-center p-8">
                        <Spinner />
                        <p className="mt-4 text-lg text-gray-300">Crafting the perfect post...</p>
                    </div>
                </Card>
            )}

            {generatedPost && (
                <Card>
                    <h3 className="text-xl font-semibold text-indigo-400 mb-4">Generated Post</h3>
                    <div className="relative">
                        <textarea
                            readOnly
                            value={generatedPost}
                            className="w-full h-48 p-3 bg-gray-900 border border-gray-700 rounded-md text-gray-300 whitespace-pre-wrap"
                            aria-label="Generated post content"
                        />
                        <button
                            onClick={handleCopyToClipboard}
                            className="absolute top-2 right-2 px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded-md text-gray-300 transition-colors"
                            aria-label="Copy to clipboard"
                        >
                            {copySuccess || 'Copy'}
                        </button>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default PostWriter;
