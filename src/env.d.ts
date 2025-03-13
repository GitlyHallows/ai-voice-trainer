/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ELEVENLABS_API_KEY: string;
  readonly VITE_GEMINI_API_KEY: string;
  readonly VITE_ELEVEN_LABS_AGENT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.md' {
  const content: string;
  export default content;
}

declare module '*.md?raw' {
  const content: string;
  export default content;
}