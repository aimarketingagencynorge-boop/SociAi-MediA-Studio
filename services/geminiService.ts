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
  
  const strategyPrompt = `You are a world-class Brand Data Extractor. 
  TASK: Perform a ${deepScan ? 'DEEP SCAN (high accuracy)' : 'STANDARD SCAN (fast)'} for the brand "${name}" using the provided website URL: ${website || 'web'}.
  
  FALLBACK STRATEGY (MUST EXECUTE):
  1. METADATA SCAN: Use Google Search to crawl the website's raw metadata. Look for Open Graph tags (og:site_name, og:title, og:description, og:image), meta description, and page <title>. Extract JSON-LD (application/ld+json) to find the official Organization name, logo, and social links (instagram, linkedin, etc).
  2. LOGO FALLBACK: If og:image is not found, search for apple-touch-icon, favicons, or common logo paths like /logo.png.
  3. DEEP SCAN (if deepScan is true): Analyze search results for hero section text, H1 headers, and mission statements. Use this to determine industry and keywords.

  MANDATORY: Return a REAL logo URL, a detailed description, and a confidence score (0-100).
  If data is low quality, set status to "partial" but ALWAYS fill the fields as much as possible.

  Return a JSON object matching this structure:
  {
    "status": "success" | "partial" | "failed",
    "confidence": number,
    "method": "meta" | "favicon" | "headless",
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
      model: "gemini-3-pro-preview",
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
    return JSON.parse(res.text || "{}");
  } catch (error) {
    console.error("Brand analysis failed:", error);
    return { 
      status: "failed", 
      confidence: 0, 
      brand: { primaryColor: '#8C4DFF', name }, 
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