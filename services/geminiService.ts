
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
  
  const ai = getAI();
  const searchPrompt = `As a JedAi Master of Digital Analysis, perform a deep Holonet Scan for the brand "${name}" ${website ? `at ${website}` : ''}.
  
  EXTRACT & GENERATE:
  1. Visual Identity: Find the primary brand HEX color and secondary accent.
  2. Logo: Locate high-res logo URL.
  3. Brand Voice: Specific communication style.
  4. Post Sparks: 10 creative post ideas.
  5. Core Info: Target audience, business description, and value proposition.

  Return ONLY JSON.`;

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
    console.groupEnd();
    return { ...data, autoAppendSignature: true };
  } catch (e) {
    console.groupEnd();
    return { 
      primaryColor: '#8C4DFF', 
      tone: 'professional', 
      targetAudience: 'General Audience',
      autoAppendSignature: true,
      postIdeas: ["Wprowadzenie marki", "Nasza misja"]
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
  const prompt = `Generate 3 high-impact social media transmissions for "${profile.name}". Language: ${lang}. Return JSON array. Use their brand voice: ${profile.brandVoice || 'Professional'}.`;

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
 * ZAAWANSOWANY PIPELINE GENEROWANIA OBRAZÓW (ETAP A + ETAP B)
 */
export const generateAIImage = async (postContent: string, profile: BrandProfile, platform: string = 'instagram'): Promise<{url: string, brief: any, prompt: string}> => {
    const ai = getAI();
    
    // ETAP A: GENEROWANIE CREATIVE BRIEFU
    const briefPrompt = `You are a world-class JedAi Creative Director. 
    Analyze the Brand Context and Post Content to create a structured Creative Brief for an image.
    
    BRAND CONTEXT:
    - Name: ${profile.name}
    - Industry: ${profile.industry}
    - Voice: ${profile.brandVoice || profile.tone}
    - Mission: ${profile.businessDescription || 'Standard business operations'}
    - USPs: ${profile.valueProposition || 'Premium quality and reliability'}
    - Brand Kit Colors: ${profile.primaryColor}, ${profile.secondaryColor || 'Neutral'}
    - Reference Style: ${profile.industry} aesthetic, modern, futuristic.
    
    POST CONTENT:
    "${postContent}"
    
    PLATFORM: ${platform}

    RULES:
    1. Focus on visual storytelling, NOT copying post text.
    2. Favor photorealistic, premium, or specific artistic styles consistent with the industry.
    3. Primary Colors should influence the lighting, mood, or accents.
    4. NO long paragraphs on the image.
    
    Return ONLY a JSON object following the required schema.`;

    const briefResponse = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: briefPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            brand_summary: { type: Type.STRING },
            target_audience: { type: Type.STRING },
            goal: { type: Type.STRING },
            platform: { type: Type.STRING },
            main_subject: { type: Type.STRING },
            keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            visual_style: { type: Type.STRING },
            mood: { type: Type.STRING },
            color_direction: { type: Type.ARRAY, items: { type: Type.STRING } },
            composition: { type: Type.STRING },
            text_policy: {
              type: Type.OBJECT,
              properties: {
                allow_text: { type: Type.BOOLEAN },
                overlay_text: { type: Type.STRING }
              }
            }
          },
          required: ["main_subject", "visual_style", "mood", "color_direction", "text_policy"]
        }
      }
    });

    const brief = JSON.parse(briefResponse.text || "{}");

    // ETAP B: SYNTEZA FINALNEGO PROMPTU I GENEROWANIE OBRAZU
    const finalImagePrompt = `A ${brief.visual_style} image of ${brief.main_subject}. 
    Mood: ${brief.mood}. Composition: ${brief.composition}. 
    Lighting and accents in ${brief.color_direction.join(' and ')}. 
    Aesthetic keywords: ${brief.keywords.join(', ')}. 
    Highly detailed, premium quality, 8k resolution. 
    Consistent with ${profile.name}'s ${profile.brandVoice} brand voice.`;

    const negativePrompt = "no gibberish text, no random letters, no paragraphs, no watermark, no UI elements, no poster frame full of text, no distorted typography, no misspelled words, no logo made of text";

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

    if (!imageUrl) throw new Error("Force link broken: Failed to generate image");

    return {
      url: imageUrl,
      brief: brief,
      prompt: finalImagePrompt
    };
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
  const prompt = `Latest viral Force Sparks (trends) for ${industry} as of today. lang: ${lang}`;

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
