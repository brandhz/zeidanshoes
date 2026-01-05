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
   LÓGICA DO CARRINHO (ATUALIZADA COM COR)
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
        let corHtml = item.cor ? `<div style="font-size:11px; color:#666;">Cor: ${item.cor}</div>` : '';

        html += `
            <div class="cart-item" style="display:flex; justify-content:space-between; align-items:center; padding:15px 0; border-bottom:1px solid #eee;">
                <div style="flex:1; padding-right:10px;">
                    <div style="font-size:10px; color:#999; text-transform:uppercase; font-weight:700; margin-bottom:2px;">${item.marca}</div>
                    <div style="font-weight:600; font-size:13px; color:#000; line-height:1.3;">${nomeExibicao} ${tamanhoHtml}</div>
                    ${corHtml}
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

window.adicionarAoCarrinho = function(marca, produto, preco, botao, tamanho, cor) {
    const corFinal = cor || ""; 
    carrinho.push({ marca, produto, preco, tamanho, cor: corFinal });
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
    
    // Fecha o menu zap se estiver aberto
    const menuZap = document.getElementById('whatsappMenu');
    if(menuZap && menuZap.style.display === 'block') menuZap.style.display = 'none';

    if (!modal) return;
    
    if (modal.style.display === 'flex') {
        modal.style.display = 'none';
        if(widgetZap) widgetZap.style.display = 'block';
    } else {
        modal.style.display = 'flex';
        //if(widgetZap) widgetZap.style.display = 'none'; // Opcional: esconder o zap quando abre o carrinho
        atualizarCarrinhoUI();
    }
};

window.finalizarNoZap = function() {
    if (carrinho.length === 0) return alert("Sua sacola está vazia!");
    
    let msg = "Olá Zeidan! Gostaria de fechar este pedido:\n\n";
    carrinho.forEach(item => {
        msg += `👟 *${item.produto}*\n`;
        if(item.marca) msg += `   Marca: ${item.marca}\n`;
        if(item.cor)   msg += `   🎨 Cor: ${item.cor}\n`;
        if(item.tamanho) msg += `   📏 Tam: ${item.tamanho}\n`;
        msg += `   💰 Valor: ${item.preco}\n`;
        msg += `--------------------\n`;
    });
    
    let total = document.getElementById('cart-total-value')?.innerText || "";
    if(total) msg += `\n*Total: ${total}*`;

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
        renderizarHistorico(); 
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
   RENDERIZAÇÃO DA HOME
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
   DETALHES DO PRODUTO (CORRIGIDO)
   ===================================================== */
function carregarDetalhesDoProduto(id) {
    salvarVisita(id); 
    let p = todosProdutos.find(item => item.id_slug === id);
    if (!p) return;

    // 1. Textos
    document.title = `${p.Produto} | Zeidan Shoes`;
    if(document.getElementById('produtoTitulo')) document.getElementById('produtoTitulo').innerText = p.Produto;
    if(document.getElementById('produtoMarca')) document.getElementById('produtoMarca').innerText = p.Marca;
    if(document.getElementById('produtoPreco')) document.getElementById('produtoPreco').innerText = p.Preco_Venda;
    if(document.getElementById('produtoDescricao')) document.getElementById('produtoDescricao').innerText = p.Descricao || "";
    
    if(document.getElementById('produtoEstilo')) document.getElementById('produtoEstilo').innerText = p.Categoria || "Casual";
    if(document.getElementById('produtoGenero')) document.getElementById('produtoGenero').innerText = detectarGenero(p);

    // 2. Visuais
    if(window.renderizarCores) window.renderizarCores(p);
    if(window.montarGaleria) window.montarGaleria(p);

    // 3. Tamanhos
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
                window.tamanhoSelecionadoPeloUsuario = tam; 
                if(erroSize) erroSize.style.display = 'none';
            };
            sizeContainer.appendChild(btn);
        });
    }

    // 4. DESCOBRIR A COR ATUAL
    let nomeCorAtual = "";
    if (p.Cores_Relacionadas) {
        const corEncontrada = p.Cores_Relacionadas.find(c => c.slug === p.id_slug);
        if (corEncontrada) {
            nomeCorAtual = corEncontrada.nome; 
        }
    }

    // 5. BOTÕES
    const btnZap = document.getElementById('btnZapDireto');
    if (btnZap) {
        btnZap.onclick = function(e) {
            e.preventDefault();
            if (p.Tamanhos && p.Tamanhos.length > 0 && !window.tamanhoSelecionadoPeloUsuario) {
                alert("⚠️ Por favor, selecione um tamanho.");
                if(erroSize) erroSize.style.display = 'block';
                return;
            }
            let msg = `Olá Zeidan! Quero comprar o *${p.Produto}*`;
            if (nomeCorAtual) msg += `\n🎨 Cor: ${nomeCorAtual}`; 
            if (window.tamanhoSelecionadoPeloUsuario) msg += `\n📏 Tam: ${window.tamanhoSelecionadoPeloUsuario}`;
            
            let numero = window.WHATSAPP_NUMBER || "5531991668430";
            window.open(`https://wa.me/${numero}?text=${encodeURIComponent(msg)}`, '_blank');
        };
    }

    const btnCart = document.getElementById('btnAddCarrinho');
    
    const acaoAdicionar = function(botaoClicado) {
        if (p.Tamanhos && p.Tamanhos.length > 0 && !window.tamanhoSelecionadoPeloUsuario) {
            alert("⚠️ Selecione um tamanho para adicionar à sacola.");
            if(erroSize) erroSize.style.display = 'block';
            return;
        }
        if (window.adicionarAoCarrinho) {
            window.adicionarAoCarrinho(
                p.Marca, 
                p.Produto, 
                p.Preco_Venda, 
                botaoClicado, 
                window.tamanhoSelecionadoPeloUsuario,
                nomeCorAtual 
            );
            if(window.toggleCart) window.toggleCart();
        }
    };

    if (btnCart) {
        btnCart.onclick = function(e) {
            e.preventDefault();
            acaoAdicionar(this);
        };
    } else {
        const btnAntigo = document.getElementById('produtoWhatsapp');
        if(btnAntigo) {
            btnAntigo.innerHTML = 'ADICIONAR À SACOLA <i class="fa-solid fa-cart-shopping"></i>';
            btnAntigo.onclick = function(e) {
                e.preventDefault();
                acaoAdicionar(this);
            };
        }
    }
    
    if(window.carregarSugestoes) window.carregarSugestoes(p);
}

/* =====================================================
   GALERIA COM SWIPE
   ===================================================== */
window.montarGaleria = function(produto) {
    const mainImg = document.getElementById('main-product-img');
    const track = document.getElementById('thumbnails-track');
    
    if (!mainImg || !track) return;

    const novoMainImg = mainImg.cloneNode(true);
    mainImg.parentNode.replaceChild(novoMainImg, mainImg);
    const imgElement = document.getElementById('main-product-img'); 

    track.innerHTML = '';

    let lista = (produto.Imagens && produto.Imagens.length > 0) ? produto.Imagens : ["img/placeholder.jpg"];
    let indiceAtual = 0;

    function atualizarFoto(index) {
        if (index < 0) index = lista.length - 1;
        if (index >= lista.length) index = 0;
        
        indiceAtual = index; 
        imgElement.src = lista[indiceAtual]; 

        document.querySelectorAll('.thumb-item').forEach(el => el.classList.remove('active'));
        const ativo = document.getElementById(`thumb-idx-${indiceAtual}`);
        if(ativo) ativo.classList.add('active');
    }

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

    imgElement.src = lista[0];

    // SWIPE
    let touchStartX = 0;
    let touchEndX = 0;

    imgElement.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
    }, {passive: true});

    imgElement.addEventListener('touchend', function(e) {
        touchEndX = e.changedTouches[0].screenX;
        if (touchEndX < touchStartX - 50) atualizarFoto(indiceAtual + 1);
        if (touchEndX > touchStartX + 50) atualizarFoto(indiceAtual - 1);
    }, {passive: true});

    imgElement.addEventListener('click', () => {
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

/* =====================================================
   OUTRAS FUNÇÕES (SUGESTÕES, MARCAS, HISTÓRICO)
   ===================================================== */
function carregarSugestoes(produtoAtual) {
    const listaSugestoes = document.getElementById("lista-sugestoes");
    const boxSugestoes = document.getElementById("box-sugestoes");
    if(!listaSugestoes || !boxSugestoes) return;
    
    listaSugestoes.innerHTML = "";
    boxSugestoes.style.display = "none";

    const relacionados = todosProdutos.filter(item => item.Marca === produtoAtual.Marca && item.id_slug !== produtoAtual.id_slug).slice(0, 5);

    if (relacionados.length > 0) {
        boxSugestoes.style.display = "block";
        relacionados.forEach(sugestao => {
            const linkHref = sugestao.id_slug ? `produto.html?id=${sugestao.id_slug}` : "#";
            const imgCapa = (sugestao.Imagens && sugestao.Imagens.length > 0) ? sugestao.Imagens[0] : "img/placeholder.jpg";
            const div = document.createElement('div');
            div.style.cssText = "min-width:140px; margin-right:15px;";
            div.innerHTML = `
                <a href="${linkHref}" style="text-decoration:none; color:inherit; display:flex; flex-direction:column; align-items:center;">
                    <div style="width:140px; height:140px; background:#f9f9f9; border-radius:10px; display:flex; align-items:center; justify-content:center; overflow:hidden;">
                        <img src="${imgCapa}" style="width:100%; height:100%; object-fit:cover;">
                    </div>
                    <div style="font-size:12px; font-weight:bold; margin-top:8px; text-align:center;">${sugestao.Produto}</div>
                </a>
            `;
            listaSugestoes.appendChild(div);
        });
    }
}

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
            `;
            container.appendChild(card);
            if (typeof cardObserver !== 'undefined') cardObserver.observe(card);
        }
    });

    if (produtosEncontrados === 0) secao.style.display = 'none';
    else secao.style.display = 'block';
}

function salvarVisita(id) {
    if (!id) return;
    let historico = JSON.parse(localStorage.getItem('zeidanHistorico')) || [];
    historico = historico.filter(item => item !== id);
    historico.unshift(id);
    if (historico.length > 10) historico.pop();
    localStorage.setItem('zeidanHistorico', JSON.stringify(historico));
}

/* =====================================================
   FUNÇÃO DE CORES (NOVO)
   ===================================================== */
function renderizarCores(produtoAtual) {
    const boxCores = document.getElementById('box-cores');
    const container = document.getElementById('color-container');
    const nomeCorSpan = document.getElementById('nome-cor-selecionada');

    if (!boxCores || !container) return;
    container.innerHTML = ''; 

    if (!produtoAtual.Cores_Relacionadas || produtoAtual.Cores_Relacionadas.length <= 1) {
        boxCores.style.display = 'none';
        return;
    }
    boxCores.style.display = 'block';

    produtoAtual.Cores_Relacionadas.forEach(cor => {
        const divCor = document.createElement('div');
        divCor.className = 'color-option-btn'; 
        divCor.style.backgroundColor = cor.hex;
        divCor.title = cor.nome; 
        if (cor.hex.toUpperCase() === '#FFFFFF' || cor.hex === '#fff') {
            divCor.style.border = '1px solid #ccc';
        }
        if (cor.slug === produtoAtual.id_slug) {
            divCor.classList.add('selected'); 
            if(nomeCorSpan) nomeCorSpan.innerText = cor.nome; 
        } 
        divCor.onclick = function() {
            if (cor.slug !== produtoAtual.id_slug) window.location.href = `produto.html?id=${cor.slug}`;
        };
        container.appendChild(divCor);
    });
}

/* =====================================================
   WIDGET WHATSAPP
   ===================================================== */
window.toggleZap = function() {
    const menu = document.getElementById('whatsappMenu');
    if (!menu) return;
    if (menu.style.display === 'block') menu.style.display = 'none';
    else menu.style.display = 'block';
};

window.abrirZap = function(tipo) {
    let numero = window.WHATSAPP_NUMBER;
    let msg = "";
    if (tipo === 'vendas') msg = "Olá Zeidan! Gostaria de ver o catálogo e tirar dúvidas.";
    if (tipo === 'suporte') msg = "Olá! Preciso de suporte sobre um pedido.";
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(msg)}`, '_blank');
};

document.addEventListener('DOMContentLoaded', function() {
    const btnZapFloat = document.querySelector('.whatsapp-btn');
    const btnFechar = document.querySelector('.zap-close');
    const menuZap = document.getElementById('whatsappMenu');

    if (btnZapFloat) btnZapFloat.onclick = window.toggleZap;
    if (btnFechar) btnFechar.onclick = window.toggleZap;
    
    // Fechar ao clicar fora
    document.addEventListener('click', function(event) {
        const widget = document.querySelector('.whatsapp-widget');
        if (widget && !widget.contains(event.target) && menuZap && menuZap.style.display === 'block') {
             menuZap.style.display = 'none';
        }
    });

    // Filtros e Categorias
    if (categoryButtons && categoryButtons.length > 0) {
        categoryButtons.forEach(btn => {
            btn.addEventListener("click", () => {
                categoryButtons.forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                renderCards("TODAS", searchInput ? searchInput.value : "", btn.getAttribute("data-cat"));
            });
        });
    }
    
    // Menu Marcas
    if (brandsToggle && brandPanel) {
        brandsToggle.addEventListener("click", (e) => {
            e.stopPropagation(); e.preventDefault();
            brandPanel.classList.toggle("open");
        });
        document.addEventListener("click", (e) => {
            if (!brandPanel.contains(e.target) && e.target !== brandsToggle) brandPanel.classList.remove("open");
        });
    }

    // Modal Imagem (Fechar)
    const modal = document.getElementById("imageModal");
    const closeBtn = document.getElementById("imageModalClose");
    const backdrop = document.querySelector(".image-modal-backdrop");
    function fecharModal() { if(modal) modal.style.display = "none"; }
    if (closeBtn) closeBtn.onclick = (e) => { e.preventDefault(); fecharModal(); };
    if (backdrop) backdrop.onclick = () => fecharModal();
    if (modal) modal.onclick = (e) => { if (e.target === modal) fecharModal(); };
});

// INICIALIZAR
loadProducts();

