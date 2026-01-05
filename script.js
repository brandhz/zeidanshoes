/* =====================================================
   CONFIGURAÇÕES GLOBAIS
   ===================================================== */
const brandColumns = document.getElementById("brandColumns");
const searchInput = document.getElementById("searchInput");
const brandPanel = document.getElementById("brandPanel") || document.querySelector(".brand-panel");
const brandsToggle = document.getElementById("brandsToggle");
const homeLink = document.getElementById("homeLink");
const categoryButtons = document.querySelectorAll(".category-btn");

let todosProdutos = []; 
let tamanhoSelecionadoPeloUsuario = null; 
window.WHATSAPP_NUMBER = "5531991668430"; 

/* --- OBSERVADOR DE SCROLL (Animação de entrada) --- */
const cardObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, { root: null, threshold: 0.1 });

/* =====================================================
   FUNÇÕES AUXILIARES
   ===================================================== */
function normalizeCat(value) {
  return (value || "").toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
}

function detectarGenero(produto) {
  if (produto["Gênero"]) return normalizeCat(produto["Gênero"]);
  if (produto.Genero) return normalizeCat(produto.Genero);
  const texto = ((produto.Produto || "") + " " + (produto.Descricao || "")).toUpperCase();
  if (texto.includes("WOMEN") || texto.includes("FEMININO") || texto.includes("DELAS")) return "FEMININO";
  if (texto.includes("MEN") || texto.includes("MASCULINO") || texto.includes("HOMEM")) return "MASCULINO";
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

        let nomeExibicao = item.produto || "Produto";
        let tamanhoHtml = item.tamanho ? `<span style="font-size:11px; background:#f0f0f0; padding:2px 6px; border-radius:4px; margin-left:5px; font-weight:bold; color:#333;">Tam: ${item.tamanho}</span>` : '';

        html += `
            <div class="cart-item" style="display:flex; justify-content:space-between; align-items:center; padding:15px 0; border-bottom:1px solid #eee;">
                <div style="flex:1; padding-right:10px;">
                    <div style="font-size:10px; color:#999; text-transform:uppercase; font-weight:700; margin-bottom:2px;">${item.marca}</div>
                    <div style="font-weight:600; font-size:13px; color:#000; line-height:1.3;">${nomeExibicao} ${tamanhoHtml}</div>
                </div>
                <div style="text-align:right; display:flex; flex-direction:column; align-items:flex-end; gap:5px;">
                    <div style="font-weight:700; color:#333; font-size:14px;">${item.preco}</div>
                    <button onclick="window.removerDoCarrinho(${index})" style="color:#ff4757; background:none; border:none; font-size:11px; cursor:pointer; text-decoration:underline; padding:0;">Remover</button>
                </div>
            </div>`;
    });

    container.innerHTML = html;
    if (totalDisplay) totalDisplay.innerText = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

window.adicionarAoCarrinho = function(marca, produto, preco, botao, tamanho = null) {
    carrinho.push({ marca, produto, preco, tamanho });
    atualizarCarrinhoUI();
    
    const cartIcon = document.querySelector('.cart-floating-btn i');
    if (cartIcon) {
        cartIcon.style.color = "#2ecc71";
        setTimeout(() => { cartIcon.style.color = ""; }, 300);
    }
    const modal = document.getElementById('cart-modal');
    if (modal) modal.style.display = 'flex';
};

window.removerDoCarrinho = function(index) {
    carrinho.splice(index, 1);
    atualizarCarrinhoUI();
};

window.toggleCart = function() {
    const modal = document.getElementById('cart-modal');
    const widgetZap = document.querySelector('.whatsapp-widget');
    if (!modal) return;
    
    if (modal.style.display === 'flex') {
        modal.style.display = 'none';
        if(widgetZap) widgetZap.style.display = 'block';
    } else {
        modal.style.display = 'flex';
        if(widgetZap) widgetZap.style.display = 'none';
        atualizarCarrinhoUI();
    }
};

window.finalizarNoZap = function() {
    if (carrinho.length === 0) return alert("Sua sacola está vazia!");
    let msg = "Olá Zeidan! Gostaria de verificar estes modelos:\n\n";
    carrinho.forEach(item => {
        let tam = item.tamanho ? ` (Tam: ${item.tamanho})` : "";
        msg += `👟 *${item.produto}*${tam}\n   Valor: ${item.preco}\n\n`;
    });
    window.open(`https://wa.me/${window.WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
};

/* =====================================================
   CARREGAMENTO DE DADOS (JSON)
   ===================================================== */
async function loadProducts() {
  try {
    const response = await fetch("data.json");
    todosProdutos = await response.json();

    // 1. Se estiver na HOME
    if (document.getElementById("grid-produtos") || document.getElementById("perfumeGrid")) {
        populateBrandColumns();
        const marcaSalva = localStorage.getItem("marcaSelecionada");
        if (marcaSalva) {
            localStorage.removeItem("marcaSelecionada");
            renderCards(marcaSalva, "", "TODAS");
        } else {
            renderCards("TODAS", "", "TODAS");
        }
        renderizarHistorico(); // Carrega o histórico
    }
    
    // 2. Se estiver na PÁGINA DE PRODUTO
    const paramsDaUrl = new URLSearchParams(window.location.search);
    const id = paramsDaUrl.get('id'); 
    if (id) carregarDetalhesDoProduto(id);
    
    if(window.atualizarCarrinhoUI) window.atualizarCarrinhoUI();

  } catch (error) {
    console.error("Erro ao carregar data.json:", error);
  }
}

/* =====================================================
   RENDERIZAÇÃO DA HOME (VITRINE DUPLA)
   ===================================================== */
function renderCards(selectedBrand, searchTerm, category) {
  const gridTenis = document.getElementById("grid-produtos") || document.getElementById("perfumeGrid");
  const gridSandalias = document.getElementById("grid-sandalias");

  if (gridTenis) gridTenis.innerHTML = "";
  if (gridSandalias) gridSandalias.innerHTML = "";
  
  if (!gridTenis) return;

  const term = (searchTerm || "").trim().toLowerCase();
  const catFilter = normalizeCat(category || "TODAS");
  const favoritos = JSON.parse(localStorage.getItem('zeidanFavoritos')) || [];

  const filtered = todosProdutos.filter((p) => {
    const brand = p.Marca || "";
    const name = p.Produto || "";
    const catJSON = normalizeCat(p.Categoria || "");
    const genClass = detectarGenero(p);

    const matchBrand = selectedBrand === "TODAS" || brand === selectedBrand;
    const combined = `${name} ${brand} ${catJSON}`.toLowerCase();
    const matchText = combined.includes(term);
    
    let matchCategory = false;
    if (catFilter === "TODAS") matchCategory = true;
    else if (catFilter === "MASCULINO" && genClass === "MASCULINO") matchCategory = true;
    else if (catFilter === "FEMININO" && genClass === "FEMININO") matchCategory = true;
    else if (catFilter === "UNISSEX" && genClass === "UNISSEX") matchCategory = true;
    else if (catJSON === catFilter) matchCategory = true;

    return matchBrand && matchText && matchCategory;
  });

  const ordenados = [...filtered.filter(p => p.Destaque), ...filtered.filter(p => !p.Destaque)];
  const limited = (selectedBrand !== "TODAS" || term !== "" || catFilter !== "TODAS") ? ordenados : ordenados.slice(0, 30); 

  limited.forEach((p) => {
    const card = document.createElement("article");
    card.className = `product-card`;

    let detalheHref = p.id_slug ? "produto.html?id=" + p.id_slug : null;
    const isFav = favoritos.includes(p.Produto);
    const heartIcon = isFav ? "fa-solid fa-heart" : "fa-regular fa-heart";
    const heartClass = isFav ? "active" : "";

    let htmlTamanhos = '';
    if (p.Tamanhos && Array.isArray(p.Tamanhos)) {
        htmlTamanhos = `<div class="size-row" style="display:flex; justify-content:center; gap:3px; margin-bottom:5px; flex-wrap:wrap;">`;
        p.Tamanhos.slice(0, 5).forEach(t => {
            htmlTamanhos += `<span style="font-size:9px; padding:2px 4px; border:1px solid #eee; color:#666;">${t}</span>`;
        });
        if(p.Tamanhos.length > 5) htmlTamanhos += `<span style="font-size:9px; color:#999;">+</span>`;
        htmlTamanhos += `</div>`;
    }

    const imgCapa = (p.Imagens && p.Imagens.length > 0) ? p.Imagens[0] : "img/placeholder.jpg";

    /* === CORREÇÃO DA IMAGEM: SEM STYLE INLINE === */
    card.innerHTML = `
      <div class="product-image-wrap">
          <button class="wishlist-btn ${heartClass}" onclick="toggleFavorito('${p.Produto.replace(/'/g," ")}', this)"><i class="${heartIcon}"></i></button>
          <a href="${detalheHref}" class="product-link">
             <img src="${imgCapa}" alt="${p.Produto}" class="product-image" />
          </a>
      </div>
      <a href="${detalheHref}" class="product-link-text">
        <div class="product-name">${p.Produto}</div>
        <div class="product-meta">
          <span class="product-brand">${p.Marca}</span>
          ${htmlTamanhos}
          <span class="product-price">${p.Preco_Venda}</span>
        </div>
      </a>
      <div class="product-actions">
        <a href="${detalheHref}" class="product-btn">VER DETALHES <i class="fa-solid fa-arrow-right" style="margin-left:5px;"></i></a>
      </div>
    `;
    
    cardObserver.observe(card);

    // Separa Sandálias
    const categoria = normalizeCat(p.Categoria || "");
    const nome = normalizeCat(p.Produto || "");
    const ehSandalia = categoria.includes("SANDALIA") || categoria.includes("CHINELO") || nome.includes("SANDALIA") || nome.includes("CHINELO") || nome.includes("YEEZY SLIDE");

    if (ehSandalia && gridSandalias) {
        gridSandalias.appendChild(card);
    } else {
        gridTenis.appendChild(card);
    }
  });
  
  if (gridSandalias && gridSandalias.children.length === 0) {
      const sectionSandalia = document.getElementById("sandalias-section");
      if(sectionSandalia) sectionSandalia.style.display = "none";
  } else {
      const sectionSandalia = document.getElementById("sandalias-section");
      if(sectionSandalia) sectionSandalia.style.display = "block";
  }
}

window.toggleFavorito = function(nome, btn) {
    if(event) event.stopPropagation();
    let favs = JSON.parse(localStorage.getItem('zeidanFavoritos')) || [];
    const icon = btn.querySelector('i');
    if (favs.includes(nome)) {
        favs = favs.filter(f => f !== nome);
        btn.classList.remove('active');
        icon.classList.remove('fa-solid'); icon.classList.add('fa-regular');
    } else {
        favs.push(nome);
        btn.classList.add('active');
        icon.classList.remove('fa-regular'); icon.classList.add('fa-solid');
    }
    localStorage.setItem('zeidanFavoritos', JSON.stringify(favs));
};

/* =====================================================
   DETALHES DO PRODUTO & GALERIA
   ===================================================== */
function carregarDetalhesDoProduto(id) {
    salvarVisita(id); // Salva no histórico
    let p = todosProdutos.find(item => item.id_slug === id);
    if (!p) return;

    document.title = `${p.Produto} | Zeidan Shoes`;
    if(document.getElementById('produtoTitulo')) document.getElementById('produtoTitulo').innerText = p.Produto;
    if(document.getElementById('produtoMarca')) document.getElementById('produtoMarca').innerText = p.Marca;
    if(document.getElementById('produtoPreco')) document.getElementById('produtoPreco').innerText = p.Preco_Venda;
    if(document.getElementById('produtoDescricao')) document.getElementById('produtoDescricao').innerText = p.Descricao || "";
    if(document.getElementById('produtoEstilo')) document.getElementById('produtoEstilo').innerText = p.Categoria || "Casual";
    if(document.getElementById('produtoGenero')) document.getElementById('produtoGenero').innerText = detectarGenero(p);

    renderizarCores(p);
    
    montarGaleria(p);

    const sizeContainer = document.getElementById('size-container');
    const erroSize = document.getElementById('size-error');
    
    if (sizeContainer && p.Tamanhos) {
        sizeContainer.innerHTML = ''; 
        p.Tamanhos.forEach(tam => {
            const btn = document.createElement('button');
            btn.className = 'size-option-btn';
            btn.innerText = tam;
            btn.onclick = () => {
                document.querySelectorAll('.size-option-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                tamanhoSelecionadoPeloUsuario = tam;
                if(erroSize) erroSize.style.display = 'none';
            };
            sizeContainer.appendChild(btn);
        });
    }

    const btnZap = document.getElementById('produtoWhatsapp');
    if(btnZap) {
        btnZap.onclick = function(e) {
            e.preventDefault();
            if (p.Tamanhos && !tamanhoSelecionadoPeloUsuario) {
                if(erroSize) { erroSize.style.display = 'block'; } else { alert("Selecione um tamanho!"); }
                return;
            }
            adicionarAoCarrinho(p.Marca, p.Produto, p.Preco_Venda, this, tamanhoSelecionadoPeloUsuario);
        };
    }
    carregarSugestoes(p);
}

window.montarGaleria = function(produto) {
    const mainImg = document.getElementById('main-product-img');
    const track = document.getElementById('thumbnails-track');
    
    if (!mainImg || !track) return;

    // Reseta eventos anteriores para não acumular
    const novoMainImg = mainImg.cloneNode(true);
    mainImg.parentNode.replaceChild(novoMainImg, mainImg);
    const imgElement = document.getElementById('main-product-img'); // Pega o novo elemento

    track.innerHTML = '';

    // Garante que sempre tenha array de imagens
    let lista = (produto.Imagens && produto.Imagens.length > 0) ? produto.Imagens : ["img/placeholder.jpg"];
    
    // Variável para controlar qual foto está aparecendo
    let indiceAtual = 0;

    // 1. Função que atualiza a foto
    function atualizarFoto(index) {
        // Garante que o índice não saia do limite (loop infinito)
        if (index < 0) index = lista.length - 1;
        if (index >= lista.length) index = 0;
        
        indiceAtual = index; // Atualiza o índice global
        imgElement.src = lista[indiceAtual]; // Troca a foto

        // Atualiza as bordas das miniaturas
        document.querySelectorAll('.thumb-item').forEach(el => el.classList.remove('active'));
        const ativo = document.getElementById(`thumb-idx-${indiceAtual}`);
        if(ativo) ativo.classList.add('active');
    }

    // 2. Cria as miniaturas
    lista.forEach((src, i) => {
        let thumb = document.createElement("div");
        thumb.className = `thumb-item ${i === 0 ? 'active' : ''}`;
        thumb.id = `thumb-idx-${i}`;
        thumb.innerHTML = `<img src="${src}" style="width:100%; height:100%; object-fit:cover;">`;
        
        thumb.onclick = (e) => { 
            e.stopPropagation(); 
            atualizarFoto(i); 
        };
        track.appendChild(thumb);
    });

    // Inicia com a primeira foto
    imgElement.src = lista[0];

    // ==========================================================
    // LÓGICA DE SWIPE (ROLAGEM DO DEDO)
    // ==========================================================
    let touchStartX = 0;
    let touchEndX = 0;

    // Quando encosta o dedo
    imgElement.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
    }, {passive: true});

    // Quando solta o dedo
    imgElement.addEventListener('touchend', function(e) {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, {passive: true});

    function handleSwipe() {
        // Se arrastou mais de 50px para a esquerda ou direita
        if (touchEndX < touchStartX - 50) {
            // Arrastou para a Esquerda (Próxima foto)
            atualizarFoto(indiceAtual + 1);
        }
        if (touchEndX > touchStartX + 50) {
            // Arrastou para a Direita (Foto anterior)
            atualizarFoto(indiceAtual - 1);
        }
    }

    // Clique para Zoom (Mantendo sua lógica original)
    imgElement.addEventListener('click', () => {
        // Pequeno delay para diferenciar clique de arraste
        if (Math.abs(touchEndX - touchStartX) < 10) { 
            const modal = document.getElementById("imageModal");
            const modalImg = document.getElementById("imageModalImg");
            if (modal && modalImg) {
                modalImg.src = imgElement.src;
                modal.style.display = "flex";
            }
        }
    });
};

function populateBrandColumns() {
  if(!brandColumns) return;
  const brands = [...new Set(todosProdutos.map(p => p.Marca))].sort();
  const columns = 4;
  const perColumn = Math.ceil(brands.length / columns);
  brandColumns.innerHTML = "";

  for (let i = 0; i < columns; i++) {
    const ul = document.createElement("ul");
    brands.slice(i * perColumn, (i + 1) * perColumn).forEach(brand => {
      const li = document.createElement("li");
      li.textContent = brand;
      li.addEventListener("click", () => {
        if (typeof renderCards === "function") renderCards(brand, "", "TODAS");
        if(brandPanel) brandPanel.classList.remove("open");
      });
      ul.appendChild(li);
    });
    brandColumns.appendChild(ul);
  }
}

/* =====================================================
   FUNÇÃO DE CORES (NOVO)
   ===================================================== */
function renderizarCores(produtoAtual) {
    const boxCores = document.getElementById('box-cores');
    const container = document.getElementById('color-container');
    const nomeCorSpan = document.getElementById('nome-cor-selecionada');

    // Se os elementos não existirem no HTML (ex: na Home), para a execução
    if (!boxCores || !container) return;

    container.innerHTML = ''; // Limpa para não duplicar

    // Verifica se existe o array Cores_Relacionadas e se tem mais de 1 cor
    if (!produtoAtual.Cores_Relacionadas || produtoAtual.Cores_Relacionadas.length <= 1) {
        boxCores.style.display = 'none';
        return;
    }

    // Mostra a caixa
    boxCores.style.display = 'block';

    // Loop para criar as bolinhas
    produtoAtual.Cores_Relacionadas.forEach(cor => {
        const divCor = document.createElement('div');
        divCor.className = 'color-option-btn'; // Usa a classe CSS que criamos antes
        
        // Estilos diretos para garantir, caso o CSS falhe
        divCor.style.backgroundColor = cor.hex;
        divCor.title = cor.nome; 

        // Se for branco, reforça a borda
        if (cor.hex.toUpperCase() === '#FFFFFF' || cor.hex === '#fff') {
            divCor.style.border = '1px solid #ccc';
        }

        // Verifica se é o produto atual (Pinta a borda ou marca como selected)
        if (cor.slug === produtoAtual.id_slug) {
            divCor.classList.add('selected'); // Adiciona classe CSS
            if(nomeCorSpan) nomeCorSpan.innerText = cor.nome; // Atualiza o texto "Cores: Preto"
        } 

        // Ao clicar, muda de página
        divCor.onclick = function() {
            if (cor.slug !== produtoAtual.id_slug) {
                // Redireciona para o ID da outra cor
                window.location.href = `produto.html?id=${cor.slug}`;
            }
        };

        container.appendChild(divCor);
    });
}

// INICIALIZAR
loadProducts();

/* =====================================================
   CORREÇÃO DO FILTRO DE CATEGORIAS
   ===================================================== */
if (categoryButtons && categoryButtons.length > 0) {
    categoryButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            categoryButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            const categoriaSelecionada = btn.getAttribute("data-cat");
            const termoBusca = searchInput ? searchInput.value : "";
            renderCards("TODAS", termoBusca, categoriaSelecionada);
        });
    });
}

/* =====================================================
   CORREÇÃO DO TOGGLE DE MARCAS
   ===================================================== */
if (brandsToggle && brandPanel) {
    brandsToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        brandPanel.classList.toggle("open");
    });
    document.addEventListener("click", (e) => {
        if (!brandPanel.contains(e.target) && e.target !== brandsToggle) {
            brandPanel.classList.remove("open");
        }
    });
}

/* =====================================================
   CORREÇÃO DO MODAL DE ZOOM (FECHAR)
   ===================================================== */
document.addEventListener("DOMContentLoaded", function() {
    const modal = document.getElementById("imageModal");
    const closeBtn = document.getElementById("imageModalClose");
    const backdrop = document.querySelector(".image-modal-backdrop");

    function fecharModal() {
        if(modal) modal.style.display = "none";
    }

    if (closeBtn) closeBtn.onclick = (e) => { e.preventDefault(); fecharModal(); };
    if (backdrop) backdrop.onclick = () => fecharModal();
    if (modal) modal.onclick = (e) => { if (e.target === modal) fecharModal(); };
});

/* =====================================================
   LÓGICA DOS VISTOS RECENTEMENTE (HISTÓRICO)
   ===================================================== */
function salvarVisita(id) {
    if (!id) return;
    let historico = JSON.parse(localStorage.getItem('zeidanHistorico')) || [];
    historico = historico.filter(item => item !== id);
    historico.unshift(id);
    if (historico.length > 10) historico.pop();
    localStorage.setItem('zeidanHistorico', JSON.stringify(historico));
}

function renderizarHistorico() {
    const container = document.getElementById('historicoGrid');
    const secao = document.getElementById('historico-section');
    if (!container || !secao) return;

    let idsSalvos = JSON.parse(localStorage.getItem('zeidanHistorico')) || [];
    if (idsSalvos.length === 0) { secao.style.display = 'none'; return; }

    container.innerHTML = "";
    let produtosEncontrados = 0;

    idsSalvos.forEach(savedId => {
        const p = todosProdutos.find(prod => String(prod.id_slug) === String(savedId));
        if(p) {
            produtosEncontrados++;
            const card = document.createElement("article");
            card.className = "product-card";
            let detalheHref = "produto.html?id=" + p.id_slug;
            const imgCapa = (p.Imagens && p.Imagens.length > 0) ? p.Imagens[0] : "img/placeholder.jpg";
            
            card.innerHTML = `
              <div class="product-image-wrap">
                  <a href="${detalheHref}" class="product-link">
                     <img src="${imgCapa}" alt="${p.Produto}" class="product-image" />
                  </a>
              </div>
              <a href="${detalheHref}" class="product-link-text">
                <div class="product-name">${p.Produto}</div>
                <div class="product-meta">
                  <span class="product-brand">${p.Marca}</span>
                  <span class="product-price">${p.Preco_Venda}</span>
                </div>
              </a>
              <div class="product-actions">
                <a href="${detalheHref}" class="product-btn">VER DETALHES</a>
              </div>
            `;
            container.appendChild(card);
            
            if (typeof cardObserver !== 'undefined') cardObserver.observe(card);
        }
    });

    if (produtosEncontrados === 0) secao.style.display = 'none';
    else secao.style.display = 'block';
}