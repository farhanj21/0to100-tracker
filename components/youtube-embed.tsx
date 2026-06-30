"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { youTubeThumb } from "@/lib/youtube";

/**
 * A YouTube player with our own chrome.
 *
 * The video is driven through YouTube's IFrame Player API with `controls=0`,
 * so none of YouTube's native UI shows — no logo, title bar, "Watch on
 * YouTube", or suggested-video clutter. We render a minimal control bar
 * (play/pause, scrubber, mute, fullscreen) instead, and hold our own poster
 * over the player until it's actually playing so there's no black flash.
 *
 * Important: `YT.Player` REPLACES the element it's given with an <iframe>, so
 * we hand it a throwaway child node created imperatively — never a node React
 * renders — otherwise React and YouTube fight over the same DOM element
 * (black screen / removeChild crashes).
 */

// Single shared loader for the API script — every player awaits the same one.
let apiPromise: Promise<any> | null = null;
function loadYouTubeApi(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject();
  const w = window as any;
  if (w.YT?.Player) return Promise.resolve(w.YT);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve) => {
    const prev = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve(w.YT);
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });
  return apiPromise;
}

function fmt(s: number): string {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function YouTubeEmbed({ id }: { id: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null); // React-owned container
  const playerRef = useRef<any>(null);

  const [ready, setReady] = useState(false);
  const [started, setStarted] = useState(false); // first real playback → drop poster
  const [blocked, setBlocked] = useState(false); // autoplay didn't kick in
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let blockTimer: ReturnType<typeof setTimeout> | undefined;
    const container = hostRef.current;

    loadYouTubeApi().then((YT) => {
      if (cancelled || !container) return;

      // Throwaway node for YouTube to replace — keeps it out of React's tree.
      const mount = document.createElement("div");
      mount.style.width = "100%";
      mount.style.height = "100%";
      container.appendChild(mount);

      playerRef.current = new YT.Player(mount, {
        videoId: id,
        playerVars: {
          autoplay: 1,
          controls: 0, // our own controls instead
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          iv_load_policy: 3,
          disablekb: 1,
          fs: 0,
        },
        events: {
          onReady: (e: any) => {
            setReady(true);
            setDuration(e.target.getDuration?.() || 0);
            setMuted(Boolean(e.target.isMuted?.()));
            try {
              e.target.playVideo();
            } catch {
              /* autoplay may be blocked — handled by the block timer below */
            }
            // If playback hasn't actually begun shortly after we ask, assume
            // autoplay was blocked and surface the play button on the poster.
            blockTimer = setTimeout(() => {
              if (!cancelled) setBlocked(true);
            }, 1200);
            const frame: HTMLIFrameElement | undefined = e.target.getIframe?.();
            if (frame) {
              frame.setAttribute("tabindex", "-1"); // don't steal focus/keys
              frame.style.width = "100%";
              frame.style.height = "100%";
            }
          },
          onStateChange: (e: any) => {
            const playingNow = e.data === 1; // YT.PlayerState.PLAYING
            setPlaying(playingNow);
            if (playingNow) {
              clearTimeout(blockTimer);
              setStarted(true);
              setBlocked(false);
              setDuration(e.target.getDuration?.() || 0);
            }
          },
        },
      });
    });

    // Drive the scrubber/time while mounted.
    const timer = setInterval(() => {
      const p = playerRef.current;
      if (p?.getCurrentTime) {
        setCurrent(p.getCurrentTime() || 0);
        const d = p.getDuration?.() || 0;
        if (d) setDuration(d);
      }
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(blockTimer);
      clearInterval(timer);
      try {
        playerRef.current?.destroy?.();
      } catch {
        /* already gone */
      }
      playerRef.current = null;
    };
  }, [id]);

  const togglePlay = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    if (playing) p.pauseVideo();
    else p.playVideo();
  }, [playing]);

  const toggleMute = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    if (p.isMuted()) {
      p.unMute();
      setMuted(false);
    } else {
      p.mute();
      setMuted(true);
    }
  }, []);

  const scrub = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const p = playerRef.current;
      if (!p || !duration) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      p.seekTo(ratio * duration, true);
      setCurrent(ratio * duration);
    },
    [duration]
  );

  const fullscreen = useCallback(() => {
    wrapRef.current?.requestFullscreen?.();
  }, []);

  const pct = duration ? Math.min(100, (current / duration) * 100) : 0;

  return (
    <div
      ref={wrapRef}
      className="group relative aspect-video w-[90vw] max-w-4xl overflow-hidden rounded-lg bg-black"
    >
      {/* Player lives here (YouTube replaces a child node with its iframe). */}
      <div ref={hostRef} className="absolute inset-0" />

      {/* Our poster over the player until it's truly playing — no black flash. */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-cover bg-center transition-opacity duration-300",
          started ? "opacity-0" : "opacity-100"
        )}
        style={{ backgroundImage: `url(${youTubeThumb(id)})` }}
      >
        <div className="absolute inset-0 bg-black/40" />
        {/* Spinner only while the player is still booting / buffering. */}
        {!started && !blocked && (
          <Loader2 className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 animate-spin text-white/80" />
        )}
      </div>

      {/* Click anywhere on the video to pause (only while playing). */}
      {playing && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute inset-0"
          aria-label="Pause"
        />
      )}

      {/* Big center play button — only when genuinely paused, or if autoplay was
          blocked. Not during the initial buffering window, so it doesn't flash. */}
      {((started && !playing) || (!started && blocked)) && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute inset-0 z-10 flex items-center justify-center bg-black/30 transition-colors hover:bg-black/40"
          aria-label="Play"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-black shadow-lg transition-transform group-hover:scale-105">
            <Play className="h-7 w-7 translate-x-0.5 fill-current" />
          </span>
        </button>
      )}

      {/* Custom control bar. */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-3 pb-2 pt-8 transition-opacity duration-200",
          started
            ? playing
              ? "opacity-0 group-hover:opacity-100"
              : "opacity-100"
            : "pointer-events-none opacity-0"
        )}
      >
        {/* Scrubber */}
        <div
          onClick={scrub}
          className="group/bar relative h-1.5 w-full cursor-pointer rounded-full bg-white/25"
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-primary"
            style={{ width: `${pct}%` }}
          />
          <div
            className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary opacity-0 transition-opacity group-hover/bar:opacity-100"
            style={{ left: `${pct}%` }}
          />
        </div>

        <div className="mt-2 flex items-center gap-3 text-white">
          <button type="button" onClick={togglePlay} aria-label={playing ? "Pause" : "Play"}>
            {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </button>
          <button type="button" onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"}>
            {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
          <span className="font-mono text-xs tabular-nums text-white/90">
            {fmt(current)} / {fmt(duration)}
          </span>
          <button
            type="button"
            onClick={fullscreen}
            aria-label="Fullscreen"
            className="ml-auto"
          >
            <Maximize className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
