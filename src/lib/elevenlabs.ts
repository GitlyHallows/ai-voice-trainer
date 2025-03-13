export interface Voice {
  voice_id: string;
  name: string;
  labels: {
    accent: string;
    description: string;
    [key: string]: string;
  };
}

export interface ElevenLabsConfig {
  apiKey: string;
  voiceId: string;
}

interface VoicesResponse {
  voices: Voice[];
}

export async function fetchVoices(apiKey: string): Promise<Voice[]> {
  console.log('Fetching voices from ElevenLabs...');
  if (!apiKey) {
    console.error('No API key provided to fetchVoices');
    throw new Error('API key is required');
  }

  try {
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'xi-api-key': apiKey
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });

      let errorMessage = `Failed to fetch voices: ${response.status} ${response.statusText}`;
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.detail) {
          errorMessage += ` - ${errorData.detail}`;
        }
      } catch (e) {
        if (errorText) {
          errorMessage += ` - ${errorText}`;
        }
      }

      throw new Error(errorMessage);
    }

    const data = await response.json() as VoicesResponse;
    console.log('Successfully fetched voices:', data.voices.length);

    return data.voices.map(voice => ({
      voice_id: voice.voice_id,
      name: voice.name,
      labels: {
        accent: voice.labels?.accent || 'Unknown',
        description: voice.labels?.description || 'No description',
        ...voice.labels
      }
    }));
  } catch (error) {
    console.error('Error in fetchVoices:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to fetch voices: ${error.message}`);
    }
    throw new Error('Failed to fetch voices: Unknown error');
  }
}

export async function synthesizeSpeech(text: string, config: ElevenLabsConfig): Promise<Blob> {
  console.log('Synthesizing speech with ElevenLabs:', {
    textLength: text.length,
    voiceId: config.voiceId
  });

  if (!config.apiKey || !config.voiceId) {
    console.error('Missing required config:', {
      hasApiKey: !!config.apiKey,
      hasVoiceId: !!config.voiceId
    });
    throw new Error('API key and voice ID are required');
  }

  try {
    console.log('Making request to ElevenLabs streaming API...');

    // Add break tags for counting
    const processedText = text.replace(
      /(\d+|\b(?:one|two|three|four|five|six|seven|eight|nine|ten)\b)(?=[\s.,])/gi,
      '$1<break time="1.0s" />'
    );

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${config.voiceId}/stream`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': config.apiKey
        },
        body: JSON.stringify({
          text : processedText,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.5,
            use_speaker_boost: true
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Speech synthesis error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });

      let errorMessage = `Speech synthesis failed: ${response.status} ${response.statusText}`;
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.detail) {
          errorMessage += ` - ${errorData.detail}`;
        }
      } catch (e) {
        if (errorText) {
          errorMessage += ` - ${errorText}`;
        }
      }

      throw new Error(errorMessage);
    }

    console.log('Successfully received audio stream from ElevenLabs');
    const blob = await response.blob();
    console.log('Audio blob created:', {
      size: blob.size,
      type: blob.type
    });
    return blob;
  } catch (error) {
    console.error('Error in synthesizeSpeech:', error);
    if (error instanceof Error) {
      throw new Error(`Speech synthesis failed: ${error.message}`);
    }
    throw new Error('Speech synthesis failed: Unknown error');
  }
}

// Utility function to validate API key format
export function isValidApiKey(apiKey: string): boolean {
  // ElevenLabs API keys typically start with 'sk_' and are followed by a hex string
  return /^sk_[a-f0-9]{40}$/.test(apiKey);
}

// Utility function to create an audio element from a blob
export function createAudioFromBlob(blob: Blob): HTMLAudioElement {
  const audio = new Audio();
  audio.src = URL.createObjectURL(blob);
  audio.onended = () => {
    URL.revokeObjectURL(audio.src);
  };
  return audio;
}
