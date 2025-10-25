
import React from 'react';
import type { GroundingMetadata, MapGroundingSource, GroundingSource } from '../../types';
import Card from './Card';

interface GroundingSourcesProps {
    metadata: GroundingMetadata;
    className?: string;
}

const GroundingSources: React.FC<GroundingSourcesProps> = ({ metadata, className }) => {
    const hasWebSources = metadata.web && metadata.web.length > 0;
    const hasMapSources = metadata.maps && metadata.maps.length > 0;

    if (!hasWebSources && !hasMapSources) {
        return null;
    }

    return (
        <Card className={className}>
            <h3 className="text-xl font-semibold text-indigo-400 mb-4">Sources</h3>
            <div className="space-y-4">
                {hasWebSources && (
                    <div>
                        <h4 className="font-bold text-gray-300 mb-2">Web Sources</h4>
                        <ul className="space-y-1 list-disc list-inside">
                            {metadata.web.map((source, index) => (
                                <li key={`web-${index}`} className="text-gray-400">
                                    <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
                                        {source.title || 'Untitled Source'}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {hasMapSources && (
                     <div>
                        <h4 className="font-bold text-gray-300 mb-2">Map Sources</h4>
                        <ul className="space-y-1 list-disc list-inside">
                            {metadata.maps.map((source, index) => (
                                <li key={`map-${index}`} className="text-gray-400">
                                    <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
                                        {source.title || 'Untitled Place'}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default GroundingSources;
