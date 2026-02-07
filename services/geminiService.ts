
import { GoogleGenAI, Type } from "@google/genai";

export class GeminiService {
  private getClient() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async suggestSubNodes(parentNodeLabel: string): Promise<string[]> {
    try {
      const ai = this.getClient();
      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: `Given the parent concept "${parentNodeLabel}", suggest 4-6 specific sub-topics or sub-tasks that would logically branch off it. Return only the sub-topic names as a JSON array of strings.`,
        config: {
          thinkingConfig: { thinkingBudget: 0 },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });

      return JSON.parse(response.text || '[]');
    } catch (error) {
      console.error("Error suggesting subnodes:", error);
      return ["Next Steps", "Research", "Design", "Implementation"];
    }
  }

  async decomposeTask(taskTitle: string): Promise<{ title: string; description: string }[]> {
    try {
      const ai = this.getClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Decompose the high-level project goal "${taskTitle}" into 5 actionable tasks. For each task, provide a short title and a one-sentence description. Return as JSON.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING }
              }
            }
          }
        }
      });

      return JSON.parse(response.text || '[]');
    } catch (error) {
      console.error("Error decomposing task:", error);
      return [];
    }
  }

  async parseNaturalLanguageInput(input: string): Promise<{ title: string; priority: string; dueDate: string; tags: string[] }> {
    try {
      const ai = this.getClient();
      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: `Analyze this user input: "${input}". Extract a task title, a priority (low, medium, high, urgent), a due date (YYYY-MM-DD format, assume today is ${new Date().toISOString().split('T')[0]}), and any tags (extracted from hashtags or context).`,
        config: {
          thinkingConfig: { thinkingBudget: 0 },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              priority: { type: Type.STRING },
              dueDate: { type: Type.STRING },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      });
      return JSON.parse(response.text || '{}');
    } catch (error) {
      console.error("Error parsing input:", error);
      return { 
        title: input, 
        priority: 'medium', 
        dueDate: new Date().toISOString().split('T')[0],
        tags: []
      };
    }
  }
}

export const gemini = new GeminiService();
