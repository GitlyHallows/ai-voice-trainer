import { describe, test, expect, beforeAll } from 'vitest';
import { WorkoutParser } from '../workoutParser.js';
import fs from 'fs';
import path from 'path';

describe('WorkoutParser', () => {
  let parser;
  let workoutContent;

  beforeAll(() => {
    workoutContent = fs.readFileSync(
      path.join(process.cwd(), 'src/data/workout.md'),
      'utf-8'
    );
    parser = new WorkoutParser();
  });

  test('should parse workout metadata correctly', () => {
    const workout = parser.parse(workoutContent);
    
    expect(workout.metadata).toEqual({
      title: '30-Minute High Intensity Training',
      duration: 30,
      phases: [
        { name: 'Warm-up', duration: 5 },
        { name: 'Main Workout', duration: 20 },
        { name: 'Cool Down', duration: 5 }
      ],
      difficulty: 'Intermediate',
      calories: 300,
      equipment: ['exercise mat', 'water bottle']
    });
  });

  test('should parse exercise details with sets and reps', () => {
    const workout = parser.parse(workoutContent);
    const squats = workout.phases[1].circuits[0].exercises[0];
    
    expect(squats).toMatchObject({
      name: 'Exercise 1: Bodyweight Squats',
      exerciseType: 'strength',
      sets: 3,
      repsPerSet: 15,
      tempo: '2-1-1-0',
      restBetweenSets: 20,
      timing: '5:00 - 5:40'
    });
  });

  test('should handle different exercise types correctly', () => {
    const workout = parser.parse(workoutContent);
    
    // Test dynamic stretch
    const armCircles = workout.phases[0].exercises[0];
    expect(armCircles).toMatchObject({
      name: 'Movement 1: Arm Circles',
      exerciseType: 'dynamic_stretch',
      sets: 2,
      repsPerSet: 10,
      side: 'each_direction'
    });

    // Test cardio
    const jumpingJacks = workout.phases[0].exercises[2];
    expect(jumpingJacks).toMatchObject({
      name: 'Movement 3: Jumping Jacks',
      exerciseType: 'cardio',
      sets: 1,
      reps: 20
    });

    // Test isometric
    const plank = workout.phases[1].circuits[2].exercises[0];
    expect(plank).toMatchObject({
      name: 'Exercise 5: Plank Hold',
      exerciseType: 'isometric',
      sets: 3,
      durationPerSet: 40
    });
  });

  test('should parse circuit metadata correctly', () => {
    const workout = parser.parse(workoutContent);
    const firstCircuit = workout.phases[1].circuits[0];
    
    expect(firstCircuit).toMatchObject({
      name: 'Circuit 1: Lower Body Focus',
      rounds: 3,
      workDuration: 40,
      restDuration: 20
    });
  });

  test('should parse voice instructions with variations', () => {
    const workout = parser.parse(workoutContent);
    const motivation = workout.phases[1].circuits[0].exercises[0].voiceInstructions.motivation;
    
    expect(Array.isArray(motivation)).toBe(true);
    expect(motivation).toHaveLength(5);
    expect(motivation).toContain('These legs were made for squatting! You\'ve got this!');
  });

  test('should handle continuous rep schemes', () => {
    const workout = parser.parse(workoutContent);
    const highKnees = workout.phases[0].exercises[3];
    
    expect(highKnees).toMatchObject({
      name: 'Movement 4: High Knees',
      exerciseType: 'cardio',
      reps: 'continuous',
      duration: 30
    });
  });

  test('should parse time ranges correctly', () => {
    const timing = parser.parseTimeRange('5:00 - 5:40');
    
    expect(timing).toEqual({
      start: 300, // 5:00 in seconds
      end: 340    // 5:40 in seconds
    });
  });

  test('should handle missing optional fields gracefully', () => {
    const minimalContent = `---
title: "Simple Workout"
duration: 10
---

# Warm-up
### Exercise: Simple Exercise
- exercise_type: "cardio"
- sets: 1
- reps: 10

**[VOICE]**: "Start jumping!"
`;
    
    const workout = parser.parse(minimalContent);
    const exercise = workout.phases[0].exercises[0];
    
    expect(exercise).toMatchObject({
      name: 'Exercise: Simple Exercise',
      exerciseType: 'cardio',
      sets: 1,
      reps: 10
    });
    expect(exercise.tempo).toBeUndefined();
    expect(exercise.formCues).toEqual([]);
  });
});