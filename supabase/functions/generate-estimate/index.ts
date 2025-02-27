
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
    const { description, breakdown, hourlyRate } = await req.json();

    if (!openAIApiKey) {
      console.error('OpenAI API key is not configured');
      throw new Error('OpenAI API key is not configured');
    }

    if (!description || !breakdown || !hourlyRate) {
      console.error('Missing required parameters');
      throw new Error('Missing required parameters');
    }

    console.log('Generating estimates for features:', breakdown.features.map(f => f.name));

    const systemPrompt = `You are a senior software project manager with expertise in estimating software development efforts.
For each feature in the project breakdown, estimate the development time in hours.
Consider the technical components required and the complexity of user stories.
Respond with ONLY the array of estimations, one per feature, in this exact format:
{
  "estimations": [
    {
      "hours": number,
      "cost": number (hours * hourlyRate)
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
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: JSON.stringify({
              description,
              features: breakdown.features,
              technicalComponents: breakdown.technicalComponents,
              hourlyRate
            })
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent estimates
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      throw new Error('Failed to generate estimates');
    }

    const data = await response.json();
    console.log('OpenAI response:', data);

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from OpenAI');
    }

    // Clean up the content and parse the JSON
    let content = data.choices[0].message.content.trim();
    content = content.replace(/^```json\s*/, '').replace(/```$/, '');
    
    try {
      const parsedContent = JSON.parse(content);
      
      if (!parsedContent.estimations || !Array.isArray(parsedContent.estimations)) {
        throw new Error('Invalid estimation format: missing estimations array');
      }

      // Validate each estimation
      parsedContent.estimations = parsedContent.estimations.map(est => ({
        hours: Number(est.hours) || 0,
        cost: Number(est.hours || 0) * hourlyRate
      }));

      console.log('Final estimations:', parsedContent);

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
    console.error('Error in generate-estimate function:', error);
    return new Response(
      JSON.stringify({
        estimations: [],
        error: error.message || 'Failed to generate estimates'
      }),
      {
        status: 200, // Using 200 to prevent client-side rejection
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
