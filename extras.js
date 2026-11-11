/* Cabeçalho ousado: menu do celular, seção ativa, aberto/fechado, progresso, esconder ao rolar */
(() => {
  /* Rolagem suave: a roda do mouse desliza em vez de pular */
  if (window.Lenis && !matchMedia("(pointer: coarse)").matches) {
    const lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 1, anchors: { offset: -90 } });
    window.__lenis = lenis;
    const quadro = (t) => { lenis.raf(t); requestAnimationFrame(quadro); };
    requestAnimationFrame(quadro);
  }

  const corpo = document.body;
  const topo = document.querySelector(".topo");
  const menu = document.getElementById("menu");
  const botaoMenu = document.querySelector(".menu-botao");

  /* Menu do celular */
  const fecharMenu = () => {
    corpo.classList.remove("menu-aberto");
    if (window.__lenis) window.__lenis.start();
    botaoMenu && botaoMenu.setAttribute("aria-expanded", "false");
    botaoMenu && botaoMenu.setAttribute("aria-label", "Abrir menu");
  };
  if (botaoMenu) {
    botaoMenu.addEventListener("click", () => {
      const abrir = !corpo.classList.contains("menu-aberto");
      corpo.classList.toggle("menu-aberto", abrir);
      if (window.__lenis) abrir ? window.__lenis.stop() : window.__lenis.start();
      botaoMenu.setAttribute("aria-expanded", String(abrir));
      botaoMenu.setAttribute("aria-label", abrir ? "Fechar menu" : "Abrir menu");
      if (abrir) topo.classList.remove("escondido");
    });
    menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", fecharMenu));
    addEventListener("keydown", (e) => { if (e.key === "Escape") fecharMenu(); });
  }

  /* Seção ativa no menu */
  const links = [...menu.querySelectorAll('a[href^="#"]')];
  const alvos = links.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);
  const io = new IntersectionObserver((es) => {
    es.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((a) => {
        const ativo = a.getAttribute("href") === "#" + e.target.id;
        a.classList.toggle("ativo", ativo);
        ativo ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current");
      });
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  alvos.forEach((s) => io.observe(s));

  /* Barra de progresso + esconder o topo ao descer, mostrar ao subir */
  const barra = document.querySelector(".progresso");
  let ultimo = scrollY;
  const aoRolar = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    barra && barra.style.setProperty("--p", (scrollY / (max || 1)).toFixed(4));
    const desceu = scrollY > ultimo + 6, subiu = scrollY < ultimo - 6;
    if (!corpo.classList.contains("menu-aberto")) {
      if (desceu && scrollY > innerHeight * 1.2) topo.classList.add("escondido");
      else if (subiu || scrollY < 80) topo.classList.remove("escondido");
    }
    if (desceu || subiu) ultimo = scrollY;
  };
  let agendado = false;
  addEventListener("scroll", () => { if (!agendado) { agendado = true; requestAnimationFrame(() => { agendado = false; aoRolar(); }); } }, { passive: true });
  aoRolar();

  /* Aberto agora / fechado (horário de Brasília) */
  // Seg a sáb: 11h–14h e 18h–23h · Domingo: 11h–14h
  const turnos = (dia) => (dia === 0 ? [[11, 14]] : [[11, 14], [18, 23]]);
  const agoraBR = () => {
    const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Sao_Paulo", weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23",
    }).formatToParts(new Date()).map((x) => [x.type, x.value]));
    const dia = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday);
    return { dia, h: Number(p.hour) + Number(p.minute) / 60 };
  };
  const situacao = () => {
    const { dia, h } = agoraBR();
    const hoje = turnos(dia);
    const atual = hoje.find(([a, f]) => h >= a && h < f);
    if (atual) return { aberto: true, texto: `Aberto agora · até ${atual[1]}h` };
    const prox = hoje.find(([a]) => h < a);
    if (prox) return { aberto: false, texto: `Fechado · abre às ${prox[0]}h` };
    const amanha = (dia + 1) % 7;
    return { aberto: false, texto: `Fechado · abre amanhã às ${turnos(amanha)[0][0]}h` };
  };
  const pintar = () => {
    const s = situacao();
    document.querySelectorAll("[data-status]").forEach((el) => {
      el.textContent = s.texto;
      el.classList.toggle("aberto", s.aberto);
    });
  };
  pintar();
  setInterval(pintar, 60000);
})();
