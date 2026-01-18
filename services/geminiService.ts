import { GoogleGenAI, Type } from "@google/genai";
import { BrandProfile, SocialPost, ContentFormat, Notification } from "../types";
import { Language } from "../translations";

// Initialize the Google GenAI client with API key from environment
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Deep scan of a brand's website using Google Search grounding.
 * This function specifically looks for visual assets (logo URLs) and brand colors.
 */
export const analyzeBrandIdentity = async (name: string, website?: string): Promise<Partial<BrandProfile>> => {
  const ai = getAI();
  
  const searchPrompt = `Search for the official web presence of brand "${name}" ${website ? `at the URL ${website}` : ''}.
  I need a complete neural analysis of their brand identity. 
  
  TASK:
  1. Identify the brand's primary and secondary HEX colors from their design system.
  2. Find the DIRECT URL to their official logo (high-res PNG, SVG, or JPG).
  3. Determine their target audience, brand tone (professional/edgy/funny), and a concise business description.
  4. Formulate their core value proposition.

  CRITICAL: Return ONLY valid JSON that matches the provided schema. Do not include markdown code blocks.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: searchPrompt,
    config: {
      tools: [{ googleSearch: {} }], // Grounding for real-time web data
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          primaryColor: { type: Type.STRING, description: "HEX code e.g. #FF0000" },
          secondaryColor: { type: Type.STRING, description: "HEX code e.g. #0000FF" },
          logoUrl: { type: Type.STRING, description: "Direct URL to logo file" },
          tone: { type: Type.STRING, enum: ['professional', 'funny', 'inspirational', 'edgy'] },
          targetAudience: { type: Type.STRING },
          businessDescription: { type: Type.STRING },
          valueProposition: { type: Type.STRING },
          brandVoice: { type: Type.STRING }
        },
        required: ["primaryColor", "logoUrl", "tone", "targetAudience"]
      }
    }
  });

  try {
    // Some responses might still include markdown blocks despite instructions
    let text = response.text || "{}";
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const data = JSON.parse(text);
    
    return { 
      ...data, 
      autoAppendSignature: true 
    };
  } catch (e) {
    console.error("Failed to parse identity scan:", e);
    // Return safe defaults if parsing fails
    return { 
      primaryColor: '#8C4DFF', 
      tone: 'professional', 
      targetAudience: 'General Professionals',
      autoAppendSignature: true 
    };
  }
};

// Helper for signature formatting based on brand profile
export const getFormattedSignature = (profile: BrandProfile): string => {
  const parts = [];
  if (profile.website) parts.push(`🌐 Website: ${profile.website}`);
  if (profile.email) parts.push(`📧 Email: ${profile.email}`);
  if (profile.phone) parts.push(`📞 Contact: ${profile.phone}`);
  if (profile.address) parts.push(`📍 Address: ${profile.address}`);
  return parts.length > 0 ? `\n---\n${parts.join('\n')}` : '';
};

// Generate initial 3 posts
export const generateInitialStrategy = async (profile: BrandProfile, lang: Language): Promise<SocialPost[]> => {
  const ai = getAI();
  const prompt = `Generate 3 high-impact social media posts for "${profile.name}". Language: ${lang}. Return JSON array. Include platform, content, hashtags, date (YYYY-MM-DD). Use their brand voice: ${profile.brandVoice || 'Professional'}.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            platform: { type: Type.STRING, enum: ['instagram', 'facebook', 'linkedin', 'tiktok'] },
            date: { type: Type.STRING },
            content: { type: Type.STRING },
            hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
            status: { type: Type.STRING, enum: ['draft', 'needs_review', 'approved'] },
            mediaSource: { type: Type.STRING, enum: ['ai_generated', 'client_upload'] }
          },
          required: ["id", "platform", "date", "content", "hashtags", "status", "mediaSource"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch {
    return [];
  }
};

// Generate full weekly strategy based on content formats
export const generateWeeklyStrategy = async (profile: BrandProfile, lang: Language, formats: ContentFormat[]): Promise<SocialPost[]> => {
  const ai = getAI();
  const formatsStr = formats.map(f => `${f.name}: ${f.keyword}`).join(', ');
  const prompt = `Generate a full weekly content plan (7 posts) for "${profile.name}" in ${profile.industry} industry. 
  Tone: ${profile.tone}. Target Audience: ${profile.targetAudience}. 
  Content Formats to include: ${formatsStr}. 
  Language: ${lang}. Return JSON array of SocialPost objects with id, platform, date (YYYY-MM-DD), content, hashtags (array), status ('draft'), mediaSource ('ai_generated'), format.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            platform: { type: Type.STRING },
            date: { type: Type.STRING },
            content: { type: Type.STRING },
            hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
            status: { type: Type.STRING },
            mediaSource: { type: Type.STRING },
            format: { type: Type.STRING }
          },
          required: ["id", "platform", "date", "content", "hashtags", "status", "mediaSource"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch {
    return [];
  }
};

// Generate AI Image using gemini-2.5-flash-image
export const generateAIImage = async (prompt: string, profile?: BrandProfile): Promise<string> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: `High-end futuristic professional social media graphic for: ${prompt}. Primary color: ${profile?.primaryColor || '#8C4DFF'}. Modern aesthetic.`,
      config: { imageConfig: { aspectRatio: "1:1" } }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("Failed to generate image");
};

// Generate AI Video using veo-3.1-fast-generate-preview and poll for completion
export const generateAIVideo = async (prompt: string): Promise<string> => {
  const ai = getAI();
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: `Cinematic professional social media video: ${prompt}`,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '16:9'
    }
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) throw new Error("Video generation failed - no URI in response");

  const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};

// Fetch latest industry trends with search grounding
export const fetchLatestTrends = async (industry: string, lang: Language): Promise<Notification[]> => {
  const ai = getAI();
  const prompt = `Latest viral social media trends for ${industry} as of today. Return 3 JSON notification objects (title, message, type). lang: ${lang}`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json"
    }
  });

  try {
    const data = JSON.parse(response.text || "[]");
    return data.map((item: any) => ({ ...item, id: Math.random().toString(), timestamp: 'Now', read: false }));
  } catch {
    return [];
  }
};