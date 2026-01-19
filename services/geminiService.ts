import { GoogleGenAI, Type } from "@google/genai";
import { BrandProfile, SocialPost, ContentFormat, Notification, ImageGenMode } from "../types";
import { Language } from "../translations";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const prepareImagePart = (dataUrl: string) => {
  if (!dataUrl || !dataUrl.includes(',')) return null;
  try {
    const [header, data] = dataUrl.split(',');
    const mimeMatch = header.match(/:(.*?);/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
    
    // Obsługa tylko wspieranych typów przez Gemini API
    const supportedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif'];
    if (!supportedTypes.includes(mimeType)) {
      console.warn(`[JedAi] Unsupported mimeType: ${mimeType}. Falling back to image/png`);
    }

    return {
      inlineData: {
        data: data.trim(),
        mimeType: supportedTypes.includes(mimeType) ? mimeType : 'image/png'
      }
    };
  } catch (e) {
    console.error("[JedAi] Error preparing image part:", e);
    return null;
  }
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
  try {
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
    return JSON.parse(response.text || "[]");
  } catch (e) {
    return [
      { id: 'f1', platform: 'instagram', date: new Date().toISOString().split('T')[0], content: `Witajcie w ${profile.name}! Jesteśmy gotowi na nowe wyzwania.`, hashtags: ['nowość', profile.name.toLowerCase()], status: 'draft', mediaSource: 'ai_generated' }
    ];
  }
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

export const generateAIImage = async (
  postContent: string, 
  profile: BrandProfile, 
  platform: string = 'instagram',
  mode: ImageGenMode = 'PHOTO',
  variantSeed: number = 0,
  editInstruction: string = ''
): Promise<{url: string, brief: any, prompt: string, negative: string, debug: any}> => {
    const ai = getAI();
    const missingFields: string[] = [];
    if (!profile.brandVoice) missingFields.push('brandVoice');
    if (!profile.businessDescription) missingFields.push('businessDescription');
    if (!profile.valueProposition) missingFields.push('valueProposition');
    
    const briefPrompt = `As a Creative Director, analyze brand context and create a visual brief for an image.
    BRAND: ${profile.name}, Industry: ${profile.industry}, Voice: ${profile.brandVoice || 'N/A'}. 
    CONTEXT: ${profile.businessDescription || 'N/A'}. USPs: ${profile.valueProposition || 'N/A'}.
    CONTENT: "${postContent}"
    MODE: ${mode}
    ${editInstruction ? `EDIT INSTRUCTION: "${editInstruction}"` : ''}
    SEED: ${variantSeed}

    REQUIREMENTS:
    1. Define main subject (no text on image).
    2. Balanced 5-color hex palette (3 primary, 1 accent, 1 neutral).
    3. Industry-specific style (e.g. food photography for restaurants).
    4. NO futuristic HUD or neon grids.
    5. No monochrome red.
    Return ONLY JSON.`;

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
            palette: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    const brief = JSON.parse(briefResponse.text || "{}");
    const paletteStr = brief.palette?.join(', ') || profile.primaryColor;

    const contentParts: any[] = [];
    
    // Walidacja i dodawanie obrazów referencyjnych (maksymalnie 3)
    if (profile.styleReferenceUrls?.length) {
      profile.styleReferenceUrls
        .filter(url => url && url.startsWith('data:'))
        .slice(0, 3)
        .map(url => prepareImagePart(url))
        .filter(Boolean)
        .forEach(part => contentParts.push(part));
    }

    // Walidacja i dodawanie logo
    if (profile.logoUrl && profile.logoUrl.startsWith('data:')) {
      const logoPart = prepareImagePart(profile.logoUrl);
      if (logoPart) contentParts.push(logoPart);
    }

    const finalImagePrompt = `${mode === 'PHOTO' ? 'Professional commercial photography' : 'Modern high-end graphic design'} of ${brief.main_subject}.
    STYLE: ${brief.visual_style}. MOOD: ${brief.mood}.
    COLORS: Use a balanced palette of ${paletteStr}. Avoid monochrome.
    CONTEXT: For ${profile.name} in ${profile.industry}.
    ${editInstruction ? `ADJUSTMENT: ${editInstruction}.` : ''}
    NO TEXT, NO LOGO TEXT, NO HUD, NO SCI-FI TEMPLATES.`;

    const negativePrompt = "text, letters, words, watermark, logo text, futuristic hud, sci-fi interface, red monochrome, neon grid, poster template, UI, buttons, menu, gibberish";

    contentParts.push({ text: `${finalImagePrompt}. NEGATIVE: ${negativePrompt}` });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: contentParts },
      config: { 
        imageConfig: { 
          aspectRatio: platform === 'tiktok' ? '9:16' : platform === 'instagram' ? '1:1' : '16:9'
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
    if (!imageUrl) throw new Error("Image generation failed.");

    return { 
      url: imageUrl, brief, prompt: finalImagePrompt, negative: negativePrompt,
      debug: { missingFields, paletteUsed: brief.palette, usedReferenceImages: !!profile.styleReferenceUrls?.length }
    };
};

export const generateAIVideo = async (prompt: string, profile: BrandProfile, editInstruction: string = ''): Promise<{url: string, debug: any}> => {
  const ai = getAI();
  
  const videoBriefPrompt = `Create a cinematic video brief for: "${prompt}". 
  Brand: ${profile.name}, Industry: ${profile.industry}. 
  Colors: ${profile.primaryColor}. Mood: Cinematic and professional. No text.
  ${editInstruction ? `Edit instructions: ${editInstruction}` : ''}
  Return ONLY JSON with "main_action", "setting", "mood".`;

  const briefResponse = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: videoBriefPrompt,
    config: { responseMimeType: "application/json" }
  });
  const brief = JSON.parse(briefResponse.text || "{}");

  const finalVideoPrompt = `Cinematic video: ${brief.main_action} in ${brief.setting}. ${brief.mood} atmosphere. Realistic lighting, high quality. No text, no sci-fi overlays.`;

  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: finalVideoPrompt,
    config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  const blob = await response.blob();
  
  return { 
    url: URL.createObjectURL(blob),
    debug: { brief, finalVideoPrompt, editInstruction }
  };
};

export const fetchLatestTrends = async (industry: string, lang: Language): Promise<Notification[]> => {
  const ai = getAI();
  const prompt = `Latest viral trends for ${industry} as of today. lang: ${lang}`;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { tools: [{ googleSearch: {} }], responseMimeType: "application/json" }
    });
    const data = JSON.parse(response.text || "[]");
    return data.map((item: any) => ({ ...item, id: Math.random().toString(), timestamp: 'Now', read: false }));
  } catch { return []; }
};