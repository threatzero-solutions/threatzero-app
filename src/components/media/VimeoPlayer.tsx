import Vimeo from "@vimeo/player";
import { useRef, useEffect, useCallback } from "react";

interface VimeoPlayerProps extends Vimeo.Options {
  className?: string;
  onReady?: (player: Vimeo) => void;
  onProgress?: (data: ProgressEventData) => void;
  onTimeUpdate?: (data: Vimeo.TimeEvent) => void;
  onSeeking?: (data: Vimeo.TimeEvent) => void;
  onSeeked?: (data: Vimeo.TimeEvent) => void;
  onEnded?: (data: Vimeo.TimeEvent) => void;
  onPlay?: (data: Vimeo.TimeEvent) => void;
  onPause?: (data: Vimeo.TimeEvent) => void;
  onError?: (data: Vimeo.Error) => void;
  currentTime?: number;
  currentPercent?: number;
}

export interface ProgressEventData {
  progressSeconds: number;
  progressPercent: number;
  currentSeconds: number;
  currentPercent: number;
  totalDuration: number;
  hasSeeked: boolean;
}

const VimeoPlayer: React.FC<VimeoPlayerProps> = ({
  className,
  onProgress,
  onReady,
  onTimeUpdate,
  onSeeking,
  onSeeked,
  onEnded,
  onPlay,
  onPause,
  onError,
  currentTime,
  currentPercent,
  ...options
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Vimeo | null>(null);

  const maxProgressSeconds = useRef(0);
  const hasSeeked = useRef(false);
  const seeking = useRef(false);

  const configureListeners = useCallback(
    (player: Vimeo) => {
      player.off("timeupdate");
      player.off("seeking");
      player.off("seeked");
      player.off("ended");
      player.off("play");
      player.off("pause");
      player.off("error");

      onTimeUpdate && player.on("timeupdate", onTimeUpdate);
      onSeeking && player.on("seeking", onSeeking);
      onSeeked && player.on("seeked", onSeeked);
      onEnded && player.on("ended", onEnded);
      onPlay && player.on("play", onPlay);
      onPause && player.on("pause", onPause);
      onError && player.on("error", onError);

      player.on("timeupdate", (data) => {
        if (seeking.current) {
          return;
        }

        if (data.seconds <= maxProgressSeconds.current) {
          hasSeeked.current = false;
        }

        if (!hasSeeked.current) {
          maxProgressSeconds.current = Math.max(
            maxProgressSeconds.current,
            data.seconds
          );
        }

        onProgress?.({
          progressSeconds: maxProgressSeconds.current,
          progressPercent:
            Math.ceil((maxProgressSeconds.current / data.duration) * 10000) /
            10000,
          currentSeconds: data.seconds,
          currentPercent: data.percent,
          totalDuration: data.duration,
          hasSeeked: hasSeeked.current,
        });
      });

      player.on("seeking", () => {
        seeking.current = true;
      });

      player.on("seeked", () => {
        seeking.current = false;
        hasSeeked.current = true;
      });

      player.ready().then(() => {
        onReady && onReady(player);
      });
    },
    [
      onProgress,
      onReady,
      onTimeUpdate,
      onSeeking,
      onSeeked,
      onEnded,
      onPlay,
      onPause,
      onError,
    ]
  );

  useEffect(() => {
    if (containerRef.current && playerRef.current === null) {
      const thisPlayer = new Vimeo(containerRef.current, options);
      configureListeners(thisPlayer);

      playerRef.current = thisPlayer;

      //   return () => {
      //     thisPlayer.destroy();
      //   };
    }
  }, [options, configureListeners]);

  useEffect(() => {
    (async () => {
      if (playerRef.current) {
        let startTime = 0;
        if (currentTime !== undefined) {
          startTime = currentTime;
        } else if (currentPercent !== undefined) {
          const duration = await playerRef.current.getDuration();
          startTime = duration * currentPercent;
        }

        await playerRef.current.setCurrentTime(startTime);
        maxProgressSeconds.current = startTime;
        hasSeeked.current = false;
      }
    })();
  }, [currentTime, currentPercent, playerRef]);

  return <div ref={containerRef} className={className} />;
};

export default VimeoPlayer;
