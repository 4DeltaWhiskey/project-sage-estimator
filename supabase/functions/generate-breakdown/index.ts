
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

    if (!openAIApiKey) {
      console.error('OpenAI API key is not configured');
      throw new Error('OpenAI API key is not configured');
    }

    if (!description || typeof description !== 'string') {
      console.error('Invalid project description');
      throw new Error('Invalid project description');
    }

    console.log('Generating breakdown for project:', description.substring(0, 100) + '...');

    const systemPrompt = `You are a senior software architect and project manager. Create a detailed breakdown of the software project described by the user.

Focus on the following aspects:
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

Keep the output structured, practical, and focused on modern software development practices.`;

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
    console.log('Successfully generated breakdown');

    let breakdown;
    try {
      breakdown = JSON.parse(data.choices[0].message.content);
      if (!breakdown.features || !Array.isArray(breakdown.features)) {
        throw new Error('Invalid response structure');
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
