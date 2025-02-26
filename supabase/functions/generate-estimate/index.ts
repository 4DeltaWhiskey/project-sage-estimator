
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

    const systemPrompt = `You are a senior software project manager with extensive experience in estimating software development projects.
    Based on the provided project breakdown and an hourly rate of ${hourlyRate}€, create a detailed estimation including:
    
    1. Time estimates for each feature (in days or weeks)
    2. Team composition needed (roles and number of people)
    3. Total cost estimation based on ${hourlyRate}€ per hour (8 hours per day, 5 days per week)
    4. Risk assessment and recommendations
    5. Timeline breakdown with phases
    
    Format the response in a clear, structured manner using markdown. Base your estimates on industry standards and best practices.
    Include subtotals for each feature and a grand total in Euros.`;

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
              breakdown: breakdown.features,
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
    const generatedText = data.choices[0].message.content;

    return new Response(JSON.stringify({ generatedText }), {
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
