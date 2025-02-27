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

    if (currentFeatures) {
      // Find the most recently modified feature by comparing technical components
      // We assume the feature with different technical components is the one that was just modified
      const modifiedFeatureIndex = currentFeatures.findIndex((feature, index, array) => {
        if (index === 0) return false;
        const prevFeature = array[index - 1];
        return JSON.stringify(feature.technicalComponents) !== JSON.stringify(prevFeature.technicalComponents);
      });

      const modifiedFeature = modifiedFeatureIndex !== -1 
        ? currentFeatures[modifiedFeatureIndex] 
        : currentFeatures[currentFeatures.length - 1];

      const systemPrompt = `You are a senior software architect and project manager. A user has manually modified the technical components of one feature in their project.

MODIFIED FEATURE WITH NEW TECHNICAL COMPONENTS:
${JSON.stringify(modifiedFeature, null, 2)}

ALL CURRENT FEATURES:
${JSON.stringify(currentFeatures, null, 2)}

Your task is to:
1. Use EXACTLY the technical components from the modified feature as the base technical stack
2. Add ONLY absolutely necessary additional technical components for other features if their specific functionality requires it
3. DO NOT remove or modify any technical components from the modified feature
4. PRESERVE ALL feature names, descriptions, and user stories exactly as they are
5. Update ONLY the technical components of other features to align with the modified feature

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

CRITICAL REQUIREMENTS:
- The modified feature's technical components MUST remain exactly as provided
- Other features' technical components should be updated to maintain consistency
- ALL other feature attributes (name, description, user stories) MUST remain unchanged
- Every feature MUST include ALL relevant technical components from the modified feature`;

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
            { role: 'user', content: `Update the technical components while preserving the modified feature's components exactly: ${JSON.stringify(currentFeatures, null, 2)}` }
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
      let breakdown = JSON.parse(data.choices[0].message.content);

      // Ensure we keep the exact technical components of the modified feature
      breakdown.features = breakdown.features.map((feature, index) => {
        if (index === modifiedFeatureIndex) {
          return {
            ...feature,
            technicalComponents: modifiedFeature.technicalComponents
          };
        }
        return feature;
      });

      return new Response(JSON.stringify(breakdown), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      // Handle new project generation (no current features)
      const systemPrompt = `You are a senior software architect and project manager. Create a detailed breakdown of the software project described by the user.

Focus on:
1. Core Features (maximum 6 essential features)
2. User Stories (2-4 key stories per feature)
3. Technical Components (required technologies and infrastructure)

Format the response as a JSON object with the same structure as shown above.`;

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
            { role: 'user', content: description }
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
      return new Response(JSON.stringify(JSON.parse(data.choices[0].message.content)), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
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
