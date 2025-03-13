export interface Exercise {
  name: string;
  exerciseType: string;
  sets?: number;
  reps?: number;
  duration?: number;
  timing?: {
    start: string;
    end: string;
  };
  voiceInstructions?: {
    start?: string;
    main?: string;
    form?: string;
    count?: string;
    motivation?: string[];
    end?: string;
  };
  formCues?: string[];
}

export interface Phase {
  name: string;
  duration: number;
  circuits?: number;
  exercises?: Exercise[];
  voiceInstructions?: {
    start?: string;
    end?: string;
  };
}

export interface Workout {
  title: string;
  duration: number;
  phases: Phase[];
}

const parseTimeToSeconds = (timeStr: string): number => {
  const [minutes, seconds] = timeStr.split(':').map(Number);
  return minutes * 60 + seconds;
};

const parseTimingField = (timing: string): { start: string; end: string } => {
  const [start, end] = timing.split('-').map(t => t.trim());
  return { start, end };
};

const extractVoiceInstruction = (line: string, tag: string): string | null => {
  const match = line.match(new RegExp(`\\*\\*\\[${tag}\\]\\*\\*: ?"([^"]+)"`));
  return match ? match[1] : null;
};

class WorkoutParser {
  parse(content: string): Workout {
    console.log('WorkoutParser: Starting to parse content', {
      contentLength: content.length,
      contentPreview: content.slice(0, 100),
      timestamp: new Date().toISOString()
    });

    const lines = content.split('\n');
    console.log('WorkoutParser: Split into lines', {
      lineCount: lines.length,
      firstLine: lines[0],
      lastLine: lines[lines.length - 1],
      hasVoiceInstructions: content.includes('**[VOICE]**:'),
      frontMatterLines: lines.slice(0, 10).join('\n')
    });

    const workout: Workout = {
      title: '',
      duration: 0,
      phases: []
    };

    let currentPhase: Phase | null = null;
    let currentExercise: Exercise | null = null;
    let inYamlFrontMatter = false;
    let phaseCount = 0;
    let exerciseCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Parse phase headers
      if (line.startsWith('# ')) {
        phaseCount++;
        console.log('WorkoutParser: Found phase', {
          phaseNumber: phaseCount,
          phaseName: line.substring(2).trim(),
          lineNumber: i
        });
      }

      // Parse exercise headers
      if (line.startsWith('### ')) {
        exerciseCount++;
        console.log('WorkoutParser: Found exercise', {
          exerciseNumber: exerciseCount,
          exerciseName: line.substring(4).trim(),
          phase: currentPhase?.name,
          lineNumber: i
        });
      }

      // Handle YAML front matter
      if (line === '---') {
        inYamlFrontMatter = !inYamlFrontMatter;
        continue;
      }

      if (inYamlFrontMatter) {
        if (line.startsWith('title:')) {
          workout.title = line.split('title:')[1].trim().replace(/"/g, '');
        }
        if (line.startsWith('duration:')) {
          const duration = parseInt(line.split('duration:')[1].trim());
          if (!isNaN(duration)) {
            workout.duration = duration;
          }
        }
        if (line.startsWith('phases:')) {
          let j = i + 1;
          while (j < lines.length && lines[j].startsWith('  -')) {
            const phaseLine = lines[j].trim();
            if (phaseLine.includes('name:')) {
              const phaseName = phaseLine.split('name:')[1].trim().replace(/"/g, '');
              const durationLine = lines[j + 1]?.trim();
              if (durationLine?.includes('duration:')) {
                const duration = parseInt(durationLine.split('duration:')[1].trim());
                if (!isNaN(duration)) {
                  workout.phases.push({
                    name: phaseName,
                    duration,
                    exercises: []
                  });
                }
              }
              j += 2;
            } else {
              j++;
            }
          }
        }
        continue;
      }

      // Parse phase headers and metadata
      if (line.startsWith('# ')) {
        const phaseName = line.substring(2).split('Phase')[0].trim();
        currentPhase = workout.phases.find(p => p.name === phaseName) || {
          name: phaseName,
          duration: 0,
          exercises: []
        };
        if (!workout.phases.includes(currentPhase)) {
          workout.phases.push(currentPhase);
        }
        
        // Look ahead for phase metadata
        let j = i + 1;
        while (j < lines.length && !lines[j].startsWith('#')) {
          const metaLine = lines[j].trim();
          if (metaLine.startsWith('circuits:')) {
            currentPhase.circuits = parseInt(metaLine.split('circuits:')[1].trim());
          }
          if (metaLine.startsWith('duration:')) {
            const duration = parseInt(metaLine.split('duration:')[1].trim());
            if (!isNaN(duration)) {
              currentPhase.duration = duration;
            }
          }
          j++;
        }
      }

      // Parse phase voice instructions
      if (line.includes('**[VOICE_START]**:') && currentPhase) {
        currentPhase.voiceInstructions = currentPhase.voiceInstructions || {};
        currentPhase.voiceInstructions.start = extractVoiceInstruction(line, 'VOICE_START');
      }
      if (line.includes('**[VOICE_END]**:') && currentPhase) {
        currentPhase.voiceInstructions = currentPhase.voiceInstructions || {};
        
        // Handle array format for VOICE_END
        if (line.includes('[') && line.includes(']')) {
          try {
            // Find the entire array expression, which may span multiple lines
            let arrayText = line.split('**[VOICE_END]**:')[1].trim();
            
            // If the array doesn't end on this line, look ahead
            if (arrayText.includes('[') && !arrayText.endsWith(']')) {
              let j = i + 1;
              while (j < lines.length && !lines[j].includes(']')) {
                arrayText += '\n' + lines[j].trim();
                j++;
              }
              
              // Add the final line with the closing bracket if found
              if (j < lines.length && lines[j].includes(']')) {
                arrayText += '\n' + lines[j].trim();
                i = j; // Update the outer loop counter to skip the processed lines
              }
            }
            
            // Now try to parse the complete array
            const endMessages = JSON.parse(arrayText);
            if (Array.isArray(endMessages) && endMessages.length > 0) {
              currentPhase.voiceInstructions.end = endMessages[0];
            }
          } catch (e) {
            console.error('Failed to parse VOICE_END array:', e);
            // Fallback to extracting as a string if JSON parsing fails
            currentPhase.voiceInstructions.end = "Excellent work completing your workout!";
          }
        } else {
          currentPhase.voiceInstructions.end = extractVoiceInstruction(line, 'VOICE_END');
        }
      }

      // Parse exercise headers
      if (line.startsWith('### ')) {
        if (currentPhase) {
          const exerciseName = line.substring(4).trim();
          currentExercise = {
            name: exerciseName,
            exerciseType: '',
            voiceInstructions: {}
          };
          currentPhase.exercises?.push(currentExercise);
        }
      }

      // Parse exercise details
      if (currentExercise) {
        if (line.includes('exercise_type:')) {
          currentExercise.exerciseType = line.split('exercise_type:')[1].trim().replace(/"/g, '');
        }
        if (line.includes('sets:')) {
          currentExercise.sets = parseInt(line.split('sets:')[1].trim());
        }
        if (line.includes('reps:') || line.includes('reps_per_set:')) {
          const repsStr = line.includes('reps:') ? line.split('reps:')[1] : line.split('reps_per_set:')[1];
          const reps = parseInt(repsStr.trim());
          if (!isNaN(reps)) {
            currentExercise.reps = reps;
          }
        }
        if (line.includes('duration:') || line.includes('duration_per_set:')) {
          const durationStr = line.includes('duration:') ? line.split('duration:')[1] : line.split('duration_per_set:')[1];
          const duration = parseInt(durationStr.trim());
          if (!isNaN(duration)) {
            currentExercise.duration = duration;
          }
        }
        if (line.includes('timing:')) {
          const timing = line.split('timing:')[1].trim().replace(/"/g, '');
          currentExercise.timing = parseTimingField(timing);
        }

        // Parse voice instructions
        if (line.includes('**[VOICE]**:')) {
          currentExercise.voiceInstructions!.main = extractVoiceInstruction(line, 'VOICE');
        }
        if (line.includes('**[VOICE_FORM]**:')) {
          currentExercise.voiceInstructions!.form = extractVoiceInstruction(line, 'VOICE_FORM');
        }
        if (line.includes('**[VOICE_COUNT]**:')) {
          currentExercise.voiceInstructions!.count = extractVoiceInstruction(line, 'VOICE_COUNT');
        }
        if (line.includes('**[VOICE_START]**:')) {
          currentExercise.voiceInstructions!.start = extractVoiceInstruction(line, 'VOICE_START');
        }

        // Parse form cues
        if (line.includes('form_cues:')) {
          currentExercise.formCues = [];
        }
        if (currentExercise.formCues && line.trim().startsWith('- "')) {
          currentExercise.formCues.push(line.trim().replace(/^- "|"$/g, ''));
        }

        // Parse motivation array
        if (line.includes('**[VOICE_MOTIVATION]**:')) {
          try {
            // Find the entire array expression, which may span multiple lines
            let arrayText = line.split('**[VOICE_MOTIVATION]**:')[1].trim();
            
            // If the array doesn't end on this line, look ahead
            if (arrayText.includes('[') && !arrayText.endsWith(']')) {
              let j = i + 1;
              while (j < lines.length && !lines[j].includes(']')) {
                arrayText += '\n' + lines[j].trim();
                j++;
              }
              
              // Add the final line with the closing bracket if found
              if (j < lines.length && lines[j].includes(']')) {
                arrayText += '\n' + lines[j].trim();
                i = j; // Update the outer loop counter to skip the processed lines
              }
            }
            
            // Now try to parse the complete array
            const motivationMessages = JSON.parse(arrayText);
            if (Array.isArray(motivationMessages) && motivationMessages.length > 0) {
              currentExercise.voiceInstructions!.motivation = motivationMessages;
            } else {
              currentExercise.voiceInstructions!.motivation = ["Keep going! You're doing great!"];
            }
          } catch (e) {
            console.error('Failed to parse VOICE_MOTIVATION array:', e);
            // Fallback to a default motivation message
            currentExercise.voiceInstructions!.motivation = ["Keep going! You're doing great!"];
            
            // Try the manual parsing approach as a fallback
            currentExercise.voiceInstructions!.motivation = [];
            let inMotivationArray = true;
            let j = i + 1;
            while (inMotivationArray && j < lines.length) {
              const motivationLine = lines[j].trim();
              if (motivationLine.startsWith('"') && motivationLine.endsWith('",')) {
                currentExercise.voiceInstructions!.motivation!.push(
                  motivationLine.slice(1, -2)
                );
              } else if (motivationLine === ']') {
                inMotivationArray = false;
              }
              j++;
            }
            i = j - 1;  // Update outer loop counter
          }
        }
      }
    }

    // Log the complete parsed workout structure
    console.log('WorkoutParser: Workout structure', {
      title: workout.title,
      totalDuration: workout.duration,
      phaseCount: workout.phases.length,
      phases: workout.phases.map(phase => ({
        name: phase.name,
        duration: phase.duration,
        circuits: phase.circuits,
        exerciseCount: phase.exercises?.length || 0,
        hasVoiceInstructions: !!phase.voiceInstructions,
        exercises: phase.exercises?.map(ex => ({
          name: ex.name,
          type: ex.exerciseType,
          voiceInstructions: {
            hasStart: !!ex.voiceInstructions?.start,
            hasMain: !!ex.voiceInstructions?.main,
            hasForm: !!ex.voiceInstructions?.form,
            hasCount: !!ex.voiceInstructions?.count,
            hasMotivation: !!ex.voiceInstructions?.motivation
          }
        }))
      }))
    });

    return workout;
  }
}

export const workoutParser = new WorkoutParser();