
import { GoogleGenAI, Type } from "@google/genai";
import { BrandProfile, SocialPost, ContentFormat, Notification, ImageGenMode } from "../types";
import { Language } from "../translations";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Konwertuje URL/Base64 na format akceptowany przez Gemini API
 */
const prepareImagePart = (dataUrl: string) => {
  const [header, data] = dataUrl.split(',');
  const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';
  return {
    inlineData: {
      data,
      mimeType
    }
  };
};

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
 * ZAAWANSOWANY PIPELINE GENEROWANIA OBRAZÓW V3.0
 */
export const generateAIImage = async (
  postContent: string, 
  profile: BrandProfile, 
  platform: string = 'instagram',
  mode: ImageGenMode = 'PHOTO',
  variantSeed: number = 0
): Promise<{url: string, brief: any, prompt: string, negative: string, debug: any}> => {
    const ai = getAI();
    
    // 1. Sprawdzenie brakujących pól kontekstu
    const missingFields: string[] = [];
    if (!profile.brandVoice) missingFields.push('brandVoice');
    if (!profile.businessDescription) missingFields.push('businessDescription');
    if (!profile.valueProposition) missingFields.push('valueProposition');
    if (!profile.styleReferenceUrls || profile.styleReferenceUrls.length === 0) missingFields.push('styleReferenceUrls');
    
    const brandContextSnapshot = `Brand: ${profile.name}, Ind: ${profile.industry}, Voice: ${profile.brandVoice || 'N/A'}`;

    // ETAP A: GENEROWANIE BRIEFU (Gemini 3 Pro)
    const briefPrompt = `You are a World-Class Creative Director. Analyze the following Brand Identity and Post Content to create a visual Brief.
    
    BRAND IDENTITY:
    - Name: ${profile.name}
    - Industry: ${profile.industry}
    - Strategy/Tone: ${profile.tone}
    - Brand Voice: ${profile.brandVoice || 'Standard professional'}
    - Description: ${profile.businessDescription || 'A modern company'}
    - Key Differentiators: ${profile.valueProposition || 'Premium quality'}
    - Target Audience: ${profile.targetAudience}
    - Brand Kit Colors: ${profile.primaryColor}, ${profile.secondaryColor || 'None'}
    
    POST CONTENT:
    "${postContent}"
    
    IMAGE MODE: ${mode}
    PLATFORM: ${platform}
    VARIANT SEED: ${variantSeed}

    REQUIREMENTS:
    1. Create a detailed visual brief for an image that captures the brand essence.
    2. Define a complete 5-color palette (3 core + 2 accents + neutrals).
    3. Determine the main subject based on industry best practices (e.g., appetizing close-ups for gastro, clean professional environments for B2B).
    4. NO TEXT in the image.
    5. Style must be consistent with ${profile.industry} aesthetics.

    Output ONLY JSON following the schema.`;

    const briefResponse = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: briefPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            industry: { type: Type.STRING },
            main_subject: { type: Type.STRING },
            visual_style: { type: Type.STRING },
            mood: { type: Type.STRING },
            keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            goal: { type: Type.STRING, enum: ['sell', 'promo', 'inform', 'brand'] },
            brand_voice_rules: { type: Type.ARRAY, items: { type: Type.STRING } },
            palette: {
              type: Type.OBJECT,
              properties: {
                primary: { type: Type.ARRAY, items: { type: Type.STRING } },
                accent: { type: Type.ARRAY, items: { type: Type.STRING } },
                neutral_bg: { type: Type.STRING },
                neutral_text: { type: Type.STRING }
              }
            },
            use_reference_assets: { type: Type.BOOLEAN }
          }
        }
      }
    });

    const brief = JSON.parse(briefResponse.text || "{}");
    const paletteStr = [...(brief.palette?.primary || []), ...(brief.palette?.accent || [])].join(', ');

    // ETAP B: PRZYGOTOWANIE ASSETÓW REFERENCYJNYCH
    const contentParts: any[] = [];
    
    // Dodaj zdjęcia referencyjne stylu (max 3)
    if (profile.styleReferenceUrls && profile.styleReferenceUrls.length > 0) {
      profile.styleReferenceUrls.slice(0, 3).forEach(url => {
        contentParts.push(prepareImagePart(url));
      });
    }

    // Dodaj logo jeśli jest dostępne
    if (profile.logoUrl) {
      contentParts.push(prepareImagePart(profile.logoUrl));
    }

    // ETAP C: SYNTEZA PROMPTU I GENEROWANIE OBRAZU (Gemini 2.5 Flash Image)
    const stylePrefix = mode === 'PHOTO' ? "A photorealistic, high-end professional lifestyle and product photography shot of" : "A clean, high-impact artistic composition of";
    const finalImagePrompt = `${stylePrefix} ${brief.main_subject}.
    VISUAL STYLE: ${brief.visual_style}. 
    MOOD: ${brief.mood}. 
    PALETTE: Use a balanced mix of ${paletteStr} with ${brief.palette?.neutral_bg} as background tones.
    CONSISTENCY: Ensure the lighting, atmosphere, and material quality are consistent with the provided reference images.
    CONTEXT: Tailored for ${profile.name}'s ${brief.industry} market. 
    KEYWORDS: ${brief.keywords?.join(', ')}.
    INSTRUCTIONS: ${brief.brand_voice_rules?.join('. ')}. 
    TECHNICAL: 8k resolution, cinematic lighting, sharp focus, professional color grading. Avoid monochrome red unless it's the primary brand color. Variant: ${variantSeed}.`;

    const negativePrompt = "no text, no letters, no typography, no paragraphs, no gibberish, no watermark, no logo text, no UI, no futuristic HUD, no sci-fi interface, no poster layout, no monochrome red, no neon grid background, no signage, no distorted alphabets";

    contentParts.push({ text: `${finalImagePrompt}. NEGATIVE: ${negativePrompt}` });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: contentParts },
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

    if (!imageUrl) throw new Error("JedAi engine failed to synthesize image data.");

    return { 
      url: imageUrl, 
      brief, 
      prompt: finalImagePrompt, 
      negative: negativePrompt,
      debug: {
        brandContextSnapshot,
        missingFields,
        paletteUsed: [...(brief.palette?.primary || []), ...(brief.palette?.accent || [])],
        usedReferenceImages: (profile.styleReferenceUrls?.length || 0) > 0,
        briefJson: brief
      }
    };
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
