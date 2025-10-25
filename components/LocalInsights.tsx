
import React, { useState, useCallback } from 'react';
import useGeolocation from '../hooks/useGeolocation';
import { getLocalInsights } from '../services/geminiService';
import type { GroundingMetadata } from '../types';
import Spinner from './ui/Spinner';
import Card from './ui/Card';
import Button from './ui/Button';
import GroundingSources from './ui/GroundingSources';

const LocalInsights: React.FC = () => {
    const { loading: geoLoading, error: geoError, data: geoData } = useGeolocation();
    const [query, setQuery] = useState('');
    const [insights, setInsights] = useState<string | null>(null);
    const [grounding, setGrounding] = useState<GroundingMetadata | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) {
            setError('Please enter a query.');
            return;
        }
        if (!geoData) {
            setError('Could not determine your location.');
            return;
        }
        setLoading(true);
        setError(null);
        setInsights(null);
        setGrounding(null);
        try {
            const { text, groundingMetadata } = await getLocalInsights(query, geoData);
            setInsights(text);
            setGrounding(groundingMetadata);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [query, geoData]);

    return (
        <div className="space-y-8">
            <Card>
                <h2 className="text-2xl font-bold text-indigo-400 mb-4">Local Marketing Insights</h2>
                <p className="text-gray-400 mb-6">Discover local opportunities. Ask for nearby collaborators, event locations, or competitor hotspots. We'll use your location and Google Maps to find answers.</p>
                {geoLoading && <p className="text-gray-400">Fetching your location...</p>}
                {geoError && <p className="text-red-400">Error fetching location: {geoError.message}</p>}
                {geoData && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="query" className="block text-sm font-medium text-gray-300 mb-2">Your Query</label>
                            <input
                                id="query"
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="e.g., Find popular cafes for a marketing collaboration"
                                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <Button type="submit" disabled={loading || !geoData} className="w-full md:w-auto">
                            {loading ? <><Spinner /> Searching...</> : 'Find Local Opportunities'}
                        </Button>
                    </form>
                )}
                {error && <p className="text-red-400 mt-4">{error}</p>}
            </Card>

            {loading && (
                 <Card>
                    <div className="flex flex-col items-center justify-center p-8">
                        <Spinner />
                        <p className="mt-4 text-lg text-gray-300">Searching for local insights...</p>
                    </div>
                 </Card>
            )}

            {(insights || grounding) && (
                <Card>
                    {insights && (
                        <div>
                            <h3 className="text-xl font-semibold text-indigo-400 mb-4">Results</h3>
                            <p className="text-gray-300 whitespace-pre-wrap">{insights}</p>
                        </div>
                    )}
                    {grounding && <GroundingSources metadata={grounding} className="mt-6" />}
                </Card>
            )}
        </div>
    );
};

export default LocalInsights;
