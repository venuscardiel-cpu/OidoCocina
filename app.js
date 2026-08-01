// =========================================================================
// 🧠 CEREBRO CENTRAL DE "OIDO COCINA" - BLOQUE 1 (ARRANQUE Y BASE DE DATOS)
// =========================================================================
// Enchufe unificado en la cocina general
const SUPABASE_URL = 'https://lgnoilucefslieyxxjdp.supabase.co';
const SUPABASE_KEY = 'sb_publishable_LEomAh36WhFioDvPtPXKPA_EoWqQOPE';

let baseDatos = { recetas: [] };
let paginaActual = 1;
const recetasPorPagina = 12;
let filtroAutorActual = "";
let filtroCategoriaActual = "";

// 📡 CONFIGURACIÓN DE INICIO
window.onload = inicializarSistema;

async function inicializarSistema() {
const clientSupabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    try {
        // 📡 Leemos tus platos directamente desde la nube dinámica de Supabase
        const { data, error } = await clientSupabase
            .from('recetas_aldea')
            .select('*');

        if (error) throw error;

        // Metemos los platos en la memoria del programa (por defecto vienen aprobados = true tras el filtro de Supabase)
        baseDatos = { recetas: data || [] };

        // Ordenamos las recetas para que las últimas que añadas salgan primero
        if (baseDatos && baseDatos.recetas) {
            baseDatos.recetas.sort((a, b) => b.id - a.id);
        }

        // Encendemos los motores visuales de la pantalla
        actualizarSelectorVecinos();
        filtrarYMostrarRecetas();
        configurarBuscadorUnificado();
    } catch (error) {
        console.error("Error crítico: No se ha podido leer la base de datos de Supabase", error);
    }
}

// 🔍 2. MAQUINARIA UNIFICADA DEL BUSCADOR (CON ADUANA DE MEMORIA)
function configurarBuscadorUnificado() {
    const cajaBusqueda = document.getElementById('motor-busqueda');
    const botonBuscarManual = document.getElementById('btn-buscar-manual');

    function ejecutarFiltro() {
        paginaActual = 1; // Reiniciamos siempre a la página 1 para evitar bucles
        filtrarYMostrarRecetas();
    }

    if (cajaBusqueda) {
        cajaBusqueda.addEventListener('input', ejecutarFiltro);
    }
    if (botonBuscarManual) {
        botonBuscarManual.addEventListener('click', ejecutarFiltro);
    }
}

// 🧮 3. MOTOR DE FILTRADO CRUZADO GENERAL
function filtrarYMostrarRecetas() {
    const textoBusqueda = document.getElementById('motor-busqueda')?.value.toLowerCase().trim() || "";
    
    // Filtramos la base de datos combinando buscador + botones + vecinos
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
// 🎨 4. PINTAR LAS TARJETAS EN LA PÁGINA ACTUAL
function renderizarCatalogo(listaRecetas) {
    const contenedor = document.getElementById('recetas-display');
    if (!contenedor) return;
    contenedor.innerHTML = "";

    if (listaRecetas.length === 0) {
        contenedor.innerHTML = `<div class="sin-resultados">❌ No constan platos en los registros con esos filtros en La Aldea.</div>`;
        return;
    }

    // Cortamos la tarta en trozos de 12 recetas por página
    const indiceInicio = (paginaActual - 1) * recetasPorPagina;
    const indiceFin = indiceInicio + recetasPorPagina;
    const recetasPagina = listaRecetas.slice(indiceInicio, indiceFin);

    recetasPagina.forEach(receta => {
        const tarjeta = document.createElement('div');
        tarjeta.className = 'tarjeta-receta';
        tarjeta.onclick = () => mostrarFichaRecetaUnica(receta.id);
        
        // Creamos la tira de ingredientes grises de fondo
    const listaIngredientes = Array.isArray(receta.ingredientes) ? receta.ingredientes : (typeof receta.ingredientes === 'string' ? receta.ingredientes.split(',').map(i => i.trim()) : []);
    const etiquetasIngredientes = listaIngredientes.map(ing => `<span class="badge-ingrediente">${ing}</span>`).join('');

        tarjeta.innerHTML = `
            <div class="tarjeta-cabecera">
                <span class="badge-categoria">${receta.categoria}</span>
                <h3>${receta.titulo}</h3>
                <p class="autor-firma">Compartida por: <strong>${receta.autor}</strong></p>
            </div>
            <div class="tarjeta-meta">
                <span>⏱️ ${receta.tiempo} min</span>
                <span>👥 ${receta.raciones} rac.</span>
                <span>📊 ${receta.dificultad}</span>
            </div>
            <div class="tarjeta-ingredientes-previo">
                ${etiquetasIngredientes}
            </div>
        `;
        contenedor.appendChild(tarjeta);
    });
}

// 🔢 5. PINTAR EL PAGINADOR DE 13 PÁGINAS (SIN DUPLICADOS)
function renderizarPaginador(totalElementos) {
    const contenedorPaginador = document.getElementById('paginacion-controles');
    if (!contenedorPaginador) return;
    contenedorPaginador.innerHTML = "";

    const totalPaginas = Math.ceil(totalElementos / recetasPorPagina);
    if (totalPaginas <= 1) return; // Si solo hay una página, escondemos los números

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
// 📂 6. APERTURA DE FICHA COMPLETA (EL SISTEMA SE OLVIDA DE LA PATATA)
function mostrarFichaRecetaUnica(id) {
    const receta = baseDatos.recetas.find(r => r.id === id);
    if (!receta) return;

    // 🔒 LA ADUANA DE MEMORIA: Vaciamos el buscador al hacer clic
    const cajaBusqueda = document.getElementById('motor-busqueda');
    if (cajaBusqueda) {
        cajaBusqueda.value = ""; 
    }
    paginaActual = 1;
    filtroAutorActual = "";
    filtroCategoriaActual = "";
    filtrarYMostrarRecetas(); // Dejamos el catálogo limpio de fondo con sus 157 platos

    // Ocultamos físicamente la sección del buscador y los filtros de la pantalla
    const seccionMotores = document.querySelector('.seccion-motores');
    if (seccionMotores) seccionMotores.style.display = 'none';
    
    // Escáner masivo: apagamos los 3 bloques de filtros superiores
    const todosLosFiltros = document.querySelectorAll('.bloque-filtros');
    todosLosFiltros.forEach(bloque => bloque.style.display = 'none');


    // Intercambiamos los paneles visuales
    document.getElementById('modulo-principal').style.display = 'none';
    const panelDetalle = document.getElementById('modulo-detalle');
    panelDetalle.style.display = 'block';

    const cajaContenido = document.getElementById('detalle-contenido');
    const listaIngredientes = receta.ingredientes.map(ing => `<li>• ${ing}</li>`).join('');

    cajaContenido.innerHTML = `
        <div class="vista-detalle">
            <button class="btn-volver" onclick="mostrarCatalogoGeneral()">⬅️ Volver al Catálogo</button>
            <h2>${receta.titulo}</h2>
            <p class="detalle-autor">Receta de la comunidad compartida por: <strong>${receta.autor}</strong></p>
            
            <div class="detalle-meta-bloque">
                <span>⏱️ <strong>Tiempo:</strong> ${receta.tiempo} minutos</span>
                <span>👥 <strong>Raciones:</strong> ${receta.raciones}</span>
                <span>📊 <strong>Dificultad:</strong> ${receta.dificultad}</span>
            </div>

            <div class="detalle-cuerpo">
                <div class="detalle-ingredientes">
                    <h4>🛒 Ingredientes necesarios:</h4>
                    <ul>${listaIngredientes}</ul>
                </div>
                <div class="detalle-pasos">
                    <h4>🍳 Elaboración paso a paso:</h4>
                    <p style="white-space: pre-line;">${receta.pasos}</p>
                </div>
            </div>
        </div>
    `;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 🔙 7. REGRESAR AL CATÁLOGO (RECUPERANDO EL BUSCADOR LIMPIO)
function mostrarCatalogoGeneral() {
    document.getElementById('modulo-detalle').style.display = 'none';
    document.getElementById('modulo-principal').style.display = 'block';

    // Volvemos a encender el buscador y los filtros en la pantalla
    const seccionMotores = document.querySelector('.seccion-motores');
    if (seccionMotores) seccionMotores.style.display = 'block';
    const bloqueFiltros = document.querySelector('.bloque-filtros');
    if (bloqueFiltros) bloqueFiltros.style.display = 'block';

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 🎭 8. FILTROS RÁPIDOS POR BOTÓN (CATEGORÍAS Y VECINOS)
function filtrarPorBoton(campo, valor) {
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

function irAlInicio() {
    const cajaBusqueda = document.getElementById('motor-busqueda');
    if (cajaBusqueda) cajaBusqueda.value = "";
    filtroAutorActual = "";
    filtroCategoriaActual = "";
    paginaActual = 1;
    filtrarYMostrarRecetas();
    mostrarCatalogoGeneral();
}

// 👥 9. ACTUALIZAR EL SELECTOR DINÁMICO DE VECINOS
function actualizarSelectorVecinos() {
    const selector = document.getElementById('selector-autor');
    if (!selector) return;
    
    // Extraemos los autores únicos de las recetas
    const autores = [...new Set(baseDatos.recetas.map(r => r.author || r.autor).filter(Boolean))];
    autores.sort();

    selector.innerHTML = `<option value="">👥 Filtrar por vecino cocinero...</option>`;
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

// 📦 10. ENVÍO AUTÓNOMO DE NUEVAS RECETAS DESDE LA WEB
function abrirFormulario() {
    const modal = document.getElementById('modal-receta');
    if (modal) modal.style.display = 'block';
}

function cerrarFormulario() {
    const modal = document.getElementById('modal-receta');
    if (modal) modal.style.display = 'none';
}
