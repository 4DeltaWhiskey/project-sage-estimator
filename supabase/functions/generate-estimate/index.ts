
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
    const { description, breakdown, hourlyRate = 50, allFeatures = false } = await req.json();

    const systemPrompt = `You are a senior software project manager and technical architect. Analyze the provided features and their technical components.

    Key responsibilities:
    1. If a feature introduces a new technology or framework, consider its impact on other features
    2. Identify shared technical dependencies across features
    3. Adjust time estimates based on technology reuse and shared infrastructure
    4. Consider setup and integration time for new technologies
    5. Account for potential refactoring needed in other features

    For each feature, generate an estimation object with:
    {
      "hours": number (estimated hours),
      "cost": number (hours * hourlyRate),
      "details": string (explanation including technology considerations and dependencies)
    }

    Format response as:
    {
      "estimations": [
        {
          "hours": 40,
          "cost": 2000,
          "details": "Includes initial setup of X technology which will benefit feature Y..."
        }
      ],
      "technicalConsiderations": {
        "sharedTechnologies": ["list of technologies that affect multiple features"],
        "impactAnalysis": "Brief analysis of cross-feature technical impacts"
      }
    }`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: JSON.stringify({
              description,
              features: allFeatures ? breakdown.features : breakdown.features[0],
              allFeatures: breakdown.features,
              hourlyRate
            }, null, 2)
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
      throw new Error('Failed to generate project estimate');
    }

    const data = await response.json();
    return new Response(JSON.stringify(JSON.parse(data.choices[0].message.content)), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-estimate function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to generate project estimate' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
