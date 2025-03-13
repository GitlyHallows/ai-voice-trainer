# AI Voice Trainer

A voice-enabled workout timer application that uses ElevenLabs voice agents and Gemini AI to create and run personalized workout routines with audio guidance.

<img width="1466" alt="image" src="https://github.com/user-attachments/assets/f1f4ed55-bc12-4745-a410-4901846310d6" />


<img width="1462" alt="image" src="https://github.com/user-attachments/assets/d0f28579-a954-4799-afe0-5d8262fbb16f" />


<img width="1473" alt="image" src="https://github.com/user-attachments/assets/9df8e7e8-024a-48c4-b8a1-d8b60ba0fc30" />



## Features

- Voice conversation with ElevenLabs agent to create custom workouts
- AI-generated workout plans using Google's Gemini API
- Voice-guided workout routines with timers and exercise descriptions
- Customizable workout settings (type, duration, intensity)
- Responsive design with shadcn/ui components
- Exercise form cues and motivational messages


## Prerequisites

- Node.js (v16 or higher)
- npm package manager
- ElevenLabs API key (get one at [ElevenLabs](https://elevenlabs.io))
- ElevenLabs voice agent ID (create one at [ElevenLabs Voice Agents](https://elevenlabs.io/voice-agents))
- Google Gemini API key (get one at [Google AI Studio](https://ai.google.dev/))

## Setup

1. Clone the repository:
```bash
git clone https://github.com/GitlyHallows/ai-voice-trainer.git
cd ai-voice-trainer
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Edit `.env` and add your ElevenLabs and Gemini API keys:
     ```env
     VITE_ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
     VITE_GEMINI_API_KEY=your_gemini_api_key_here
     ```

## Run the server

Run the server:
```bash
npm run dev
```

The application will be available at `http://localhost:8080`

## Using the Application

1. **Voice Selection**:
   - Enter your ElevenLabs API key if not already set in `.env`
   - Select a voice from the dropdown to use for the workout audio

2. **Creating a Workout**:
   - Click the microphone button in the bottom-right corner to start a conversation
   - Tell the voice agent what kind of workout you want (e.g., "I want a 25-minute leg workout")
   - The agent will use Gemini AI to generate a personalized workout plan
   - When you're ready to start, tell the agent "I'm ready to begin" or manually disconnect

3. **Workout Player**:
   - After the workout is generated, use the play button to start the workout
   - The player will automatically guide you through each exercise with voice instructions
   - You can use the controls if you'd like to pause, resume, or skip to the next exercise/phase


## Project Structure

```
src/
├── components/     # React components including VoiceChat and WorkoutPlayer
├── contexts/      # React contexts
├── data/          # Sample workout data
├── hooks/         # Custom React hooks including useWorkoutAudio
├── lib/           # Utility functions including workout parser and generator
└── pages/         # Application pages
```


The built files will be in the `dist` directory.

## Technologies Used

- Vite + React + TypeScript
- shadcn-ui + Tailwind CSS
- ElevenLabs API for voice synthesis and agent conversation
- Google Gemini API for workout plan generation
- Web Speech API for audio playback

## Deployment

You can deploy this project using platforms like Netlify, Vercel, or GitHub Pages.


## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
