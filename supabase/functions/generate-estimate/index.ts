
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
    const { description, breakdown, hourlyRate = 50 } = await req.json();

    const systemPrompt = `You are a senior software project manager. For each feature in the provided breakdown, generate an estimation object considering the technical constraints and requirements. The estimation should be higher for features that involve more complex technical components.

    Your task is to:
    1. Analyze each feature and its user stories
    2. Consider the technical components that will be used
    3. Generate an accurate estimation taking into account:
       - Feature complexity
       - Number and complexity of user stories
       - Technical components involved
       - Integration complexity
       - Testing requirements

    Return an array of estimation objects, with this structure for each feature:
    {
      "hours": number (estimated development hours),
      "cost": number (hours * hourlyRate),
      "details": string (brief explanation of the estimate considering technical aspects)
    }

    Format as a JSON object with this structure:
    {
      "estimations": [
        {
          "hours": 40,
          "cost": 2000,
          "details": "Estimate considers setup of auth system, integration with..."
        },
        ...
      ]
    }`;

    console.log('Sending request to OpenAI with:', {
      description,
      features: breakdown.features,
      technicalComponents: breakdown.technicalComponents,
      hourlyRate
    });

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
              features: breakdown.features,
              technicalComponents: breakdown.technicalComponents,
              hourlyRate
            }, null, 2)
          }
        ],
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
    const estimations = JSON.parse(data.choices[0].message.content);

    console.log('Generated estimations:', estimations);

    return new Response(JSON.stringify(estimations), {
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
