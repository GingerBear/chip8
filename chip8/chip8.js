import { Renderer } from './renderer.js';
import { Keyboard } from './keyboard.js';
import { Speaker } from './speaker.js';
import { CPU } from './cpu.js';

/**

binary cheat sheet
- 1 bit   === 0 or 1
- 1 byte  === 8 bits
- 1 byte  === 2 hex
- 1 hex   === 4 bits (2^4 -> 16)
- 16 bits === 2 bytes === 4 hex
- 8 bits  === 1 byte  === 2 hex
- 0xa     === 10
- 0xb     === 11

 */

class Chip8 {
  constructor() {
    this.fps = 60;
    this.fpsInterval = 0;
    this.startTime = 0;
    this.now = 0;
    this.then = 0;

    this.loopHandle = 0;
    this.renderer = new Renderer(10);
    this.keyboard = new Keyboard();
    this.speaker = new Speaker();
    this.cpu = new CPU(this.renderer, this.keyboard, this.speaker);

    this.displayEl = {
      v: this.registersDisplay(),
      i: document.querySelector('.cpu-internal .memory-address-register-i'),
      memoryValue: document.querySelector('.cpu-internal .memory-value'),
      pc: document.querySelector('.cpu-internal .program-counter-pc'),
      opcodeExplain: document.querySelector('.cpu-internal .opcode-explained'),
      stack: document.querySelector('.cpu-internal .stack'),
      paused: document.querySelector('.cpu-internal .paused'),
      speed: document.querySelector('.cpu-internal .speed'),
      log: document.querySelector('.log'),
      memory: this.memoryDisplay(),
      lines: {
        i: document.querySelector('.line-i'),
        pc: document.querySelector('.line-pc'),
      },
    };
  }

  memoryDisplay() {
    let container = document.querySelector('.cpu-internal .memory');
    let html = ``;
    for (let i = 0; i < 64; i++) {
      html += `<div class="row">`;
      for (let j = 0; j < 64; j++) {
        html += `<span class="col"></span>`;
      }
      html += `</div>`;
    }
    container.innerHTML = html;
    let allItems = container.querySelectorAll('.col');
    return Array(4096)
      .fill(1)
      .map((_, i) => allItems[i]);
  }

  registersDisplay() {
    let container = document.querySelector('.cpu-internal .register-v');
    let html = ``;
    for (let j = 0; j < 16; j++) {
      html += `<span class="col" data-index="${j.toString(16)}"></span>`;
    }

    container.innerHTML = html;
    let allItems = container.querySelectorAll('.col');
    return Array(16)
      .fill(1)
      .map((_, i) => allItems[i]);
  }

  init(romName) {
    this.fpsInterval = 1000 / this.fps;
    this.then = Date.now();
    this.startTime = this.then;

    this.displayEl.memory.forEach((el) =>
      el.classList.remove('focused', 'focused-2')
    );
    document.querySelector('#pause').textContent = 'play';

    this.pause();
    this.renderer.clear();
    this.renderer.render();
    this.cpu.reset();
    this.cpu.loadSpritesIntoMemory();

    this.cpu.loadRom(romName).then(() => {
      this.displayCPUInternal();
    });
  }

  runNormally() {
    this.cpu.speed = 10;
    this.loopHandle = requestAnimationFrame(this.loop.bind(this));
  }

  pause() {
    cancelAnimationFrame(this.loopHandle);
  }

  cycleCPU() {
    let lastPC = this.cpu.pc;
    let lastI = this.cpu.i;
    this.cpu.cycle();

    this.displayCPUInternal(lastPC, lastI);
  }

  updateContent(el, text) {
    if (el.textContent === text) return;

    clearTimeout(el.flashTimeoutHandler);

    el.classList.remove('to-flash', 'flashing');
    el.classList.add('to-flash');
    el.textContent = text;
    requestAnimationFrame(() => {
      el.classList.add('flashing');
      el.flashTimeoutHandler = setTimeout(() => {
        el.classList.remove('to-flash', 'flashing');
      }, 1000);
    });
  }

  displayCPUInternal(lastPC = 0, lastI = 0) {
    this.updateContent(this.displayEl.i, toHex(this.cpu.i, 4));
    this.displayEl.memoryValue.textContent = `${toHex(
      this.cpu.memory[this.cpu.i]
    )}`;

    this.updateContent(this.displayEl.pc, toHex(this.cpu.pc, 4));
    this.updateContent(this.displayEl.stack, this.cpu.stack + '');
    this.updateContent(this.displayEl.paused, this.cpu.paused + '');
    this.updateContent(this.displayEl.speed, this.cpu.speed + '');

    this.cpu.v.forEach((item, i) => {
      this.updateContent(this.displayEl.v[i], toHex(item));

      if (this.displayEl.v[i].textContent === '00') {
        this.displayEl.v[i].classList.add('zero');
      } else {
        this.displayEl.v[i].classList.remove('zero');
      }
    });

    this.cpu.memory.forEach((item, i) => {
      this.displayEl.memory[i].textContent = toHex(item);
      if (this.displayEl.memory[i].textContent === '00') {
        this.displayEl.memory[i].classList.add('zero');
      } else {
        this.displayEl.memory[i].classList.remove('zero');
      }
    });

    let opcode =
      (this.cpu.memory[this.cpu.pc] << 8) | this.cpu.memory[this.cpu.pc + 1];

    this.displayEl.opcodeExplain.textContent = `${toHex(
      opcode,
      4
    )}: ${explanOpcode(opcode)}`;

    let logItemEl = document.createElement('div');
    logItemEl.textContent = this.displayEl.opcodeExplain.textContent;
    this.displayEl.log.appendChild(logItemEl);
    if (this.displayEl.log.children.length > 100) {
      this.displayEl.log.children[0].remove();
    }
    this.displayEl.log.scrollTop = this.displayEl.log.scrollHeight;

    this.displayEl.memory[lastPC].classList.remove('focused');
    this.displayEl.memory[lastPC + 1].classList.remove('focused'); // opcode is 16bits, take 2 bytes

    this.displayEl.memory[this.cpu.pc].classList.add('focused');
    this.displayEl.memory[this.cpu.pc + 1].classList.add('focused');

    this.displayEl.memory[lastI].classList.remove('focused-2');
    this.displayEl.memory[this.cpu.i].classList.add('focused-2');

    this.drawLines(
      this.displayEl.i,
      this.displayEl.memory[this.cpu.i],
      this.displayEl.lines.i
    );

    this.drawLines(
      this.displayEl.pc,
      this.displayEl.memory[this.cpu.pc],
      this.displayEl.lines.pc
    );
  }

  drawLines(fromEl, toEl, lineEl) {
    let x1 = fromEl.offsetLeft + fromEl.clientWidth + 4;
    let y1 = fromEl.offsetTop + fromEl.clientHeight + 2;
    let x2 = toEl.offsetLeft;
    let y2 = toEl.offsetTop;
    lineEl.setAttribute('x1', x1);
    lineEl.setAttribute('y1', y1);
    lineEl.setAttribute('x2', x2);
    lineEl.setAttribute('y2', y2);
  }

  loop() {
    this.now = Date.now();
    let elapsed = this.now - this.then;

    if (elapsed > this.fpsInterval) {
      this.cycleCPU();
    }

    this.loopHandle = requestAnimationFrame(this.loop.bind(this));
  }
}

let chip8 = new Chip8();

chip8.init(document.querySelector('#rom-select').value);

document.querySelector('#rom-select').addEventListener('change', (e) => {
  chip8.init(e.target.value);
});

document.querySelector('#pause').addEventListener('click', (e) => {
  if (e.target.textContent === 'play') {
    chip8.runNormally();
    e.target.textContent = 'pause';
  } else {
    chip8.pause();
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

document.querySelector('#step').addEventListener('click', (e) => {
  document.querySelector('#pause').textContent = 'play';
  chip8.pause();
  chip8.cpu.speed = 1;
  chip8.cycleCPU();
});

document.querySelector('#reset').addEventListener('click', (e) => {
  chip8.init(document.querySelector('#rom-select').value);
});

function toHex(num, len = 2) {
  let val = num.toString(16);
  if (len === 2) {
    return val.length === 1 ? '0' + val : val;
  } else if (len === 4) {
    if (val.length === 1) return '000' + val;
    if (val.length === 2) return '00' + val;
    if (val.length === 3) return '0' + val;
  }

  return val;
}

function explanOpcode(opcode) {
  let x = ((opcode & 0x0f00) >> 8).toString(16);
  let y = ((opcode & 0x00f0) >> 4).toString(16);

  let description = '';

  switch (opcode & 0xf000) {
    case 0x0000:
      switch (opcode) {
        case 0x00e0:
          // this.renderer.clear();
          description = 'clear screen';
          break;
        case 0x00ee:
          // this.pc = this.stack.pop();
          description = 'pop the stack and save to pc';
          break;
      }
      break;
    case 0x1000:
      // this.pc = opcode & 0xfff;
      description = `save ${toHex(opcode & 0xfff)} to pc`;
      break;
    case 0x2000:
      // this.stack.push(this.pc);
      // this.pc = opcode & 0xfff;
      description = `push pc to stack, save ${toHex(opcode & 0xfff)} to pc`;
      break;
    case 0x3000:
      // if (this.v[x] === (opcode & 0xff)) {
      //   this.pc += 2;
      // }
      description = `if v[${x}] === ${toHex(
        opcode & 0xff
      )}, save (pc + 2) to pc`;
      break;
    case 0x4000:
      // if (this.v[x] !== (opcode & 0xff)) {
      //   this.pc += 2;
      // }
      description = `if v[${x}] !== ${toHex(
        opcode & 0xff
      )}, save (pc + 2) to pc`;
      break;
    case 0x5000:
      // if (this.v[x] === this.v[y]) {
      //   this.pc += 2;
      // }
      description = `if v[${x}] === v[${y}], increse 2 to pc`;
      break;
    case 0x6000:
      // this.v[x] = opcode & 0xff;
      description = `save ${toHex(opcode & 0xff)} to v[${x}]`;
      break;
    case 0x7000:
      // this.v[x] += opcode & 0xff;
      description = `add ${toHex(opcode & 0xff)} to v[${x}]`;
      break;
    case 0x8000:
      switch (opcode & 0xf) {
        case 0x0:
          // this.v[x] = this.v[y];
          description = `save v[${y}] to v[${x}]`;
          break;
        case 0x1:
          // this.v[x] |= this.v[y];
          description = `save (v[${x}] OR v[${y}]) to v[${x}]`;
          break;
        case 0x2:
          // this.v[x] &= this.v[y];
          description = `save (v[${x}] AND v[${y}]) to v[${x}]`;
          break;
        case 0x3:
          // this.v[x] ^= this.v[y];
          description = `save (v[${x}] XOR v[${y}]) to v[${x}]`;

          break;
        case 0x4:
          // let sum = (this.v[x] += this.v[y]);
          // this.v[0xf] = 0;

          // if (sum > 0xff) {
          //   this.v[0xf] = 1;
          // }
          // this.v[x] = sum;
          description = `save (v[${x}] + v[${y}]) to v[${x}], if overflow, set V[f] to 1`;
          break;
        case 0x5:
          // this.v[0xf] = 0;
          // if (this.v[x] > this.v[y]) {
          //   this.v[0xf] = 1;
          // }

          // this.v[x] -= this.v[y];
          description = `save (v[${x}] - v[${y}]) to v[${x}], set V[f] to 1 if resultis positive, 0 if negative`;
          break;
        case 0x6:
          // this.v[0xf] = this.v[x] & 0x1;
          // this.v[x] >>= 1;
          description = `set v[f] to last bit of v[${x}], shift right ${toHex(
            this.v[x]
          )} 1 bit`;
          break;
        case 0x7:
          // this.v[0xf] = 0;

          // if (this.v[y] > this.v[x]) {
          //   this.v[0xf] = 1;
          // }

          // this.v[x] = this.v[y] - this.v[x];
          description = `save (v[${y}] - v[${x}]) to v[${x}], set V[f] to 1 if resultis positive, 0 if negative`;
          break;
        case 0xe:
          // this.v[0xf] = this.v[x] & 0x80;
          // this.v[x] <<= 1;
          description = `set v[f] to last bit of v[${x}], shift left ${toHex(
            this.v[x]
          )} 1 bit`;
          break;
      }

      break;
    case 0x9000:
      // if (this.v[x] !== this.v[y]) {
      //   this.pc += 2;
      // }

      description = `if v[${x}] !== v[${y}], increse 2 to pc`;
      break;
    case 0xa000:
      // this.i = opcode & 0xfff;
      description = `set ${toHex(opcode & 0xfff)} to i`;
      break;
    case 0xb000:
      // this.pc = opcode & (0xfff + this.v[0]);
      description = `set pc to (${toHex(opcode & 0xfff)} + v[0])`;
      break;
    case 0xc000:
      // let rand = Math.floor(Math.random() * 0xff);
      // this.v[x] = rand & opcode & 0xff;
      description = `generate a 0-ff random number, set [v${x}] to be (random number AND ${toHex(
        opcode & 0xff
      )})`;
      break;
    case 0xd000:
      // let width = 8;
      // let height = opcode & 0xf;

      // this.v[0xf] = 0;

      // for (let row = 0; row < height; row++) {
      //   let sprite = this.memory[this.i + row];

      //   for (let col = 0; col < width; col++) {
      //     if ((sprite & 0x80) > 0) {
      //       if (this.renderer.setPixel(this.v[x] + col, this.v[y] + row)) {
      //         this.v[0xf] = 1;
      //       }
      //     }

      //     sprite <<= 1;
      //   }
      // }

      description = `Draw a sprite at position v[${x}], v[${y}] with ${(
        opcode & 0xf
      ).toString(
        16
      )} bytes of sprite data starting at the address stored in i. Set v[f] to 1 if any set pixels are changed to unset, and 0 otherwise`;
      break;
    case 0xe000:
      switch (opcode & 0xff) {
        case 0x9e:
          // if (this.keyboard.isKeyPressed(this.v[x])) {
          //   this.pc += 2;
          // }
          description = `if key v[${x}] is pressed, increse 2 to pc`;
          break;
        case 0xa1:
          // if (!this.keyboard.isKeyPressed(this.v[x])) {
          //   this.pc += 2;
          // }
          description = `if key v[${x}] is not pressed, increse 2 to pc`;
          break;
      }

      break;
    case 0xf000:
      switch (opcode & 0xff) {
        case 0x07:
          // this.v[x] = this.delayTimer;
          description = `save deplayTimer to v[${x}]`;
          break;
        case 0x0a:
          // this.paused = true;

          // this.keyboard.onNextKeyPress = (key) => {
          //   this.v[x] - key;
          //   this.paused = false;
          // };

          description = `pause the cpu, wait for keypress, then resume and save the key to v[${x}]`;
          break;
        case 0x15:
          // this.delayTimer = this.v[x];
          description = `save v[${x}] to deplayTimer`;
          break;
        case 0x18:
          // this.soundTimer = this.v[x];
          description = `save v[${x}] to soundTimer`;
          break;
        case 0x1e:
          // this.i += this.v[x];
          description = `add v[${x}] to i`;
          break;
        case 0x29:
          // this.i = this.v[x] * 5;
          description = `set i to the memory address of the sprite data corresponding to the hex digit stored in register v[${x}]. This one is not clear.`;
          break;
        case 0x33:
          // this.memory[this.i] = parseInt(this.v[x] / 100);
          // this.memory[this.i + 1] = parseInt((this.v[x] % 100) / 10);
          // this.memory[this.i + 2] = parseInt(this.v[x] % 10);

          description = `	Store the binary-coded decimal equivalent of the value stored in register v[${x}] at addresses i, i+1, and i+2`;
          break;
        case 0x55:
          // for (let registerIndex = 0; registerIndex <= x; registerIndex++) {
          //   this.memory[this.i + registerIndex] = this.v[registerIndex];
          // }
          description = `Copy data in register 0-${x} to memeory start at i to i+${x}`;
          break;
        case 0x65:
          //   for (let registerIndex = 0; registerIndex <= x; registerIndex++) {
          //     this.v[registerIndex] = this.memory[this.i + registerIndex];
          //   }
          description = `Copy data in memory i to i+${x} to registry 0 to ${x}`;
          break;
      }

      break;

    default:
      // throw new Error('Unknown opcode ' + opcode);

      description = 'Unknown opcode ' + opcode;
  }
  return description;
}
