
import { GoogleGenAI, Type, Modality, FunctionDeclaration } from "@google/genai";

const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Multimodal Understanding using Gemini 3 Flash (Accessible Tier)
 */
export async function analyzeMultimodal(prompt: string, fileData: string, mimeType: string): Promise<string> {
  try {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: fileData.split(',')[1], mimeType } },
          { text: prompt }
        ]
      }
    });
    return response.text || "Analysis failed to materialize.";
  } catch (err) {
    console.error("Multimodal error:", err);
    throw err;
  }
}

/**
 * Complex Reasoning using Gemini 3 Pro with high thinking budget
 * Updated to use gemini-3-pro-preview and max thinking budget for complex logic.
 */
export async function solveComplexProblem(prompt: string): Promise<string> {
  try {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 32768 } // Max reasoning for complex tasks as per UI requirements
      }
    });
    return response.text || "Neural pathways congested.";
  } catch (err) {
    console.error("Reasoning error:", err);
    throw err;
  }
}

/**
 * Low Latency Quick Response using Gemini 2.5 Flash Lite
 */
export async function fastTriage(prompt: string): Promise<string> {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite-latest',
    contents: prompt,
  });
  return response.text || "Quick sync failed.";
}

/**
 * Search Grounding using Gemini 3 Flash
 */
export async function performResearch(query: string): Promise<{ text: string; sources: { title: string; uri: string }[] }> {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: query,
    config: {
      tools: [{ googleSearch: {} }]
    }
  });

  const text = response.text || "No data retrieved.";
  const sources: { title: string; uri: string }[] = [];
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (chunks) {
    for (const chunk of chunks) {
      if (chunk.web) sources.push({ title: chunk.web.title || "Source", uri: chunk.web.uri || "" });
    }
  }
  return { text, sources };
}

/**
 * Maps Grounding using Gemini 2.5 Flash
 */
export async function performMapsSearch(query: string, location?: { latitude: number, longitude: number }): Promise<{ text: string; sources: { title: string; uri: string }[] }> {
  const ai = getClient();
  const config: any = {
    tools: [{ googleMaps: {} }],
  };

  if (location) {
    config.toolConfig = {
      retrievalConfig: { latLng: location }
    };
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: query,
    config,
  });

  const text = response.text || "No local data found.";
  const sources: { title: string; uri: string }[] = [];
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (chunks) {
    for (const chunk of chunks) {
      if (chunk.maps) sources.push({ title: chunk.maps.title || "Place", uri: chunk.maps.uri || "" });
    }
  }
  return { text, sources };
}

/**
 * Image Generation using Gemini 2.5 Flash Image (Standard Tier)
 */
export async function generateCreativeImage(prompt: string): Promise<string | null> {
  try {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: { aspectRatio: "1:1" }
      }
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (err) {
    console.error("Image generation error:", err);
    throw err;
  }
}

/**
 * Image Editing using Gemini 2.5 Flash Image
 */
export async function editImage(prompt: string, base64Image: string, mimeType: string): Promise<string | null> {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: base64Image.split(',')[1], mimeType } },
        { text: prompt }
      ]
    }
  });

  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }
  return null;
}

/**
 * Text to Speech Generation using Gemini 2.5 Flash TTS
 */
export async function speakResponse(text: string): Promise<void> {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (base64Audio) {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const buffer = await decodeAudioData(decode(base64Audio), audioCtx, 24000, 1);
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    source.start();
  }
}

/**
 * Video Generation using Veo 3.1 Fast
 * Added generateVeoVideo to support cinematic video creation.
 */
export async function generateVeoVideo(prompt: string, image?: string, aspectRatio: '16:9' | '9:16' = '16:9'): Promise<string | null> {
  // Create a new GoogleGenAI instance right before the call to ensure current API key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt || 'A cinematic high-quality video',
      image: image ? {
        imageBytes: image.split(',')[1],
        mimeType: image.split(',')[0].split(':')[1].split(';')[0]
      } : undefined,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: aspectRatio
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) return null;

    // Must append API key when fetching from the download link
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (err: any) {
    console.error("Veo generation error:", err);
    throw err;
  }
}

// Audio Utilities
export function decode(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function encode(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const SYNAPSE_TOOLS: FunctionDeclaration[] = [
  {
    name: 'add_protocol',
    parameters: {
      type: Type.OBJECT,
      description: 'Add a new task or protocol.',
      properties: {
        title: { type: Type.STRING },
        priority: { type: Type.NUMBER },
      },
      required: ['title', 'priority'],
    },
  }
];
