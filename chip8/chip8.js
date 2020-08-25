import { Renderer } from './renderer.js';
import { Keyboard } from './keyboard.js';
import { Speaker } from './speaker.js';
import { CPU } from './cpu.js';

class Chip8 {
  constructor() {
    this.fps = 60;
    this.fpsInterval = 0;
    this.startTime = 0;
    this.now = 0;
    this.then = 0;

    this.loop = 0;
    this.renderer = new Renderer(10);
    this.keyboard = new Keyboard();
    this.speaker = new Speaker();
    this.cpu = new CPU(this.renderer, this.keyboard, this.speaker);
  }

  init() {
    this.fpsInterval = 1000 / this.fps;
    this.then = Date.now();
    this.startTime = this.then;

    this.cpu.loadSpritesIntoMemory();
    this.cpu.loadRom('BLINKY');

    this.loop = requestAnimationFrame(this.step.bind(this));
  }

  step() {
    this.now = Date.now();
    let elapsed = this.now - this.then;

    if (elapsed > this.fpsInterval) {
      this.cpu.cycle();
    }

    this.loop = requestAnimationFrame(this.step.bind(this));
  }
}

let chip8 = new Chip8();

chip8.init();

document.querySelector('#pause').addEventListener('click', (e) => {
  if (e.target.textContent === 'play') {
    chip8.cpu.paused = false;
    e.target.textContent = 'pause';
  } else {
    chip8.cpu.paused = true;
    e.target.textContent = 'play';
  }
});

document.querySelector('#fast').addEventListener('click', (e) => {
  if (e.target.textContent === 'fast') {
    chip8.cpu.speed = 100;
    e.target.textContent = 'slow';
  } else {
    chip8.cpu.speed = 10;
    e.target.textContent = 'fast';
  }
});
