import { GoogleGenAI, Type } from "@google/genai";
import { BrandProfile, SocialPost, ContentFormat, Notification, ImageGenMode } from "../types";
import { Language } from "../translations";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

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
    
    // ETAP 1: CREATIVE BRIEF (Gemini 3 Pro)
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
    4. NO futuristic HUD or neon grids unless requested.
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

    // ETAP 2: RENDERING (Gemini 2.5 Flash Image)
    const contentParts: any[] = [];
    
    // Style conditioning
    if (profile.styleReferenceUrls && profile.styleReferenceUrls.length > 0) {
      profile.styleReferenceUrls.slice(0, 3).forEach(url => {
        contentParts.push(prepareImagePart(url));
      });
    }
    
    // Brand conditioning (logo)
    if (profile.logoUrl) {
      contentParts.push(prepareImagePart(profile.logoUrl));
    }

    const finalImagePrompt = `${mode === 'PHOTO' ? 'Professional commercial photography' : 'Modern high-end graphic design'} of ${brief.main_subject}.
    STYLE: ${brief.visual_style}. MOOD: ${brief.mood}.
    COLORS: Use a balanced palette of ${paletteStr}. Avoid monochrome.
    CONTEXT: This is for ${profile.name} operating in ${profile.industry}.
    ${editInstruction ? `SPECIFIC ADJUSTMENT: ${editInstruction}.` : ''}
    IMPORTANT: NO TEXT, NO LOGO TEXT, NO FUTURISTIC HUD, NO SCI-FI TEMPLATES.`;

    const negativePrompt = "text, letters, words, watermark, logo text, futuristic hud, sci-fi interface, red monochrome, neon grid, poster template, gibberish, low quality, distorted, Paragraphs, UI elements";

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
      url: imageUrl, 
      brief, 
      prompt: finalImagePrompt, 
      negative: negativePrompt,
      debug: {
        brandContextSnapshot: JSON.stringify({ industry: profile.industry, tone: profile.tone }),
        missingFields,
        paletteUsed: brief.palette || [],
        usedReferenceImages: !!(profile.styleReferenceUrls && profile.styleReferenceUrls.length > 0),
        briefJson: brief
      }
    };
};

export const generateAIVideo = async (prompt: string, editInstruction: string = ''): Promise<string> => {
  const ai = getAI();
  // Using Veo for cinematic quality video
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: `Professional cinematic video of ${prompt}. ${editInstruction ? `Change request: ${editInstruction}` : ''} High quality, realistic lighting, no text, no sci-fi overlays.`,
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
  const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};

export const fetchLatestTrends = async (industry: string, lang: Language): Promise<Notification[]> => {
  const ai = getAI();
  const prompt = `Identify current viral social media trends specifically for the ${industry} industry. Language: ${lang}. Return in JSON format.`;
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
    return data.map((item: any) => ({
      ...item,
      id: Math.random().toString(),
      timestamp: 'Now',
      read: false
    }));
  } catch {
    return [];
  }
};