import { useEffect, useState } from "react";
import { Check, ChevronDown, Loader2, Settings2, Volume2 } from "lucide-react";
import { Voice, isValidApiKey, synthesizeSpeech } from "@/lib/elevenlabs";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface Props {
  value?: string;
  disabled?: boolean;
  isLoading?: boolean;
  apiKey?: string;
  voices?: Voice[];
  onVoiceChange?: (voiceId: string) => void;
  onApiKeyChange?: (apiKey: string) => void;
  onSettingsClick?: () => void;
}

const VoiceSelect = ({
  value,
  disabled,
  isLoading,
  apiKey,
  voices = [],
  onVoiceChange,
  onApiKeyChange,
  onSettingsClick,
}: Props) => {
  const { toast } = useToast();
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(apiKey || "");
  const [saveInProgress, setSaveInProgress] = useState(false);
  const [localError, setLocalError] = useState<string>();
  const [isTestingVoice, setIsTestingVoice] = useState(false);

  useEffect(() => {
    setApiKeyInput(apiKey || "");
  }, [apiKey]);

  const handleVoiceChangeRequest = (voiceId: string) => {
    if (!apiKey) {
      setShowApiKeyDialog(true);
      return;
    }
    handleVoiceChange(voiceId);
  };

  const handleVoiceChange = (voiceId: string) => {
    onVoiceChange?.(voiceId);
  };

  const handleSaveApiKey = async () => {
    setLocalError(undefined);
    
    if (!apiKeyInput.trim()) {
      setLocalError("API key is required");
      return;
    }

    if (!isValidApiKey(apiKeyInput)) {
      setLocalError("Invalid API key format. Please check your key.");
      return;
    }

    setSaveInProgress(true);

    try {
      onApiKeyChange?.(apiKeyInput);
      setShowApiKeyDialog(false);
      toast({
        title: "Success",
        description: "API key saved successfully",
      });
    } catch (error) {
      setLocalError("Failed to save API key");
      toast({
        title: "Error",
        description: "Failed to save API key",
        variant: "destructive",
      });
    } finally {
      setSaveInProgress(false);
    }
  };

  const handleTestVoice = async () => {
    if (!apiKey || !value) {
      toast({
        title: "Cannot test voice",
        description: "Please select a voice and provide an API key first.",
        variant: "destructive",
      });
      return;
    }

    setIsTestingVoice(true);
    try {
      const audioBlob = await synthesizeSpeech("Hello! This is a test of the selected voice.", {
        apiKey,
        voiceId: value
      });
      const audio = new Audio(URL.createObjectURL(audioBlob));
      audio.play();
      audio.onended = () => URL.revokeObjectURL(audio.src);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to test voice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTestingVoice(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Select
          value={value}
          onValueChange={handleVoiceChangeRequest}
          disabled={disabled || isLoading}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select a voice" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : voices && voices.length > 0 ? (
                voices.map(voice => (
                  <SelectItem key={voice.voice_id} value={voice.voice_id}>
                    <div className="flex items-center">
                      <Check
                        className={`mr-2 h-4 w-4 ${
                          value === voice.voice_id ? "opacity-100" : "opacity-0"
                        }`}
                      />
                      <div className="flex flex-col">
                        <div className="font-medium">{voice.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {voice.labels.accent} • {voice.labels.description}
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-voices" disabled>
                  No voices available
                </SelectItem>
              )}
            </SelectGroup>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="icon"
          onClick={handleTestVoice}
          disabled={disabled || isLoading || !value || !apiKey || isTestingVoice}
        >
          {isTestingVoice ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={onSettingsClick}
          disabled={disabled}
        >
          <Settings2 className="h-4 w-4" />
        </Button>
      </div>

      <AlertDialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ElevenLabs API Key Required</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-4">
                <p>
                  To use voice synthesis, you need an ElevenLabs API key. You can
                  get one by signing up at{" "}
                  <a
                    href="https://elevenlabs.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    elevenlabs.io
                  </a>
                </p>
                <div className="space-y-2">
                  <input
                    type="password"
                    placeholder="Enter your API key"
                    value={apiKeyInput}
                    onChange={e => setApiKeyInput(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  {localError && (
                    <p className="text-sm text-destructive">{localError}</p>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Your API key is stored securely in your browser and is never sent
                  to our servers.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveApiKey} disabled={saveInProgress}>
              {saveInProgress ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default VoiceSelect;
