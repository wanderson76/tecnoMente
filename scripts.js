// Sons de interface em Base64 (pequenos bips rápidos para não precisar de arquivos externos)
const hoverSound = new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YT9vT18A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8=");
hoverSound.volume = 0.1;

const clickSound = new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YT9vT18A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8=");
clickSound.volume = 0.3;

// Seleciona todos os cards e links
const interactiveElements = document.querySelectorAll('.skill-card, .project-card, .nav-link, .contact-link');

interactiveElements.forEach(el => {
    // Efeito ao passar o mouse
    el.addEventListener('mouseenter', () => {
        hoverSound.currentTime = 0;
        hoverSound.play().catch(() => {}); // Ignora erro se o user não interagiu ainda
        
        // Efeito visual de tremor rápido (Glitch)
        el.style.transform = `translate(${Math.random() * 4 - 2}px, ${Math.random() * 4 - 2}px) skewX(-2deg)`;
    });

    el.addEventListener('mouseleave', () => {
        el.style.transform = `translate(0, 0) skewX(0deg)`;
    });

    // Efeito ao clicar
    el.addEventListener('click', () => {
        clickSound.currentTime = 0;
        clickSound.play().catch(() => {});
    });
});

// Mensagem no Console para Engajamento
console.log("%c SYSTEM INITIALIZED: MANGA-TECH-V1 ", "background: #00ff9d; color: #000; font-weight: bold; padding: 5px;");