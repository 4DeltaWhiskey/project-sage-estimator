
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

    const systemPrompt = `You are a senior software project manager. You need to generate a completely new estimation for each feature based on the updated technical constraints. 
    
    IMPORTANT: The new estimates should be different from previous ones as they must reflect the impact of the technical changes.

    Your task is to:
    1. Analyze each feature and its user stories
    2. Consider how the provided technical components affect the implementation complexity
    3. Generate accurate estimations taking into account:
       - Feature complexity and scope
       - Number and complexity of user stories
       - Required technical skills and learning curve
       - Integration complexity with chosen technologies
       - Testing requirements for the specific tech stack
       - Development environment setup time
       - Potential technical risks and mitigation time

    For each feature, generate an estimation object with:
    {
      "hours": number (realistic development hours considering technical complexity),
      "cost": number (hours * hourlyRate),
      "details": string (explanation focusing on technical implementation factors)
    }

    Format as a JSON object:
    {
      "estimations": [
        {
          "hours": number,
          "cost": number,
          "details": string
        },
        ...
      ]
    }`;

    console.log('Processing estimation with technical constraints:', breakdown.technicalComponents);

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
            }, null, 2)
          }
        ],
        temperature: 0.8,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate project estimate');
    }

    const data = await response.json();
    const estimations = JSON.parse(data.choices[0].message.content);

    console.log('Generated new estimations:', estimations);

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
