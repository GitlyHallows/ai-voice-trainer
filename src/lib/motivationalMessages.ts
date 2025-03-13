
import { z } from "zod";

export const exerciseSchema = z.object({
  id: z.string(),
  name: z.string(),
  defaultCountdown: z.number(),
  defaultInterval: z.number(),
  start: z.string(),
  during: z.array(z.string()),
  end: z.string(),
});

export type Exercise = z.infer<typeof exerciseSchema>;

export type WorkoutExercise = {
  id: string;
  name: string;
  reps: number;
  duration: number;
};

const DEFAULT_WORKOUT: WorkoutExercise[] = [
  { id: "pushups", name: "Push-ups", reps: 10, duration: 3 },
  { id: "squats", name: "Squats", reps: 15, duration: 3 },
  { id: "situps", name: "Sit-ups", reps: 20, duration: 3 },
  { id: "burpees", name: "Burpees", reps: 8, duration: 3 }
];

export function getWorkout(): WorkoutExercise[] {
  return DEFAULT_WORKOUT;
}

const EXERCISE_CONFIGS: { [key: string]: Exercise } = {
  pushups: {
    id: "pushups",
    name: "Push-ups",
    defaultCountdown: 10,
    defaultInterval: 3,
    start: "Let's start with push-ups! Get in position, hands shoulder-width apart, core tight!",
    during: [
      "Keep your core engaged, straight line from head to heels!",
      "Excellent form! Lower your chest to the ground with control!",
      "You're crushing these push-ups! Keep pushing!",
      "Almost there! Stay strong, maintain that form!",
      "Final reps - give it everything you've got!"
    ],
    end: "Outstanding work on those push-ups! Your upper body is getting stronger!"
  },
  squats: {
    id: "squats",
    name: "Squats",
    defaultCountdown: 15,
    defaultInterval: 3,
    start: "Time for squats! Stand with feet shoulder-width apart, chest proud!",
    during: [
      "Drive through your heels, keep that chest up!",
      "Beautiful depth! Feel those legs working!",
      "Each squat makes you stronger! Keep pushing!",
      "Your form is fantastic! Keep that energy high!",
      "Final squats - show me what you've got!"
    ],
    end: "Phenomenal job on those squats! Your legs are going to thank you tomorrow!"
  },
  situps: {
    id: "situps",
    name: "Sit-ups",
    defaultCountdown: 20,
    defaultInterval: 3,
    start: "Moving to sit-ups! Lie on your back, knees bent, let's strengthen that core!",
    during: [
      "Engage that core! Pull up with control!",
      "You're on fire! Keep that pace going!",
      "Halfway there - your core is getting stronger!",
      "Each rep builds that six-pack! Keep going!",
      "Final push - make these last ones count!"
    ],
    end: "Amazing work on those sit-ups! Your core is going to be rock solid!"
  },
  burpees: {
    id: "burpees",
    name: "Burpees",
    defaultCountdown: 8,
    defaultInterval: 3,
    start: "Last exercise - burpees! This is where champions are made! Ready to bring it home!",
    during: [
      "Full range of motion - make each rep count!",
      "You're absolutely crushing it! Keep that intensity!",
      "This is where you become unstoppable!",
      "Push through the burn - you're almost there!",
      "Final burpees - empty the tank! Give it all you've got!"
    ],
    end: "INCREDIBLE WORK! You've just crushed this workout! You should feel proud!"
  }
};

export function getExerciseConfig(exerciseId: string): Exercise {
  return EXERCISE_CONFIGS[exerciseId] || {
    id: exerciseId,
    name: exerciseId,
    defaultCountdown: 10,
    defaultInterval: 3,
    start: "Let's begin!",
    during: [
      "Keep pushing!",
      "You're doing great!",
      "Stay strong!",
      "Almost there!",
      "Final push!"
    ],
    end: "Great job!"
  };
}

export function getMotivationalMessage(exerciseId: string, currentRep: number, totalReps: number): string {
  const config = getExerciseConfig(exerciseId);
  
  if (currentRep === totalReps) {
    return config.end;
  }

  if (currentRep === 1) {
    return config.start;
  }

  // Calculate which motivational message to use based on progress
  const progress = (totalReps - currentRep) / totalReps;
  const messageIndex = Math.floor(progress * config.during.length);
  return config.during[Math.min(messageIndex, config.during.length - 1)];
}
