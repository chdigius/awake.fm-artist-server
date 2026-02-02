import { computed, type ComputedRef } from 'vue';
import { usePlayerStore } from '@awake/audio-player';
import type { AudioTrack } from '@awake/audio-player';

interface MediaFile {
  type: 'media_file';
  filename: string;
  path: string;
  title?: string;
  extension: string;
  duration?: number;
  metadata?: Record<string, any>;
}

interface CollectionMetadata {
  source: string;
  path: string;
  pattern?: string;
}

interface VisualizerConfig {
  id?: string;
  seed_from?: string[];
  options?: Record<string, any>;
}

interface UseAudioCardOptions {
  item: MediaFile;
  collectionMetadata?: CollectionMetadata;
  visualizer?: VisualizerConfig;
  displayTitle: ComputedRef<string>;
  displayDate?: ComputedRef<string | null>;
}

/**
 * Composable for shared audio card logic (SetCard, TrackCard, etc.)
 * Handles deep linking, player integration, and visualizer config.
 */
export function useAudioCard(options: UseAudioCardOptions) {
  const playerStore = usePlayerStore();

  // Generate URL-safe track ID from filename
  const trackId = computed(() => {
    return options.item.filename
      .replace(options.item.extension, '')
      .replace(/[^a-zA-Z0-9-_]/g, '-') // Replace non-alphanumeric with dash
      .replace(/-+/g, '-') // Collapse multiple dashes
      .replace(/^-|-$/g, ''); // Remove leading/trailing dashes
  });

  // Hash function for seeding visualizer
  function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  // Build visualizer config from props + item metadata
  const visualizerConfig = computed(() => {
    const config = options.visualizer || {};
    const id = config.id || 'nebula-flight';
    const vizOptions = { ...config.options };

    // If seed_from specified, generate seed from item metadata
    if (config.seed_from) {
      let seedSource = '';
      config.seed_from.forEach(source => {
        if (source === 'filename') {
          seedSource += options.item.filename;
        } else if (source === 'duration' && options.item.duration) {
          seedSource += options.item.duration.toString();
        }
      });

      if (seedSource) {
        vizOptions.seed = hashString(seedSource);
      }
    }

    return { id, options: vizOptions };
  });

  // Handle card click - play track and update URL
  function handleClick() {
    // Normalize path: convert Windows backslashes to forward slashes for URLs
    const normalizedPath = options.item.path.replace(/\\/g, '/');

    const track: AudioTrack = {
      id: options.item.filename,
      path: `/content/${normalizedPath}`,
      title: options.displayTitle.value,
      duration: options.item.duration,
      visualizer: visualizerConfig.value,
      metadata: {
        filename: options.item.filename,
        extension: options.item.extension,
        date: options.displayDate?.value,
        // Store collection metadata for deep linking
        collectionSource: options.collectionMetadata?.source,
        collectionPath: options.collectionMetadata?.path,
        collectionPattern: options.collectionMetadata?.pattern,
      },
    };

    // Build URL hash with collection metadata
    let hash = `#track-${trackId.value}`;
    if (options.collectionMetadata?.source && options.collectionMetadata?.path) {
      hash += `&source=${encodeURIComponent(options.collectionMetadata.source)}`;
      hash += `&path=${encodeURIComponent(options.collectionMetadata.path)}`;
      if (options.collectionMetadata.pattern) {
        hash += `&pattern=${encodeURIComponent(options.collectionMetadata.pattern)}`;
      }
    } else {
      console.warn('[useAudioCard] Missing collection metadata - deep linking may not work correctly');
    }

    // Update URL hash for deep linking (without page reload)
    window.history.pushState(null, '', hash);

    playerStore.play(track, 'global');
  }

  return {
    trackId,
    visualizerConfig,
    handleClick,
  };
}
