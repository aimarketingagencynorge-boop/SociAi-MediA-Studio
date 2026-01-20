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
    const cleanData = data.replace(/\s/g, ''); 

    return {
      inlineData: {
        data: cleanData,
        mimeType: mimeType
      }
    };
  } catch (e) {
    console.error("[JedAi Debug] Image prep failed:", e);
    return null;
  }
};

export const generateInitialStrategy = async (profile: BrandProfile, lang: Language): Promise<SocialPost[]> => {
  const ai = getAI();
  const prompt = `Generate 3 high-impact social media transmissions for "${profile.name}". Return JSON array.`;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.warn("[JedAi Debug] Strategy AI failed, using local fallback.");
    return [
      { id: 'f1', platform: 'instagram', date: new Date().toISOString().split('T')[0], content: `Witajcie w ${profile.name}! Rozpoczynamy nową erę komunikacji.`, hashtags: ['startup', 'nowość'], status: 'draft', mediaSource: 'ai_generated' }
    ];
  }
};

export const generateAIImage = async (
  postContent: string, 
  profile: BrandProfile, 
  platform: string = 'instagram',
  mode: ImageGenMode = 'PHOTO',
  variantSeed: number = 0,
  editInstruction: string = ''
): Promise<{url: string, brief: any, prompt: string, debug: any}> => {
    const ai = getAI();
    
    const briefPrompt = `Create a visual brief for: "${postContent}". Brand: ${profile.name}. Style: ${mode}. Seed: ${variantSeed}. Return JSON with "main_subject", "palette" (5 hex), "mood".`;
    const briefRes = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: briefPrompt,
      config: { responseMimeType: "application/json" }
    });
    const brief = JSON.parse(briefRes.text || "{}");
    console.log("[JedAi Pipeline] Creative Brief:", brief);

    const parts: any[] = [];
    if (profile.styleReferenceUrls?.[0]) {
        const part = prepareImagePart(profile.styleReferenceUrls[0]);
        if (part) parts.push(part);
    }

    const finalPrompt = `${mode === 'PHOTO' ? 'Realistic high-end photography' : 'Modern graphic design'} of ${brief.main_subject}. Palette: ${brief.palette?.join(', ')}. No text, no HUD, no UI overlays. ${editInstruction}`;
    const negativePrompt = "text, buttons, user interface, hud, sci-fi panels, watermark, letters, monochrome red";
    
    parts.push({ text: `${finalPrompt}. NEGATIVE: ${negativePrompt}` });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
      config: { imageConfig: { aspectRatio: platform === 'tiktok' ? '9:16' : '1:1' } }
    });

    const imageData = response.candidates[0].content.parts.find(p => p.inlineData)?.inlineData?.data;
    if (!imageData) throw new Error("Image Generation Failed");

    return { 
      url: `data:image/png;base64,${imageData}`, 
      brief, 
      prompt: finalPrompt,
      debug: { palette: brief.palette, missingFields: profile.brandVoice ? [] : ['brandVoice'] }
    };
};

export const generateAIVideo = async (prompt: string, profile: BrandProfile, editInstruction: string = ''): Promise<{url: string, debug: any}> => {
  const ai = getAI();
  console.log("[JedAi Pipeline] Video Briefing for Veo...");
  
  const finalVideoPrompt = `Cinematic 4k video for ${profile.name}: ${prompt}. Style: professional commercial. No text. ${editInstruction}`;

  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: finalVideoPrompt,
    config: { resolution: '720p', aspectRatio: '16:9' }
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 8000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  const blob = await response.blob();
  
  return { 
    url: URL.createObjectURL(blob),
    debug: { finalVideoPrompt, editInstruction }
  };
};

export const analyzeBrandIdentity = async (name: string, website?: string, deepScan: boolean = false): Promise<any> => {
  const ai = getAI();
  
  const strategyPrompt = `You are an expert Brand Intelligence agent. 
  TASK: Extract comprehensive brand identity data for "${name}" using URL: ${website || 'N/A'}.
  
  STEPS:
  1. USE GOOGLE SEARCH to find the official website if URL is missing or unreachable.
  2. IDENTIFY: Official business name, industry niche, and a rich description (2-3 sentences).
  3. EXTRACT LOGO: Find the actual URL for the brand logo. Look for "og:image", "favicon", or official site assets.
  4. SOCIALS: Locate official Instagram, Facebook, and LinkedIn links.
  5. STYLE: Identify the primary brand color (HEX code).

  MANDATORY: Return a valid JSON object. If a field is unknown, leave it as an empty string, NEVER return null.
  
  Confidence Score: Calculate 0-100 based on how much real data you found.

  JSON structure required:
  {
    "status": "success" | "partial",
    "confidence": number,
    "method": "search",
    "brand": {
      "name": string,
      "description": string,
      "logoUrl": string,
      "website": string,
      "industry": string,
      "keywords": string[],
      "primaryColor": string,
      "socials": {
        "instagram": string,
        "facebook": string,
        "linkedin": string,
        "youtube": string
      }
    },
    "debug": {
      "sources": string[],
      "errors": string[]
    }
  }`;

  try {
    const res = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: strategyPrompt,
      config: { 
        tools: [{ googleSearch: {} }], 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            method: { type: Type.STRING },
            brand: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                logoUrl: { type: Type.STRING },
                website: { type: Type.STRING },
                industry: { type: Type.STRING },
                keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                primaryColor: { type: Type.STRING },
                socials: {
                  type: Type.OBJECT,
                  properties: {
                    instagram: { type: Type.STRING },
                    facebook: { type: Type.STRING },
                    linkedin: { type: Type.STRING },
                    youtube: { type: Type.STRING }
                  }
                }
              }
            },
            debug: {
              type: Type.OBJECT,
              properties: {
                sources: { type: Type.ARRAY, items: { type: Type.STRING } },
                errors: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            }
          },
          required: ["status", "confidence", "brand"]
        }
      }
    });

    const parsed = JSON.parse(res.text || "{}");
    
    // Safety Fallback Merger to prevent React "Black Screen" crash
    return {
      status: parsed.status || "partial",
      confidence: parsed.confidence || 0,
      method: parsed.method || "search",
      brand: {
        name: parsed.brand?.name || name,
        description: parsed.brand?.description || "",
        logoUrl: parsed.brand?.logoUrl || "",
        website: parsed.brand?.website || website || "",
        industry: parsed.brand?.industry || "",
        keywords: parsed.brand?.keywords || [],
        primaryColor: parsed.brand?.primaryColor || "#8C4DFF",
        socials: {
          instagram: parsed.brand?.socials?.instagram || "",
          facebook: parsed.brand?.socials?.facebook || "",
          linkedin: parsed.brand?.socials?.linkedin || "",
          youtube: parsed.brand?.socials?.youtube || ""
        }
      },
      debug: {
        sources: parsed.debug?.sources || [],
        errors: parsed.debug?.errors || []
      }
    };
  } catch (error) {
    console.error("[JedAi DB] Brand analysis critical failure:", error);
    return { 
      status: "failed", 
      confidence: 0, 
      brand: { 
        name, 
        primaryColor: '#8C4DFF', 
        socials: { instagram: "", facebook: "", linkedin: "", youtube: "" } 
      }, 
      debug: { errors: [String(error)], sources: [] } 
    };
  }
};

export const generateWeeklyStrategy = async (profile: BrandProfile, lang: Language, formats: ContentFormat[]): Promise<SocialPost[]> => {
  const ai = getAI();
  const prompt = `Generate 7 posts for ${profile.name}. Return JSON array.`;
  try {
    const res = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(res.text || "[]");
  } catch { return []; }
};