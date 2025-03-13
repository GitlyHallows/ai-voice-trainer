import { generateWorkoutPlan } from './workoutPlanGenerator';

export interface WorkoutplanParams {
  type: string;
  length: number;
}

export interface LogMessageParams {
  message: string;
}

// Implementation of the tools
export async function workoutplan(parameters: WorkoutplanParams): Promise<string> {
  const { type, length } = parameters;
  console.log('Generating workout plan:', { type, length });
  
  try {
    // Generate the workout plan content
    const content = await generateWorkoutPlan(type, length);
    console.log('Generated workout plan content length:', content.length);

    // Create a filename with timestamp
    const timestamp = Date.now();
    const fileName = `workout_${timestamp}.md`;

    // Store the generated content
    localStorage.setItem(fileName, content);
    
    // We don't need to track the timestamp for disconnection anymore
    // The user will explicitly disconnect when ready

    // Log a summary of the generated workout plan (not the entire content to prevent large console logs)
    console.log('Workout plan generated:', {
      fileName,
      type,
      length,
      contentLength: content.length,
      contentPreview: content.slice(0, 100) + '...'
    });

    // Dispatch event with the full content
    window.dispatchEvent(new CustomEvent('workoutGenerated', {
      detail: {
        fileName,
        type,
        length,
        content
      }
    }));

    // IMPORTANT: Don't automatically trigger voiceChatDisconnect here,
    // let the user manually disconnect the mic when they're ready
    
    // Return a simple string message for the conversation
    return `I've created a ${length}-minute ${type} workout plan for you! When you're ready to start, just tell me "I'm ready to begin" or click the mic button to disconnect and the workout will start automatically.`;
  } catch (error) {
    console.error('Workout plan generation failed:', error);
    throw new Error(`Failed to generate workout plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function logMessage(parameters: LogMessageParams): Promise<string> {
  const { message } = parameters;
  console.log('Client tool log:', message);
  return `Logged: ${message}`;
}

// Function to fetch stored workout plan
export function getStoredWorkoutPlan(fileName: string): string | null {
  return localStorage.getItem(fileName);
}