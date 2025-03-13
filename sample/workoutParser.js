import { parse as parseYAML } from 'yaml';

export class WorkoutParser {
  parse(content) {
    const { metadata, mainContent } = this._splitDocument(content);
    const phases = this._parsePhases(mainContent);

    return {
      metadata: this._parseMetadata(metadata),
      phases
    };
  }

  parseTimeRange(timeString) {
    const [start, end] = timeString.split(' - ').map(time => {
      const [minutes, seconds = '00'] = time.split(':');
      return parseInt(minutes) * 60 + parseInt(seconds);
    });
    return { start, end };
  }

  _splitDocument(content) {
    const matches = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!matches) {
      throw new Error('Invalid workout document format: Missing front-matter');
    }
    return {
      metadata: matches[1],
      mainContent: matches[2].trim()
    };
  }

  _parseMetadata(yamlContent) {
    try {
      return parseYAML(yamlContent);
    } catch (error) {
      console.error('Failed to parse workout metadata:', error);
      return {};
    }
  }

  _parsePhases(content) {
    const phases = [];
    const phaseBlocks = content.split(/(?=^# )/m);

    for (const block of phaseBlocks) {
      if (!block.trim()) continue;

      const phaseMatch = block.match(/^# ([^\n]+)/);
      if (!phaseMatch) continue;

      const phaseName = phaseMatch[1];
      const phaseContent = block.slice(phaseMatch[0].length).trim();

      const phase = {
        name: phaseName,
        ...this._parsePhaseMetadata(phaseContent),
        ...(this._isMainWorkoutPhase(phaseName)
          ? { circuits: this._parseCircuits(phaseContent) }
          : { exercises: this._parseExercises(phaseContent) })
      };

      phases.push(phase);
    }

    return phases;
  }

  _isMainWorkoutPhase(phaseName) {
    return phaseName.toLowerCase().includes('main workout');
  }

  _parsePhaseMetadata(content) {
    const metadata = {};
    const lines = content.split('\n');

    for (const line of lines) {
      const match = line.match(/^([^:#]+):\s*(.+)$/);
      if (match && !line.startsWith('#')) {
        const [, key, value] = match;
        metadata[key.trim()] = this._parseValue(value.trim());
      }
    }

    return metadata;
  }

  _parseCircuits(content) {
    const circuits = [];
    const circuitBlocks = content.split(/(?=^## Circuit \d+:)/m);

    for (const block of circuitBlocks) {
      if (!block.trim() || !block.startsWith('## Circuit')) continue;

      const circuitMatch = block.match(/^## ([^:\n]+):(.*?)(?=(?:^## |\Z))/ms);
      if (!circuitMatch) continue;

      const circuitName = circuitMatch[1].trim();
      const circuitContent = circuitMatch[2].trim();

      const circuit = {
        name: circuitName,
        ...this._parseCircuitMetadata(circuitContent),
        exercises: this._parseExercises(circuitContent)
      };

      circuits.push(circuit);
    }

    return circuits;
  }

  _parseCircuitMetadata(content) {
    const metadata = {};
    const lines = content.split('\n');

    for (const line of lines) {
      if (line.startsWith('- ')) {
        const [key, value] = line.slice(2).split(':').map(s => s.trim());
        if (key && value) {
          metadata[this._camelCase(key)] = this._parseValue(value);
        }
      }
    }

    return metadata;
  }

  _parseExercises(content) {
    const exercises = [];
    const exerciseBlocks = content.split(/(?=^### )/m);

    for (const block of exerciseBlocks) {
      if (!block.trim() || !block.startsWith('### ')) continue;

      const exerciseMatch = block.match(/^### ([^:\n]+):?(.*?)(?=(?:^### |\Z))/ms);
      if (!exerciseMatch) continue;

      const exerciseName = exerciseMatch[1].trim();
      const exerciseContent = exerciseMatch[2].trim();

      const exercise = {
        name: exerciseName,
        ...this._parseExerciseMetadata(exerciseContent),
        ...this._parseVoiceInstructions(exerciseContent),
        formCues: this._parseFormCues(exerciseContent)
      };

      exercises.push(exercise);
    }

    return exercises;
  }

  _parseExerciseMetadata(content) {
    const metadata = {};
    const lines = content.split('\n');

    for (const line of lines) {
      if (line.startsWith('- ')) {
        const [key, value] = line.slice(2).split(':').map(s => s.trim());
        if (key && value && !key.includes('form_cues')) {
          const camelKey = this._camelCase(key);
          metadata[camelKey] = this._parseValue(value);
        }
      }
    }

    // Parse tempo if available
    if (metadata.tempo) {
      metadata.tempoBreakdown = this._parseTempoNotation(metadata.tempo);
    }

    return metadata;
  }

  _parseTempoNotation(tempo) {
    const [eccentric, bottomHold, concentric, topHold] = tempo.split('-').map(Number);
    return {
      eccentric,    // Lowering phase
      bottomHold,   // Pause at bottom
      concentric,   // Rising phase
      topHold      // Pause at top
    };
  }

  _parseVoiceInstructions(content) {
    const voiceInstructions = {};
    const sections = content.split(/\*\*\[VOICE(?:_[A-Z]+)?\]\*\*:/);
    
    for (let i = 1; i < sections.length; i++) {
      const typeMatch = sections[i - 1].match(/\*\*\[VOICE(_[A-Z]+)?\]\*\*$/);
      if (!typeMatch) continue;
      
      const type = typeMatch[1] ? this._camelCase(typeMatch[1].slice(1)) : 'main';
      const instructionContent = sections[i].trim();
      
      if (instructionContent.startsWith(' [') && instructionContent.endsWith(']')) {
        try {
          const arrayContent = instructionContent
            .slice(2, -1)
            .split(',\n  ')
            .map(item => item.trim().replace(/^"|"$/g, '').trim());
          voiceInstructions[type] = arrayContent;
        } catch (error) {
          console.error('Failed to parse voice instruction array:', error);
          voiceInstructions[type] = instructionContent;
        }
      } else {
        voiceInstructions[type] = instructionContent.match(/"([^"]+)"/)?.[1] || instructionContent;
      }
    }

    return { voiceInstructions };
  }

  _parseFormCues(content) {
    const formCuesMatch = content.match(/- form_cues:\s*\n((?:\s*- [^\n]+\n?)*)/);
    if (!formCuesMatch) return [];

    return formCuesMatch[1]
      .split('\n')
      .filter(line => line.trim().startsWith('- '))
      .map(line => line.trim().slice(2).trim().replace(/^["']|["']$/g, ''));
  }

  _parseValue(value) {
    // Handle quoted strings
    if (value.match(/^["'].*["']$/)) {
      return value.slice(1, -1);
    }
    // Handle numbers
    if (value.match(/^\d+$/)) {
      return parseInt(value, 10);
    }
    if (value.match(/^\d*\.\d+$/)) {
      return parseFloat(value);
    }
    // Handle continuous reps
    if (value === 'continuous') {
      return value;
    }
    return value;
  }

  _camelCase(str) {
    return str
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
  }
}