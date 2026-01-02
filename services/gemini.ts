
import { GoogleGenAI, Type } from "@google/genai";
import { Pokemon } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export interface BattleInsight {
  prediction: string;
  strategicAdvantage: string;
  keyStatsToWatch: string[];
  winProbability: number;
}

export const getBattleInsight = async (p1: Pokemon, p2: Pokemon): Promise<BattleInsight> => {
  const prompt = `Analyze a hypothetical Pokemon battle between ${p1.name} (Types: ${p1.types.join(', ')}) and ${p2.name} (Types: ${p2.types.join(', ')}). 
  Provide a win probability for ${p1.name} and a brief strategic analysis.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          prediction: { type: Type.STRING },
          strategicAdvantage: { type: Type.STRING },
          keyStatsToWatch: { type: Type.ARRAY, items: { type: Type.STRING } },
          winProbability: { type: Type.NUMBER, description: "Probability from 0 to 1" }
        },
        required: ["prediction", "strategicAdvantage", "keyStatsToWatch", "winProbability"]
      }
    }
  });

  return JSON.parse(response.text);
};
