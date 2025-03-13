import { useState, useEffect, useCallback, useRef } from 'react';
import { synthesizeSpeech } from '@/lib/elevenlabs';
import { workoutParser, type Workout, type Exercise, type Phase } from '@/lib/workoutParser';
import { useToast } from '@/components/ui/use-toast';

export interface WorkoutAudioConfig {
  apiKey: string;
  voiceId: string;
  onError?: (error: Error) => void;
  audioElement?: HTMLAudioElement | null;
}

interface AudioState {
  isPlaying: boolean;
  currentPhase: number;
  currentExercise: number;
  currentCircuit: number;
}

export function useWorkoutAudio(workoutContent: string, config: WorkoutAudioConfig) {
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [audioState, setAudioState] = useState<AudioState>({
    isPlaying: false,
    currentPhase: 0,
    currentExercise: 0,
    currentCircuit: 0
  });
  
  // Refs to ensure we're using latest values in callbacks
  const workoutRef = useRef<Workout | null>(null);
  const audioStateRef = useRef({...audioState});
  const { toast } = useToast();
  
  // Audio playback management
  const audioQueueRef = useRef<{text: string, type: string}[]>([]);
  const isPlayingAudioRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Debug logging
  const logWorkoutProgress = useCallback(() => {
    if (!workoutRef.current) return;
    
    const state = audioStateRef.current;
    const phase = workoutRef.current.phases[state.currentPhase];
    const exercise = phase?.exercises?.[state.currentExercise];
    
    console.log('Workout progress:', {
      title: workoutRef.current.title,
      currentPhase: `${state.currentPhase + 1}/${workoutRef.current.phases.length} (${phase?.name})`,
      currentExercise: exercise ? `${state.currentExercise + 1}/${phase?.exercises?.length} (${exercise.name})` : 'None',
      currentCircuit: `${state.currentCircuit + 1}/${phase?.circuits || 1}`,
      isPlaying: state.isPlaying
    });
  }, []);
  
  // Parse workout content on change
  useEffect(() => {
    if (!workoutContent || workoutContent.length < 10) return;
    
    console.log('New workout content received:', {
      contentLength: workoutContent.length,
      preview: workoutContent.slice(0, 100) + '...'
    });
    
    try {
      // Clean up any existing playback
      if (audioStateRef.current.isPlaying) {
        stopPlayback();
      }
      
      // Parse the workout
      const parsedWorkout = workoutParser.parse(workoutContent);
      console.log('Workout parsed successfully:', {
        title: parsedWorkout.title,
        phases: parsedWorkout.phases.map(p => p.name),
        totalExercises: parsedWorkout.phases.reduce((sum, p) => sum + (p.exercises?.length || 0), 0)
      });
      
      // Update refs and state
      workoutRef.current = parsedWorkout;
      setWorkout(parsedWorkout);
      
      // Reset state
      const initialState = {
        isPlaying: false,
        currentPhase: 0,
        currentExercise: 0,
        currentCircuit: 0
      };
      audioStateRef.current = initialState;
      setAudioState(initialState);
      
      // Clear any queued audio
      audioQueueRef.current = [];
      isPlayingAudioRef.current = false;
      
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      
    } catch (error) {
      console.error('Failed to parse workout:', error);
      toast({
        title: "Error",
        description: "Could not parse workout plan",
        variant: "destructive"
      });
    }
  }, [workoutContent, toast]);
  
  // Update ref when state changes
  useEffect(() => {
    audioStateRef.current = audioState;
  }, [audioState]);
  
  // Speech synthesis function
  const speakText = useCallback(async (text: string): Promise<void> => {
    if (!config.apiKey || !config.voiceId) {
      console.error('Missing API key or voice ID');
      return;
    }
    
    console.log('Speaking:', text.slice(0, 30) + (text.length > 30 ? '...' : ''));
    
    try {
      const audioBlob = await synthesizeSpeech(text, {
        apiKey: config.apiKey,
        voiceId: config.voiceId
      });
      
      const audio = config.audioElement || new Audio();
      const url = URL.createObjectURL(audioBlob);
      
      return new Promise((resolve, reject) => {
        const handleEnded = () => {
          URL.revokeObjectURL(url);
          audio.removeEventListener('ended', handleEnded);
          audio.removeEventListener('error', handleError);
          resolve();
        };
        
        const handleError = () => {
          URL.revokeObjectURL(url);
          audio.removeEventListener('ended', handleEnded);
          audio.removeEventListener('error', handleError);
          reject(new Error('Audio playback failed'));
        };
        
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('error', handleError);
        audio.src = url;
        audio.play().catch(reject);
      });
    } catch (error) {
      console.error('Speech synthesis failed:', error);
      throw error;
    }
  }, [config.apiKey, config.voiceId, config.audioElement]);
  
  // Queue audio processing
  const processAudioQueue = useCallback(async () => {
    if (isPlayingAudioRef.current || audioQueueRef.current.length === 0 || !audioStateRef.current.isPlaying) {
      return;
    }
    
    isPlayingAudioRef.current = true;
    
    try {
      const item = audioQueueRef.current.shift();
      if (item) {
        console.log(`Playing ${item.type} audio:`, item.text.slice(0, 30) + (item.text.length > 30 ? '...' : ''));
        await speakText(item.text);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      if (config.onError) config.onError(error as Error);
    } finally {
      isPlayingAudioRef.current = false;
      
      // Process next item if available and still playing
      if (audioQueueRef.current.length > 0 && audioStateRef.current.isPlaying) {
        setTimeout(processAudioQueue, 100);
      }
    }
  }, [speakText, config.onError]);
  
  // Add audio to queue
  const queueAudio = useCallback((text: string, type: string) => {
    if (!text) return;
    
    console.log(`Queueing ${type} audio:`, text.slice(0, 30) + (text.length > 30 ? '...' : ''));
    audioQueueRef.current.push({ text, type });
    
    // Start processing queue if not already processing
    if (!isPlayingAudioRef.current && audioStateRef.current.isPlaying) {
      processAudioQueue();
    }
  }, [processAudioQueue]);
  
  // Queue exercise instructions
  const queueExerciseInstructions = useCallback((exercise: Exercise) => {
    if (!exercise || !exercise.voiceInstructions) {
      console.warn('No voice instructions for exercise:', exercise?.name || 'unknown');
      return;
    }
    
    console.log('Queueing instructions for exercise:', exercise.name);
    
    if (exercise.voiceInstructions.start) {
      queueAudio(exercise.voiceInstructions.start, 'start');
    }
    
    if (exercise.voiceInstructions.main) {
      queueAudio(exercise.voiceInstructions.main, 'main');
    }
    
    if (exercise.voiceInstructions.form) {
      queueAudio(exercise.voiceInstructions.form, 'form');
    }
    
    if (exercise.voiceInstructions.count) {
      queueAudio(exercise.voiceInstructions.count, 'count');
    }
    
    if (exercise.voiceInstructions.motivation && exercise.voiceInstructions.motivation.length > 0) {
      const randomIndex = Math.floor(Math.random() * exercise.voiceInstructions.motivation.length);
      const motivationText = exercise.voiceInstructions.motivation[randomIndex];
      queueAudio(motivationText, 'motivation');
    }
  }, [queueAudio]);
  
  // Get current exercise based on state
  const getCurrentExercise = useCallback((): Exercise | null => {
    if (!workoutRef.current) return null;
    
    const state = audioStateRef.current;
    const phase = workoutRef.current.phases[state.currentPhase];
    
    if (!phase || !phase.exercises || phase.exercises.length === 0) {
      return null;
    }
    
    return phase.exercises[state.currentExercise] || null;
  }, []);
  
  // Move to next exercise
  const moveToNextExercise = useCallback(() => {
    if (!workoutRef.current || !audioStateRef.current.isPlaying) return;
    
    const workout = workoutRef.current;
    const state = {...audioStateRef.current};
    const phase = workout.phases[state.currentPhase];
    
    if (!phase || !phase.exercises) {
      console.error('Invalid phase or no exercises');
      return null;
    }
    
    // Calculate max values for current phase
    const maxExercises = phase.exercises.length;
    const maxCircuits = phase.circuits || 1;
    
    // Determine if at last position of each group
    const isLastExercise = state.currentExercise >= maxExercises - 1;
    const isLastCircuit = state.currentCircuit >= maxCircuits - 1;
    const isLastPhase = state.currentPhase >= workout.phases.length - 1;
    
    console.log('Current position:', {
      phase: state.currentPhase + 1,
      exercise: state.currentExercise + 1,
      circuit: state.currentCircuit + 1,
      isLastExercise,
      isLastCircuit,
      isLastPhase
    });
    
    // Move to next exercise/circuit/phase
    if (!isLastExercise) {
      // Next exercise in same phase/circuit
      state.currentExercise++;
      
      console.log(`Moving to next exercise: ${state.currentExercise + 1}/${maxExercises}`);
    } else if (!isLastCircuit) {
      // Reset to first exercise in next circuit
      state.currentExercise = 0;
      state.currentCircuit++;
      
      console.log(`Moving to next circuit: ${state.currentCircuit + 1}/${maxCircuits}`);
      queueAudio(`Starting circuit ${state.currentCircuit + 1}`, 'circuit');
    } else if (!isLastPhase) {
      // Move to next phase
      state.currentPhase++;
      state.currentExercise = 0;
      state.currentCircuit = 0;
      
      const nextPhase = workout.phases[state.currentPhase];
      console.log(`Moving to next phase: ${nextPhase.name}`);
      
      if (nextPhase.voiceInstructions?.start) {
        queueAudio(nextPhase.voiceInstructions.start, 'phase-start');
      }
    } else {
      // Workout complete
      console.log('Workout complete');
      
      if (phase.voiceInstructions?.end) {
        queueAudio(phase.voiceInstructions.end, 'workout-end');
      }
      
      stopPlayback();
      return;
    }
    
    // Update state
    audioStateRef.current = state;
    setAudioState(state);
    
    // Queue instructions for the new exercise
    const exercise = workout.phases[state.currentPhase]?.exercises?.[state.currentExercise];
    if (exercise) {
      queueExerciseInstructions(exercise);
      
      // Set timer for auto-progression if exercise has duration
      if (exercise.duration) {
        const durationMs = exercise.duration * 1000;
        
        console.log(`Setting timer for ${exercise.name}: ${durationMs}ms`);
        
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        
        timerRef.current = setTimeout(() => {
          console.log(`Exercise timer completed: ${exercise.name}`);
          
          if (exercise.voiceInstructions?.end) {
            queueAudio(exercise.voiceInstructions.end, 'exercise-end');
          }
          
          // Make sure we have a small delay before moving to the next exercise
          setTimeout(() => {
            if (audioStateRef.current.isPlaying) {
              moveToNextExercise();
            }
          }, 1000);
          
        }, durationMs + 1000); // Add a buffer
      }
    }
  }, [queueAudio, queueExerciseInstructions]);
  
  // Start workout playback
  const startPlayback = useCallback(() => {
    if (!workoutRef.current) {
      console.error('No workout loaded');
      return;
    }
    
    console.log('Starting workout:', workoutRef.current.title);
    
    // Clear any existing playback state
    audioQueueRef.current = [];
    isPlayingAudioRef.current = false;
    
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    // Reset to beginning
    const initialState = {
      isPlaying: true,
      currentPhase: 0,
      currentExercise: 0,
      currentCircuit: 0
    };
    
    audioStateRef.current = initialState;
    setAudioState(initialState);
    
    const firstPhase = workoutRef.current.phases[0];
    
    // Start by playing the introduction for the first phase
    if (firstPhase?.voiceInstructions?.start) {
      queueAudio(firstPhase.voiceInstructions.start, 'phase-start');
    }
    
    // Queue first exercise instructions
    const firstExercise = firstPhase?.exercises?.[0];
    if (firstExercise) {
      queueExerciseInstructions(firstExercise);
      
      // Set timer for auto-progression if the exercise has a duration
      if (firstExercise.duration) {
        const durationMs = firstExercise.duration * 1000;
        
        console.log(`Setting timer for first exercise: ${durationMs}ms`);
        
        timerRef.current = setTimeout(() => {
          console.log('First exercise completed');
          
          if (firstExercise.voiceInstructions?.end) {
            queueAudio(firstExercise.voiceInstructions.end, 'exercise-end');
          }
          
          // Move to next exercise after a small delay
          setTimeout(() => {
            if (audioStateRef.current.isPlaying) {
              moveToNextExercise();
            }
          }, 1000);
          
        }, durationMs + 1000); // Add buffer for smoother transition
      }
    }
    
    // Log current state
    logWorkoutProgress();
  }, [queueAudio, queueExerciseInstructions, moveToNextExercise, logWorkoutProgress]);
  
  // Stop workout playback
  const stopPlayback = useCallback(() => {
    console.log('Stopping workout playback');
    
    // Clear queue and timers
    audioQueueRef.current = [];
    isPlayingAudioRef.current = false;
    
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    // Update state
    audioStateRef.current.isPlaying = false;
    setAudioState(prev => ({ ...prev, isPlaying: false }));
    
    // Stop any playing audio
    if (config.audioElement) {
      config.audioElement.pause();
      config.audioElement.currentTime = 0;
    }
  }, [config.audioElement]);
  
  // Process queue when state changes
  useEffect(() => {
    if (audioState.isPlaying && !isPlayingAudioRef.current && audioQueueRef.current.length > 0) {
      processAudioQueue();
    }
  }, [audioState.isPlaying, processAudioQueue]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      
      // Stop any playing audio
      if (config.audioElement) {
        config.audioElement.pause();
      }
    };
  }, [config.audioElement]);
  
  // Calculate progress percentage
  const calculateProgress = useCallback(() => {
    if (!workoutRef.current) return 0;
    
    const state = audioStateRef.current;
    const workout = workoutRef.current;
    
    // Simple calculation: current phase / total phases
    return state.currentPhase / workout.phases.length;
  }, []);
  
  // Move to next phase (skip to next phase)
  const moveToNextPhase = useCallback(() => {
    if (!workoutRef.current || !audioStateRef.current.isPlaying) return;
    
    const workout = workoutRef.current;
    const state = {...audioStateRef.current};
    
    // Check if we're already at the last phase
    if (state.currentPhase >= workout.phases.length - 1) {
      console.log('Already at last phase');
      return;
    }
    
    // Move to next phase
    state.currentPhase++;
    state.currentExercise = 0;
    state.currentCircuit = 0;
    
    console.log(`Skipping to next phase: ${workout.phases[state.currentPhase].name}`);
    
    // Update state
    audioStateRef.current = state;
    setAudioState(state);
    
    // Clear any existing timers and queues
    audioQueueRef.current = [];
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    // Queue phase start instructions if available
    const nextPhase = workout.phases[state.currentPhase];
    if (nextPhase.voiceInstructions?.start) {
      queueAudio(nextPhase.voiceInstructions.start, 'phase-start');
    }
    
    // Set up first exercise of the new phase
    const firstExercise = nextPhase.exercises?.[0];
    if (firstExercise) {
      queueExerciseInstructions(firstExercise);
    }
  }, [queueAudio, queueExerciseInstructions]);

  return {
    isPlaying: audioState.isPlaying,
    currentPhase: audioState.currentPhase,
    currentExercise: getCurrentExercise(),
    currentCircuit: audioState.currentCircuit,
    progress: calculateProgress(),
    totalPhases: workoutRef.current?.phases.length || 0,
    start: startPlayback,
    stop: stopPlayback,
    nextExercise: moveToNextExercise,
    nextPhase: moveToNextPhase
  };
}
