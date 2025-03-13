import { useState, useEffect } from "react";
import VoiceSelect from "./components/VoiceSelect";
import { WorkoutPlayer } from "./components/workout/WorkoutPlayer";
import { VoiceChat } from "./components/VoiceChat";
import type { Voice } from "./lib/elevenlabs";
import { fetchVoices } from "./lib/elevenlabs";
import { useToast } from "./components/ui/use-toast";
import { Toaster } from "./components/ui/toaster";
import defaultWorkout from './data/workout.md?raw';

function App() {
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>();
  const [workoutContent, setWorkoutContent] = useState(defaultWorkout);
  const [apiKey, setApiKey] = useState<string>(() => {
    return (
      import.meta.env.VITE_ELEVENLABS_API_KEY ||
      localStorage.getItem("elevenlabs_api_key") ||
      ''
    );
  });
  const [voices, setVoices] = useState<Voice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Listen for workout generation events
  useEffect(() => {
    const handleWorkoutGenerated = (event: CustomEvent<{
      fileName: string;
      type: string;
      length: number;
      content: string;
    }>) => {
      const { fileName, type, length, content } = event.detail;
      console.log('New workout plan received:', {
        fileName,
        type,
        length,
        contentLength: content.length
      });

      // Update the workout content immediately
      setWorkoutContent(content);

      toast({
        title: "Workout Plan Generated",
        description: `New ${length}-minute ${type} workout plan created and loaded.`,
      });
    };

    window.addEventListener('workoutGenerated', handleWorkoutGenerated as EventListener);

    return () => {
      window.removeEventListener('workoutGenerated', handleWorkoutGenerated as EventListener);
    };
  }, [toast]);

  // Debug info
  useEffect(() => {
    console.log('App state:', {
      hasApiKey: !!apiKey,
      selectedVoiceId,
      voicesCount: voices.length,
      isLoading,
      workoutContentLength: workoutContent.length
    });
  }, [apiKey, selectedVoiceId, voices, isLoading, workoutContent]);

  // Fetch voices when API key is available
  useEffect(() => {
    async function loadVoices() {
      if (!apiKey) {
        console.log('No API key available, skipping voice fetch');
        return;
      }
      
      setIsLoading(true);
      try {
        console.log('Fetching voices...');
        const fetchedVoices = await fetchVoices(apiKey);
        console.log('Voices fetched:', fetchedVoices.length);
        setVoices(fetchedVoices);

        // Auto-select first voice if none selected
        if (!selectedVoiceId && fetchedVoices.length > 0) {
          setSelectedVoiceId(fetchedVoices[0].voice_id);
        }
      } catch (error) {
        console.error('Failed to fetch voices:', error);
        toast({
          title: "Error",
          description: "Failed to fetch voices. Please check your API key.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadVoices();
  }, [apiKey, toast, selectedVoiceId]);

  const handleVoiceChange = (voiceId: string) => {
    console.log('Voice changed:', voiceId);
    setSelectedVoiceId(voiceId);
  };

  const handleApiKeyChange = (newApiKey: string) => {
    console.log('API key changed');
    setApiKey(newApiKey);
    localStorage.setItem("elevenlabs_api_key", newApiKey);
  };

  const handleSettingsClick = () => {
    toast({
      title: "Current Settings",
      description: `API Key: ${apiKey ? "Set" : "Not set"}\nSelected Voice: ${selectedVoiceId || "None"}`,
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold mb-8">AI Voice Trainer</h1>
        
        <div className="grid gap-8">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Voice Selection</h2>
            <VoiceSelect
              value={selectedVoiceId}
              disabled={isLoading}
              isLoading={isLoading}
              apiKey={apiKey}
              voices={voices}
              onVoiceChange={handleVoiceChange}
              onApiKeyChange={handleApiKeyChange}
              onSettingsClick={handleSettingsClick}
            />
          </div>

          <WorkoutPlayer 
            key={workoutContent} // Force re-mount when content changes
            workoutContent={workoutContent}
            apiKey={apiKey}
            voiceId={selectedVoiceId}
          />
        </div>
      </div>

      {/* Voice Chat Component */}
      <VoiceChat agentId={import.meta.env.VITE_ELEVEN_LABS_AGENT_ID || ""} />
      
      <Toaster />
    </div>
  );
}

export default App;
