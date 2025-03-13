
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VoiceSelect } from "../VoiceSelect";
import type { WorkoutExercise } from "@/lib/motivationalMessages";

interface WorkoutHeaderProps {
  currentExercise: WorkoutExercise;
  currentExerciseIndex: number;
  totalExercises: number;
  interval: number;
  selectedVoice: string;
  isGenerating: boolean;
  isRunning: boolean;
  onIntervalChange: (value: number) => void;
  onVoiceChange: (value: string) => void;
}

export function WorkoutHeader({
  currentExercise,
  currentExerciseIndex,
  totalExercises,
  interval,
  selectedVoice,
  isGenerating,
  isRunning,
  onIntervalChange,
  onVoiceChange,
}: WorkoutHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-gray-800">Workout Timer</h1>
        <Link to="/settings">
          <Button variant="outline" size="sm">
            Settings
          </Button>
        </Link>
      </div>

      <div className="space-y-2">
        <label className="text-sm text-gray-600">Current Exercise</label>
        <div className="text-lg font-medium text-gray-800">
          {currentExercise.name} ({currentExercise.reps} reps)
        </div>
        <div className="text-sm text-gray-600">
          Exercise {currentExerciseIndex + 1} of {totalExercises}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm text-gray-600">Select Voice</label>
        <VoiceSelect
          value={selectedVoice}
          onValueChange={onVoiceChange}
          disabled={isGenerating || isRunning}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm text-gray-600">
          Interval (seconds)
        </label>
        <Input
          type="number"
          min="1"
          value={interval}
          onChange={(e) => onIntervalChange(Number(e.target.value))}
          disabled={isRunning}
          className="w-full"
        />
      </div>
    </div>
  );
}
