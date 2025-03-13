
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getAllVoices } from "@/lib/elevenlabs";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const Settings = () => {
  const navigate = useNavigate();
  const { user, signInWithGoogle, signOut } = useAuth();
  const [apiKey, setApiKey] = useState("");

  const { data: userSettings } = useQuery({
    queryKey: ["userSettings", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("user_settings")
        .select("eleven_labs_key")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: voices, isLoading, refetch } = useQuery({
    queryKey: ["voices", userSettings?.eleven_labs_key],
    queryFn: async () => {
      try {
        if (!userSettings?.eleven_labs_key) {
          throw new Error("API key not found");
        }
        return await getAllVoices(userSettings.eleven_labs_key);
      } catch (error) {
        console.error("Failed to fetch voices:", error);
        toast.error("Failed to fetch voices. Please check your API key.");
        return [];
      }
    },
    enabled: !!userSettings?.eleven_labs_key,
  });

  const updateApiKey = useMutation({
    mutationFn: async (apiKey: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("user_settings")
        .upsert({ user_id: user.id, eleven_labs_key: apiKey });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("API key updated successfully");
      refetch();
    },
    onError: () => {
      toast.error("Failed to update API key");
    },
  });

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      toast.error("Please enter an API key");
      return;
    }
    updateApiKey.mutate(apiKey);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-semibold text-gray-800">Settings</h1>
            <div className="flex gap-2">
              {user ? (
                <>
                  <Button variant="outline" onClick={() => signOut()}>
                    Sign Out
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/")}>
                    Back to Timer
                  </Button>
                </>
              ) : (
                <Button onClick={() => signInWithGoogle()}>
                  Sign in with Google
                </Button>
              )}
            </div>
          </div>

          {user ? (
            <>
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-700">API Key Configuration</h2>
                <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                  <p className="text-sm text-gray-600">
                    You need to set your ElevenLabs API key to use voice features.
                  </p>
                  <div className="flex flex-col space-y-4">
                    <Input
                      type="password"
                      placeholder="Enter your ElevenLabs API key"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                    <div className="flex gap-4">
                      <Button onClick={handleSaveApiKey}>
                        Save API Key
                      </Button>
                      <Button 
                        onClick={() => {
                          window.open("https://elevenlabs.io/speech-synthesis", "_blank");
                        }}
                        variant="outline"
                      >
                        Get API Key
                      </Button>
                      <Button onClick={() => refetch()} variant="outline">
                        Test Connection
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-700">Available Voices</h2>
                {isLoading ? (
                  <p>Loading voices...</p>
                ) : voices && voices.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {voices.map((voice) => (
                      <div
                        key={voice.voice_id}
                        className="p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <p className="font-medium">{voice.name}</p>
                        <p className="text-sm text-gray-500">ID: {voice.voice_id}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">No voices available. Please check your API key configuration.</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center p-8 bg-gray-50 rounded-lg">
              <p className="text-gray-600">Please sign in to manage your settings.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
