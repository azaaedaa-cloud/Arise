import { Howl } from 'howler';

// Sound effects
export const sounds = {
  click: new Howl({
    src: ['https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'], // Soft click
    volume: 0.2,
  }),
  success: new Howl({
    src: ['https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3'], // Success chime
    volume: 0.3,
  }),
  transition: new Howl({
    src: ['https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3'], // Swoosh
    volume: 0.1,
  }),
};

// Floating emoji utility
export const spawnEmoji = (emoji: string, x: number, y: number) => {
  const el = document.createElement('div');
  el.className = 'floating-emoji';
  el.innerText = emoji;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  document.body.appendChild(el);
  
  setTimeout(() => {
    el.remove();
  }, 2000);
};
