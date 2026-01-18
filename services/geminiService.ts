import { GoogleGenAI, Type } from "@google/genai";
import { BrandProfile, SocialPost, ContentFormat, Notification } from "../types";
import { Language } from "../translations";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Skanowanie Holonet - zaawansowana analiza marki.
 */
export const analyzeBrandIdentity = async (name: string, website?: string): Promise<Partial<BrandProfile>> => {
  const startTime = Date.now();
  console.group("%c[SociAI Diagnostic] Holonet Scan", "color: #34E0F7; font-weight: bold;");
  console.log("Targeting Mission:", name, website || "deep-space");

  const ai = getAI();
  
  const searchPrompt = `As a JedAi Master of Digital Analysis, perform a deep Holonet Scan for the brand "${name}" ${website ? `at ${website}` : ''}.
  
  EXTRACT & GENERATE:
  1. Visual Identity: Find the primary brand HEX color and secondary accent.
  2. Logo: Locate the high-res official logo URL (PNG/SVG) from metadata (og:image, favicon).
  3. Brand Voice: Define their specific communication style.
  4. Post Sparks: Generate 10 diverse, creative social media post ideas (topics only).
  5. Core Info: Target audience, business description, and unique value proposition.

  CRITICAL: Return ONLY a raw JSON object matching the schema. No markdown.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: searchPrompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            primaryColor: { type: Type.STRING },
            secondaryColor: { type: Type.STRING },
            logoUrl: { type: Type.STRING },
            tone: { type: Type.STRING, enum: ['professional', 'funny', 'inspirational', 'edgy'] },
            targetAudience: { type: Type.STRING },
            businessDescription: { type: Type.STRING },
            valueProposition: { type: Type.STRING },
            brandVoice: { type: Type.STRING },
            postIdeas: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["primaryColor", "logoUrl", "tone", "targetAudience", "postIdeas"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    
    console.log("Holonet Data Retrieved:", data);
    console.log("Scan Duration:", Date.now() - startTime, "ms");
    console.groupEnd();

    return { 
      ...data, 
      autoAppendSignature: true 
    };
  } catch (e) {
    console.error("Holonet Scan Interrupted:", e);
    console.groupEnd();
    // Fallback: Default palette if scan fails
    return { 
      primaryColor: '#8C4DFF', 
      tone: 'professional', 
      targetAudience: 'General Audience',
      autoAppendSignature: true,
      postIdeas: ["Wprowadzenie marki", "Nasza misja", "Nowy produkt"]
    };
  }
};

export const getFormattedSignature = (profile: BrandProfile): string => {
  const parts = [];
  if (profile.website) parts.push(`🌐 Website: ${profile.website}`);
  if (profile.email) parts.push(`📧 Email: ${profile.email}`);
  if (profile.phone) parts.push(`📞 Contact: ${profile.phone}`);
  if (profile.address) parts.push(`📍 Address: ${profile.address}`);
  return parts.length > 0 ? `\n---\n${parts.join('\n')}` : '';
};

export const generateInitialStrategy = async (profile: BrandProfile, lang: Language): Promise<SocialPost[]> => {
  const ai = getAI();
  const prompt = `Generate 3 high-impact social media transmissions for "${profile.name}". Language: ${lang}. Return JSON array. Include platform, content, hashtags, date (YYYY-MM-DD). Use their brand voice: ${profile.brandVoice || 'Professional'}.`;

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

export const generateWeeklyStrategy = async (profile: BrandProfile, lang: Language, formats: ContentFormat[]): Promise<SocialPost[]> => {
  const ai = getAI();
  const formatsStr = formats.map(f => `${f.name}: ${f.keyword}`).join(', ');
  const prompt = `Generate a full weekly mission map (7 transmissions) for "${profile.name}" in ${profile.industry} industry. 
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

export const generateAIImage = async (prompt: string, profile?: BrandProfile): Promise<string> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: `Cinematic JedAi transmission graphic for: ${prompt}. Primary color: ${profile?.primaryColor || '#8C4DFF'}. Futuristic aesthetic.`,
      config: { imageConfig: { aspectRatio: "1:1" } }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("Force link broken: Failed to generate image");
};

export const generateAIVideo = async (prompt: string): Promise<string> => {
  const ai = getAI();
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: `Epic JedAi cinematic video: ${prompt}`,
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
  if (!downloadLink) throw new Error("Video generation failed - no URI");

  const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};

export const fetchLatestTrends = async (industry: string, lang: Language): Promise<Notification[]> => {
  const ai = getAI();
  const prompt = `Latest viral Force Sparks (trends) for ${industry} as of today. Return 3 JSON notification objects (title, message, type). lang: ${lang}`;

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