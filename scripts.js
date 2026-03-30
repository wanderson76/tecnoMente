// 1. EFEITO TYPEWRITER (Máquina de Escrever no Subtítulo)
const subtitleText = "> Aluno do Ensino Médio Profissionalizante | Back-end | Python | Ágeis_";
const typewriterElement = document.getElementById("typewriter-subtitle");
let i = 0;

function typeWriter() {
    if (i < subtitleText.length) {
        typewriterElement.innerHTML += subtitleText.charAt(i);
        i++;
        setTimeout(typeWriter, 50); // Velocidade da digitação (ms)
    }
}

// Inicia o efeito assim que a página carrega
window.onload = typeWriter;

// 2. SISTEMA DE FILTRO DE PAINÉIS (Navegação Interativa)
const navButtons = document.querySelectorAll(".nav-btn");
const panels = document.querySelectorAll(".panel");

navButtons.forEach(button => {
    button.addEventListener("click", () => {
        // Remove classe ativo de todos os botões e adiciona no clicado
        navButtons.forEach(btn => btn.classList.remove("active"));
        button.classList.add("active");

        const filterValue = button.getAttribute("data-filter");

        // Lógica de filtragem
        panels.forEach(panel => {
            // Se "all", mostra todos, senão, verifica se a classe corresponde
            if (filterValue === "all" || panel.classList.contains(`item-${filterValue}`)) {
                panel.classList.add("active");
            } else {
                panel.classList.remove("active");
            }
        });
    });
});