// ==========================================
// 1. CEREBRO CENTRAL DE "OÍDO COCINA" - BLOQUE 1 (ARRANQUE Y BASE DE DATOS)
// ==========================================
const SUPABASE_URL = 'https://supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnbndsbG90d2ZzbGljeXh4amRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDUwMTI3MDMsImV4cCI6MjAyMTAxMjcwM30.YYWmpAQA_slA4X1UW4_nstcUVBF0r1MyxzUuDunvE6A';

// La aduana o lavadora de texto para evitar inyecciones maliciosas (XSS)
function limpiarTexto(texto) {
    if (!texto) return '';
    return String(texto)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;");
}

let baseDatos = { recetas: [] };
let paginaActual = 1;
const recetasPorPagina = 12;
let filtroAutorActual = "";
let filtroCategoriaActual = "";

window.onload = inicializarSistema;

async function inicializarSistema() {
    window.clientSupabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    try {
        // Leemos tus platos directamente desde la nube (SOLO APROBADOS)
        const { data, error } = await clientSupabase
            .from('recetas_aldea')
            .select('*')
            .eq('aprobado', true);

        if (error) throw error;

        baseDatos = { recetas: data || [] };

        if (baseDatos && baseDatos.recetas) {
            baseDatos.recetas.sort((a, b) => b.id - a.id);
        }

        actualizarSelectorVecinos();
        filtrarYMostrarRecetas();
        configurarBuscadorUnificado();

    } catch (error) {
        console.error("Error crítico: No se ha podido leer la base de datos de Supabase", error);
    }
}

function configurarBuscadorUnificado() {
    const cajaBuscqueda = document.getElementById('motor-busqueda');
    const botonBuscarManual = document.getElementById('btn-buscar-manual');

    function ejecutarFiltro() {
        paginaActual = 1;
        filtrarYMostrarRecetas();
    }

    if (cajaBuscqueda) cajaBuscqueda.addEventListener('input', ejecutarFiltro);
    if (botonBuscarManual) botonBuscarManual.addEventListener('click', ejecutarFiltro);
}
// ==========================================
// 3. MOTOR DE FILTRADO CRUZADO GENERAL
// ==========================================
function filtrarYMostrarRecetas() {
    const textoBusqueda = document.getElementById('motor-busqueda')?.value.toLowerCase().trim() || "";

    const recetasFiltradas = baseDatos.recetas.filter(receta => {
        const coincideBuscador = !textoBusqueda ||
            receta.titulo.toLowerCase().includes(textoBusqueda) ||
            receta.autor.toLowerCase().includes(textoBusqueda) ||
            receta.ingredientes.some(ing => ing.toLowerCase().includes(textoBusqueda));

        const coincideAutor = !filtroAutorActual || receta.autor === filtroAutorActual;
        const coincideCategoria = !filtroCategoriaActual || receta.categoria === filtroCategoriaActual;

        return coincideBuscador && coincideAutor && coincideCategoria;
    });

    renderizarCatalogo(recetasFiltradas);
    renderizarPaginador(recetasFiltradas.length);
}

// ==========================================
// 4. PINTAR LAS TARJETAS EN LA PÁGINA ACTUAL
// ==========================================
function renderizarCatalogo(listaRecetas) {
    const contenedor = document.getElementById('recetas-display');
    if (!contenedor) return;
    contenedor.innerHTML = "";

    if (listaRecetas.length === 0) {
        contenedor.innerHTML = `<div class="sin-resultados">❌ No constan platos en los registros con esos filtros en La Aldea.</div>`;
        return;
    }

    const indiceInicio = (paginaActual - 1) * recetasPorPagina;
    const indiceFin = indiceInicio + recetasPorPagina;
    const recetasPagina = listaRecetas.slice(indiceInicio, indiceFin);

    recetasPagina.forEach(receta => {
        const tarjeta = document.createElement('div');
        tarjeta.className = 'tarjeta-receta';
        tarjeta.onclick = () => mostrarFichaRecetaUnica(receta.id);

        const listaIngredientes = Array.isArray(receta.ingredientes) ? receta.ingredientes : (typeof receta.ingredientes === 'string' ? receta.ingredientes.split(',').map(i => i.trim()) : []);
        const etiquetasIngredientes = listaIngredientes.map(ing => `<span class="badge-ingrediente">${limpiarTexto(ing)}</span>`).join('');

        tarjeta.innerHTML = `
            <div class="tarjeta-cabecera">
                <span class="badge-categoria">${limpiarTexto(receta.categoria)}</span>
                <h3>${limpiarTexto(receta.titulo)}</h3>
                <p class="autor-firma">Compartida por: <strong>${limpiarTexto(receta.autor)}</strong></p>
            </div>
            <div class="tarjeta-meta">
                <span>⏱ ${receta.tiempo} min</span>
                <span>🍽 ${receta.raciones} rac.</span>
                <span>🍳 ${receta.dificultad}</span>
            </div>
            <div class="tarjeta-ingredientes-previo">
                ${etiquetasIngredientes}
            </div>
        `;
        contenedor.appendChild(tarjeta);
    });
}
// ==========================================
// 5. PINTAR EL PAGINADOR DE 12 PÁGINAS (SIN DUPLICADOS)
// ==========================================
function renderizarPaginador(totalElementos) {
    const contenedorPaginador = document.getElementById('paginacion-controles');
    if (!contenedorPaginador) return;
    contenedorPaginador.innerHTML = "";

    const totalPaginas = Math.ceil(totalElementos / recetasPorPagina);
    if (totalPaginas <= 1) return;

    for (let i = 1; i <= totalPaginas; i++) {
        const botonPagina = document.createElement('button');
        botonPagina.innerText = i;
        botonPagina.className = (i === paginaActual) ? 'btn-paginador activo' : 'btn-paginador';
        botonPagina.onclick = (e) => {
            e.stopPropagation();
            paginaActual = i;
            filtrarYMostrarRecetas();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };
        contenedorPaginador.appendChild(botonPagina);
    }
}

// ==========================================
// 6. APERTURA DE FICHA COMPLETA (EL SISTEMA SE OLVIDA DE LA PATATA)
// ==========================================
async function mostrarFichaRecetaUnica(id) {
    const receta = baseDatos.recetas.find(r => r.id === id);
    if (!receta) return;

    const cajaBuscqueda = document.getElementById('motor-busqueda');
    if (cajaBuscqueda) cajaBuscqueda.value = "";
    paginaActual = 1;
    filtroAutorActual = "";
    filtroCategoriaActual = "";
    filtrarYMostrarRecetas();

    const seccionMotores = document.querySelector('.seccion-motores');
    if (seccionMotores) seccionMotores.style.display = 'none';

    const todosLosFiltros = document.querySelectorAll('.bloque-filtros');
    todosLosFiltros.forEach(bloque => bloque.style.display = 'none');

    document.getElementById('modulo-principal').style.display = 'none';
    document.getElementById('modulo-detalle').style.style.display = 'block';

    const cajaContenido = document.getElementById('detalle-contenido');
    const listaIngredientes = Array.isArray(receta.ingredientes) ? receta.ingredientes : (typeof receta.ingredientes === 'string' ? receta.ingredientes.split(',').map(i => i.trim()) : []);
    const listaIngredientesHtml = listaIngredientes.map(ing => `<li>${limpiarTexto(ing)}</li>`).join('');

    cajaContenido.innerHTML = `
        <div class="vista-detalle">
            <button class="btn-volver" onclick="mostrarCatalogoGeneral()">⬅ Volver al Catálogo</button>
            <h2>${limpiarTexto(receta.titulo)}</h2>
            <p class="detalle-autor">Receta de la comunidad compartida por: <strong>${limpiarTexto(receta.autor)}</strong></p>
            
            <div class="detalle-meta-bloque">
                <span>⏱ <strong>Tiempo:</strong> ${receta.tiempo} minutos</span>
                <span>🍽 <strong>Raciones:</strong> ${receta.raciones} rac.</span>
                <span>🍳 <strong>Dificultad:</strong> ${receta.dificultad}</span>
            </div>

            <div class="detalle-cuerpo">
                <div class="detalle-ingredientes">
                    <h4>🥦 Ingredientes necesarios:</h4>
                    <ul>${listaIngredientesHtml}</ul>
                </div>
                <div class="detalle-pasos">
                    <h4>🍳 Elaboración paso a paso:</h4>
                    <p style="white-space: pre-line;">${limpiarTexto(receta.pasos)}</p>
                </div>
            </div>
        </div>
    `;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function mostrarCatalogoGeneral() {
    document.getElementById('modulo-detalle').style.display = 'none';
    document.getElementById('modulo-principal').style.display = 'block';

    const seccionMotores = document.querySelector('.seccion-motores');
    if (seccionMotores) seccionMotores.style.display = 'block';
    const bloqueFiltros = document.querySelector('.bloque-filtros');
    if (bloqueFiltros) bloqueFiltros.style.display = 'block';

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function filtrarPorBotonde(campo, valor) {
    if (campo === 'categoria') {
        filtroCategoriaActual = (filtroCategoriaActual === valor) ? "" : valor;
    }
    paginaActual = 1;
    filtrarYMostrarRecetas();
    actualizarEstilosBotonesFiltro();
}

function filtrarPorVecino(nombreVecino) {
    filtroAutorActual = nombreVecino;
    paginaActual = 1;
    filtrarYMostrarRecetas();
}

// ==========================================
// 9. ACTUALIZAR EL SELECTOR DINÁMICO DE VECINOS
// ==========================================
function actualizarSelectorVecinos() {
    const selector = document.getElementById('selector-autor');
    if (!selector) return;

    const autores = [...new Set(baseDatos.recetas.map(r => r.autor).filter(Boolean))];
    autores.sort();

    selector.innerHTML = `<option value="">👤 Filtrar por vecino cocinero...</option>`;
    autores.forEach(autor => {
        const opcion = document.createElement('option');
        opcion.value = autor;
        opcion.innerText = autor;
        selector.appendChild(opcion);
    });

    selector.onchange = (e) => filtrarPorVecino(e.target.value);
}

function actualizarEstilosBotonesFiltro() {
    const botones = document.querySelectorAll('.btn-filtro');
    botones.forEach(btn => {
        if (btn.innerText.includes(filtroCategoriaActual) && filtroCategoriaActual !== "") {
            btn.classList.add('activo');
        } else {
            btn.classList.remove('activo');
        }
    });
}

function abrirFormulario() {
    const modal = document.getElementById('modal-receta');
    if (modal) modal.style.display = 'block';
}

// Cierre unificado del formulario modal
function cerrarFormulario() {
    const modal = document.getElementById('modal-receta');
    if (modal) modal.style.display = 'none';
}
