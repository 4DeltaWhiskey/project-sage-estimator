
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

    const systemPrompt = `You are a senior software project manager. For each feature in the provided breakdown, generate an estimation object with this structure:
    {
      "hours": number (estimated hours),
      "cost": number (hours * hourlyRate),
      "details": string (brief explanation of the estimate)
    }

    Return an array of these estimation objects, one for each feature. Format as a JSON object with this structure:
    {
      "estimations": [
        {
          "hours": 40,
          "cost": 2000,
          "details": "Includes setup of authentication system, user roles, and basic security features..."
        },
        ...
      ]
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
              features: breakdown.features,
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
