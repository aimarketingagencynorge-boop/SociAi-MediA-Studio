
import { GoogleGenAI, Type } from "@google/genai";
import { BrandProfile, SocialPost, ContentFormat, Notification } from "../types";
import { Language } from "../translations";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeBrandIdentity = async (name: string, website?: string): Promise<Partial<BrandProfile>> => {
  const ai = getAI();
  const prompt = `Analyze the brand "${name}" ${website ? `at ${website}` : ''}. Find its brand identity, color scheme (Hex codes), tone of voice, target audience, and a description for an AI to generate a professional studio version of its logo. Return JSON.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          primaryColor: { type: Type.STRING },
          secondaryColor: { type: Type.STRING },
          tone: { type: Type.STRING, description: 'One of: professional, funny, inspirational, edgy' },
          targetAudience: { type: Type.STRING },
          logoPrompt: { type: Type.STRING, description: 'Prompt for image generation model to create a logo symbol' },
          analysisSummary: { type: Type.STRING }
        },
        required: ["primaryColor", "tone", "targetAudience", "logoPrompt"]
      }
    }
  });

  try {
    const data = JSON.parse(response.text || "{}");
    // Generate the logo using the prompt we just got
    let logoUrl = '';
    try {
        logoUrl = await generateAIImage(`Professional minimalist high-end logo symbol for a brand, vector style, flat design, on dark background, following description: ${data.logoPrompt}`);
    } catch (e) {
        console.warn("Logo generation failed", e);
    }
    
    return {
      primaryColor: data.primaryColor,
      secondaryColor: data.secondaryColor,
      tone: data.tone as any,
      targetAudience: data.targetAudience,
      logoUrl: logoUrl,
      analysisSummary: data.analysisSummary,
      autoAppendSignature: true,
      styleReferenceUrls: []
    };
  } catch (e) {
    console.error("Brand analysis failed", e);
    return {
      autoAppendSignature: true,
      styleReferenceUrls: []
    };
  }
};

export const fetchLatestTrends = async (industry: string, lang: Language): Promise<Notification[]> => {
  const ai = getAI();
  const prompt = `SEARCH THE WEB for the absolute latest (today or this week) social media trends, news, or viral insights specifically for the "${industry}" industry. 
  DO NOT use old or generic information. Provide 3 REAL entries. 
  Return JSON array of notifications. LANGUAGE: ${lang}. 
  Fields: title, message, type (one of: trend, insight, system). 
  Make them sound urgent, high-value, and professional.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            message: { type: Type.STRING },
            type: { type: Type.STRING }
          },
          required: ["title", "message", "type"]
        }
      }
    }
  });

  try {
    const rawData = JSON.parse(response.text || "[]");
    return rawData.map((item: any) => ({
      id: Math.random().toString(36).substr(2, 9),
      title: item.title,
      message: item.message,
      type: item.type,
      timestamp: 'Just now',
      read: false
    }));
  } catch (e) {
    console.error("Failed to fetch trends", e);
    return [];
  }
};

export const getFormattedSignature = (profile: BrandProfile): string => {
  if (!profile.autoAppendSignature) return "";
  const parts = [];
  if (profile.website) parts.push(`🌐 Website: ${profile.website}`);
  if (profile.email) parts.push(`📧 Email: ${profile.email}`);
  if (profile.phone) parts.push(`📞 Contact: ${profile.phone}`);
  if (profile.address) parts.push(`📍 Address: ${profile.address}`);
  
  return parts.length > 0 ? `\n---\n${parts.join('\n')}\n---` : "";
};

export const generateInitialStrategy = async (profile: BrandProfile, lang: Language): Promise<SocialPost[]> => {
  const ai = getAI();
  const prompt = `Generate a 3-post social media starter plan for a brand called "${profile.name}" in the "${profile.industry}" industry. Tone: ${profile.tone}. Website focus: ${profile.website}. 
  BUSINESS DETAILS: ${profile.businessDescription || 'Not specified'}.
  BRAND VOICE: ${profile.brandVoice || 'Not specified'}.
  VALUE PROPOSITION: ${profile.valueProposition || 'Not specified'}.
  LANGUAGE: ${lang}. Return high-quality professional marketing copy. Return JSON array of objects.`;

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
            mediaSource: { type: Type.STRING }
          },
          required: ["id", "platform", "date", "content", "hashtags", "status", "mediaSource"]
        }
      }
    }
  });

  try {
    const rawPosts: SocialPost[] = JSON.parse(response.text || "[]");
    const signature = getFormattedSignature(profile);
    
    return rawPosts.map(post => ({
      ...post,
      content: profile.autoAppendSignature ? `${post.content}${signature}` : post.content
    }));
  } catch (e) {
    return [];
  }
};

export const generateWeeklyStrategy = async (profile: BrandProfile, lang: Language, formats: ContentFormat[]): Promise<SocialPost[]> => {
    const ai = getAI();
    const formatsDescription = formats.map(f => `- ${f.name} (${f.keyword}): ${f.postsPerWeek} posts`).join('\n');
    const prompt = `Weekly social media strategy for "${profile.name}". Quotas:\n${formatsDescription}\nIndustry: ${profile.industry}. Tone: ${profile.tone}. 
    BUSINESS DETAILS: ${profile.businessDescription || 'Not specified'}.
    BRAND VOICE: ${profile.brandVoice || 'Not specified'}.
    VALUE PROPOSITION: ${profile.valueProposition || 'Not specified'}.
    LANGUAGE: ${lang}.
    
    CRITICAL QUALITY GUIDELINES:
    - Content must be EXTREMELY high-quality, professional, and strategic.
    - Focus on engagement and brand value.
    - DO NOT include signatures or footers in the content field (they will be added programmatically).
    - Return JSON array of posts.`;

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
        const rawPosts: SocialPost[] = JSON.parse(response.text || "[]");
        const signature = getFormattedSignature(profile);
        
        return rawPosts.map(post => ({
            ...post,
            content: profile.autoAppendSignature ? `${post.content}${signature}` : post.content
        }));
    } catch (e) {
        return [];
    }
};

/**
 * Distills long post content into a visual description AND a catchy text headline for the image.
 */
const distillVisualPrompt = async (postContent: string, brandProfile?: BrandProfile): Promise<{visual: string, headline: string}> => {
    const ai = getAI();
    const prompt = `Analyze this social media post and provide:
    1. A short, catchy headline (max 5 words) to be visually placed on the graphic.
    2. A CONCISE visual scene description for an image generator.
    
    POST CONTENT: "${postContent}"
    BRAND TONE: "${brandProfile?.tone || 'professional'}"
    BRAND VOICE: "${brandProfile?.brandVoice || 'Not specified'}"
    
    Return JSON format.`;

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    headline: { type: Type.STRING },
                    visual: { type: Type.STRING }
                },
                required: ["headline", "visual"]
            }
        }
    });

    try {
        return JSON.parse(response.text || "{}");
    } catch {
        return { headline: brandProfile?.name || "Innovation", visual: "Professional high-end social media graphic." };
    }
};

export const generateAIImage = async (promptOrContent: string, brandContext?: BrandProfile): Promise<string> => {
    const ai = getAI();
    
    // 1. Distill the prompt to get visual scene and headline
    const { visual, headline } = await distillVisualPrompt(promptOrContent, brandContext);

    // 2. Prepare multimodal parts if brand has style references
    const styleInstruction = brandContext?.styleReferenceUrls && brandContext.styleReferenceUrls.length > 0
        ? "STRICTLY MATCH the lighting, color grading, artistic style, and overall atmosphere of the reference images provided below."
        : "Style: Professional, high-end, cyber-neon aesthetic.";

    const parts: any[] = [{ text: `Create a professional social media graphic.
        VISUAL SCENE: ${visual}
        TEXT TO INCLUDE: "${headline}"
        PRIMARY COLOR: ${brandContext?.primaryColor || '#8C4DFF'}
        
        INSTRUCTIONS:
        - Incorporate the text "${headline}" in a modern, stylish, and legible way as a headline.
        - ${styleInstruction}
        - Ensure a high-end, premium feel matching the brand tone "${brandContext?.tone || 'professional'}".` }];

    // 3. Add Style References (if any) as inlineData
    if (brandContext?.styleReferenceUrls && brandContext.styleReferenceUrls.length > 0) {
        for (const url of brandContext.styleReferenceUrls) {
            if (url.startsWith('data:')) {
                const [mimePart, data] = url.split(';base64,');
                const mimeType = mimePart.split(':')[1];
                parts.push({
                    inlineData: {
                        mimeType: mimeType,
                        data: data
                    }
                });
            }
        }
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: parts },
      config: { imageConfig: { aspectRatio: "1:1" } }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data returned");
};

export const generateAIVideo = async (prompt: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `Cinematic professional video, futuristic cyber-neon style, theme: ${prompt}`,
      config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({ operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
};
