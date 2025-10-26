
import { GoogleGenAI, Type, Modality, GenerateContentResponse, GroundingChunk } from "@google/genai";
import type { MarketingPlanResponse, AspectRatio, GroundingMetadata, Platform, PostingRecommendation } from '../types';

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

const marketAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    brandSummary: {
      type: Type.OBJECT,
      properties: {
        mission: { type: Type.STRING },
        targetAudience: { type: Type.STRING },
        toneOfVoice: { type: Type.STRING },
      },
      required: ['mission', 'targetAudience', 'toneOfVoice'],
    },
    competitorStrategies: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          competitorName: { type: Type.STRING },
          contentThemes: { type: Type.ARRAY, items: { type: Type.STRING } },
          commonPostTypes: { type: Type.ARRAY, items: { type: Type.STRING } },
          platformStrategies: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                platform: { type: Type.STRING },
                strategy: { type: Type.STRING },
                postingFrequency: { type: Type.STRING },
              },
              required: ['platform', 'strategy'],
            },
          },
        },
        required: ['competitorName', 'contentThemes', 'commonPostTypes', 'platformStrategies'],
      },
    },
    trendingTopics: {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                topic: { type: Type.STRING },
                relevance: { type: Type.STRING },
            },
            required: ['topic', 'relevance'],
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
  required: ['brandSummary', 'competitorStrategies', 'trendingTopics', 'postIdeas'],
};

export const generateMarketAnalysis = async (
    brandInfo: { mission: string, audience: string, tone: string },
    competitorsInfo: string
): Promise<{ plan: MarketingPlanResponse; groundingMetadata: GroundingMetadata | null }> => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
    const prompt = `
      Act as a senior social media strategist. Conduct a comprehensive brand and market analysis based on the provided information. Ground your analysis in up-to-date information from the web.

      **Brand Identity:**
      - Mission: ${brandInfo.mission}
      - Target Audience: ${brandInfo.audience}
      - Tone of Voice: ${brandInfo.tone}

      **Competitors:**
      - ${competitorsInfo}

      **Your Tasks:**
      1.  **Brand Summary:** Briefly summarize the user's brand identity.
      2.  **Competitor Deep Dive:** For each competitor, analyze their social media presence to identify:
          - Key content themes and pillars they focus on.
          - Common post types they use (e.g., video, carousel, articles, polls).
          - Their platform-specific strategies (e.g., how their Instagram strategy differs from their LinkedIn strategy). Also, estimate their approximate posting frequency on each platform (e.g., '3-5 posts/week').
      3.  **Trending Topics:** Identify 3-5 current trending topics or keywords relevant to the user's industry. For each topic, explain its relevance.
      4.  **Actionable Post Ideas:** Generate 5 creative and actionable post ideas based on your analysis. These ideas should be tailored for specific platforms and include a detailed prompt and a visual suggestion.

      The response must be a single JSON object (no markdown formatting, no code block fences) that strictly adheres to the provided schema.
    `;

    // Fix: Removed responseMimeType and responseSchema as they are not compatible with the googleSearch tool.
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            thinkingConfig: { thinkingBudget: 32768 },
            tools: [{ googleSearch: {} }],
            // responseMimeType and responseSchema are incompatible with tools like googleSearch.
            // The prompt instructs the model to return JSON, which we will parse manually.
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
        console.error("Failed to parse market analysis from model response:", response.text, err);
        throw new Error("Could not generate a valid analysis. The response from the AI was not in the expected JSON format.");
    }
    
    const groundingMetadata = parseGroundingChunks(response.candidates?.[0]?.groundingMetadata?.groundingChunks);
    return { plan, groundingMetadata };
};

export const generatePostContent = async (
    topic: string,
    tone: string,
    platform: string
): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const prompt = `
        Act as an expert social media copywriter. 
        Generate a compelling social media post for the ${platform} platform.

        Topic/Keywords: "${topic}"
        Tone of Voice: ${tone}

        The post should be engaging, concise, and tailored for the specified platform. 
        If appropriate for the platform, include relevant hashtags.
        Do not include any preamble, just return the post content itself.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    return response.text;
};

const recommendationSchema = {
    type: Type.OBJECT,
    properties: {
        recommendations: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    platform: { type: Type.STRING, enum: ['Facebook', 'Instagram', 'LinkedIn', 'Google Business Profile'] },
                    optimalTime: { type: Type.STRING },
                    formatSuggestion: { type: Type.STRING },
                },
                required: ['platform', 'optimalTime', 'formatSuggestion'],
            },
        },
    },
    required: ['recommendations'],
};

export const getPostingRecommendations = async (
    postContent: string,
    platforms: Platform[]
): Promise<PostingRecommendation[]> => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const prompt = `
        Based on the following social media post content, provide recommendations for the best time to post and the best format (e.g., Carousel, Story, Reel, standard post) for each of the selected platforms.

        Post Content: "${postContent}"
        
        Platforms: ${platforms.join(', ')}

        Return a JSON object with a single key "recommendations" containing an array of recommendation objects.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: recommendationSchema,
        },
    });

    try {
        const responseText = response.text.trim();
        const parsedJson = JSON.parse(responseText) as { recommendations: PostingRecommendation[] };
        return parsedJson.recommendations;
    } catch (err) {
        console.error("Failed to parse recommendations from model response:", response.text, err);
        throw new Error("Could not generate valid recommendations. The response from the AI was not in the expected JSON format.");
    }
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

    // Fix: Restructured the request payload to be more explicit and robust, which should resolve persistent image processing errors.
    const instruction = {
        text: `You are an expert image editor. Edit the provided image based on the following instruction. Do not change the aspect ratio or overall composition unless specifically asked. Instruction: "${prompt}"`
    };

    const image = {
        inlineData: {
            data: base64Image,
            mimeType: mimeType
        }
    };
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [{
            role: 'user',
            parts: [
                instruction,
                image,
            ],
        }],
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
