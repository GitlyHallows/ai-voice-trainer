// Define types for Gemini API response
interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

export async function generateWorkoutPlan(type: string, length: number): Promise<string> {
  console.log('Generating new workout plan with Gemini API:', { type, length });

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('Gemini API key not found in environment variables');
    throw new Error('Gemini API key is required');
  }

  const prompt = `
Below is the sample workout plan document that adheres to a specific yaml format which lets my app parse it and 
use it. I want you to create a document matching this format for ${length} ${type} workout. The content inside 
such as phrases, reps can be totally yours, but just stick to format. For ex., you can set your own warmup 
exercises for the type of workout I asked for, instead of dynamic stretches for warmup for ex. Because leg needs
 different stretches, you may customize it accordingly.

workout.md
"
---
title: "30-Minute High Intensity Training"
duration: 30
phases:
  - name: "Warm-up"
    duration: 5
  - name: "Main Workout"
    duration: 20
  - name: "Cool Down"
    duration: 5
difficulty: "Intermediate"
calories: 300
equipment:
  - "exercise mat"
  - "water bottle"
---

# Warm-up Phase
duration: 5 minutes

## Dynamic Stretches
- duration: 3
- sequences: 2

**[VOICE_START]**: "Welcome to your 30-minute high-intensity workout! Let's start with some dynamic stretches to
 warm up your muscles."

### Movement 1: Arm Circles
- exercise_type: "dynamic_stretch"
- sets: 2
- reps_per_set: 10
- side: "each_direction"
- tempo: "2-0-2-0"  # seconds for eccentric-bottom-concentric-top
- timing: "0:00 - 0:30"

**[VOICE]**: "Begin with arm circles. Ten forward, then ten backward. Keep a steady pace."
**[VOICE_COUNT]**: "Forward... 2... 3... 4... 5... 6... 7... 8... 9... 10... Now backward..."

### Movement 2: Hip Rotations
- exercise_type: "dynamic_stretch"
- sets: 2
- reps_per_set: 8
- side: "each_side"
- tempo: "2-0-2-0"
- timing: "0:30 - 1:00"

**[VOICE]**: "Hip rotations next. Eight on each side. Keep your core engaged."

## Light Cardio
- duration: 2
- intensity: "moderate"

### Movement 3: Jumping Jacks
- exercise_type: "cardio"
- sets: 1
- reps: 20
- tempo: "1-0-1-0"
- timing: "1:00 - 1:30"

**[VOICE]**: "Time for jumping jacks. Twenty reps at a moderate pace."
**[VOICE_MOTIVATION]**: [
  "That's it! Feel your body warming up!",
  "Great form, keep that rhythm going!",
  "You're building heat in those muscles!",
  "Every jack is prepping you for an awesome workout!",
  "Love that energy, keep it flowing!"
]

### Movement 4: High Knees
- exercise_type: "cardio"
- duration: 30
- sets: 1
- reps: "continuous"
- intensity: "moderate"
- timing: "1:30 - 2:00"

**[VOICE]**: "High knees for thirty seconds. Drive those knees up!"

# Main Workout Phase
duration: 20 minutes
circuits: 4
rest_between_circuits: 60

## Circuit 1: Lower Body Focus
- rounds: 3
- work_duration: 40
- rest_duration: 20

**[VOICE_START]**: "Now for the main workout. We'll do four circuits, three rounds each. First circuit focuses 
on lower body."

### Exercise 1: Bodyweight Squats
- exercise_type: "strength"
- sets: 3
- reps_per_set: 15
- tempo: "2-1-1-0"  # slow down, pause, up, no pause at top
- rest_between_sets: 20
- timing: "5:00 - 5:40"
- form_cues: 
  - "feet shoulder-width apart"
  - "chest up"
  - "knees tracking toes"

**[VOICE]**: "Starting with squats. Keep your chest up and back straight."
**[VOICE_FORM]**: "Drive through your heels as you push up."
**[VOICE_MOTIVATION]**: [
  "These legs were made for squatting! You've got this!",
  "Every squat makes you stronger! Push through!",
  "Feel that power in your legs! You're unstoppable!",
  "This is where champions are made! Keep pushing!",
  "Your form is fantastic! Keep that energy high!"
]

### Exercise 2: Alternating Lunges
- exercise_type: "strength"
- sets: 3
- reps_per_set: 12
- side: "each_leg"
- tempo: "2-0-2-0"
- rest_between_sets: 20
- timing: "6:00 - 6:40"
- form_cues:
  - "step length is key"
  - "knee at 90 degrees"

**[VOICE]**: "Alternating lunges now. Step forward with control."
**[VOICE_FORM]**: "Keep your upper body straight and core engaged."
**[VOICE_MOTIVATION]**: [
  "Each lunge is sculpting those legs! Keep going!",
  "You're stronger than you know! Push through!",
  "That's perfect form! You're crushing it!",
  "Feel the burn - it means you're getting stronger!",
  "You make these lunges look easy! Keep it up!"
]

## Circuit 2: Upper Body Power
- rounds: 3
- work_duration: 40
- rest_duration: 20

**[VOICE_START]**: "Second circuit! Upper body focus - let's build that strength!"

### Exercise 3: Push-Ups
- exercise_type: "strength"
- sets: 3
- reps_per_set: 12
- tempo: "2-0-1-1"  # slow down, no pause, up, pause at top
- rest_between_sets: 20
- modifications: "knees down if needed"
- timing: "10:00 - 10:40"
- form_cues:
  - "hands shoulder-width"
  - "core tight"
  - "straight line head to heels"

**[VOICE]**: "Push-up time! Modified version is perfectly fine."
**[VOICE_FORM]**: "Keep your core tight and body in a straight line."
**[VOICE_MOTIVATION]**: [
  "Every push-up builds upper body strength! You're doing amazing!",
  "Feel those arms and chest working! This is where change happens!",
  "You've got more in you than you think! Keep pushing!",
  "This is your time to shine! Show those push-ups who's boss!",
  "Quality over quantity - your form is spot on! Keep going!"
]

### Exercise 4: Mountain Climbers
- exercise_type: "cardio"
- sets: 3
- duration_per_set: 30
- intensity: "high"
- rest_between_sets: 10
- timing: "11:00 - 11:40"

**[VOICE]**: "Mountain climbers! Drive those knees with power!"
**[VOICE_MOTIVATION]**: [
  "You're on fire! Keep those knees driving!",
  "This is cardio and core combined - you're doubly awesome!",
  "Fast feet, strong core - you're in the zone!",
  "Halfway point - you're absolutely crushing it!",
  "Your determination is inspiring! Don't stop now!"
]

## Circuit 3: Core Strength
- rounds: 3
- work_duration: 40
- rest_duration: 20

**[VOICE_START]**: "Core circuit coming up. Stay focused on form!"

### Exercise 5: Plank Hold
- exercise_type: "isometric"
- sets: 3
- duration_per_set: 40
- rest_between_sets: 20
- timing: "15:00 - 15:40"
- form_cues:
  - "forearms flat"
  - "shoulders over elbows"
  - "neutral spine"

**[VOICE]**: "Plank position. Engage your core and hold strong!"
**[VOICE_FORM]**: "Keep your hips in line with shoulders."
**[VOICE_MOTIVATION]**: [
  "Your core is solid as a rock! Hold it there!",
  "This plank is building your foundation! Stay strong!",
  "Breathe through it - you're showing incredible strength!",
  "Time is ticking but you're not budging! Amazing control!",
  "Your form is perfect - that's the way to build real strength!"
]

### Exercise 6: Russian Twists
- exercise_type: "strength"
- sets: 3
- reps_per_set: 20
- tempo: "1-0-1-0"
- rest_between_sets: 20
- timing: "16:00 - 16:40"
- form_cues:
  - "feet lifted"
  - "lean back slightly"

**[VOICE]**: "Russian twists. Control the movement."
**[VOICE_MOTIVATION]**: [
  "Those obliques are getting stronger with every twist!",
  "Control and power - you've got both! Keep it up!",
  "Your core is on fire but you're not stopping!",
  "Each twist sculpts your waistline! You've got this!",
  "The burn means it's working! Embrace it!"
]

## Circuit 4: Final Push
- rounds: 3
- work_duration: 40
- rest_duration: 20

**[VOICE_START]**: "Final circuit! Give it everything you've got!"

### Exercise 7: Burpees
- exercise_type: "compound"
- sets: 3
- reps_per_set: 10
- tempo: "1-0-1-0"
- rest_between_sets: 20
- modifications: "step-back option"
- timing: "20:00 - 20:40"

**[VOICE]**: "Burpees - last push! Modify if needed but keep moving!"
**[VOICE_MOTIVATION]**: [
  "This is your final challenge - show it what you're made of!",
  "You're so close to the finish line! Push through!",
  "Your strength is incredible - dig deep for these last ones!",
  "This is where champions are made! Don't give up!",
  "You've come too far to stop now! Give it all you've got!"
]

### Exercise 8: Mountain Climbers
- exercise_type: "cardio"
- sets: 3
- duration_per_set: 30
- intensity: "maximum"
- rest_between_sets: 10
- timing: "21:00 - 21:40"

**[VOICE]**: "Final exercise! Mountain climbers at maximum pace!"
**[VOICE_MOTIVATION]**: [
  "Last exercise of the day - empty the tank!",
  "You're almost there! Make these count!",
  "Show me what you've got! Finish strong!",
  "This is your moment to shine! All out effort!",
  "Your dedication is inspiring! Push to the finish!"
]

# Cool Down Phase
duration: 5 minutes

## Static Stretches
- duration: 5
- hold_time: 30 seconds each

**[VOICE_START]**: "Excellent work! Let's cool down with some stretches."

### Stretch 1: Quad Stretch
- exercise_type: "static_stretch"
- duration: 30
- side: "each_leg"
- timing: "25:00 - 26:00"

**[VOICE]**: "Hold each quad stretch for thirty seconds. Breathe deeply."

### Stretch 2: Hamstring Stretch
- exercise_type: "static_stretch"
- duration: 30
- side: "each_leg"
- timing: "26:00 - 27:00"

**[VOICE]**: "Gentle hamstring stretch now. Don't bounce, just hold."

### Stretch 3: Child's Pose
- exercise_type: "static_stretch"
- duration: 60
- timing: "27:00 - 28:00"

**[VOICE]**: "Move into child's pose. Let your breathing return to normal."

### Stretch 4: Final Relaxation
- exercise_type: "relaxation"
- duration: 60
- timing: "28:00 - 29:00"

**[VOICE]**: "Last minute to relax. Great job on completing your workout!"

**[VOICE_END]**: [
  "You absolutely crushed it today! This workout was intense, and you showed up with everything you had!",
  "Your dedication and effort were outstanding! Remember to stay hydrated and get some good rest.",
  "You should feel incredibly proud of what you accomplished today!",
  "Each workout makes you stronger, and today you proved just how strong you are!",
  "Can't wait to see you crush it again next time! Great work!"
]
"

Please create a complete workout plan document following this exact format for a ${length}-minute ${type} workout.
`;

  try {
    // Make request to Gemini API
    console.log('Making request to Gemini API for workout generation...');
    
    // Using Gemini 2.0 Flash model
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 4096, // Reduced from 8192 to reduce generation time
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });

      let errorMessage = `Failed to generate workout plan: ${response.status} ${response.statusText}`;
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error?.message) {
          errorMessage += ` - ${errorData.error.message}`;
        }
      } catch (e) {
        if (errorText) {
          errorMessage += ` - ${errorText}`;
        }
      }

      throw new Error(errorMessage);
    }

    const data = await response.json() as GeminiResponse;
    console.log('Successfully received response from Gemini API');

    // Validate the response structure
    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      console.error('Unexpected Gemini API response structure:', data);
      throw new Error('Gemini API returned an unexpected response structure');
    }

    // Extract the workout plan from the response
    const workoutPlan = data.candidates[0].content.parts[0].text;
    
    // Log a summary of the generated plan
    console.log('Generated workout plan with Gemini:', {
      type,
      length,
      contentLength: workoutPlan.length
    });

    return workoutPlan;
  } catch (error) {
    console.error('Error generating workout plan with Gemini:', error);
    
    // Fallback to basic plan if Gemini API fails
    console.log('Falling back to basic workout plan template...');
    return generateBasicWorkoutPlan(type, length);
  }
}

// Fallback function that generates a basic workout plan without using AI
function generateBasicWorkoutPlan(type: string, length: number): string {
  console.log('Generating basic fallback workout plan:', { type, length });
  
  const warmupDuration = Math.round(length * 0.15); // 15% of total time
  const cooldownDuration = Math.round(length * 0.15); // 15% of total time
  const mainWorkoutDuration = length - (warmupDuration + cooldownDuration);

  // Create a basic workout plan
  const workoutPlan = `---
title: "${length}-Minute ${type.charAt(0).toUpperCase() + type.slice(1)} Workout"
duration: ${length}
phases:
  - name: "Warm-up"
    duration: ${warmupDuration}
  - name: "Main Workout"
    duration: ${mainWorkoutDuration}
  - name: "Cool Down"
    duration: ${cooldownDuration}
---

# Warm-up Phase
duration: ${warmupDuration} minutes

**[VOICE_START]**: "Welcome to your ${length}-minute ${type.toLowerCase()} workout! Let's start with a proper warm-up."

### Exercise 1: Dynamic Stretches
- exercise_type: "warm_up"
- duration: ${Math.round(warmupDuration * 0.5)}
- sets: 1

**[VOICE]**: "Let's begin with some dynamic stretches to get your body ready."

# Main Workout Phase
duration: ${mainWorkoutDuration} minutes
circuits: 3

**[VOICE_START]**: "Now for the main workout. We'll focus on ${type.toLowerCase()} exercises."

### Exercise 1: ${type.charAt(0).toUpperCase() + type.slice(1)} Focus
- exercise_type: "strength"
- sets: 3
- reps: 12
- duration: ${Math.round(mainWorkoutDuration / 3)}

**[VOICE]**: "Starting our main ${type.toLowerCase()} exercises. Focus on proper form."

# Cool Down Phase
duration: ${cooldownDuration} minutes

**[VOICE_START]**: "Great work! Let's cool down properly."

### Exercise 1: Static Stretches
- exercise_type: "cool_down"
- duration: ${cooldownDuration}
- hold_time: 30

**[VOICE]**: "Time to stretch and let your body recover."

**[VOICE_END]**: "Excellent work completing your ${type.toLowerCase()} workout! You should be proud of your effort today!"`;

  return workoutPlan;
}