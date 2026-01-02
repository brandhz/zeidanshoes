/* =====================================================
   CONFIGURAÇÕES GLOBAIS
   ===================================================== */
const perfumeGrid = document.getElementById("perfumeGrid");
const brandColumns = document.getElementById("brandColumns");
const searchInput = document.getElementById("searchInput");
const brandPanel = document.querySelector(".brand-panel");
const brandsToggle = document.getElementById("brandsToggle");
const homeLink = document.getElementById("homeLink");
const categoryButtons = document.querySelectorAll(".category-btn") || [];

let perfumes = [];
let currentCategory = "TODAS";
const LIMITE_INICIAL = 30;
window.WHATSAPP_NUMBER = "5531991668430";

/* --- 1. OBSERVADOR DE SCROLL (ANIMAÇÃO) --- */
/* Isso faz os cards aparecerem suavemente quando rola a tela */
const cardObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, { root: null, threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

/* =====================================================
   FUNÇÕES AUXILIARES
   ===================================================== */
function normalizeCat(value) {
  return (value || "").toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
}

function detectarGenero(produto) {
  const textoCompleto = (
    (produto.Produto || "") + " " + 
    (produto.Familia || "") + " " + 
    (produto.Descricao || "") + " " +
    (produto["Gênero"] || produto.Genero || "") 
  ).toLowerCase();

  if (textoCompleto.includes("compartilhável") || textoCompleto.includes("unissex") || textoCompleto.includes("shared")) return "UNISSEX";
  if (textoCompleto.includes("feminino") || textoCompleto.includes("woman") || textoCompleto.includes("femme") || textoCompleto.includes("pour elle")) return "FEMININO";
  if (textoCompleto.includes("masculino") || textoCompleto.includes("homem") || textoCompleto.includes("homme") || textoCompleto.includes("pour homme")) return "MASCULINO";
  return "UNISSEX"; 
}

/* =====================================================
   LÓGICA DO CARRINHO
   ===================================================== */
let carrinho = JSON.parse(localStorage.getItem('carrinhoZeidan')) || [];

window.atualizarCarrinhoUI = function() {
    localStorage.setItem('carrinhoZeidan', JSON.stringify(carrinho));
    const container = document.getElementById('cart-items');
    const contador = document.getElementById('cart-count');
    const totalDisplay = document.getElementById('cart-total-value');

    if (contador) {
        contador.innerText = carrinho.length;
        contador.style.display = carrinho.length > 0 ? 'flex' : 'none';
    }

    if (!container) return;

    if (carrinho.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:40px 20px; color:#888;"><i class="fa-solid fa-basket-shopping" style="font-size:40px; margin-bottom:10px; opacity:0.5;"></i><p>Sua sacola está vazia.</p></div>';
        if (totalDisplay) totalDisplay.innerText = "R$ 0,00";
        return;
    }

    let html = '';
    let total = 0;

    carrinho.forEach((item, index) => {
        let precoNumerico = 0;
        try {
            let limpo = item.preco.toString().replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
            precoNumerico = parseFloat(limpo);
        } catch(e) { precoNumerico = 0; }
        
        if (!isNaN(precoNumerico)) total += precoNumerico;

        let nomeExibicao = item.produto || item.nome || "Produto";

        html += `
            <div class="cart-item" style="display:flex; justify-content:space-between; align-items:center; padding:15px 0; border-bottom:1px solid #eee;">
                <div style="flex:1; padding-right:10px;">
                    <div style="font-size:10px; color:#999; text-transform:uppercase; font-weight:700; margin-bottom:2px;">
                        ${item.marca}
                    </div>
                    <div style="font-weight:600; font-size:13px; color:#000; line-height:1.3;">
                        ${nomeExibicao}
                    </div>
                </div>
                <div style="text-align:right; display:flex; flex-direction:column; align-items:flex-end; gap:5px;">
                    <div style="font-weight:700; color:#333; font-size:14px;">${item.preco}</div>
                    <button onclick="window.removerDoCarrinho(${index})" style="color:#ff4757; background:none; border:none; font-size:11px; cursor:pointer; text-decoration:underline; padding:0;">
                        Remover
                    </button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
    if (totalDisplay) totalDisplay.innerText = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

window.adicionarAoCarrinho = function(marca, produto, preco, botao) {
    carrinho.push({ marca, produto, preco });
    atualizarCarrinhoUI();

    const cartIcon = document.querySelector('.cart-floating-btn i') || document.getElementById('cart-btn');
    if (cartIcon) {
        cartIcon.style.transition = "transform 0.2s, color 0.2s";
        cartIcon.style.transform = "scale(1.4)";
        cartIcon.style.color = "#2ecc71";
        setTimeout(() => {
            cartIcon.style.transform = "scale(1)";
            cartIcon.style.color = ""; 
        }, 300);
    }

    if (botao) {
        const textoOriginal = botao.innerHTML;
        const estiloOriginal = botao.getAttribute("style");
        botao.innerHTML = 'Adicionado! <i class="fa-solid fa-check"></i>';
        botao.style.background = '#2ecc71'; 
        botao.style.color = '#fff';
        botao.style.border = '1px solid #2ecc71';
        botao.style.transform = 'scale(1.05)';
        setTimeout(() => {
            botao.innerHTML = textoOriginal;
            botao.setAttribute("style", estiloOriginal || ""); 
        }, 1500);
    }
};

window.removerDoCarrinho = function(index) {
    carrinho.splice(index, 1);
    atualizarCarrinhoUI();
};

// 5. Abre e Fecha a Janela (COM CORREÇÃO DO ZAP)
    window.toggleCart = function() {
        const modal = document.getElementById('cart-modal');
        const widgetZap = document.querySelector('.whatsapp-widget'); // Pega o botão do zap
        
        if (!modal) return;
        
        if (modal.style.display === 'flex') {
            // FECHANDO O CARRINHO
            modal.style.display = 'none';
            if(widgetZap) widgetZap.style.display = 'block'; // Mostra o zap de volta
        } else {
            // ABRINDO O CARRINHO
            modal.style.display = 'flex';
            if(widgetZap) widgetZap.style.display = 'none'; // Esconde o zap pra não atrapalhar
            atualizarCarrinhoUI();
        }
    };

window.finalizarNoZap = function() {
    if (carrinho.length === 0) return alert("Sua sacola está vazia!");
    let mensagem = "Olá Zeidan! Gostaria de verificar a disponibilidade destes perfumes:\n\n";
    let totalEstimado = 0;

    carrinho.forEach(item => {
        mensagem += `▪️ *${item.produto}* (${item.marca}) - ${item.preco}\n`;
        try {
            let limpo = item.preco.toString().replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
            let valor = parseFloat(limpo);
            if(!isNaN(valor)) totalEstimado += valor;
        } catch(e){}
    });

    mensagem += `\n💰 *Total Estimado:* ${totalEstimado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
    mensagem += `\n\nAguardo a confirmação e o link de pagamento!`;
    let url = `https://wa.me/${window.WHATSAPP_NUMBER}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
};

/* =====================================================
   CARREGAMENTO DE DADOS
   ===================================================== */
async function loadPerfumes() {
  try {
    const response = await fetch("data.json");
    perfumes = await response.json();

    if (typeof brandColumns !== 'undefined' && brandColumns) populateBrandColumns();
    if (typeof perfumeGrid !== 'undefined' && perfumeGrid) renderCards("TODAS", "", "TODAS");
    
    if(window.atualizarCarrinhoUI) window.atualizarCarrinhoUI();

    // LÓGICA HÍBRIDA (Renomeei para paramsDaUrl para evitar conflito)
    const paramsDaUrl = new URLSearchParams(window.location.search);
    const id = paramsDaUrl.get('id'); 

    if (id) {
        let p = perfumes.find(item => item.id_slug === id);
        
        if (!p) {
            const idDecodificado = decodeURIComponent(id); 
            p = perfumes.find(item => item.Produto === idDecodificado);
        }

        if (!p) {
             const idLimpo = id.toLowerCase().replace(/-/g, ' ');
             p = perfumes.find(item => (item.Produto || "").toLowerCase() === idLimpo);
        }
        
        if (p) {
            if(document.getElementById('product-detail-name')) 
                document.getElementById('product-detail-name').innerText = p.Produto;
            
            if(document.getElementById('product-detail-brand')) 
                document.getElementById('product-detail-brand').innerText = p.Marca;
            
            if(document.getElementById('product-detail-price')) 
                document.getElementById('product-detail-price').innerText = p.Preco_Venda;
            
            if(document.getElementById('product-detail-desc')) 
                document.getElementById('product-detail-desc').innerText = p.Descricao || "Fragrância importada original.";

            if (window.montarGaleria) window.montarGaleria(p);

            const btnZap = document.getElementById('produtoWhatsapp');
            if(btnZap) {
                btnZap.onclick = function() {
                    const marcaSafe = (p.Marca||"").replace(/'/g," ");
                    const prodSafe = (p.Produto||"").replace(/'/g," ");
                    if (window.adicionarAoCarrinho) {
                        window.adicionarAoCarrinho(marcaSafe, prodSafe, p.Preco_Venda, this);
                    }
                };
            }
            
            const errorMsg = document.querySelector('.product-not-found-msg');
            const notFoundTitle = document.querySelector('h1'); 
            
            if(errorMsg) errorMsg.style.display = 'none';
            if(notFoundTitle && notFoundTitle.innerText.includes("NÃO ENCONTRADO")) {
                 notFoundTitle.style.display = 'none';
            }
        } else {
            console.error('Produto não encontrado:', id);
        }
    }
  } catch (error) {
    console.error("Erro ao carregar data.json:", error);
  }
}

/* =====================================================
   RENDERIZAÇÃO DA HOME (VITRINE) - VERSÃO SEGURA
   ===================================================== */
function renderCards(selectedBrand, searchTerm, category) {
  // 1. GARANTINDO QUE O ELEMENTO EXISTE
  // Verifique se no seu HTML a div tem id="grid-produtos" ou class="product-grid"
  // Ajuste o seletor abaixo conforme seu HTML real:
  const perfumeGrid = document.getElementById('grid-produtos') || document.querySelector('.product-grid');

  if (!perfumeGrid) {
      console.error("ERRO: Não achei a div do grid no HTML!");
      return;
  }
  
  perfumeGrid.innerHTML = "";
  
  // Se a lista de perfumes não existir, para para não dar erro
  if (typeof perfumes === 'undefined' || !perfumes) {
      console.error("ERRO: A lista 'perfumes' não foi carregada.");
      return;
  }

  const term = (searchTerm || "").trim().toLowerCase();
  const catFilter = normalizeCat(category || "TODAS");
  const favoritos = JSON.parse(localStorage.getItem('zeidanFavoritos')) || [];

  // FILTRAGEM
  const filtered = perfumes.filter((p) => {
    const brand = p.Marca || "";
    const name = p.Produto || "";
    const price = (p.Preco_Venda || "").trim();
    const catJSON = normalizeCat(p.Categoria || "");
    
    // Tratamento de erro na detecção de gênero
    // --- INICIO DA CORREÇÃO ---
    // 1. Tenta ler o Gênero direto do JSON (com ou sem acento)
    let rawGender = p["Gênero"] || p["Genero"] || ""; 

    // 2. Se não achar, aí sim tenta a função antiga (só por garantia)
    if (!rawGender) {
        try { 
             if(typeof detectingGenero === 'function') {
                rawGender = detectarGenero(p); 
             } else if (typeof detectarGenero === 'function') {
                rawGender = detectarGenero(p);
             }
        } catch(e){}
    }

    // 3. Normaliza (transforma "Masculino" em "MASCULINO" para bater com o filtro)
    let genClass = normalizeCat(rawGender);
    // --- FIM DA CORREÇÃO ---

    if (!price) return false;
    
    const matchBrand = selectedBrand === "TODAS" || brand === selectedBrand;
    const combined = `${name} ${brand}`.toLowerCase();
    const matchText = combined.includes(term);
    
    let matchCategory = false;
    if (catFilter === "TODAS") matchCategory = true;
    else if (catFilter === "ARABE" && (catJSON === "ARABE" || brand === "LATTAFA" || brand === "AL HARAMAIN" || brand === "AFNAN" || brand === "ARMAF")) matchCategory = true;
    else if (catFilter === "DESIGNER" && (catJSON === "DESIGNER" || brand === "DIOR" || brand === "CHANEL" || brand === "YVES SAINT LAURENT" || brand === "JEAN PAUL GAULTIER" || brand === "CAROLINA HERRERA" || brand === "PACO RABANNE")) matchCategory = true;
    else if (catFilter === "NICHO" && (catJSON === "NICHO" || brand === "CREED" || brand === "PARFUMS DE MARLY" || brand === "XERJOFF" || brand === "ROJA" || brand === "AMOUAGE")) matchCategory = true;
    else if (catJSON === catFilter || genClass === catFilter) matchCategory = true;

    return matchBrand && matchText && matchCategory;
  });

  // ORDENAÇÃO
  const ordenados = [...filtered.filter((p) => p.Destaque === true), ...filtered.filter((p) => p.Destaque !== true)];

  // LÓGICA DO LIMITE (Correção anterior)
  const temFiltroAtivo = selectedBrand !== "TODAS" || term !== "" || catFilter !== "TODAS";
  const limited = temFiltroAtivo ? ordenados : ordenados.slice(0, 30); // Se 30 for o seu LIMITE_INICIAL fixo

  console.log(`Renderizando ${limited.length} produtos.`); // Debug no console

  // CRIAÇÃO DOS CARDS
  limited.forEach((p) => {
    const card = document.createElement("article");
    const catClass = normalizeCat(p.Categoria || "").toLowerCase();
    
    let genClass = "";
    try { 
         // Mesma proteção aqui
         if(typeof detectarGenero === 'function') {
            genClass = normalizeCat(detectarGenero(p)).toLowerCase(); 
         }
    } catch(e){}

    card.className = `product-card ${catClass} ${genClass}`;

    let detalheHref = p.id_slug ? "produto.html?id=" + p.id_slug : (p.Produto ? "produto.html?id=" + encodeURIComponent(p.Produto) : null);
    
    const marcaSafe = (p.Marca || "").replace(/'/g, " ");
    const produtoSafe = (p.Produto || "").replace(/'/g, " ");
    const precoSafe = p.Preco_Venda || "";
    
    const isFav = favoritos.includes(p.Produto);
    const heartClass = isFav ? "active" : "";
    const heartIcon = isFav ? "fa-solid fa-heart" : "fa-regular fa-heart";

    card.innerHTML = `
      <div class="product-image-wrap">
          <button class="wishlist-btn ${heartClass}" onclick="toggleFavorito('${produtoSafe}', this)">
             <i class="${heartIcon}"></i>
          </button>
          ${detalheHref ? `<a href="${detalheHref}" class="product-link">` : `<div class="product-link">`}
             ${p.Imagem ? `<img src="${p.Imagem}" alt="${p.Produto ?? ""}" class="product-image" />` : ""}
          ${detalheHref ? `</a>` : `</div>`}
      </div>

      ${detalheHref ? `<a href="${detalheHref}" class="product-link-text">` : ``}
        <div class="product-name">${p.Produto ?? ""}</div>
        <div class="product-meta">
          <span class="product-brand">${p.Marca ?? ""}</span>
          <span class="product-price">${p.Preco_Venda ?? ""}</span>
        </div>
      ${detalheHref ? `</a>` : ``}

      <div class="product-actions">
        <button class="product-btn" onclick="window.adicionarAoCarrinho('${marcaSafe}', '${produtoSafe}', '${precoSafe}', this)">
          Encomende <i class="fa-solid fa-cart-plus"></i>
        </button>
      </div>
    `;
    
    /* --- AQUI: Animação de Entrada --- */
    cardObserver.observe(card);
    
    perfumeGrid.appendChild(card);
  });
}

window.toggleFavorito = function(nomeProduto, btn) {
    if(event) event.stopPropagation();
    let favoritos = JSON.parse(localStorage.getItem('zeidanFavoritos')) || [];
    const icon = btn.querySelector('i');

    if (favoritos.includes(nomeProduto)) {
        favoritos = favoritos.filter(f => f !== nomeProduto);
        btn.classList.remove('active');
        icon.classList.remove('fa-solid');
        icon.classList.add('fa-regular');
    } else {
        favoritos.push(nomeProduto);
        btn.classList.add('active');
        icon.classList.remove('fa-regular');
        icon.classList.add('fa-solid');
        icon.style.transform = "scale(1.3)";
        setTimeout(() => icon.style.transform = "scale(1)", 200);
    }
    localStorage.setItem('zeidanFavoritos', JSON.stringify(favoritos));
};

/* =====================================================
   RENDERIZAR HISTÓRICO (VISTOS RECENTEMENTE)
   ===================================================== */
function renderizarHistorico() {
    const container = document.getElementById('historicoGrid');
    const section = document.getElementById('historico-section');
    
    if (!container || !section) return;

    const historico = JSON.parse(localStorage.getItem('zeidanHistorico')) || [];

    if (historico.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    container.innerHTML = '';

    historico.forEach(p => {
        const card = document.createElement("article");
        
        // Classes padrão + Alinhamento
        card.className = `product-card`;

        let detalheHref = p.id_slug ? "produto.html?id=" + p.id_slug : "produto.html?id=" + encodeURIComponent(p.Produto);
        
        const marcaSafe = (p.Marca || "").replace(/'/g, " ");
        const produtoSafe = (p.Produto || "").replace(/'/g, " ");
        const precoSafe = p.Preco_Venda || "";
        
        let favoritos = JSON.parse(localStorage.getItem('zeidanFavoritos')) || [];
        const isFav = favoritos.includes(p.Produto);
        const heartClass = isFav ? "active" : "";
        const heartIcon = isFav ? "fa-solid fa-heart" : "fa-regular fa-heart";

        card.innerHTML = `
          <div class="product-image-wrap">
              <button class="wishlist-btn ${heartClass}" onclick="toggleFavorito('${produtoSafe}', this)">
                 <i class="${heartIcon}"></i>
              </button>
              <a href="${detalheHref}" class="product-link">
                 ${p.Imagem ? `<img src="${p.Imagem}" alt="${p.Produto}" class="product-image" />` : ""}
              </a>
          </div>

          <a href="${detalheHref}" class="product-link-text">
            <div class="product-name" style="font-size: 0.9rem;">${p.Produto}</div>
            <div class="product-meta">
              <span class="product-brand">${p.Marca}</span>
              <span class="product-price">${p.Preco_Venda}</span>
            </div>
          </a>

          <div class="product-actions">
            <button class="product-btn" onclick="window.adicionarAoCarrinho('${marcaSafe}', '${produtoSafe}', '${precoSafe}', this)">
              Encomende <i class="fa-solid fa-cart-plus"></i>
            </button>
          </div>
        `;
        
        /* --- AQUI: Animação de Entrada --- */
        cardObserver.observe(card);
        
        container.appendChild(card);
    });
}

/* =====================================================
   PAINEL DE MARCAS E MENU
   ===================================================== */
function populateBrandColumns() {
  const brandsWithPrice = perfumes.filter((p) => (p.Preco_Venda || "").trim() !== "").map((p) => p.Marca || "");
  const brands = [...new Set(brandsWithPrice)].filter((b) => b && b.trim() !== "").sort((a, b) => a.localeCompare(b));
  const columns = 4;
  const perColumn = Math.ceil(brands.length / columns);
  brandColumns.innerHTML = "";

  for (let i = 0; i < columns; i++) {
    const ul = document.createElement("ul");
    const slice = brands.slice(i * perColumn, (i + 1) * perColumn);
    slice.forEach((brand) => {
      const li = document.createElement("li");
      li.textContent = brand;
      li.addEventListener("click", () => {
        if (perfumeGrid) {
          renderCards(brand, searchInput ? searchInput.value : "", currentCategory);
          const produtos = document.getElementById("produtos");
          if (produtos) produtos.scrollIntoView({ behavior: "smooth" });
        } else {
          localStorage.setItem("abrirMarcas", "0");
          localStorage.setItem("marcaSelecionada", brand);
          window.location.href = "index.html";
        }
        closeBrandPanel();
      });
      ul.appendChild(li);
    });
    brandColumns.appendChild(ul);
  }
}

if (brandsToggle && brandPanel) {
  brandsToggle.addEventListener("click", () => {
    if (brandPanel.classList.contains("open")) closeBrandPanel(); else openBrandPanel();
  });
}
function openBrandPanel() { if (brandPanel) brandPanel.classList.add("open"); }
function closeBrandPanel() { if (brandPanel) brandPanel.classList.remove("open"); }
document.addEventListener("click", (e) => {
  if (!brandPanel || !brandsToggle) return;
  if (!brandPanel.contains(e.target) && !brandsToggle.contains(e.target)) closeBrandPanel();
});

if (homeLink && perfumeGrid) {
  homeLink.addEventListener("click", () => {
    if (searchInput) searchInput.value = "";
    currentCategory = "TODAS";
    categoryButtons.forEach((btn) => btn.classList.toggle("active", btn.dataset.cat === "TODAS"));
    renderCards("TODAS", "", currentCategory);
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}
if (searchInput && perfumeGrid) {
  searchInput.addEventListener("input", (e) => renderCards("TODAS", e.target.value, currentCategory));
}
if (categoryButtons.length && perfumeGrid) {
  categoryButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      categoryButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentCategory = btn.dataset.cat;
      renderCards("TODAS", searchInput ? searchInput.value : "", currentCategory);
    });
  });
}
window.addEventListener('scroll', function() {
  const header = document.querySelector('.hero-bar');
  if (header) {
    if (window.scrollY > 50) header.classList.add('scrolled'); else header.classList.remove('scrolled');
  }
});

/* =====================================================
   GALERIA SNIPER (SEPARAÇÃO TOTAL TOUCH vs MOUSE) 🎯
   ===================================================== */
window.montarGaleria = function(produto) {
    console.log("--> Galeria Sniper Ativada");

    const mainImg = document.getElementById('main-product-img');
    const track = document.getElementById('thumbnails-track');

    if (!mainImg || !track) return;

    // 1. Limpa eventos antigos
    mainImg.onclick = null;

    // 2. Prepara Imagens
    let lista = [];
    if(produto.Imagem) lista.push(produto.Imagem);
    if(produto.Imagem2) lista.push(produto.Imagem2);
    if(produto.Imagem3) lista.push(produto.Imagem3);
    if(produto.Imagem4) lista.push(produto.Imagem4);
    if(lista.length === 0) lista = ["placeholder.jpg"];
    const unicaImagem = lista.length === 1;

    mainImg.src = lista[0];
    let indiceAtual = 0;

    // 3. Miniaturas
    track.innerHTML = '';
    lista.forEach((src, i) => {
        let thumb = document.createElement("div");
        thumb.className = `thumb-item ${i===0 ? 'active' : ''}`;
        thumb.id = `thumb-idx-${i}`;
        thumb.innerHTML = `<img src="${src}">`;
        if(unicaImagem) thumb.style.display = 'none';
        
        // No thumb, usamos click simples mesmo
        thumb.onclick = (e) => { e.stopPropagation(); irParaFoto(i); };
        track.appendChild(thumb);
    });

    function irParaFoto(i) {
        indiceAtual = i;
        mainImg.src = lista[i];
        document.querySelectorAll('.thumb-item').forEach(el => el.classList.remove('active'));
        let ativo = document.getElementById(`thumb-idx-${i}`);
        if(ativo) {
            ativo.classList.add('active');
            ativo.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }

    function abrirZoom() {
        const modal = document.getElementById("imageModal");
        const modalImg = document.getElementById("imageModalImg");
        if (modal && modalImg) {
            console.log("Zoom Aberto!");
            modalImg.src = mainImg.src;
            modal.classList.add("open");
            modal.style.display = "flex";
        }
    }

    // ============================================================
    // A LÓGICA SNIPER 🔫
    // ============================================================
    
    let startX = 0;
    let startY = 0;
    let isTouch = false; // Variável para saber se o usuário está no celular

    // --- 1. CELULAR (TOUCH) ---
    
    mainImg.addEventListener('touchstart', e => {
        isTouch = true; // Marca que é touch para desativar o clique do mouse depois
        startX = e.changedTouches[0].clientX;
        startY = e.changedTouches[0].clientY;
    }, {passive: false}); // passive: false permite usar preventDefault se precisar

    mainImg.addEventListener('touchend', e => {
        let endX = e.changedTouches[0].clientX;
        let endY = e.changedTouches[0].clientY;
        
        let diffX = endX - startX;
        let diffY = endY - startY;
        
        // CALCULA A DISTÂNCIA PERCORRIDA (EM QUALQUER DIREÇÃO)
        // Se moveu mais que 10px (seja pra baixo scrollando ou pro lado), NÃO É CLIQUE.
        if (Math.abs(diffX) > 10 || Math.abs(diffY) > 10) {
            
            // Verifica se foi Swipe Lateral Intencional (> 50px)
            if (Math.abs(diffX) > 50 && Math.abs(diffY) < 40) {
                 if (diffX < 0) {
                     let prox = indiceAtual + 1;
                     if(prox >= lista.length) prox = 0;
                     irParaFoto(prox);
                 } else {
                     let ant = indiceAtual - 1;
                     if(ant < 0) ant = lista.length - 1;
                     irParaFoto(ant);
                 }
            }
            // Se foi só scroll (vertical), não faz nada.
            return;
        }

        // SE CHEGOU AQUI: O DEDO NÃO MEXEU! É TAP!
        // preventDefault() impede que o navegador gere um "clique fantasma" depois
        if (e.cancelable) e.preventDefault(); 
        abrirZoom();
    });

    // --- 2. COMPUTADOR (MOUSE) ---
    
    // O evento 'click' no computador funciona normal.
    // Mas no celular, o navegador dispara 'click' depois do 'touchend'.
    // A gente bloqueia isso verificando a flag 'isTouch'.
    mainImg.addEventListener('click', (e) => {
        if (isTouch) {
            // Se veio do touch, ignoramos este evento (já tratamos no touchend)
            isTouch = false; // Reseta para o próximo
            return;
        }
        // Se é mouse de verdade, abre o zoom
        abrirZoom();
    });
};

// Inicialização
loadPerfumes();
renderizarHistorico(); // Inicia o histórico

if (localStorage.getItem("abrirMarcas") === "1") {
  localStorage.removeItem("abrirMarcas");
  openBrandPanel();
  const marcasSection = document.getElementById("marcas") || document.getElementById("produtos");
  if (marcasSection) marcasSection.scrollIntoView({ behavior: "smooth" });
}
if (perfumeGrid) {
  const marcaSelecionada = localStorage.getItem("marcaSelecionada");
  if (marcaSelecionada) {
    localStorage.removeItem("marcaSelecionada");
    renderCards(marcaSelecionada, "", currentCategory);
  }
}

// Abrir e Fechar Menu do Zap
function toggleZapMenu() {
    const menu = document.getElementById('zapMenu');
    if (menu.style.display === 'block') {
        menu.style.display = 'none';
    } else {
        menu.style.display = 'block';
    }
}
