
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

    const systemPrompt = `You are a senior software project manager and technical architect with deep expertise in software estimation. Conduct a thorough analysis of the provided features and their technical components.

    Your analysis should include:
    1. Detailed technical dependencies between features
    2. Comprehensive architectural considerations
    3. In-depth analysis of development complexity
    4. Infrastructure and scalability requirements
    5. Technical debt and maintainability factors
    6. Security and compliance implications
    7. Testing and quality assurance requirements
    8. Integration complexity with existing systems
    9. Performance optimization needs
    10. Future scalability considerations

    For each feature, provide a detailed estimation object with:
    {
      "hours": number (estimated development hours),
      "cost": number (hours * hourlyRate),
      "details": string (comprehensive explanation of the estimate including all technical considerations)
    }

    Format response as:
    {
      "estimations": [
        {
          "hours": number,
          "cost": number,
          "details": string
        }
      ],
      "technicalConsiderations": {
        "sharedTechnologies": ["detailed list of technologies affecting multiple features"],
        "impactAnalysis": "In-depth analysis of cross-feature technical impacts and architectural considerations",
        "recommendations": "Strategic technical recommendations for implementation"
      }
    }`;

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
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      throw new Error('Failed to generate project estimate');
    }

    const data = await response.json();
    console.log('Estimation response:', data); // Added for debugging
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
