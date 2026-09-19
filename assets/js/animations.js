/**
 * Animações e efeitos visuais
 * Scroll reveal, contadores, partículas e terminal
 */

(function () {
  'use strict';

  function initScrollReveal() {
    const elements = document.querySelectorAll(
      '.reveal-up, .reveal-left, .reveal-right, .reveal-scale'
    );
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    elements.forEach((el) => observer.observe(el));
  }

  function animateCounter(el, target, duration) {
    const startTime = performance.now();
    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(target * eased);
      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = target;
      }
    }
    requestAnimationFrame(update);
  }

  function initCounters() {
    const counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const target = parseInt(el.getAttribute('data-count'), 10);
            animateCounter(el, target, 1800);
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach((el) => observer.observe(el));
  }

  function initParticles() {
    const canvas = document.getElementById('particles');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationId;
    let width, height;

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    }

    function createParticles() {
      const count = Math.min(Math.floor((width * height) / 18000), 55);
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 1.4 + 0.4,
          speedX: (Math.random() - 0.5) * 0.28,
          speedY: (Math.random() - 0.5) * 0.28,
          opacity: Math.random() * 0.35 + 0.08,
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 102, 255, ' + p.opacity + ')';
        ctx.fill();
      });
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = 'rgba(37, 99, 235, ' + 0.05 * (1 - dist / 110) + ')';
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animationId = requestAnimationFrame(draw);
    }

    resize();
    createParticles();
    draw();

    let resizeTimeout;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(function () {
        resize();
        createParticles();
      }, 200);
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        cancelAnimationFrame(animationId);
      } else {
        draw();
      }
    });
  }

  function buildTerminalLines(termDict) {
    const t = termDict || {};
    return [
      { type: 'prompt', text: 'whoami' },
      { type: 'output', text: t.whoami1 || 'Desenvolvedor Full Stack' },
      { type: 'output', text: t.whoami2 || 'Estudante de Sistemas de Informação' },
      { type: 'blank' },
      { type: 'prompt', text: 'cat sobre.txt' },
      { type: 'output', text: t.about1 || 'Desenvolvedor focado em criar sistemas web modernos,' },
      { type: 'output', text: t.about2 || 'soluções comerciais e aplicações completas.' },
      { type: 'blank' },
      { type: 'prompt', text: 'ls tecnologias/' },
      { type: 'output', text: t.tech1 || 'HTML  CSS  JavaScript  TypeScript' },
      { type: 'output', text: t.tech2 || 'PHP  Delphi  MySQL  PostgreSQL  Git' },
      { type: 'blank' },
      { type: 'prompt', text: 'cat experiencia.txt' },
      { type: 'output', text: t.exp1 || 'Desenvolvimento de sistemas comerciais' },
      { type: 'output', text: t.exp2 || 'Manutenção de ERP em Delphi' },
      { type: 'output', text: t.exp3 || 'Desenvolvimento Web · Banco de Dados · Integrações' },
      { type: 'blank' },
      { type: 'prompt-final' },
    ];
  }

  let terminalTypingToken = 0;
  let terminalStarted = false;

  function runTerminalTyping(body, lines, animated) {
    const token = ++terminalTypingToken;
    body.innerHTML = '';
    let lineIndex = 0;
    let charIndex = 0;
    let currentEl = null;

    function createPromptLine() {
      const div = document.createElement('div');
      div.className = 'terminal-line';
      div.innerHTML =
        '<span class="terminal-prompt"><span class="user">filipe@dev</span>:<span class="path">~</span>$ </span>' +
        '<span class="cmd"></span>';
      body.appendChild(div);
      return div.querySelector('.cmd');
    }

    function createOutputLine() {
      const div = document.createElement('div');
      div.className = 'terminal-line terminal-output';
      body.appendChild(div);
      return div;
    }

    function finishInstant() {
      lines.forEach(function (line) {
        if (line.type === 'blank') {
          const div = document.createElement('div');
          div.className = 'terminal-line';
          div.innerHTML = '&nbsp;';
          body.appendChild(div);
        } else if (line.type === 'prompt-final') {
          const div = document.createElement('div');
          div.className = 'terminal-line';
          div.innerHTML =
            '<span class="terminal-prompt"><span class="user">filipe@dev</span>:<span class="path">~</span>$ </span>' +
            '<span class="terminal-cursor" aria-hidden="true"></span>';
          body.appendChild(div);
        } else if (line.type === 'prompt') {
          const el = createPromptLine();
          el.textContent = line.text;
        } else {
          const el = createOutputLine();
          el.textContent = line.text;
        }
      });
    }

    if (!animated) {
      finishInstant();
      return;
    }

    function typeNext() {
      if (token !== terminalTypingToken) return;
      if (lineIndex >= lines.length) return;
      const line = lines[lineIndex];

      if (line.type === 'blank') {
        const div = document.createElement('div');
        div.className = 'terminal-line';
        div.innerHTML = '&nbsp;';
        body.appendChild(div);
        lineIndex++;
        setTimeout(typeNext, 80);
        return;
      }

      if (line.type === 'prompt-final') {
        const div = document.createElement('div');
        div.className = 'terminal-line';
        div.innerHTML =
          '<span class="terminal-prompt"><span class="user">filipe@dev</span>:<span class="path">~</span>$ </span>' +
          '<span class="terminal-cursor" aria-hidden="true"></span>';
        body.appendChild(div);
        return;
      }

      if (!currentEl) {
        if (line.type === 'prompt') {
          currentEl = createPromptLine();
          charIndex = 0;
        } else {
          currentEl = createOutputLine();
          charIndex = 0;
        }
      }

      if (charIndex < line.text.length) {
        currentEl.textContent += line.text.charAt(charIndex);
        charIndex++;
        const delay = line.type === 'prompt' ? 35 + Math.random() * 25 : 12 + Math.random() * 10;
        setTimeout(typeNext, delay);
      } else {
        currentEl = null;
        lineIndex++;
        setTimeout(typeNext, line.type === 'prompt' ? 280 : 60);
      }
    }

    typeNext();
  }

  function getCurrentTermDict() {
    try {
      const lang = localStorage.getItem('portfolio-lang') || 'pt';
      const all = window.PORTFOLIO_I18N || {};
      return (all[lang] && all[lang].terminal) || (all.pt && all.pt.terminal) || {};
    } catch (e) {
      return {};
    }
  }

  function initTerminal() {
    const body = document.getElementById('terminal-body');
    if (!body) return;

    const observer = new IntersectionObserver(
      function (entries) {
        if (entries[0].isIntersecting) {
          terminalStarted = true;
          runTerminalTyping(body, buildTerminalLines(getCurrentTermDict()), true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    const terminal = document.getElementById('terminal');
    if (terminal) observer.observe(terminal);
  }

  window.__reinitTerminal = function (termDict) {
    const body = document.getElementById('terminal-body');
    if (!body || !termDict) return;
    // Se já animou, troca o texto instantaneamente; se ainda não, só atualiza o dicionário
    if (terminalStarted || body.children.length > 0) {
      runTerminalTyping(body, buildTerminalLines(termDict), false);
      terminalStarted = true;
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    initScrollReveal();
    initCounters();
    initParticles();
    initTerminal();
  });
})();
