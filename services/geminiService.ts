
import { GoogleGenAI, Type } from "@google/genai";
import { BrandProfile, SocialPost, ContentFormat, Notification, ImageGenMode } from "../types";
import { Language } from "../translations";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeBrandIdentity = async (name: string, website?: string): Promise<Partial<BrandProfile>> => {
  const ai = getAI();
  const searchPrompt = `As a JedAi Master of Digital Analysis, perform a deep Holonet Scan for the brand "${name}" ${website ? `at ${website}` : ''}.
  EXTRACT & GENERATE: 1. Visual Identity (HEX), 2. Logo, 3. Brand Voice, 4. Post Sparks, 5. Core Info. Return ONLY JSON.`;

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
    return { ...data, autoAppendSignature: true };
  } catch (e) {
    return { primaryColor: '#8C4DFF', tone: 'professional', targetAudience: 'General Audience', autoAppendSignature: true, postIdeas: ["Wprowadzenie marki"] };
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
  const prompt = `Generate 3 high-impact social media transmissions for "${profile.name}". Language: ${lang}. Return JSON array.`;
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
  try { return JSON.parse(response.text || "[]"); } catch { return []; }
};

export const generateWeeklyStrategy = async (profile: BrandProfile, lang: Language, formats: ContentFormat[]): Promise<SocialPost[]> => {
  const ai = getAI();
  const formatsStr = formats.map(f => `${f.name}: ${f.keyword}`).join(', ');
  const prompt = `Generate a weekly mission map for "${profile.name}". Tone: ${profile.tone}. Formats: ${formatsStr}. Return JSON array.`;
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
  try { return JSON.parse(response.text || "[]"); } catch { return []; }
};

/**
 * ZAAWANSOWANY PIPELINE GENEROWANIA OBRAZÓW
 * Wersja 2.0: PHOTO vs POSTER, No Text Policy, Regenerate Seed
 */
export const generateAIImage = async (
  postContent: string, 
  profile: BrandProfile, 
  platform: string = 'instagram',
  mode: ImageGenMode = 'PHOTO',
  variantSeed: number = 0
): Promise<{url: string, brief: any, prompt: string, negative: string}> => {
    const ai = getAI();
    
    // ETAP A: CREATIVE BRIEF
    const briefPrompt = `You are a Creative Director. Create a JSON brief for an image.
    MODE: ${mode} (PHOTO means realistic lifestyle/product photo, POSTER means background for text).
    BRAND: ${profile.name} (${profile.industry}). Voice: ${profile.brandVoice || profile.tone}. 
    USPs: ${profile.valueProposition}. Colors: ${profile.primaryColor}.
    POST: "${postContent}"
    VARIANT_SEED: ${variantSeed} (Add slight variation if > 0).
    
    RULES: 
    1. NO TEXT on image.
    2. Focus on ${profile.industry} aesthetics. 
    3. If industry is food/gastro, use appetizing food photography style.
    4. PHOTO mode must be photorealistic. POSTER mode must be a clean composition.`;

    const briefResponse = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: briefPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            main_subject: { type: Type.STRING },
            visual_style: { type: Type.STRING },
            mood: { type: Type.STRING },
            color_direction: { type: Type.ARRAY, items: { type: Type.STRING } },
            composition: { type: Type.STRING },
            keywords: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["main_subject", "visual_style", "mood", "color_direction"]
        }
      }
    });

    const brief = JSON.parse(briefResponse.text || "{}");

    // ETAP B: SYNTEZA PROMPTU
    const stylePrefix = mode === 'PHOTO' ? "A photorealistic, premium lifestyle/product photography image of" : "A clean, artistic background composition of";
    const finalImagePrompt = `${stylePrefix} ${brief.main_subject}. 
    Mood: ${brief.mood}. Composition: ${brief.composition}. 
    Lighting/Palette: ${brief.color_direction.join(' and ')}. 
    Style: ${brief.visual_style}. 
    Details: ${brief.keywords?.join(', ')}. 
    Variant adjustment: ${variantSeed}. Highly detailed, 8k, professional grade.`;

    const negativePrompt = "no text, no letters, no typography, no paragraphs, no gibberish, no watermark, no logo text, no UI, no futuristic HUD, no poster layout, no signage, no distorted words, no random alphabets";

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: `${finalImagePrompt}. Avoid: ${negativePrompt}`,
      config: { 
        imageConfig: { 
          aspectRatio: platform === 'instagram' ? "1:1" : platform === 'linkedin' ? "4:3" : "16:9" 
        } 
      }
    });

    let imageUrl = '';
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!imageUrl) throw new Error("Image generation failed");

    return { url: imageUrl, brief, prompt: finalImagePrompt, negative: negativePrompt };
};

export const generateAIVideo = async (prompt: string): Promise<string> => {
  const ai = getAI();
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: `Epic cinematic video: ${prompt}`,
    config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
  });
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }
  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};

export const fetchLatestTrends = async (industry: string, lang: Language): Promise<Notification[]> => {
  const ai = getAI();
  const prompt = `Latest viral trends for ${industry} as of today. lang: ${lang}`;
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: { tools: [{ googleSearch: {} }], responseMimeType: "application/json" }
  });
  try {
    const data = JSON.parse(response.text || "[]");
    return data.map((item: any) => ({ ...item, id: Math.random().toString(), timestamp: 'Now', read: false }));
  } catch { return []; }
};
