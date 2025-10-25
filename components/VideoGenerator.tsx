import React, { useState, useCallback, useEffect } from 'react';
import { generateVideo } from '../services/geminiService';
import { fileToBase64, fileToDataUrl } from '../utils/fileUtils';
import type { AspectRatio } from '../types';
import Spinner from './ui/Spinner';
import Card from './ui/Card';
import Button from './ui/Button';
import FileInput from './ui/FileInput';

const loadingMessages = [
    "Warming up the video engine...",
    "Storyboarding your scene...",
    "Rendering initial frames...",
    "Applying special effects...",
    "Compositing the final shots...",
    "This can take a few minutes, hang tight...",
    "Almost there..."
];

const VideoGenerator: React.FC = () => {
    const [apiKeySelected, setApiKeySelected] = useState(false);
    const [checkingApiKey, setCheckingApiKey] = useState(true);

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
    const [error, setError] = useState<string | null>(null);

    // Fix: Updated to safely handle optional window.aistudio property.
    useEffect(() => {
        const checkKey = async () => {
            if (window.aistudio) {
                try {
                    const hasKey = await window.aistudio.hasSelectedApiKey();
                    setApiKeySelected(hasKey);
                } catch (e) {
                    console.error("aistudio.hasSelectedApiKey() failed", e);
                    setApiKeySelected(true); // Assume available on error as per original logic
                } finally {
                    setCheckingApiKey(false);
                }
            } else {
                console.warn("window.aistudio is not defined. Assuming API key is selected.");
                setApiKeySelected(true); // Assume it's available in environments where aistudio is not present
                setCheckingApiKey(false);
            }
        };
        checkKey();
    }, []);
    
    useEffect(() => {
        let interval: number;
        if (loading) {
            interval = window.setInterval(() => {
                setLoadingMessage(prev => {
                    const currentIndex = loadingMessages.indexOf(prev);
                    const nextIndex = (currentIndex + 1) % loadingMessages.length;
                    return loadingMessages[nextIndex];
                });
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [loading]);

    // Fix: Updated to safely handle optional window.aistudio property.
    const handleSelectKey = async () => {
        if (window.aistudio) {
            try {
                await window.aistudio.openSelectKey();
                // Assume success after opening dialog to handle race condition
                setApiKeySelected(true);
            } catch (e) {
                console.error("Failed to open API key selection", e);
                setError("Could not open the API key selection dialog.");
            }
        } else {
            console.error("window.aistudio is not available to open API key selection.");
            setError("API key selection is not available in this environment.");
        }
    };
    
    const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setGeneratedVideoUrl(null);
            try {
                const dataUrl = await fileToDataUrl(file);
                setPreviewUrl(dataUrl);
            } catch (err) {
                setError('Failed to load image preview.');
            }
        }
    }, []);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!imageFile || !prompt.trim()) {
            setError('Please upload an image and provide a video prompt.');
            return;
        }
        setLoading(true);
        setError(null);
        setGeneratedVideoUrl(null);
        setLoadingMessage(loadingMessages[0]);

        try {
            const base64Image = await fileToBase64(imageFile);
            const videoUrl = await generateVideo(base64Image, imageFile.type, prompt, aspectRatio);
            setGeneratedVideoUrl(videoUrl);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            if (errorMessage.includes("Requested entity was not found")) {
                setError("Your API key is invalid. Please select a valid key.");
                setApiKeySelected(false);
            } else {
                setError(errorMessage);
            }
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [imageFile, prompt, aspectRatio]);

    if (checkingApiKey) {
        return <Card><div className="flex justify-center items-center p-8"><Spinner /> <span className="ml-4">Checking API Key...</span></div></Card>;
    }

    if (!apiKeySelected) {
        return (
            <Card>
                <div className="text-center p-8">
                    <h2 className="text-2xl font-bold text-indigo-400 mb-4">API Key Required</h2>
                    <p className="text-gray-400 mb-6">Video generation with Veo requires a valid API key. Please select one to continue. Billing applies.</p>
                    <Button onClick={handleSelectKey}>Select API Key</Button>
                    <p className="mt-4 text-sm text-gray-500">
                        For more information, see the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-indigo-400">billing documentation</a>.
                    </p>
                    {error && <p className="text-red-400 mt-4">{error}</p>}
                </div>
            </Card>
        );
    }
    
    return (
        <div className="space-y-8">
            <Card>
                <h2 className="text-2xl font-bold text-indigo-400 mb-4">AI Video Generator</h2>
                <p className="text-gray-400 mb-6">Bring your images to life! Upload a starting image, describe a scene, and our AI will generate a short video.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <FileInput label="Upload Starting Image" onChange={handleFileChange} accept="image/*" />
                    <div>
                        <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">Video Prompt</label>
                        <input
                            id="prompt"
                            type="text"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g., The camera slowly zooms out to reveal a futuristic city"
                            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Aspect Ratio</label>
                        <div className="flex space-x-4">
                            {(['16:9', '9:16'] as AspectRatio[]).map(ratio => (
                                <label key={ratio} className="flex items-center space-x-2 text-gray-300">
                                    <input
                                        type="radio"
                                        name="aspectRatio"
                                        value={ratio}
                                        checked={aspectRatio === ratio}
                                        onChange={() => setAspectRatio(ratio)}
                                        className="form-radio h-4 w-4 text-indigo-600 bg-gray-700 border-gray-600 focus:ring-indigo-500"
                                    />
                                    <span>{ratio} ({ratio === '16:9' ? 'Landscape' : 'Portrait'})</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <Button type="submit" disabled={loading || !imageFile} className="w-full md:w-auto">
                        {loading ? <><Spinner /> Generating...</> : 'Generate Video'}
                    </Button>
                </form>
                {error && <p className="text-red-400 mt-4">{error}</p>}
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {previewUrl && (
                    <Card>
                        <h3 className="text-xl font-semibold text-center mb-4">Starting Image</h3>
                        <img src={previewUrl} alt="Video start" className="rounded-lg w-full h-auto object-contain max-h-96" />
                    </Card>
                )}
                
                {loading && (
                     <Card>
                        <div className="flex flex-col items-center justify-center h-full min-h-[24rem]">
                            <Spinner />
                            <p className="mt-4 text-lg text-gray-300 text-center">{loadingMessage}</p>
                        </div>
                     </Card>
                )}

                {generatedVideoUrl && (
                    <Card>
                        <h3 className="text-xl font-semibold text-center mb-4">Generated Video</h3>
                        <video src={generatedVideoUrl} controls autoPlay loop className="rounded-lg w-full h-auto max-h-96" />
                    </Card>
                )}
            </div>
        </div>
    );
};

export default VideoGenerator;
