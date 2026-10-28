declare module '@met4citizen/talkinghead' {
  export class TalkingHead {
    constructor(node: HTMLElement, opt?: Record<string, unknown>);
    showAvatar(avatar: Record<string, unknown>, onprogress?: ((e: ProgressEvent) => void) | null): Promise<void>;
    speakAudio(r: Record<string, unknown>, opt?: Record<string, unknown> | null): void;
    speakMarker(onmarker: () => void): void;
    stopSpeaking(): void;
    setMood(mood: string): void;
    playGesture(name: string, dur?: number, mirror?: boolean, ms?: number): void;
    makeEyeContact(t: number): void;
    lookAtCamera(t: number): void;
    start(): void;
    stop(): void;
    dispose(): void;
  }
}
