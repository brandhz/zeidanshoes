/* =====================================================
   CONFIG GLOBAL
   ===================================================== */
const WHATSAPP_NUMBER = "5531991668430";
let allProducts = [];
let cart = JSON.parse(localStorage.getItem('zeidanCart')) || [];
let userSelectedSize = null;
let userSelectedColor = null;

/* =====================================================
   INICIALIZAÇÃO
   ===================================================== */
document.addEventListener("DOMContentLoaded", () => {
    loadProducts();
    updateCartUI();
    setupGlobalEventListeners();
});

async function loadProducts() {
    try {
        const response = await fetch("data.json?" + new Date().getTime());
        allProducts = await response.json();
        console.log("Produtos carregados:", allProducts.length);

        if (typeof populateBrandColumns === 'function') populateBrandColumns();

        initHomePage();

        const params = new URLSearchParams(window.location.search);
        const productId = params.get('id');

        if (productId) {
            const homeView = document.getElementById('vitrine-home');
            if (homeView) homeView.style.display = 'none';

            initProductDetails(productId);

        } else {
            const marcaSalva = localStorage.getItem("marcaSelecionada");

            if (marcaSalva) {
                console.log(">>> APLICANDO FILTRO DE MARCA:", marcaSalva);

                localStorage.removeItem("marcaSelecionada");

                if (typeof window.renderGrid === 'function') {
                    window.renderGrid(marcaSalva, "", "TODAS");
                }
            } else {
                if (window.showHomeView) window.showHomeView();
            }
        }

    } catch (error) {
        console.error("Erro Crítico no loadProducts:", error);
    }
}

/* =====================================================
   LÓGICA DA HOME
   ===================================================== */

function initHomePage() {
    console.log("Iniciando Home Page...");

    try {
        const rails = document.querySelectorAll('.horizontal-scroll-container');
        if (rails.length > 0) {
            rails.forEach(rail => {
                const categoryFilter = rail.getAttribute('data-categoria');
                const brandFilter = rail.getAttribute('data-marca');

                if (categoryFilter) {
                    renderRail(rail, categoryFilter, 'categoria');
                } else if (brandFilter) {
                    renderRail(rail, brandFilter, 'marca');
                }
            });
        }
    } catch (error) {
        console.error("Erro ao carregar trilhos:", error);
    }

    try {
        if (typeof renderHistory === 'function') {
            renderHistory();
        }
    } catch (error) {
        console.error("Erro ao carregar histórico:", error);
    }

    if (window.showHomeView) window.showHomeView();
}

/* =====================================================
   CONTROLE DE TELAS (HOME vs BUSCA)
   ===================================================== */

window.showHomeView = function () {
    const homeView = document.getElementById('vitrine-home');
    const searchView = document.getElementById('vitrine-busca');
    const input = document.getElementById('searchInput');
    const brandPanel = document.getElementById('brandPanel');
    const productDetail = document.querySelector('.product-detail');
    
    if (productDetail) productDetail.style.display = 'none';
    if (homeView) homeView.style.display = 'block';
    if (searchView) searchView.style.display = 'none';

    if (typeof renderHistory === 'function') {
        renderHistory();
    }

    if (input) input.value = "";

    if (brandPanel) brandPanel.classList.remove('open');

    window.scrollTo({ top: 0, behavior: 'smooth' });
};

/* =====================================================
   RENDER RAIL
   ===================================================== */

function renderRail(container, filterValue, filterType = 'marca') {
    if (!container) return;
    container.innerHTML = "";

    if (typeof allProducts === 'undefined' || !allProducts) return;

    const term = (filterValue || "").toUpperCase().trim();
    let filtered = [];

    if (filterType === 'categoria') {
        const categoriasAceitas = term.split(',').map(c => c.trim());

        filtered = allProducts.filter(p => {
            const catProduto = (
                p.Categoria ||
                p.categoria ||
                p.Category ||
                p.category ||
                p.Tipo ||
                p.tipo ||
                ""
            ).toUpperCase();

            return categoriasAceitas.includes(catProduto);
        });

    } else {
        if (term === "DESTAQUES") {
            filtered = allProducts.filter(p => p.Destaque === true).slice(0, 10);
            if (filtered.length === 0) filtered = allProducts.slice(0, 10);
        } else {
            filtered = allProducts.filter(p => (p.Marca || "").toUpperCase() === term);
        }
    }

    // --- RENDERIZAÇÃO ---
    if (filtered.length === 0) {
        console.log("Nenhum produto achado para:", term);
        container.innerHTML = `<p style="padding:20px; color: red;">Não achei produtos da categoria: ${term}. Verifique o cadastro.</p>`;
        return;
    } else {
        if (container.parentElement) container.parentElement.style.display = 'block';
    }

    filtered.forEach(product => {
        if (typeof createProductCard === 'function') {
            const card = createProductCard(product);
            container.appendChild(card);
        }
    });
}

/* =====================================================
   LÓGICA DOS PRODUTOS
   ===================================================== */
function initProductDetails(id) {
    const product = allProducts.find(p => p.id_slug == id);

    if (!product) {
        console.error("Product not found:", id);
        return;
    }

    const detailSection = document.querySelector('.product-detail');
    if (detailSection) {
        detailSection.style.display = 'block';
        detailSection.classList.add('visible');
    }

    const home = document.getElementById('vitrine-home');
    if (home) home.style.display = 'none';
    const search = document.getElementById('vitrine-busca');
    if (search) search.style.display = 'none';

    saveHistory(product.id_slug);

    const setRes = (id1, id2, value) => {
        const el = document.getElementById(id1) || document.getElementById(id2);
        if (el) el.innerText = value;
    };

    setRes('produtoTitulo', 'product-detail-name', product.Produto);
    setRes('produtoMarca', 'product-detail-brand', product.Marca);
    setRes('produtoPreco', 'product-detail-price', product.Preco_Venda);
    setRes('produtoDescricao', 'product-detail-desc', product.Descricao || "");
    setRes('produtoEstilo', 'product-detail-style', product.Categoria || "-");
    setRes('produtoGenero', 'product-detail-gender', product.Genero || product.genero || "Unissex");

    // INICIA GALERIA E CORES
    initGallery(product);
    renderColors(product);
    renderSizes(product);
    renderSuggestions(product);

    // CONFIGURA BOTÃO DE COMPRAR
    const btnPlace = document.getElementById('produtoWhatsapp') || document.getElementById('btn-adicionar-carrinho');

    if (btnPlace) {
        const newBtn = btnPlace.cloneNode(true);
        if (btnPlace.parentNode) btnPlace.parentNode.replaceChild(newBtn, btnPlace);

        newBtn.onclick = (e) => {
            e.preventDefault();

            // Validação de Tamanho
            if (!userSelectedSize && product.Tamanhos) {
                const errorMsg = document.getElementById('size-error');
                if (errorMsg) {
                    errorMsg.style.display = 'block';
                    errorMsg.innerText = "Por favor, selecione um tamanho!";
                } else {
                    alert("Por favor, selecione um tamanho.");
                }
                return;
            }

            window.addToCart(
                product.Marca,
                product.Produto,
                product.Preco_Venda,
                newBtn,
                userSelectedSize,
                userSelectedColor
            );
        };
    }
}

function renderSizes(product) {
    const container = document.getElementById('size-container');
    const errorMsg = document.getElementById('size-error');

    if (!container) return;

    container.innerHTML = "";

    const sizes = product.Tamanhos || ["34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44"];

    sizes.forEach(size => {
        const btn = document.createElement('div');

        btn.className = 'size-option-btn';

        btn.innerText = size;
        btn.onclick = () => {
            document.querySelectorAll('.size-option-btn').forEach(b => b.classList.remove('selected'));

            btn.classList.add('selected');

            userSelectedSize = size;

            if (errorMsg) errorMsg.style.display = 'none';
        };
        container.appendChild(btn);
    });
}

function renderColors(product) {
    const box = document.getElementById('box-cores');
    const container = document.getElementById('color-container');

    if (!box || !container) return;
    container.innerHTML = '';

    if (!product.Cores_Relacionadas || product.Cores_Relacionadas.length <= 1) {
        box.style.display = 'none';
        return;
    }
    box.style.display = 'block';

    product.Cores_Relacionadas.forEach(color => {
        const div = document.createElement('div');
        div.className = 'color-option-btn';
        div.style.backgroundColor = color.hex;
        div.title = color.nome;

        if (color.slug === product.id_slug) {
            div.classList.add('selected');
            userSelectedColor = color.nome;
        }

        div.onclick = () => {
            if (color.slug !== product.id_slug) window.location.href = `produto.html?id=${color.slug}`;
        };
        container.appendChild(div);
    });
}

/* =====================================================
   LÓGICA DO GRID E DA BUSCA
   ===================================================== */
window.renderGrid = function (brandFilter, searchTerm, categoryFilter) {
    const homeView = document.getElementById('vitrine-home');
    const searchView = document.getElementById('vitrine-busca');
    const grid = document.getElementById('grid-produtos');
    const headerContainer = document.querySelector('#vitrine-busca .section-header');

    if (homeView) homeView.style.display = 'none';

    const historico = document.getElementById('historico-section');
    if (historico) historico.style.display = 'none';

    const productDetail = document.querySelector('.product-detail');
    if (productDetail) productDetail.style.display = 'none';

    if (searchView) searchView.style.display = 'block';

    const search = (searchTerm || "").toLowerCase().trim();
    const brand = (brandFilter || "TODAS").toUpperCase();

    const results = allProducts.filter(p => {
        const pBrand = (p.Marca || "").toUpperCase();
        const pName = (p.Produto || "").toLowerCase();

        const matchBrand = brand === "TODAS" || pBrand === brand;
        const matchSearch = pName.includes(search) || pBrand.toLowerCase().includes(search);

        return matchBrand && matchSearch;
    });

    if (headerContainer) {
        let titleText = "Todos os Produtos";
        if (search) titleText = `Resultados para "${search}"`;
        else if (brand !== "TODAS") titleText = `${brand}`;

        headerContainer.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; gap: 10px; margin-bottom: 20px;">
                <h2 class="section-title" id="titulo-busca" style="font-weight: 700; font-size: 35px; margin: 0;">${titleText}</h2>
                
                <a href="#" onclick="window.showHomeView(); return false;" class="see-all-link" style="font-size: 14px; color: #555; text-decoration: none;">← Voltar para Home</a>
            </div>
        `;
    }

    if (grid) {
        grid.innerHTML = "";
        if (results.length === 0) {
            grid.innerHTML = `<div style="text-align:center; padding:40px; width:100%; grid-column: 1 / -1;">Nenhum produto encontrado.</div>`;
            return;
        }
        results.forEach(p => {
            if (typeof createProductCard === 'function') {
                const card = createProductCard(p);
                card.style.width = "100%";
                card.style.minWidth = "0";
                card.style.maxWidth = "none";
                grid.appendChild(card);
            }
        });
    }

    const panel = document.getElementById('brandPanel');
    if (panel) panel.classList.remove('open');

    window.scrollTo({ top: 0, behavior: 'smooth' });
};

/* =====================================================
   GERADOR DE CARDS
   ===================================================== */
function createProductCard(product) {
    const article = document.createElement('article');
    article.className = 'product-card';

    const img = (product.Imagens && product.Imagens.length > 0) ? product.Imagens[0] : "img/placeholder.jpg";
    const link = `produto.html?id=${product.id_slug}`;

    let parcelVal = "0,00";
    try {
        const rawPrice = parseFloat(product.Preco_Venda.replace('R$', '').replace(/\./g, '').replace(',', '.'));
        if (!isNaN(rawPrice)) parcelVal = (rawPrice / 3).toFixed(2).replace('.', ',');
    } catch (e) { }

    article.innerHTML = `
        <div class="product-image-wrap">
            <a href="${link}" class="product-link">
                <img src="${img}" alt="${product.Produto}" class="product-image" loading="lazy" />
            </a>
            ${product.Desconto ? `<span class="badge-desconto">-${product.Desconto}%</span>` : ''}
        </div>
        <a href="${link}" class="product-link-text">
            <div class="product-name" style="font-size: 20px; font-weight:800;  margin-bottom:5px; line-height:1.2;">${product.Produto}</div>
            <div class="product-meta">
                <span class="product-brand" style="color:#888; font-size:12px;">${product.Marca}</span>
                <div class="price-row" style="margin-top:8px;">
                    <div class="product-price" style="font-weight:800; font-size:20px; color:#4cae56;">${product.Preco_Venda}</div>
                    <div style="font-size:11px; color:#666;">3x R$ ${parcelVal}</div>
                </div>
            </div>
        </a>
        <div class="product-actions">
            <a href="${link}" class="product-btn" style="width:100%; text-align:center; display:block; background:#000; color:#fff; padding:10px; border-radius:4px; text-decoration:none; font-weight:bold; font-size:13px; margin-top:10px;">VER DETALHES</a>
        </div>
    `;

    return article;
}

/* =====================================================
   CARRINHO
   ===================================================== */
window.toggleCart = function () {
    const modal = document.getElementById('cart-modal');
    if (!modal) return;

    if (modal.style.display === 'flex') {
        modal.style.display = 'none';
    } else {
        modal.style.display = 'flex';
        updateCartUI();
    }
};

window.addToCart = function (brand, name, price, btnElement, size, color) {
    const item = {
        marca: brand,
        produto: name,
        preco: price,
        tamanho: size || "U",
        cor: color || ""
    };

    cart.push(item);
    updateCartUI();

    if (btnElement) {
        const originalText = btnElement.innerHTML;
        btnElement.innerHTML = "Adicionado! ✓";
        btnElement.style.background = "#2ecc71";
        btnElement.style.color = "#fff";
        setTimeout(() => {
            btnElement.innerHTML = originalText;
            btnElement.style.background = ""; 
            btnElement.style.color = "";
        }, 1500);
    }

    const modal = document.getElementById('cart-modal');
    if (modal) modal.style.display = 'flex';
};

window.removeFromCart = function (index) {
    cart.splice(index, 1);
    updateCartUI();
};

function updateCartUI() {
    localStorage.setItem('zeidanCart', JSON.stringify(cart));

    const container = document.getElementById('cart-items');
    const badge = document.getElementById('cart-count');
    const totalEl = document.getElementById('cart-total-value');

    if (badge) {
        badge.innerText = cart.length;
        badge.style.display = cart.length > 0 ? 'flex' : 'none';
    }

    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = '<p class="empty-msg" >Sua sacola está vazia</p>';
        if (totalEl) totalEl.innerText = "R$ 0,00";
        return;
    }

    let html = '';
    let total = 0;

    cart.forEach((item, idx) => {
        let val = 0;
        try { val = parseFloat(item.preco.replace('R$', '').replace(/\./g, '').replace(',', '.')); } catch (e) { }
        if (!isNaN(val)) total += val;

        html += `
            <div class="cart-item" style="display:flex; justify-content:space-between; align-items:center; padding:15px 0; border-bottom:1px solid #eee;">
                <div>
                    <div style="font-size:11px; color:#999;">${item.marca}</div>
                    <div style="font-weight:600; font-size:13px;">${item.produto}</div>
                    <div style="font-size:11px;">Tam: ${item.tamanho} ${item.cor ? '| ' + item.cor : ''}</div>
                </div>
                <div style="text-align:right;">
                    <div style="font-weight:700;">${item.preco}</div>
                    <button onclick="removeFromCart(${idx})" style="color:red; background:none; border:none; font-size:11px; cursor:pointer; text-decoration:underline;">Remover</button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
    if (totalEl) totalEl.innerText = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

window.checkoutWhatsApp = function () {
    if (cart.length === 0) return alert("Sua sacola está vazia!");

    let msg = "Olá Zeidan! Gostaria de finalizar o seguinte pedido:\n\n";
    cart.forEach(item => {
        msg += `👟 *${item.produto}*\n   Tam: ${item.tamanho} | ${item.cor}\n   Valor: ${item.preco}\n\n`;
    });

    const total = document.getElementById('cart-total-value')?.innerText || "";
    msg += `*Total do Pedido: ${total}*`;

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
};

window.finalizarNoZap = window.checkoutWhatsApp;

/* =====================================================
   VISTOS RECENTEMENTE
   ===================================================== */
function renderHistory() {
    const container = document.getElementById('historico-grid');
    const section = document.getElementById('historico-section');

    if (!container || !section) return;

    const ids = JSON.parse(localStorage.getItem('zeidanHistorico')) || [];
    const params = new URLSearchParams(window.location.search);
    const currentId = params.get('id');
    const validIds = ids.filter(id => id != currentId);

    if (validIds.length === 0) {
        section.style.display = 'none';
        return;
    }

    container.innerHTML = "";
    let count = 0;

    validIds.forEach(id => {
        const p = allProducts.find(prod => prod.id_slug == id);

        if (p) {
            count++;
            const card = createProductCard(p);
            card.style.minWidth = "160px";
            card.style.maxWidth = "180px";
            container.appendChild(card);
        }
    });

    section.style.display = (count > 0) ? 'block' : 'none';
}

function saveHistory(id) {
    if (!id) return;
    let history = JSON.parse(localStorage.getItem('zeidanHistorico')) || [];
    history = history.filter(item => String(item) !== String(id));
    history.unshift(id);
    if (history.length > 10) history.pop();
    localStorage.setItem('zeidanHistorico', JSON.stringify(history));
    renderHistory();
}

/* =====================================================
   GALERIA E SUGESTÕES
   ===================================================== */
function initGallery(product) {
    const mainImg = document.getElementById('main-product-img');
    const track = document.getElementById('thumbnails-track');

    if (!mainImg || !track) return;

    const newMainImg = mainImg.cloneNode(true);
    mainImg.parentNode.replaceChild(newMainImg, mainImg);
    const imgEl = document.getElementById('main-product-img');

    track.innerHTML = '';
    const images = (product.Imagens && product.Imagens.length > 0) ? product.Imagens : ["img/placeholder.jpg"];
    let currentIndex = 0;

    const updateView = (idx) => {
        if (idx < 0) idx = images.length - 1;
        if (idx >= images.length) idx = 0;
        currentIndex = idx;
        imgEl.src = images[currentIndex];

        document.querySelectorAll('.thumb-item').forEach(t => t.classList.remove('active'));
        const activeThumb = document.getElementById(`thumb-${idx}`);
        if (activeThumb) activeThumb.classList.add('active');
    };

    images.forEach((src, i) => {
        const thumb = document.createElement('div');
        thumb.className = `thumb-item ${i === 0 ? 'active' : ''}`;
        thumb.id = `thumb-${i}`;
        thumb.innerHTML = `<img src="${src}" style="width:100%;height:100%;object-fit:cover">`;
        thumb.onclick = (e) => { e.stopPropagation(); updateView(i); };
        track.appendChild(thumb);
    });

    imgEl.src = images[0];

    let startX = 0;
    imgEl.addEventListener('touchstart', e => startX = e.changedTouches[0].screenX, { passive: true });
    imgEl.addEventListener('touchend', e => {
        const endX = e.changedTouches[0].screenX;
        if (endX < startX - 50) updateView(currentIndex + 1);
        if (endX > startX + 50) updateView(currentIndex - 1);
    }, { passive: true });

    imgEl.addEventListener('click', () => {
        const modal = document.getElementById("imageModal");
        const modalImg = document.getElementById("imageModalImg");
        if (modal && modalImg) {
            modalImg.src = imgEl.src;
            modal.style.display = 'flex';
        }
    });
}

/* =====================================================
   SUGESTÕES
   ===================================================== */
function renderSuggestions(currentProduct) {
    const box = document.getElementById("box-sugestoes");
    const list = document.getElementById("lista-sugestoes");

    if (!box || !list) {
        console.error("ERRO: Não achei 'box-sugestoes' ou 'lista-sugestoes' no HTML.");
        return;
    }

    list.innerHTML = "";
    box.style.display = "none"; 

    const categoriaAtual = (
        currentProduct.Categoria ||
        currentProduct.categoria ||
        currentProduct.Category ||
        currentProduct.category ||
        currentProduct.Tipo ||
        ""
    ).toUpperCase();

    console.log("🔍 Produto Atual:", currentProduct.Produto);
    console.log("📂 Categoria Detectada:", categoriaAtual);

    let related = [];

    if (categoriaAtual && categoriaAtual !== "" && categoriaAtual !== "-") {
        related = allProducts.filter(p => {
            const catP = (p.Categoria || p.categoria || p.Category || p.category || p.Tipo || "").toUpperCase();
            return catP === categoriaAtual && p.id_slug !== currentProduct.id_slug;
        });
        console.log(`✅ Achei ${related.length} produtos pela categoria '${categoriaAtual}'`);
    }

    if (related.length < 4) {
        console.log("⚠️ Poucos produtos da categoria. Buscando por Marca...");
        const porMarca = allProducts.filter(p =>
            p.Marca === currentProduct.Marca &&
            p.id_slug !== currentProduct.id_slug
        );

        porMarca.forEach(p => {
            if (!related.includes(p)) related.push(p);
        });
    }

    related = related.slice(0, 10);

    // RENDERIZA
    if (related.length > 0) {
        box.style.display = "block"; // Mostra a caixa
        console.log("🎨 Desenhando sugestões na tela...");

        related.forEach(p => {
            const img = (p.Imagens && p.Imagens.length > 0) ? p.Imagens[0] : "img/placeholder.jpg";

            const div = document.createElement('div');
            // CSS Inline forçado para garantir visualização
            div.style.cssText = "min-width:140px; margin-right:15px; cursor:pointer; display:inline-block; vertical-align:top;";

            div.innerHTML = `
               <a href="produto.html?id=${p.id_slug}" style="text-decoration:none; color:inherit; display:flex; flex-direction:column; align-items:center;">
                  <div style="width:140px; height:140px; background:#fff; border-radius:10px; overflow:hidden; border:1px solid #eee; display:flex; align-items:center; justify-content:center;">
                    <img src="${img}" style="width:100%; height:100%; object-fit:contain;">
                  </div>
                  <div style="font-size:12px; font-weight:bold; margin-top:8px; text-align:center; line-height:1.2; max-width:140px;">
                    ${p.Produto}
                  </div>
                  <div style="font-size:13px; color:#4cae56; font-weight:700; margin-top:2px;">
                    ${p.Preco_Venda}
                  </div>
               </a>
            `;
            list.appendChild(div);
        });
    } else {
        console.warn("❌ Nenhuma sugestão encontrada (nem categoria, nem marca).");
    }
}

/* =====================================================
   EVENTOS GLOBAIS & MARCAS
   ===================================================== */
function setupGlobalEventListeners() {
    // Lógica do Painel de Marcas ---
    const btnBrands = document.getElementById('brandsToggle');
    const panelBrands = document.getElementById('brandPanel');

    if (btnBrands && panelBrands) {
        // Preenche as marcas
        populateBrandColumns();

        // Clique no botão "Marcas"
        btnBrands.addEventListener('click', (e) => {
            e.stopPropagation(); // Impede que o clique feche o menu imediatamente
            panelBrands.classList.toggle('open');
        });

        // Clique fora para fechar
        document.addEventListener('click', (e) => {
            if (panelBrands.classList.contains('open')) {
                if (!panelBrands.contains(e.target) && e.target !== btnBrands) {
                    panelBrands.classList.remove('open');
                }
            }
        });
    }

    // Lógica da Busca ---
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.querySelector('.search-btn');

    if (searchInput && searchBtn) {
        const doSearch = () => {
            if (searchInput.value.trim() !== "") {
                window.renderGrid("TODAS", searchInput.value, "TODAS");
            }
        };

        searchBtn.addEventListener('click', doSearch);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') doSearch();
        });
    }

    // Botão Início (Reset) ---
    const btnHome = document.getElementById('homeLink');
    if (btnHome) {
        btnHome.onclick = (e) => {
            e.preventDefault();
            window.showHomeView();
        };
    }

    // --- Clique no X ou fora da imagem para fechar 
    const modal = document.getElementById("imageModal");
    const closeBtn = document.getElementById("imageModalClose");
    const backdrop = document.querySelector(".image-modal-backdrop");

    if (modal) {
        // Fechar clicando no X
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                modal.style.display = 'none';
            });
        }

        // Fechar clicando no fundo escuro (backdrop)
        if (backdrop) {
            backdrop.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }

        // 3. Segurança: Fechar clicando na área vazia do modal
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
}

function populateBrandColumns() {
    const container = document.getElementById('brandColumns');
    if (!container) return;

    // Pega marcas únicas do JSON
    const brands = [...new Set(allProducts.map(p => p.Marca))].sort();

    // Se não tiver marcas carregadas ainda, para.
    if (brands.length === 0) return;

    container.innerHTML = "";

    // Cria lista simples
    const ul = document.createElement('ul');
    ul.style.listStyle = "none";
    ul.style.padding = "0";
    ul.style.margin = "0"; 

    brands.forEach(brand => {
        const li = document.createElement('li');
        li.innerText = brand;
        li.style.padding = "2px 0"; // Espaçamento melhor para toque
        li.style.cursor = "pointer";
        li.style.color = "#fff";

        li.onclick = () => {
            // Ao clicar na marca, filtra e fecha o painel
            window.renderGrid(brand, "", "TODAS");
        };

        // Efeito visual simples
        li.onmouseover = () => li.style.color = "#000";
        li.onmouseout = () => li.style.color = "#333";

        ul.appendChild(li);
    });

    container.appendChild(ul);
}

const sliders = document.querySelectorAll('.scroll-arrastavel');
let isDown = false;
let startX;
let scrollLeft;

sliders.forEach(slider => {
    // Quando clica o mouse
    slider.addEventListener('mousedown', (e) => {
        isDown = true;
        slider.classList.add('active');
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
    });

    // Quando o mouse sai da área ou solta o clique
    slider.addEventListener('mouseleave', () => {
        isDown = false;
        slider.classList.remove('active');
    });

    slider.addEventListener('mouseup', () => {
        isDown = false;
        slider.classList.remove('active');
    });

    // Quando move o mouse (enquanto segura o clique)
    slider.addEventListener('mousemove', (e) => {
        if (!isDown) return; // Se não tiver clicado, não faz nada
        e.preventDefault();  
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX) * 2; 
        slider.scrollLeft = scrollLeft - walk;
    });
});

/* =====================================================
   LÓGICA DE COMPARTILHAMENTO (BLINDADA CONTRA HTTP)
   ===================================================== */
const btnShare = document.getElementById('btnCompartilhar');

if (btnShare) {
    btnShare.addEventListener('click', async () => {
        const shareData = {
            title: document.title, 
            text: 'Dá uma olhada nesse produto que achei:',
            url: window.location.href
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.log('Compartilhamento cancelado ou erro:', err);
            }
        }
        else {
            copiarLinkResiliente(window.location.href);
        }
    });
}

// Função Auxiliar que copia mesmo sem HTTPS
function copiarLinkResiliente(texto) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(texto)
            .then(() => alert("Link copiado para a área de transferência!"))
            .catch(() => tentarMetodoAntigo(texto)); 
    } else {
        tentarMetodoAntigo(texto);
    }
}

function tentarMetodoAntigo(texto) {
    const textArea = document.createElement("textarea");
    textArea.value = texto;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        const successful = document.execCommand('copy');
        const msg = successful ? 'Link copiado!' : 'Não foi possível copiar o link.';
        alert(msg);
    } catch (err) {
        alert('Opa, não consegui copiar o link. Tente copiar manualmente da barra de endereço.');
    }

    document.body.removeChild(textArea);
}
