
import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getMotivationalMessage, getWorkout, getExerciseConfig } from "@/lib/motivationalMessages";
import { WorkoutControls } from "./workout/WorkoutControls";
import { WorkoutDisplay } from "./workout/WorkoutDisplay";
import { WorkoutHeader } from "./workout/WorkoutHeader";
import { useWorkoutAudio } from "@/hooks/useWorkoutAudio";

export function Timer() {
  // State declarations
  const [currentNumber, setCurrentNumber] = useState<number>(10);
  const [isRunning, setIsRunning] = useState(false);
  const [interval, setInterval] = useState<number>(3);
  const [selectedVoice, setSelectedVoice] = useState<string>("9BWtsMINqrJLrRacOk9x");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [currentMotivation, setCurrentMotivation] = useState<string>("");
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [workout] = useState(getWorkout());
  const timerRef = useRef<number>();
  const { user, isAuthEnabled } = useAuth();
  const { audioMapRef, motivationAudioMapRef, audioRef, motivationAudioRef, generateAudioFiles } = useWorkoutAudio();

  const { data: userSettings } = useQuery({
    queryKey: ["userSettings", user?.id],
    queryFn: async () => {
      if (!user || !isAuthEnabled) return null;
      const { data, error } = await supabase
        .from("user_settings")
        .select("eleven_labs_key")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user && isAuthEnabled,
  });

  // Cleanup function
  const cleanup = useCallback(() => {
    // Stop any playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    if (motivationAudioRef.current) {
      motivationAudioRef.current.pause();
      motivationAudioRef.current.src = '';
    }

    // Revoke all object URLs
    Array.from(audioMapRef.current.values()).forEach(URL.revokeObjectURL);
    Array.from(motivationAudioMapRef.current.values()).forEach(URL.revokeObjectURL);

    // Clear maps
    audioMapRef.current.clear();
    motivationAudioMapRef.current.clear();

    // Reset states
    setIsReady(false);
    setIsGenerating(false);
    setGenerationProgress(0);
  }, []);

  // Handle voice changes
  const handleVoiceChange = useCallback((newVoice: string) => {
    if (isRunning) {
      toast.error("Please stop the workout before changing voices");
      return;
    }
    
    if (isGenerating) {
      toast.error("Please wait for current generation to complete");
      return;
    }

    cleanup();
    setSelectedVoice(newVoice);
    toast.info("Voice changed. Please generate new audio files.");
  }, [cleanup, isRunning, isGenerating]);

  const currentExercise = workout[currentExerciseIndex];

  const generateMotivation = async (repNumber: number) => {
    const message = getMotivationalMessage(currentExercise.id, repNumber, currentExercise.reps);
    setCurrentMotivation(message);
    return message;
  };

  const moveToNextExercise = () => {
    if (currentExerciseIndex < workout.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
      const nextExercise = workout[currentExerciseIndex + 1];
      setCurrentNumber(nextExercise.reps);
      setInterval(nextExercise.duration);
      
      // Play the start message for the next exercise
      const startMessage = getExerciseConfig(nextExercise.id).start;
      const startMotivationUrl = motivationAudioMapRef.current.get('start_' + nextExercise.id);
      if (startMotivationUrl) {
        motivationAudioRef.current.src = startMotivationUrl;
        motivationAudioRef.current.play();
      }
    } else {
      // Workout complete
      setIsRunning(false);
      const finalMessage = "Congratulations! You've completed the entire workout!";
      toast.success(finalMessage);
      const finalAudioUrl = motivationAudioMapRef.current.get('workout_complete');
      if (finalAudioUrl) {
        motivationAudioRef.current.src = finalAudioUrl;
        motivationAudioRef.current.play();
      }
    }
  };

  const handleStart = async () => {
    if (!isReady) {
      toast.error("Please generate the audio files first");
      return;
    }
    
    const config = getExerciseConfig(currentExercise.id);
    setCurrentNumber(currentExercise.reps);
    
    // Play start message first
    const startMotivationUrl = motivationAudioMapRef.current.get('start_' + currentExercise.id);
    if (startMotivationUrl) {
      motivationAudioRef.current.src = startMotivationUrl;
      await motivationAudioRef.current.play();
      
      // Only start the countdown after the start message finishes
      motivationAudioRef.current.onended = () => {
        setIsRunning(true);
        generateMotivation(currentExercise.reps);
      };
    } else {
      setIsRunning(true);
      generateMotivation(currentExercise.reps);
    }
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setCurrentExerciseIndex(0);
    const firstExercise = workout[0];
    setCurrentNumber(firstExercise.reps);
    setInterval(firstExercise.duration);
    setCurrentMotivation("");
    audioRef.current.pause();
    motivationAudioRef.current.pause();
  };

  const calculateTotalAudioFiles = (workout: any[]) => {
    let total = 0;
    workout.forEach(exercise => {
      // Count number audio files
      total += exercise.reps;
      // Count start and end messages
      total += 2;
      // Count motivation messages (every third rep and last rep)
      total += Math.floor(exercise.reps / 3) + 1;
    });
    // Add workout complete message
    total += 1;
    return total;
  };

  const handleGenerate = async () => {
    const apiKey = isAuthEnabled && user ? userSettings?.eleven_labs_key : import.meta.env.VITE_ELEVENLABS_API_KEY;
    if (!apiKey) {
      toast.error("Please set your ElevenLabs API key");
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    const totalFiles = calculateTotalAudioFiles(workout);
    let generatedFiles = 0;

    try {
      await generateAudioFiles(workout, selectedVoice, apiKey, (progress) => {
        generatedFiles++;
        setGenerationProgress((generatedFiles / totalFiles) * 100);
      });
      setIsReady(true);
      toast.success("Audio files generated successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate audio files. Please try again.");
      cleanup();
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  useEffect(() => {
    const exercise = workout[currentExerciseIndex];
    setInterval(exercise.duration);
    setCurrentNumber(exercise.reps);
  }, [currentExerciseIndex, workout]);

  useEffect(() => {
    if (isRunning && currentNumber > 0) {
      const playCurrentNumber = async () => {
        const audioUrl = audioMapRef.current.get(currentNumber);
        if (audioUrl) {
          // Play the number
          audioRef.current.src = audioUrl;
          await audioRef.current.play();

          // If it's every third number or the last one, play the motivation after the number
          const motivationUrl = motivationAudioMapRef.current.get(
            `${currentExercise.id}_${currentNumber}`
          );
          
          if (motivationUrl) {
            audioRef.current.onended = async () => {
              motivationAudioRef.current.src = motivationUrl;
              await motivationAudioRef.current.play();
              
              // Only decrease the counter after motivation message finishes
              motivationAudioRef.current.onended = () => {
                setCurrentNumber((prev) => prev - 1);
              };
            };
          } else {
            // If no motivation message, decrease counter immediately after number
            audioRef.current.onended = () => {
              setCurrentNumber((prev) => prev - 1);
            };
          }

          const motivation = await generateMotivation(currentNumber);
          if (motivation) {
            toast.info(`${currentNumber} - ${motivation}`);
          }
        } else {
          setCurrentNumber((prev) => prev - 1);
        }
      };

      timerRef.current = window.setTimeout(playCurrentNumber, interval * 1000);
    } else if (currentNumber === 0) {
      // Play the end message for current exercise
      const endMotivationUrl = motivationAudioMapRef.current.get('end_' + currentExercise.id);
      if (endMotivationUrl) {
        motivationAudioRef.current.src = endMotivationUrl;
        motivationAudioRef.current.play();
        motivationAudioRef.current.onended = () => {
          moveToNextExercise();
        };
      } else {
        moveToNextExercise();
      }
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isRunning, currentNumber, interval, currentExercise]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-lg space-y-6 max-w-md w-full mx-4">
        <WorkoutHeader
          currentExercise={currentExercise}
          currentExerciseIndex={currentExerciseIndex}
          totalExercises={workout.length}
          interval={interval}
          selectedVoice={selectedVoice}
          isGenerating={isGenerating}
          isRunning={isRunning}
          onIntervalChange={setInterval}
          onVoiceChange={handleVoiceChange}
        />

        <div className="space-y-4">
          <WorkoutDisplay
            currentNumber={currentNumber}
            totalReps={currentExercise.reps}
            currentMotivation={currentMotivation}
          />

          <WorkoutControls
            isReady={isReady}
            isRunning={isRunning}
            isGenerating={isGenerating}
            generationProgress={generationProgress}
            onGenerate={handleGenerate}
            onStart={handleStart}
            onPause={handlePause}
            onReset={handleReset}
          />
        </div>
      </div>
    </div>
  );
}
