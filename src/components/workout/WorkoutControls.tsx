import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

interface WorkoutControlsProps {
  isReady: boolean;
  isRunning: boolean;
  isGenerating: boolean;
  generationProgress?: number;
  onGenerate: () => void;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
}

export function WorkoutControls({
  isReady,
  isRunning,
  isGenerating,
  generationProgress = 0,
  onGenerate,
  onStart,
  onPause,
  onReset,
}: WorkoutControlsProps) {
  return (
    <div className="flex flex-col space-y-2">
      <div className="space-y-2">
        <Button
          onClick={onGenerate}
          disabled={isGenerating || isRunning}
          className="w-full relative"
        >
          {isGenerating ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating Audio Files...
            </span>
          ) : (
            "Generate Audio Files"
          )}
        </Button>
        {isGenerating && (
          <div className="space-y-1">
            <Progress value={generationProgress} className="h-2" />
            <p className="text-xs text-center text-muted-foreground">
              {Math.round(generationProgress)}% complete
            </p>
          </div>
        )}
      </div>
      <div className="flex space-x-2">
        <Button
          onClick={onStart}
          disabled={!isReady || isRunning}
          className="flex-1"
        >
          Start
        </Button>
        <Button
          onClick={onPause}
          disabled={!isRunning}
          variant="outline"
          className="flex-1"
        >
          Pause
        </Button>
        <Button
          onClick={onReset}
          variant="outline"
          disabled={isGenerating}
          className="flex-1"
        >
          Reset
        </Button>
      </div>
    </div>
  );
}
