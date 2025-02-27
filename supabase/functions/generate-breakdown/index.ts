
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

Focus on:
1. Technical Components (required technologies and infrastructure) - These should be listed separately and be consistent across all features
2. Core Features (maximum 6 essential features)
3. User Stories (2-4 key stories per feature)

Respond with ONLY a valid JSON object matching this structure (no markdown, no backticks, no explanations):
{
  "features": [
    {
      "name": "Feature Name",
      "description": "Clear, concise feature description",
      "userStories": [
        "As a [user type], I want to [action] so that [benefit]"
      ]
    }
  ],
  "technicalComponents": [
    "List of all technical components and technologies required for the entire project"
  ]
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',  // Fixed model name
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: description }
        ],
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
    console.log('OpenAI response:', data);

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from OpenAI');
    }

    // Clean up the content to ensure it's valid JSON
    let content = data.choices[0].message.content.trim();
    // Remove any markdown code block indicators if present
    content = content.replace(/^```json\s*/, '').replace(/```$/, '');
    
    try {
      const parsedContent = JSON.parse(content);
      
      if (!parsedContent.features || !Array.isArray(parsedContent.features) || !parsedContent.technicalComponents || !Array.isArray(parsedContent.technicalComponents)) {
        throw new Error('Invalid breakdown format: missing features or technical components array');
      }

      console.log('Successfully parsed content:', parsedContent);

      return new Response(JSON.stringify(parsedContent), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      console.error('Content that failed to parse:', content);
      throw new Error('Failed to parse OpenAI response as JSON');
    }
  } catch (error) {
    console.error('Error in generate-breakdown function:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to generate project breakdown'
      }),
      {
        status: 200, // Using 200 to prevent client-side rejection
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
