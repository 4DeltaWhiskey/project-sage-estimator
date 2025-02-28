
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

    if (!projectDescription || !breakdown) {
      return new Response(
        JSON.stringify({ error: 'Project description and breakdown are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If OpenAI API key is not available, generate fallback prompt
    if (!openAIApiKey) {
      console.log("OpenAI API key not found, using fallback prompt generation");
      const fallbackPrompt = generateFallbackPrompt(projectDescription, breakdown);
      return new Response(JSON.stringify({ prompt: fallbackPrompt }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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

    // Call OpenAI API to generate the prompt
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
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
      // Use fallback if OpenAI response is invalid
      const fallbackPrompt = generateFallbackPrompt(projectDescription, breakdown);
      return new Response(JSON.stringify({ prompt: fallbackPrompt }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const generatedPrompt = data.choices[0].message.content;
    console.log("Generated Lovable prompt successfully");
    
    return new Response(JSON.stringify({ prompt: generatedPrompt }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-lovable-prompt function:', error);
    
    // In case of any error, generate a fallback prompt
    try {
      const { projectDescription, breakdown } = await req.json();
      const fallbackPrompt = generateFallbackPrompt(projectDescription, breakdown);
      
      return new Response(JSON.stringify({ prompt: fallbackPrompt }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (fallbackError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }
});

// Fallback prompt generation function
function generateFallbackPrompt(projectDescription: string, breakdown: any) {
  let prompt = "";
  
  // Add project description
  prompt += `I want to build a web application with the following description:\n\n${projectDescription}\n\n`;
  
  // Add features and user stories
  if (breakdown && breakdown.features.length > 0) {
    prompt += "The application should include the following features:\n\n";
    
    breakdown.features.forEach((feature: any, index: number) => {
      prompt += `${index + 1}. ${feature.name}: ${feature.description}\n`;
      
      // Add user stories for each feature
      if (feature.userStories.length > 0) {
        prompt += "   User Stories:\n";
        feature.userStories.forEach((story: string, storyIdx: number) => {
          prompt += `   - ${story}\n`;
        });
      }
      
      prompt += "\n";
    });
  }
  
  // Add technical constraints
  if (breakdown && breakdown.technicalComponents.length > 0) {
    prompt += "Technical constraints and components to use:\n";
    breakdown.technicalComponents.forEach((tech: string) => {
      prompt += `- ${tech}\n`;
    });
    prompt += "\n";
  }
  
  // Add final instructions for Lovable
  prompt += `Please create a responsive, modern web application based on these requirements using React, Typescript, and Tailwind CSS. Start by showing me a basic structure of the main page with navigation and key components.`;
  
  return prompt;
}
