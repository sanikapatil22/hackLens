'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';

interface DemoFrame {
  duration: number; // milliseconds
  action: string; // "type", "click", "alert", "highlight", etc.
  target?: string;
  value?: string;
  message?: string;
}

interface VideoDemoRecorderProps {
  frames: DemoFrame[];
  title: string;
  description?: string;
  autoPlay?: boolean;
}

export function VideoDemoRecorder({
  frames,
  title,
  description,
  autoPlay = true,
}: VideoDemoRecorderProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [speed, setSpeed] = useState(1);

  const totalDuration = frames.reduce((sum, frame) => sum + frame.duration, 0);
  const currentDuration = frames.slice(0, currentFrame + 1).reduce((sum, frame) => sum + frame.duration, 0);

  useEffect(() => {
    if (!isPlaying || currentFrame >= frames.length) {
      setIsPlaying(false);
      return;
    }

    const frameDelay = frames[currentFrame].duration / speed;
    const timer = setTimeout(() => {
      setCurrentFrame((prev) => Math.min(prev + 1, frames.length - 1));
    }, frameDelay);

    return () => clearTimeout(timer);
  }, [isPlaying, currentFrame, frames, speed]);

  useEffect(() => {
    setProgress((currentDuration / totalDuration) * 100);
  }, [currentDuration, totalDuration]);

  const handlePlayPause = () => {
    if (currentFrame >= frames.length - 1) {
      setCurrentFrame(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleReset = () => {
    setCurrentFrame(0);
    setIsPlaying(true);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    let frameIndex = 0;
    let accumulated = 0;

    for (let i = 0; i < frames.length; i++) {
      accumulated += frames[i].duration;
      if (accumulated / totalDuration >= percent) {
        frameIndex = i;
        break;
      }
    }

    setCurrentFrame(frameIndex);
    setIsPlaying(false);
  };

  const currentFrame_ = frames[currentFrame];
  const timeDisplay = `${Math.floor(currentDuration / 1000)}s / ${Math.floor(totalDuration / 1000)}s`;

  return (
    <Card className="bg-card border border-border overflow-hidden">
      <div className="p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>

        {/* Video/Demo Area */}
        <div className="bg-secondary/20 border border-border rounded-lg overflow-hidden">
          <DemoFrameRenderer frame={currentFrame_} />
        </div>

        {/* Controls */}
        <div className="space-y-3">
          {/* Progress Bar */}
          <div
            className="h-1 bg-secondary/30 rounded-full cursor-pointer hover:h-2 transition-all"
            onClick={handleProgressClick}
          >
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePlayPause}
                className="p-2 hover:bg-secondary/50 rounded transition-colors"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-primary" />
                ) : (
                  <Play className="w-5 h-5 text-primary" />
                )}
              </button>

              <button
                onClick={handleReset}
                className="p-2 hover:bg-secondary/50 rounded transition-colors"
                title="Replay"
              >
                <RotateCcw className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="text-xs text-muted-foreground">{timeDisplay}</div>

            <div className="flex items-center gap-3">
              {/* Speed Control */}
              <select
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="px-2 py-1 text-xs bg-secondary/30 border border-border rounded hover:bg-secondary/50 transition-colors text-foreground"
              >
                <option value={0.5}>0.5x</option>
                <option value={1}>1x</option>
                <option value={1.5}>1.5x</option>
                <option value={2}>2x</option>
              </select>

              {/* Mute Toggle */}
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 hover:bg-secondary/50 rounded transition-colors"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <Volume2 className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Frame Info */}
        <div className="text-xs text-muted-foreground bg-secondary/10 rounded p-3">
          <p>
            <span className="font-semibold">Step {currentFrame + 1} of {frames.length}:</span> {currentFrame_.action}
          </p>
          {currentFrame_.message && <p className="mt-1">{currentFrame_.message}</p>}
        </div>
      </div>
    </Card>
  );
}

interface DemoFrameRendererProps {
  frame: DemoFrame;
}

function DemoFrameRenderer({ frame }: DemoFrameRendererProps) {
  return (
    <div className="p-6 min-h-64 space-y-4">
      {frame.action === 'type' && (
        <div className="space-y-3 animate-in fade-in">
          <div className="text-sm text-muted-foreground">Typing in field: {frame.target}</div>
          <div className="bg-background border border-border rounded p-3 font-mono text-sm text-foreground">
            {frame.value}
            <span className="animate-pulse">|</span>
          </div>
        </div>
      )}

      {frame.action === 'click' && (
        <div className="space-y-3 animate-in fade-in">
          <div className="text-sm text-muted-foreground">Clicking on: {frame.target}</div>
          <div className="bg-primary/20 border border-primary/50 rounded p-4 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary rounded-full animate-pulse" />
          </div>
        </div>
      )}

      {frame.action === 'alert' && (
        <div className="space-y-3 animate-in fade-in">
          <div className="bg-destructive/10 border-l-4 border-destructive rounded p-4 space-y-2">
            <p className="font-semibold text-destructive">Alert: {frame.message}</p>
            <p className="text-sm text-destructive/80">This alert was triggered by the attack</p>
          </div>
        </div>
      )}

      {frame.action === 'intercept' && (
        <div className="space-y-3 animate-in fade-in">
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4 space-y-2">
            <p className="font-semibold text-yellow-900">Network Interception Detected</p>
            <div className="bg-white rounded p-3 border border-yellow-100 text-xs font-mono space-y-1">
              <p className="text-yellow-900">POST /api/login</p>
              <p className="text-destructive">{frame.message}</p>
            </div>
          </div>
        </div>
      )}

      {frame.action === 'success' && (
        <div className="space-y-3 animate-in fade-in">
          <div className="bg-green-50 border border-green-200 rounded p-4">
            <p className="font-semibold text-green-900">{frame.message}</p>
            <p className="text-sm text-green-800 mt-2">Attack was successful - the vulnerability was exploited</p>
          </div>
        </div>
      )}

      {frame.action === 'highlight' && (
        <div className="space-y-3 animate-in fade-in">
          <div className="bg-accent/10 border-2 border-accent rounded p-4">
            <p className="text-sm text-accent font-semibold">{frame.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
