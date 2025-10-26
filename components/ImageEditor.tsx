import React, { useState, useCallback, useEffect } from 'react';
import { editImage } from '../services/geminiService';
import { fileToBase64, fileToDataUrl, getMimeType } from '../utils/fileUtils';
import { getCssFilterValue, applyFilterAndGetUrl } from '../utils/imageUtils';
import type { ImageFilter } from '../types';
import Spinner from './ui/Spinner';
import Card from './ui/Card';
import Button from './ui/Button';
import FileInput from './ui/FileInput';
import DownloadButton from './ui/DownloadButton';

const supportedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const supportedMimeTypesString = supportedMimeTypes.join(',');
const MAX_FILE_SIZE_MB = 4;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const imageFilters: { id: ImageFilter; label: string }[] = [
    { id: 'none', label: 'None' },
    { id: 'grayscale', label: 'Grayscale' },
    { id: 'sepia', label: 'Sepia' },
    { id: 'invert', label: 'Invert' },
    { id: 'vintage', label: 'Vintage' },
];

const ImageEditor: React.FC = () => {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
    const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
    const [downloadableUrl, setDownloadableUrl] = useState<string | null>(null);
    const [selectedFilter, setSelectedFilter] = useState<ImageFilter>('none');
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Effect to generate a downloadable URL with the filter applied via canvas
    useEffect(() => {
        if (editedImageUrl) {
            setDownloadableUrl(editedImageUrl); // Set initial URL
            if (selectedFilter !== 'none') {
                applyFilterAndGetUrl(editedImageUrl, selectedFilter)
                    .then(setDownloadableUrl)
                    .catch(err => {
                        console.error("Failed to apply filter for download:", err);
                        setError("Could not apply filter for download.");
                        setDownloadableUrl(editedImageUrl); // Fallback
                    });
            }
        }
    }, [editedImageUrl, selectedFilter]);

    const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setEditedImageUrl(null);
            setSelectedFilter('none');
            setError(null);
            try {
                const dataUrl = await fileToDataUrl(file);
                setOriginalImageUrl(dataUrl);
            } catch (err) {
                setError('Failed to load image preview.');
                console.error(err);
            }
        }
    }, []);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!imageFile || !prompt.trim()) {
            setError('Please upload an image and provide an editing prompt.');
            return;
        }

        if (imageFile.size > MAX_FILE_SIZE_BYTES) {
            setError(`Image size exceeds the ${MAX_FILE_SIZE_MB} MB limit.`);
            return;
        }
        
        const mimeType = getMimeType(imageFile);
        if (!supportedMimeTypes.includes(mimeType)) {
            setError(`Unsupported image type. Please use one of the following: ${supportedMimeTypes.map(t => t.split('/')[1]).join(', ')}.`);
            return;
        }

        setLoading(true);
        setError(null);
        setEditedImageUrl(null);
        setSelectedFilter('none');
        try {
            const base64Image = await fileToBase64(imageFile);
            const editedBase64 = await editImage(base64Image, mimeType, prompt);
            setEditedImageUrl(`data:${mimeType};base64,${editedBase64}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to edit image.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [imageFile, prompt]);
    
    return (
        <div className="space-y-8">
            <Card>
                <h2 className="text-2xl font-bold text-indigo-400 mb-4">AI Image Editor</h2>
                <p className="text-gray-400 mb-6">Upload an image, describe the changes, and then apply visual filters to perfect the result.</p>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <FileInput 
                        id="file-upload-editor" 
                        label="Upload Image" 
                        onChange={handleFileChange} 
                        accept={supportedMimeTypesString}
                        description={`Supported formats: JPG, PNG, WEBP. Max size: ${MAX_FILE_SIZE_MB} MB.`}
                    />
                    <div>
                        <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">Editing Prompt</label>
                        <input
                            id="prompt"
                            type="text"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g., make the sky look like a sunset, add a cat"
                            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <Button type="submit" disabled={loading || !imageFile} className="w-full md:w-auto">
                        {loading ? <><Spinner /> Applying Edits...</> : 'Edit Image'}
                    </Button>
                </form>
                {error && <p className="text-red-400 mt-4">{error}</p>}
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                {originalImageUrl && (
                    <Card>
                        <h3 className="text-xl font-semibold text-center mb-4">Original</h3>
                        <img src={originalImageUrl} alt="Original" className="rounded-lg w-full h-auto object-contain max-h-[40rem]" />
                    </Card>
                )}
                
                <div className="md:sticky md:top-8">
                    {loading && (
                         <Card>
                            <div className="flex flex-col items-center justify-center h-full min-h-[24rem]">
                                <Spinner />
                                <p className="mt-4 text-lg text-gray-300">Applying AI magic...</p>
                            </div>
                         </Card>
                    )}

                    {editedImageUrl && (
                        <Card>
                            <h3 className="text-xl font-semibold text-center mb-4">Edited</h3>
                            <img 
                                src={editedImageUrl} 
                                alt="Edited" 
                                className="rounded-lg w-full h-auto object-contain max-h-[40rem] transition-all duration-300"
                                style={{ filter: getCssFilterValue(selectedFilter) }}
                            />
                            <div className="mt-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-3">Apply Filter</label>
                                    <div className="flex flex-wrap gap-2">
                                        {imageFilters.map(filter => (
                                            <button
                                                key={filter.id}
                                                onClick={() => setSelectedFilter(filter.id)}
                                                className={`px-3 py-2 text-xs md:text-sm font-medium rounded-md transition-all duration-200 border-2 ${
                                                    selectedFilter === filter.id
                                                        ? 'bg-indigo-600 border-indigo-500 text-white ring-2 ring-offset-2 ring-offset-gray-800 ring-indigo-500'
                                                        : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:border-gray-500'
                                                }`}
                                            >
                                                {filter.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex justify-center pt-2">
                                    <DownloadButton imageUrl={downloadableUrl} filename={`edited-image-${selectedFilter}.png`} />
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImageEditor;