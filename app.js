let baseDatos = { ingredientes_nevera: [], recetas: [] };
let paginaActual = 1;
const itemsPorPagina = 12;

// Almacenes globales para los estados de los motores rápidos
let filtroBotonActivo = { tipo: null, valor: null };
let filtroVecinoActivo = "";

const limpiarTexto = (texto) => {
    return texto ? texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";
};

async function inicializarSistema() {
    try {
        const respuesta = await fetch('recetas.json');
        baseDatos = await respuesta.json();
    } catch (e) {
        console.log("Modo local de contingencia activo.");
        baseDatos = {
            ingredientes_nevera: ["Aceite", "Ajo", "Arroz", "Azúcar", "Berenjena", "Calabacín", "Cebolla", "Chocolate", "Harina", "Huevo", "Leche", "Limón", "Mantequilla", "Nata", "Pan", "Patata", "Pera", "Pescado", "Pimiento", "Pollo", "Puerro", "Queso", "Sal", "Tomate", "Vinagre", "Yogur", "Zanahoria", "Zumo", "Miel"],
            recetas: [] // ¡Limpiado a cero! Solo saldrá lo que pongas en el recetas.json
        };
    }
    baseDatos.ingredientes_nevera.sort((a, b) => a.localeCompare('es'));
    renderizarNevera();
    actualizarSelectorVecinos();
    comprobarRutaNavegacion();
}

function comprobarRutaNavegacion() {
    const parametros = new URLSearchParams(window.location.search);
    const idReceta = parametros.get('id');
    if (idReceta) {
        mostrarFichaRecetaUnica(parseInt(idReceta));
    } else {
        mostrarCatalogoGeneral();
    }
}

function mostrarCatalogoGeneral() {
    document.getElementById('modulo-detalle').style.display = 'none';
    document.getElementById('modulo-principal').style.display = 'block';
    filtrarYMostrarRecetas();
}

function verDetalleReceta(id) {
    window.history.pushState({}, '', `?id=${id}`);
    mostrarFichaRecetaUnica(id);
}

function irAlInicio() {
    window.history.pushState({}, '', window.location.pathname);
    mostrarCatalogoGeneral();
}

function mostrarFichaRecetaUnica(id) {
    const receta = baseDatos.recetas.find(r => r.id === id);
    const contenedorPrincipal = document.getElementById('modulo-principal');
    const contenedorDetalle = document.getElementById('modulo-detalle');
    const cajaContenido = document.getElementById('detalle-contenido');

    if (!receta) {
        cajaContenido.innerHTML = `<h3>⚠️ Error operativos: El plato no consta en los registros.</h3>`;
        contenedorPrincipal.style.display = 'none';
        contenedorDetalle.style.display = 'block';
        return;
    }

    contenedorPrincipal.style.display = 'none';
    contenedorDetalle.style.display = 'block';

    cajaContenido.innerHTML = `
        <h2 style="color: var(--primary); font-family: inherit;">${receta.titulo}</h2>
                <p class="autor" style="font-size: 1.1em; margin-bottom: 20px;">
                    Receta compartida por: 
                    <strong class="clicable" onclick="buscarPorAutorCruzado('${receta.autor}')" style="cursor: pointer; color: var(--primary); text-decoration: underline;">
                        ${receta.autor} 🔍
                    </strong>
                </p>
        <div class="meta-datos" style="margin: 15px 0;">
            <span class="badge categoria" style="font-size: 0.9em; padding: 5px 12px;">📁 ${receta.categoria || 'Plato'}</span>
            <span class="badge" style="font-size: 0.9em; padding: 5px 12px;">⏱️ ${receta.tiempo || '--'} min</span>
            <span class="badge" style="font-size: 0.9em; padding: 5px 12px;">👥 ${receta.raciones || '--'} raciones</span>
            <span class="badge" style="font-size: 0.9em; padding: 5px 12px;">📊 Dificultad: ${receta.dificultad || 'Media'}</span>
        </div>
        <h3 style="font-family: system-ui, sans-serif; font-size: 1.1em; color: #7a7167; text-transform: uppercase;">Ingredientes (Pincha uno para buscar platos relacionados):</h3>
        <div class="tags" style="margin-bottom: 25px;">
            ${receta.ingredientes.map(i => `
                <span class="tag clicable" onclick="buscarPorIngredienteCruzado('${i}')" style="font-size: 0.95em; padding: 5px 14px; margin-bottom: 5px;">
                    ${i} 🔍
                </span>
            `).join('')}
        </div>
        <h3 style="font-family: system-ui, sans-serif; font-size: 1.1em; color: #7a7167; text-transform: uppercase;">Modo de preparación paso a paso:</h3>
        <div class="pasos-caja">${receta.pasos.replace(/\n/g, '<br>')}</div>
    `;
    window.scrollTo(0, 0);
}

function buscarPorIngredienteCruzado(ingrediente) {
    irAlInicio();
    document.getElementById('motor-busqueda').value = ingrediente;
    filtrarYMostrarRecetas();
}
function renderizarNevera() {
    const contenedor = document.getElementById('contenedor-ingredientes');
    if (!contenedor) return;
    contenedor.innerHTML = '';
    baseDatos.ingredientes_nevera.forEach(ing => {
        const div = document.createElement('div');
        div.className = 'checkbox-item';
        div.innerHTML = `<label><input type="checkbox" value="${ing}" onchange="filtrarYMostrarRecetas()"> ${ing}</label>`;
        contenedor.appendChild(div);
    });
}

function actualizarSelectorVecinos() {
    const selector = document.getElementById('selector-autor');
    if (!selector) return;
    const autores = [...new Set(baseDatos.recetas.map(r => r.autor))].sort();
    selector.innerHTML = '<option value="">📋 Ver todas las autorías...</option>';
    autores.forEach(autor => {
        const opt = document.createElement('option');
        opt.value = autor;
        opt.textContent = autor;
        selector.appendChild(opt);
    });
}

function filtrarPorBoton(tipo, valor) {
    const botones = document.querySelectorAll('.btn-filto:not(.btn-reset)');
    botones.forEach(b => b.classList.remove('activo'));
    if (filtroBotonActivo.tipo === tipo && filtroBotonActivo.valor === valor) {
        filtroBotonActivo = { tipo: null, valor: null };
    } else {
        filtroBotonActivo = { tipo: tipo, valor: valor };
        const btnPinchado = Array.from(botones).find(b => b.textContent.includes(valor) || (valor === 'exprés' && b.textContent.includes('Exprés')) || (valor === 'lento' && b.textContent.includes('Fuego Lento')));
        if (btnPinchado) btnPinchado.classList.add('activo');
    }
    paginaActual = 1;
    filtrarYMostrarRecetas();
}

function filtrarPorVecino(autor) {
    filtroVecinoActivo = autor;
    paginaActual = 1;
    filtrarYMostrarRecetas();
}

function limpiarTodosLosFiltros() {
    document.getElementById('motor-busqueda').value = "";
    const checkboxes = document.querySelectorAll('#contenedor-ingredientes input');
    checkboxes.forEach(cb => cb.checked = false);
    const selector = document.getElementById('selector-autor');
    if (selector) selector.value = "";
    filtroBotonActivo = { tipo: null, valor: null };
    filtroVecinoActivo = "";
    const botones = document.querySelectorAll('.btn-filto');
    botones.forEach(b => b.classList.remove('activo'));
    paginaActual = 1;
    filtrarYMostrarRecetas();
}

function filtrarYMostrarRecetas() {
    const textoBusqueda = limpiarTexto(document.getElementById('motor-busqueda').value);
    const checkboxes = document.querySelectorAll('#contenedor-ingredientes input:checked');
    const ingredientesBuscados = Array.from(checkboxes).map(cb => cb.value);

    const recetasFiltradas = baseDatos.recetas.filter(receta => {
        const enTitulo = limpiarTexto(receta.titulo).includes(textoBusqueda);
        const enAutor = limpiarTexto(receta.autor).includes(textoBusqueda);
        const enCategoria = limpiarTexto(receta.categoria || "").includes(textoBusqueda);
        const enIngredientes = receta.ingredientes.some(ing => limpiarTexto(ing).includes(textoBusqueda));
        const pasaTexto = enTitulo || enAutor || enIngredientes || enCategoria;

        const pasaNevera = ingredientesBuscados.length === 0 || 
            ingredientesBuscados.every(ing => receta.ingredientes.includes(ing));

        const pasaVecino = !filtroVecinoActivo || receta.autor === filtroVecinoActivo;

        let pasaBotones = true;
        if (filtroBotonActivo.tipo === 'categoria') {
            pasaBotones = receta.categoria === filtroBotonActivo.valor;
        } else if (filtroBotonActivo.tipo === 'dificultad') {
            pasaBotones = receta.dificultad === filtroBotonActivo.valor;
        } else if (filtroBotonActivo.tipo === 'tiempo') {
            const minutos = parseInt(receta.tiempo) || 0;
            if (filtroBotonActivo.valor === 'exprés') pasaBotones = minutos <= 30;
            if (filtroBotonActivo.valor === 'lento') pasaBotones = minutos >= 60;
        }

        return pasaTexto && pasaNevera && pasaVecino && pasaBotones;
    });

    const totalItems = recetasFiltradas.length;
    const totalPaginas = Math.ceil(totalItems / itemsPorPagina) || 1;
    if (paginaActual > totalPaginas) paginaActual = totalPaginas;

    const inicio = (paginaActual - 1) * itemsPorPagina;
    const fin = inicio + itemsPorPagina;
    const itemsPagina = recetasFiltradas.slice(inicio, fin);

    const contenedorRecetas = document.getElementById('recetas-display');
    if (!contenedorRecetas) return;
    contenedorRecetas.innerHTML = '';

    if(itemsPagina.length === 0) {
        contenedorRecetas.innerHTML = '<p style="font-style: italic; color: #7a7167; grid-column: 1/-1; text-align: center; margin-top: 20px;">No constan platos en La Aldea con los criterios combinados.</p>';
    } else {
        itemsPagina.forEach(receta => {
            const card = document.createElement('div');
            card.className = 'receta-card';
            card.innerHTML = `
                <div>
                    <h3 style="cursor: pointer; color: var(--primary);" 
                        onclick="verDetalleReceta(${receta.id})" 
                        onmouseover="this.style.textDecoration='underline'" 
                        onmouseout="this.style.textDecoration='none'">
                        ${receta.titulo}
                    </h3>
                    <p class="autor">Por: ${receta.autor}</p>
                    <div class="meta-datos">
                        <span class="badge categoria">${receta.categoria || 'Plato'}</span>
                        <span class="badge">⏱️ ${receta.tiempo || '--'} min</span>
                        <span class="badge">👥 ${receta.raciones || '--'} raciones</span>
                        <span class="badge">📊 ${receta.dificultad || 'Media'}</span>
                    </div>
                    <div class="tags">${receta.ingredientes.map(i => `<span class="tag">${i}</span>`).join('')}</div>
                </div>
                <button class="btn-ver" onclick="verDetalleReceta(${receta.id})">Ver Receta Completa →</button>
            `;
            contenedorRecetas.appendChild(card);
        });
    }

    const contenedorPaginacion = document.getElementById('paginacion-controles');
    if (!contenedorPaginacion) return;
    contenedorPaginacion.innerHTML = '';
    for (let i = 1; i <= totalPaginas; i++) {
        const btn = document.createElement('button');
        btn.innerText = i;
        if (i === paginaActual) btn.style.background = '#b85a38';
        btn.addEventListener('click', () => {
            paginaActual = i;
            filtrarYMostrarRecetas();
        });
        contenedorPaginacion.appendChild(btn);
    }
}

document.getElementById('form-receta').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const titulo = document.getElementById('titulo').value.trim();
    const autor = document.getElementById('autor').value.trim();
    const categoria = document.getElementById('categoria').value;
    const tiempo = document.getElementById('tiempo').value;
    const raciones = document.getElementById('raciones').value;
    const difica = document.getElementById('dificultad').value;
    const pasos = document.getElementById('pasos').value.trim();
    
    const checkboxes = document.querySelectorAll('#contenedor-ingredientes input:checked');
    const ingredientesSeleccionados = Array.from(checkboxes).map(cb => cb.value);

    if (ingredientesSeleccionados.length === 0) {
        alert("¡Error operativo! Debes seleccionar al menos un ingrediente de la nevera.");
        return;
    }

    const nuevaReceta = {
        id: Date.now(),
        titulo: titulo,
        autor: autor,
        categoria: categoria,
        tiempo: tiempo,
        raciones: raciones,
        dificultad: difica,
        ingredientes: ingredientesSeleccionados,
        pasos: pasos
    };

    baseDatos.recetas.unshift(nuevaReceta);
    this.reset();
    paginaActual = 1;
    cerrarFormulario();
    actualizarSelectorVecinos();
    filtrarYMostrarRecetas();
    alert("📡 Plato enviado con éxito de forma autónoma. Sincronizando en la red de La Aldea.");
});

document.getElementById('motor-busqueda').addEventListener('keyup', () => {
    paginaActual = 1;
    filtrarYMostrarRecetas();
});

window.addEventListener('popstate', comprobarRutaNavegacion);

function abrirFormulario() {
    document.getElementById('modal-subida').style.display = 'block';
}

function cerrarFormulario() {
    document.getElementById('modal-subida').style.display = 'none';
}

window.onload = inicializarSistema;
function buscarPorAutorCruzado(autor) {
    irAlInicio();
    filtrarPorVecino(autor);
    const selector = document.getElementById('selector-autor');
    if (selector) selector.value = autor;
}
