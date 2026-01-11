// useViewMode.ts
import { ref, onMounted, onBeforeUnmount } from 'vue';

type ViewMode = 'mobile' | 'fixed' | 'cinematic';

export function useViewMode() {
  const viewMode = ref<ViewMode>('fixed');

  const computeViewMode = () => {
    const w = window.innerWidth;
    if (w < 768) return 'mobile';
    if (w < 1440) return 'fixed';
    return 'cinematic';
  };

  const applyViewMode = () => {
    viewMode.value = computeViewMode();
    document.documentElement.dataset.viewMode = viewMode.value;
  };

  // Apply immediately on call (don't wait for mount)
  if (typeof window !== 'undefined') {
    applyViewMode();
    window.addEventListener('resize', applyViewMode);
  }

  onMounted(() => {
    applyViewMode();
  });

  onBeforeUnmount(() => {
    window.removeEventListener('resize', applyViewMode);
  });

  return { viewMode };
}
