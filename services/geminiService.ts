
import { GoogleGenAI, Type, Modality, GenerateContentResponse, GroundingChunk } from "@google/genai";
import type { MarketingPlanResponse, AspectRatio, GroundingMetadata } from '../types';

// Fix: Improved API key handling to be more robust.
const getApiKey = () => {
  const key = process.env.API_KEY;
  if (!key) {
    // As per guidelines, API_KEY is expected to be available.
    // Throwing an error is better than passing undefined to the SDK.
    throw new Error("API_KEY environment variable not found.");
  }
  return key;
};

const marketingPlanSchema = {
  type: Type.OBJECT,
  properties: {
    competitorAnalysis: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          competitorName: { type: Type.STRING },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['competitorName', 'strengths', 'weaknesses'],
      },
    },
    contentPillars: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          pillar: { type: Type.STRING },
          description: { type: Type.STRING },
        },
        required: ['pillar', 'description'],
      },
    },
    postIdeas: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          platform: { type: Type.STRING, enum: ['Instagram', 'TikTok', 'X', 'Facebook', 'LinkedIn'] },
          prompt: { type: Type.STRING },
          visualIdea: { type: Type.STRING },
        },
        required: ['platform', 'prompt', 'visualIdea'],
      },
    },
  },
  required: ['competitorAnalysis', 'contentPillars', 'postIdeas'],
};

export const generateMarketingPlan = async (
    businessInfo: string,
    competitorsInfo: string
): Promise<{ plan: MarketingPlanResponse; groundingMetadata: GroundingMetadata | null }> => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    // Fix: Updated prompt to explicitly request JSON output as responseSchema is not allowed with googleSearch.
    const prompt = `
      Analyze the provided business and competitor information to create a comprehensive social media marketing plan.
      Business: ${businessInfo}
      Competitors: ${competitorsInfo}
      
      Provide a detailed competitor analysis, define 3-5 core content pillars, and generate 5 actionable post ideas with prompts and visual suggestions.
      Ground your analysis and suggestions in up-to-date information from the web.

      The response must be a single JSON object (no markdown formatting, no code block fences) with the following structure:
      {
        "competitorAnalysis": [
          { "competitorName": "string", "strengths": ["string"], "weaknesses": ["string"] }
        ],
        "contentPillars": [
          { "pillar": "string", "description": "string" }
        ],
        "postIdeas": [
          { "platform": "Instagram" | "TikTok" | "X" | "Facebook" | "LinkedIn", "prompt": "string", "visualIdea": "string" }
        ]
      }
    `;

    // Fix: Removed responseMimeType and responseSchema as they are not compatible with the googleSearch tool.
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            thinkingConfig: { thinkingBudget: 32768 },
            tools: [{ googleSearch: {} }],
        },
    });

    let plan: MarketingPlanResponse;
    try {
        // Fix: Added logic to handle potential markdown code fences around the JSON response.
        let responseText = response.text.trim();
        if (responseText.startsWith('```json')) {
            responseText = responseText.slice(7).trim();
            if (responseText.endsWith('```')) {
                responseText = responseText.slice(0, -3).trim();
            }
        }
        plan = JSON.parse(responseText) as MarketingPlanResponse;
    } catch (err) {
        console.error("Failed to parse marketing plan from model response:", response.text, err);
        throw new Error("Could not generate a valid marketing plan. The response from the AI was not in the expected JSON format.");
    }
    
    const groundingMetadata = parseGroundingChunks(response.candidates?.[0]?.groundingMetadata?.groundingChunks);
    return { plan, groundingMetadata };
};

export const generateImage = async (prompt: string, aspectRatio: AspectRatio): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: aspectRatio,
        },
    });

    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
    if (!base64ImageBytes) {
        throw new Error('No image was generated.');
    }
    return base64ImageBytes;
};

export const editImage = async (base64Image: string, mimeType: string, prompt: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { data: base64Image, mimeType } },
                { text: prompt },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            return part.inlineData.data;
        }
    }
    throw new Error('No image was generated.');
};

export const generateVideo = async (
    base64Image: string,
    mimeType: string,
    prompt: string,
    aspectRatio: AspectRatio
) => {
    // A new instance must be created before each call to ensure the latest API key is used.
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt,
        image: { imageBytes: base64Image, mimeType },
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: aspectRatio === '1:1' ? '16:9' : aspectRatio, // Veo does not support 1:1, default to 16:9
        },
    });

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error('Video generation failed or returned no URI.');
    }
    
    const videoResponse = await fetch(`${downloadLink}&key=${getApiKey()}`);
    if (!videoResponse.ok) {
        throw new Error('Failed to fetch generated video.');
    }
    const videoBlob = await videoResponse.blob();
    return URL.createObjectURL(videoBlob);
};

export const getLocalInsights = async (
    query: string,
    coords: { latitude: number; longitude: number }
): Promise<{ text: string; groundingMetadata: GroundingMetadata | null }> => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: query,
        config: {
            tools: [{ googleMaps: {} }],
            toolConfig: {
                retrievalConfig: {
                    latLng: {
                        latitude: coords.latitude,
                        longitude: coords.longitude,
                    },
                },
            },
        },
    });

    const groundingMetadata = parseGroundingChunks(response.candidates?.[0]?.groundingMetadata?.groundingChunks);
    return { text: response.text, groundingMetadata };
};

const parseGroundingChunks = (chunks: GroundingChunk[] | undefined): GroundingMetadata | null => {
    if (!chunks || chunks.length === 0) {
        return null;
    }
    const metadata: GroundingMetadata = { web: [], maps: [] };
    chunks.forEach(chunk => {
        if (chunk.web) {
            metadata.web.push({ title: chunk.web.title ?? 'Untitled', uri: chunk.web.uri ?? '' });
        }
        if (chunk.maps) {
            metadata.maps.push({ title: chunk.maps.title ?? 'Untitled', uri: chunk.maps.uri ?? '', placeId: chunk.maps.placeId });
        }
    });
    return metadata;
};