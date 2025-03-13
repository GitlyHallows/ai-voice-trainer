import { useRef, useEffect, useState } from 'react';
import { useWorkoutAudio } from '@/hooks/useWorkoutAudio';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Play, Pause, SkipForward, StopCircle, SkipBack, FastForward } from 'lucide-react';

interface WorkoutPlayerProps {
  workoutContent: string;
  apiKey?: string;
  voiceId?: string;
}

export function WorkoutPlayer({ workoutContent, apiKey, voiceId }: WorkoutPlayerProps) {
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentContent, setCurrentContent] = useState(workoutContent);
  const hasWorkout = currentContent.length > 0;
  const isReady = !!(apiKey && voiceId && hasWorkout);
  const autoStartRef = useRef(false);

  // Initialize workout audio hook
  const {
    isPlaying,
    currentPhase,
    currentExercise,
    currentCircuit,
    start,
    stop,
    nextExercise,
    nextPhase,
    progress,
    totalPhases
  } = useWorkoutAudio(currentContent, {
    apiKey: apiKey || '',
    voiceId: voiceId || '',
    audioElement: audioRef.current,
    onError: (error) => {
      console.error('Workout audio error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle workout content updates
  useEffect(() => {
    if (workoutContent !== currentContent) {
      console.log('WorkoutPlayer: Content change detected', {
        oldLength: currentContent.length,
        newLength: workoutContent.length,
        oldPreview: currentContent.slice(0, 50),
        newPreview: workoutContent.slice(0, 50),
        timestamp: new Date().toISOString()
      });
      
      setCurrentContent(workoutContent);
      
      if (isPlaying) {
        stop();
      }
      
      // Don't auto-start when new content is received
      // The user should explicitly start the workout
      autoStartRef.current = false;
      
      toast({
        title: "Workout Updated",
        description: "New workout plan loaded. Ready to start.",
      });
    }
  }, [workoutContent, currentContent, isPlaying, stop, toast]);

  // Listen for voice chat disconnection events to auto-start workout
  useEffect(() => {
    const handleVoiceChatDisconnect = () => {
      console.log('VoiceChat disconnected, attempting auto-start if workout is ready');
      
      if (isReady && !isPlaying && autoStartRef.current) {
        console.log('Auto-starting workout playback');
        setTimeout(() => {
          start();
          autoStartRef.current = false;
        }, 1000); // Small delay to ensure everything is ready
      }
    };

    window.addEventListener('voiceChatDisconnect', handleVoiceChatDisconnect);
    
    return () => {
      window.removeEventListener('voiceChatDisconnect', handleVoiceChatDisconnect);
    };
  }, [isReady, isPlaying, start]);

  // Do not auto-start when content changes - removed auto-start logic to prevent
  // unwanted disconnection after workout plan generation
  // The user must explicitly start the workout either by saying "I'm ready"
  // to the voice agent or by pressing the play button

  const handlePauseResume = () => {
    if (isPlaying) {
      stop();
    } else {
      start();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Workout Player</h2>
        
        {!hasWorkout && (
          <div className="text-sm text-muted-foreground">
            Start a conversation to generate a workout plan
          </div>
        )}
        
        {/* Progress indicator */}
        {hasWorkout && (
          <div className="text-sm text-muted-foreground">
            Phase {currentPhase + 1}/{totalPhases} • {Math.round(progress * 100)}%
          </div>
        )}
      </div>

      {/* Enhanced control buttons */}
      <div className="flex justify-center items-center space-x-4 my-4">
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-full"
          onClick={stop}
          disabled={!isReady || !isPlaying}
          title="Stop"
        >
          <StopCircle className="h-5 w-5" />
        </Button>
        
        <Button
          variant="default"
          size="lg"
          className={`h-14 w-14 rounded-full ${isPlaying ? 'bg-amber-600 hover:bg-amber-700' : 'bg-green-600 hover:bg-green-700'}`}
          onClick={handlePauseResume}
          disabled={!isReady}
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause className="h-7 w-7" /> : <Play className="h-7 w-7" />}
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-full"
          onClick={nextExercise}
          disabled={!isReady}
          title="Next Exercise"
        >
          <SkipForward className="h-5 w-5" />
        </Button>
        
        <Button
          variant="outline"
          size="icon" 
          className="h-10 w-10 rounded-full"
          onClick={nextPhase}
          disabled={!isReady}
          title="Next Phase"
        >
          <FastForward className="h-5 w-5" />
        </Button>
      </div>

      {/* Audio element */}
      <audio ref={audioRef} className="w-full" controls hidden />

      {/* Current exercise display */}
      {currentExercise && (
        <div className="rounded-lg border p-4 bg-white shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-lg">{currentExercise.name}</h3>
              
              {currentPhase > 0 && currentCircuit >= 0 && (
                <div className="inline-block px-2 py-1 mt-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                  Circuit {currentCircuit + 1}
                </div>
              )}
            </div>
            
            {currentExercise.duration && (
              <div className="text-xl font-mono bg-gray-100 px-3 py-1 rounded-lg">
                {currentExercise.duration}s
              </div>
            )}
          </div>
          
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            <div>
              <p className="font-medium text-gray-700">Type:</p>
              <p>{currentExercise.exerciseType}</p>
            </div>
            
            {currentExercise.sets && (
              <div>
                <p className="font-medium text-gray-700">Sets:</p>
                <p>{currentExercise.sets}</p>
              </div>
            )}
            
            {currentExercise.reps && (
              <div>
                <p className="font-medium text-gray-700">Reps:</p>
                <p>{currentExercise.reps}</p>
              </div>
            )}
            
            {currentExercise.timing && (
              <div>
                <p className="font-medium text-gray-700">Timing:</p>
                <p>{currentExercise.timing.start} - {currentExercise.timing.end}</p>
              </div>
            )}
          </div>
          
          {currentExercise.formCues && currentExercise.formCues.length > 0 && (
            <div className="mt-3 border-t pt-2">
              <p className="font-medium text-gray-700">Form Cues:</p>
              <ul className="list-disc list-inside mt-1">
                {currentExercise.formCues.map((cue, index) => (
                  <li key={index} className="text-sm">{cue}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {!isReady && !hasWorkout && (
        <div className="text-sm text-muted-foreground text-center p-4 bg-gray-50 rounded-lg">
          Please select a voice and provide an API key to start the workout.
        </div>
      )}
    </div>
  );
}
