
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectDescription, breakdown } = await req.json();

    console.log("Received request to generate Lovable prompt");

    if (!projectDescription || !breakdown) {
      console.error("Missing required parameters: projectDescription or breakdown");
      return new Response(
        JSON.stringify({ error: 'Project description and breakdown are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if OpenAI API key is available
    if (!openAIApiKey) {
      console.error("OpenAI API key not found");
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured. Please set the OPENAI_API_KEY secret.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare a JSON structure for the breakdown to send to OpenAI
    const breakdownData = {
      features: breakdown.features.map((feature: any) => ({
        name: feature.name,
        description: feature.description,
        userStories: feature.userStories
      })),
      technicalComponents: breakdown.technicalComponents || []
    };

    console.log("Calling OpenAI API to generate prompt");

    // Call OpenAI API to generate the prompt
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Using a slightly faster model for prompt generation
        messages: [
          { 
            role: 'system', 
            content: 'You are an assistant that creates detailed prompts for web application development based on project descriptions and requirements. Your prompts should be clear, comprehensive, and optimized for use with AI coding assistants.'
          },
          { 
            role: 'user', 
            content: `Generate a well-structured prompt for building a web application based on this project description and breakdown. 
            
            Project Description: ${projectDescription}
            
            Breakdown: ${JSON.stringify(breakdownData, null, 2)}
            
            The prompt should be formatted as follows:
            1. Start with the project description
            2. List all features with their descriptions
            3. Include user stories for each feature
            4. List all technical constraints/components
            5. End with instructions to create a responsive, modern web application using React, TypeScript, and Tailwind CSS.
            
            Make the prompt clear, detailed, and optimized for an AI coding assistant to understand the requirements.`
          }
        ],
      }),
    });

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid OpenAI response:', data);
      return new Response(
        JSON.stringify({ error: 'Failed to get valid response from OpenAI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const generatedPrompt = data.choices[0].message.content;
    console.log("Successfully generated Lovable prompt");
    
    return new Response(JSON.stringify({ prompt: generatedPrompt }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-lovable-prompt function:', error);
    return new Response(
      JSON.stringify({ error: `Error generating prompt: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
