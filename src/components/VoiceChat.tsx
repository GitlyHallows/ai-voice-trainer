import { useEffect, useState } from 'react';
import { Conversation } from '@11labs/client';
import { Button } from './ui/button';
import { Mic, MicOff } from 'lucide-react';
import { workoutplan, logMessage } from '../lib/clientTools';

interface VoiceChatProps {
  agentId: string;
}

export function VoiceChat({ agentId }: VoiceChatProps) {
  if (!agentId) {
    console.error('No agent ID provided to VoiceChat component');
  }
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [conversation, setConversation] = useState<any>(null);

  const startConversation = async () => {
    if (!agentId) {
      console.error('Cannot start conversation: No agent ID provided');
      return;
    }
    
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Start the conversation with client tools
      const conv = await Conversation.startSession({
        agentId,
        clientTools: {
          // Tool for generating workout plans
          workoutplan: async ({ type, length }) => {
            console.log('Workout tool called:', { type, length });
            try {
              const result = await workoutplan({ type, length });
              return result; // Returns a string message
            } catch (error) {
              console.error('Workout generation error:', error);
              return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
            }
          },
          // Tool for logging messages
          logMessage: async ({ message }) => {
            console.log('Log tool called:', { message });
            try {
              const result = await logMessage({ message });
              return result; // Returns a string message
            } catch (error) {
              console.error('Log message error:', error);
              return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
            }
          }
        },
        onConnect: () => {
          console.log('Connected to ElevenLabs');
          setIsConnected(true);
          setIsListening(true);
        },
        onDisconnect: () => {
          console.log('Disconnected from ElevenLabs');
          setIsConnected(false);
          setIsListening(false);
          setConversation(null);
          
          // Don't automatically trigger the workout when disconnecting
          // Remove the check for lastWorkoutTimestamp because we want the user
          // to explicitly say they're ready to start (or disconnect manually)
          // This prevents the agent from disconnecting right after workout generation
        },
        onError: (error) => {
          console.error('Conversation error:', error);
        },
        onModeChange: (mode) => {
          console.log('Mode changed:', mode);
          setIsListening(mode.mode === 'listening');
        }
      });

      setConversation(conv);
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  };

  const stopConversation = async () => {
    if (conversation) {
      try {
        // End the session
        await conversation.endSession();
        
        // Update state
        setConversation(null);
        setIsConnected(false);
        setIsListening(false);
        
        // Dispatch event for workout player to start automatically
        window.dispatchEvent(new CustomEvent('voiceChatDisconnect'));
        console.log('VoiceChat: Dispatched voiceChatDisconnect event');
      } catch (error) {
        console.error('Error ending conversation:', error);
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (conversation) {
        conversation.endSession();
      }
    };
  }, [conversation]);

  return (
    <div className="fixed bottom-4 right-4 flex flex-col items-end gap-2">
      <div className="bg-white rounded-lg shadow-lg p-4 mb-2">
        <div className="text-sm font-medium">
          Status: {isConnected ? 'Connected' : 'Disconnected'}
        </div>
        <div className="text-sm">
          Agent is {isListening ? 'listening' : 'speaking'}
        </div>
        {!agentId && (
          <div className="text-xs text-red-500 mt-1">
            Missing agent ID in .env file
          </div>
        )}
      </div>

      <Button
        variant={isConnected ? "destructive" : "default"}
        size="icon"
        className="h-12 w-12 rounded-full shadow-lg"
        onClick={isConnected ? stopConversation : startConversation}
        disabled={!agentId}
        title={!agentId ? "Agent ID not configured" : (isConnected ? "Disconnect" : "Connect")}
      >
        {isConnected ? (
          <MicOff className="h-6 w-6" />
        ) : (
          <Mic className="h-6 w-6" />
        )}
      </Button>
    </div>
  );
}