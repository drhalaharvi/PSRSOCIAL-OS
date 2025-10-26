import React, { useState, useCallback } from 'react';
import { editImage } from '../services/geminiService';
import { fileToBase64, fileToDataUrl, getMimeType } from '../utils/fileUtils';
import Spinner from './ui/Spinner';
import Card from './ui/Card';
import Button from './ui/Button';
import FileInput from './ui/FileInput';
import DownloadButton from './ui/DownloadButton';

const supportedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const supportedMimeTypesString = supportedMimeTypes.join(',');
const MAX_FILE_SIZE_MB = 4;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const ImageUpscaler: React.FC = () => {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
    const [upscaledImageUrl, setUpscaledImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setUpscaledImageUrl(null);
            setError(null); // Clear previous errors
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
        if (!imageFile) {
            setError('Please upload an image to upscale.');
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
        setUpscaledImageUrl(null);
        try {
            const base64Image = await fileToBase64(imageFile);
            const upscalePrompt = "Upscale this image, significantly enhancing its resolution, detail, and clarity. Make it look like a high-resolution photograph. Do not add any new elements or change the subject matter.";
            const upscaledBase64 = await editImage(base64Image, mimeType, upscalePrompt);
            setUpscaledImageUrl(`data:${mimeType};base64,${upscaledBase64}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to upscale image.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [imageFile]);
    
    return (
        <div className="space-y-8">
            <Card>
                <h2 className="text-2xl font-bold text-indigo-400 mb-4">AI Image Upscaler</h2>
                <p className="text-gray-400 mb-6">Upload a low-resolution image and our AI will enhance its quality and detail, making it sharp and clear.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <FileInput 
                        id="upscaler-file-upload" 
                        label="Upload Image to Upscale" 
                        onChange={handleFileChange} 
                        accept={supportedMimeTypesString}
                        description={`Supported formats: JPG, PNG, WEBP. Max size: ${MAX_FILE_SIZE_MB} MB.`}
                    />
                    <Button type="submit" disabled={loading || !imageFile} className="w-full md:w-auto">
                        {loading ? <><Spinner /> Upscaling...</> : 'Upscale Image'}
                    </Button>
                </form>
                {error && <p className="text-red-400 mt-4">{error}</p>}
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {originalImageUrl && (
                    <Card>
                        <h3 className="text-xl font-semibold text-center mb-4">Original</h3>
                        <img src={originalImageUrl} alt="Original" className="rounded-lg w-full h-auto object-contain max-h-96" />
                    </Card>
                )}
                
                {loading && (
                     <Card>
                        <div className="flex flex-col items-center justify-center h-full min-h-[24rem]">
                            <Spinner />
                            <p className="mt-4 text-lg text-gray-300">Enhancing your image...</p>
                        </div>
                     </Card>
                )}

                {upscaledImageUrl && (
                    <Card>
                        <h3 className="text-xl font-semibold text-center mb-4">Upscaled</h3>
                        <img src={upscaledImageUrl} alt="Upscaled" className="rounded-lg w-full h-auto object-contain max-h-96" />
                        <div className="mt-4 flex justify-center">
                            <DownloadButton imageUrl={upscaledImageUrl} filename="upscaled-image.png" />
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default ImageUpscaler;