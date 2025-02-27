
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { description, currentFeatures } = await req.json();

    if (!openAIApiKey) {
      console.error('OpenAI API key is not configured');
      throw new Error('OpenAI API key is not configured');
    }

    if (!description || typeof description !== 'string') {
      console.error('Invalid project description');
      throw new Error('Invalid project description');
    }

    console.log('Generating breakdown for project:', description.substring(0, 100) + '...');

    const systemPrompt = `You are a senior software architect and project manager. You need to ensure technical consistency across features while preserving the user stories and feature descriptions.

${currentFeatures ? `
IMPORTANT: The project has existing features. A user has manually modified the technical components of one of these features:
${JSON.stringify(currentFeatures, null, 2)}

Your task is to:
1. Analyze the technical components across all features
2. Identify the most recently modified technical stack (it will typically be the most comprehensive or different from others)
3. PRESERVE all feature names, descriptions, and user stories exactly as they are
4. Update ONLY the technical components of other features to align with the modified feature's technical choices
5. Ensure all features use a consistent technical stack while maintaining their original functionality
6. Add any additional technical components needed to support the features' requirements
` : 'Create a new breakdown focusing on:'}

1. Core Features (maximum 6 essential features)
2. User Stories (2-4 key stories per feature)
3. Technical Components (required technologies and infrastructure)

Format the response as a JSON object with this exact structure:
{
  "features": [
    {
      "name": "Feature Name",
      "description": "Clear, concise feature description",
      "userStories": [
        "As a [user type], I want to [action] so that [benefit]"
      ],
      "technicalComponents": [
        "Required technology or component"
      ]
    }
  ]
}

CRITICAL: When currentFeatures are provided, you MUST:
- Keep ALL feature names exactly as provided
- Keep ALL descriptions exactly as provided
- Keep ALL user stories exactly as provided
- ONLY modify the technicalComponents arrays to ensure consistency`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: currentFeatures ? 
            `Update the technical components while preserving all other feature aspects: ${JSON.stringify(currentFeatures, null, 2)}` : 
            description 
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      throw new Error('Failed to generate project breakdown');
    }

    const data = await response.json();
    console.log('Successfully generated breakdown');

    let breakdown;
    try {
      breakdown = JSON.parse(data.choices[0].message.content);
      if (!breakdown.features || !Array.isArray(breakdown.features)) {
        throw new Error('Invalid response structure');
      }

      // Verify that when currentFeatures exist, we preserved everything except technical components
      if (currentFeatures) {
        breakdown.features = breakdown.features.map((newFeature, index) => {
          const originalFeature = currentFeatures[index];
          if (originalFeature) {
            return {
              ...originalFeature,
              technicalComponents: newFeature.technicalComponents
            };
          }
          return newFeature;
        });
      }
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      throw new Error('Invalid response format from AI');
    }

    return new Response(JSON.stringify(breakdown), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-breakdown function:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to generate project breakdown'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
