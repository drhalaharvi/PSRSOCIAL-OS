
import React, { useState, useCallback } from 'react';
import { generateImage } from '../services/geminiService';
import type { AspectRatio } from '../types';
import Spinner from './ui/Spinner';
import Card from './ui/Card';
import Button from './ui/Button';
import DownloadButton from './ui/DownloadButton';

const ImageGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) {
            setError('Please enter a prompt to generate an image.');
            return;
        }
        setLoading(true);
        setError(null);
        setGeneratedImageUrl(null);
        try {
            const generatedBase64 = await generateImage(prompt, aspectRatio);
            setGeneratedImageUrl(`data:image/jpeg;base64,${generatedBase64}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate image.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [prompt, aspectRatio]);
    
    return (
        <div className="space-y-8">
            <Card>
                <h2 className="text-2xl font-bold text-indigo-400 mb-4">AI Image Generator</h2>
                <p className="text-gray-400 mb-6">Describe the image you want to create. Our AI will bring your vision to life using the Imagen model for high-quality results.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">Prompt</label>
                        <input
                            id="prompt"
                            type="text"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g., A majestic lion wearing a crown, photorealistic, 4k"
                            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Aspect Ratio</label>
                        <div className="flex space-x-4">
                            {(['1:1', '16:9', '9:16'] as AspectRatio[]).map(ratio => (
                                <label key={ratio} className="flex items-center space-x-2 text-gray-300">
                                    <input
                                        type="radio"
                                        name="aspectRatio"
                                        value={ratio}
                                        checked={aspectRatio === ratio}
                                        onChange={() => setAspectRatio(ratio)}
                                        className="form-radio h-4 w-4 text-indigo-600 bg-gray-700 border-gray-600 focus:ring-indigo-500"
                                    />
                                    <span>{ratio} {ratio === '1:1' ? '(Square)' : ratio === '16:9' ? '(Landscape)' : '(Portrait)'}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <Button type="submit" disabled={loading} className="w-full md:w-auto">
                        {loading ? <><Spinner /> Generating...</> : 'Generate Image'}
                    </Button>
                </form>
                {error && <p className="text-red-400 mt-4">{error}</p>}
            </Card>
            
            <div className="flex justify-center">
                {loading && (
                     <Card className="w-full md:w-auto">
                        <div className="flex flex-col items-center justify-center h-full min-h-[24rem] p-8">
                            <Spinner />
                            <p className="mt-4 text-lg text-gray-300">Generating your masterpiece...</p>
                        </div>
                     </Card>
                )}

                {generatedImageUrl && (
                    <Card className="w-full max-w-2xl">
                        <h3 className="text-xl font-semibold text-center mb-4">Generated Image</h3>
                        <img src={generatedImageUrl} alt="Generated" className="rounded-lg w-full h-auto object-contain max-h-[40rem]" />
                        <div className="mt-4 flex justify-center">
                            <DownloadButton imageUrl={generatedImageUrl} filename="generated-image.jpg" />
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default ImageGenerator;
