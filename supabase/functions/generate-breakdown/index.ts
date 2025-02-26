
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
    const { description } = await req.json();

    const systemPrompt = `You are a senior product manager and software architect. Break down the following project description into a structured format with:

1. Core Features (maximum 6)
2. User Stories for each feature (2-4 stories per feature)
3. Technical Components needed

Format the response as a JSON object with this structure:
{
  "features": [
    {
      "name": "Feature name",
      "description": "Brief feature description",
      "userStories": [
        "As a [user type], I want to [action] so that [benefit]"
      ],
      "technicalComponents": [
        "Component/technology needed"
      ]
    }
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
          { role: 'user', content: description }
        ],
        response_format: { type: "json_object" }
      }),
    });

    const data = await response.json();
    const breakdown = JSON.parse(data.choices[0].message.content);

    return new Response(JSON.stringify(breakdown), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-breakdown function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
