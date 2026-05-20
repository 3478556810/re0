import { ref } from 'vue';

export function usePageFlip() {
  const flipClass = ref('');
  const isFlipping = ref(false);

  const triggerFlip = (type, callback) => {
    if (isFlipping.value) return;
    isFlipping.value = true;

    flipClass.value = 'fading';
    setTimeout(() => {
      callback();
      flipClass.value = 'appearing';
      setTimeout(() => {
        flipClass.value = '';
        isFlipping.value = false;
      }, 300);
    }, 300);
  };

  return { flipClass, isFlipping, triggerFlip };
}