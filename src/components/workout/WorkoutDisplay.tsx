
import { Progress } from "@/components/ui/progress";

interface WorkoutDisplayProps {
  currentNumber: number;
  totalReps: number;
  currentMotivation?: string;
}

export function WorkoutDisplay({ currentNumber, totalReps, currentMotivation }: WorkoutDisplayProps) {
  return (
    <div className="relative pt-4">
      <div className="text-6xl font-bold text-center text-gray-800">
        {currentNumber}
      </div>
      <Progress
        value={(currentNumber / totalReps) * 100}
        className="h-2 mt-4"
      />
      {currentMotivation && (
        <div className="text-center mt-4 text-gray-600 italic">
          {currentMotivation}
        </div>
      )}
    </div>
  );
}
