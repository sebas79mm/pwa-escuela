
<script setup>
import { ref, computed, watch, nextTick } from 'vue'

// ==========================================
// CONFIGURACIÓN
// ==========================================

defineProps({
  titulo: String
})

const CLAVE_TAREAS = 'misTareas'

// ==========================================
// ALMACENAMIENTO LOCAL
// ==========================================

// Recuperar las tareas antes de crear el estado
function cargarTareas() {
  try {
    const guardadas = localStorage.getItem(CLAVE_TAREAS)

    if (guardadas === null) {
      return []
    }

    const datos = JSON.parse(guardadas)

    return Array.isArray(datos) ? datos : []

  } catch (error) {
    console.error('Error al cargar tareas:', error)
    return []
  }
}

// Guardar automáticamente
function guardarTareas() {
  try {
    localStorage.setItem(
      CLAVE_TAREAS,
      JSON.stringify(tareas.value)
    )
  } catch (error) {
    console.error('Error al guardar tareas:', error)
  }
}

// ==========================================
// VARIABLES REACTIVAS
// ==========================================

const tareas = ref(cargarTareas())
const nuevaTarea = ref('')
const filtro = ref('todas')

const tareaEditando = ref(null)
const tituloEditado = ref('')

const cargando = ref(false)
const error = ref('')
const tareasExistentes = ref([])

// ==========================================
// OBSERVAR CAMBIOS Y GUARDAR
// ==========================================

watch(
  tareas,
  () => {
    guardarTareas()
  },
  { deep: true }
)

// ==========================================
// FILTROS Y CONTADORES
// ==========================================

const tareasFiltradas = computed(() => {
  if (filtro.value === 'pendientes') {
    return tareas.value.filter(t => !t.completada)
  }

  if (filtro.value === 'completada') {
    return tareas.value.filter(t => t.completada)
  }

  return tareas.value
})

const totalPendientes = computed(() =>
  tareas.value.filter(t => !t.completada).length
)

const totalCompletadas = computed(() =>
  tareas.value.filter(t => t.completada).length
)

// ==========================================
// AGREGAR TAREAS
// ==========================================

function agregarTarea() {
  const titulo = nuevaTarea.value.trim()

  if (!titulo) return

  tareas.value.push({
    id: crypto.randomUUID(),
    titulo,
    completada: false
  })

  nuevaTarea.value = ''
}

// ==========================================
// COMPLETAR TAREAS
// ==========================================

function cambiarEstado(id) {
  const tarea = tareas.value.find(t => t.id === id)

  if (tarea) {
    tarea.completada = !tarea.completada
  }
}

// ==========================================
// ELIMINAR TAREAS
// ==========================================

function eliminarTarea(id) {
  tareas.value = tareas.value.filter(t => t.id !== id)
}

function borrarTodas() {
  if (tareas.value.length === 0) return

  const confirmar = confirm(
    '¿Estás seguro de que deseas eliminar todas las tareas?'
  )

  if (confirmar) {
    tareas.value = []
  }
}

// ==========================================
// EDITAR TAREAS
// ==========================================

function editarTarea(tarea) {
  tareaEditando.value = tarea.id
  tituloEditado.value = tarea.titulo
}

function guardarEdicion(tarea) {
  const nuevoTitulo = tituloEditado.value.trim()

  if (!nuevoTitulo) return

  tarea.titulo = nuevoTitulo

  tareaEditando.value = null
  tituloEditado.value = ''
}

function cancelarEdicion() {
  tareaEditando.value = null
  tituloEditado.value = ''
}

// ==========================================
// CONSULTAR API
// ==========================================

async function obtenerDatos() {
  cargando.value = true
  error.value = ''

  try {
    const respuesta = await fetch(
      'https://jsonplaceholder.typicode.com/todos?_limit=5'
    )

    if (!respuesta.ok) {
      throw new Error('No se pudo consultar la API')
    }

    const datos = await respuesta.json()

    tareasExistentes.value = datos

  } catch (err) {
    error.value = 'No fue posible recuperar las tareas BnB'
    console.error(err)

  } finally {
    cargando.value = false
  }
}

// ==========================================
// IMPORTAR TAREAS DE LA API
// ==========================================

function importarTareas() {
  const tareasConvertidas = tareasExistentes.value.map(tarea => ({
    id: crypto.randomUUID(),
    titulo: tarea.title,
    completada: tarea.completed
  }))

  tareas.value.push(...tareasConvertidas)
}

// ==========================================
// CONFIGURACIÓN DE JAMENDO
// ==========================================

const JAMENDO_CLIENT_ID = '9f77b7b3'
const JAMENDO_API = 'https://api.jamendo.com/v3.0'

const busquedaMusica = ref('')
const tipoBusqueda = ref('todo')
const buscandoMusica = ref(false)
const errorMusica = ref('')

const canciones = ref([])
const artistas = ref([])
const albumes = ref([])

const audioPlayer = ref(null)
const volumen = ref(0.7)

const reproductor = ref({
  actual: null,
  indice: -1
})

const reproduciendo = ref(false)

// ==========================================
// CONSULTA GENERAL A JAMENDO
// ==========================================

async function consultarJamendo(endpoint, parametros = {}) {
  const url = new URL(`${JAMENDO_API}/${endpoint}/`)

  url.search = new URLSearchParams({
    client_id: JAMENDO_CLIENT_ID,
    format: 'json',
    ...parametros
  }).toString()

  const respuesta = await fetch(url)

  if (!respuesta.ok) {
    throw new Error('Error al conectar con Jamendo')
  }

  const datos = await respuesta.json()

  if (datos.headers?.status !== 'success') {
    throw new Error(
      datos.headers?.error_message || 'Jamendo no pudo completar la consulta'
    )
  }

  return datos.results || []
}

// ==========================================
// BUSCAR CANCIONES, ARTISTAS Y ÁLBUMES
// ==========================================

async function buscarMusica() {
  const termino = busquedaMusica.value.trim()

  if (!termino) return

  buscandoMusica.value = true
  errorMusica.value = ''

  canciones.value = []
  artistas.value = []
  albumes.value = []

  try {
    const consultas = []

    if (tipoBusqueda.value === 'todo' ||
        tipoBusqueda.value === 'canciones') {
      consultas.push(
        consultarJamendo('tracks', {
          search: termino,
          limit: '15',
          type: 'single albumtrack',
          audioformat: 'mp32',
          imagesize: '300'
        })
      )
    } else {
      consultas.push(Promise.resolve([]))
    }

    if (tipoBusqueda.value === 'todo' ||
        tipoBusqueda.value === 'artistas') {
      consultas.push(
        consultarJamendo('artists', {
          namesearch: termino,
          limit: '8',
          hasimage: 'true'
        })
      )
    } else {
      consultas.push(Promise.resolve([]))
    }

    if (tipoBusqueda.value === 'todo' ||
        tipoBusqueda.value === 'albumes') {
      consultas.push(
        consultarJamendo('albums', {
          namesearch: termino,
          limit: '8',
          imagesize: '300'
        })
      )
    } else {
      consultas.push(Promise.resolve([]))
    }

    const [tracks, artists, albums] = await Promise.all(consultas)

    canciones.value = tracks
    artistas.value = artists
    albumes.value = albums

    if (
      tracks.length === 0 &&
      artists.length === 0 &&
      albums.length === 0
    ) {
      errorMusica.value = 'No encontramos resultados para tu búsqueda.'
    }

  } catch (err) {
    console.error('Error de Jamendo:', err)
    errorMusica.value = 'No fue posible consultar Jamendo. Intenta nuevamente.'
  } finally {
    buscandoMusica.value = false
  }
}

// ==========================================
// REPRODUCIR CANCIÓN
// ==========================================

async function reproducirCancion(cancion, indice = 0) {
  if (!cancion.audio) {
    errorMusica.value = 'Esta canción no tiene una dirección de audio disponible.'
    return
  }

  reproductor.value.actual = cancion
  reproductor.value.indice = indice
  reproduciendo.value = true

  await nextTick()

  try {
    if (audioPlayer.value) {
      audioPlayer.value.volume = Number(volumen.value)
      await audioPlayer.value.play()
    }
  } catch (err) {
    reproduciendo.value = false
    console.error('Error al reproducir:', err)
    errorMusica.value = 'No se pudo reproducir esta canción.'
  }
}

// ==========================================
// SIGUIENTE Y ANTERIOR
// ==========================================

function siguienteCancion() {
  const siguiente = reproductor.value.indice + 1

  if (siguiente < canciones.value.length) {
    reproducirCancion(canciones.value[siguiente], siguiente)
  }
}

function anteriorCancion() {
  const anterior = reproductor.value.indice - 1

  if (anterior >= 0) {
    reproducirCancion(canciones.value[anterior], anterior)
  }
}

// ==========================================
// REPRODUCIR CANCIONES DE UN ARTISTA
// ==========================================

async function verCancionesArtista(artista) {
  buscandoMusica.value = true
  errorMusica.value = ''

  try {
    const resultados = await consultarJamendo('tracks', {
      artist_id: artista.id,
      limit: '20',
      type: 'single albumtrack',
      audioformat: 'mp32',
      imagesize: '300'
    })

    canciones.value = resultados
    artistas.value = []
    albumes.value = []
    tipoBusqueda.value = 'canciones'
    busquedaMusica.value = artista.name

    if (!resultados.length) {
      errorMusica.value = 'Este artista todavía no tiene canciones disponibles.'
    }
  } catch (err) {
    errorMusica.value = 'No fue posible recuperar las canciones del artista.'
    console.error(err)
  } finally {
    buscandoMusica.value = false
  }
}

// ==========================================
// REPRODUCIR CANCIONES DE UN ÁLBUM
// ==========================================

async function verCancionesAlbum(album) {
  buscandoMusica.value = true
  errorMusica.value = ''

  try {
    const resultados = await consultarJamendo('albums/tracks', {
      id: album.id,
      limit: '30',
      audioformat: 'mp32',
      imagesize: '300'
    })

    canciones.value = resultados.flatMap(item =>
      item.tracks || []
    )

    // Algunas respuestas pueden devolver las pistas directamente.
    if (!canciones.value.length) {
      canciones.value = resultados.filter(item => item.audio)
    }

    artistas.value = []
    albumes.value = []
    tipoBusqueda.value = 'canciones'
    busquedaMusica.value = album.name

    if (!canciones.value.length) {
      errorMusica.value = 'No encontramos canciones disponibles en este álbum.'
    }
  } catch (err) {
    errorMusica.value = 'No fue posible recuperar las canciones del álbum.'
    console.error(err)
  } finally {
    buscandoMusica.value = false
  }
}

// ==========================================
// CONTROL DE VOLUMEN
// ==========================================

watch(volumen, valor => {
  if (audioPlayer.value) {
    audioPlayer.value.volume = Number(valor)
  }
})

// ==========================================
// FORMATEAR DURACIÓN
// ==========================================

function formatoDuracion(segundos) {
  const minutos = Math.floor(Number(segundos) / 60)
  const resto = Math.floor(Number(segundos) % 60)

  return `${minutos}:${String(resto).padStart(2, '0')}`
}

</script>

<template>
  <div class="w-full max-w-md bg-white rounded-2xl shadow-lg p-6">

    <!-- FILTROS -->
    <div class="flex justify-between items-center mb-6">
      <button
        v-for="opcion in [
          { valor: 'todas', texto: 'Todas' },
          { valor: 'pendientes', texto: 'Pendientes' },
          { valor: 'completada', texto: 'Completada' }
        ]"
        :key="opcion.valor"
        @click="filtro = opcion.valor"
        :class="[
          'w-full rounded-lg px-3 py-2 text-sm font-semibold transition',
          filtro === opcion.valor
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        ]"
      >
        {{ opcion.texto }}
      </button>
    </div>

    <!-- TÍTULO -->
    <h1 class="text-2xl font-bold text-gray-800 text-center mb-6">
      <span
        v-for="(letra, index) in 'Mis Tareas'.split('')"
        :key="index"
        class="inline-block transition-transform duration-200 hover:-translate-y-2 cursor-pointer"
      >
        {{ letra === ' ' ? '\u00A0' : letra }}
      </span>
    </h1>

    <!-- LISTA DE TAREAS -->
    <ul class="space-y-3 mb-6">
      <li
        v-for="tarea in tareasFiltradas"
        :key="tarea.id"
        class="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl p-3"
      >

        <!-- COMPLETAR -->
        <button
          type="button"
          @click="cambiarEstado(tarea.id)"
          :title="tarea.completada ? 'Marcar como pendiente' : 'Marcar como completada'"
          class="group flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border transition hover:scale-110"
          :class="tarea.completada
            ? 'border-green-400/40 bg-green-500 text-white hover:bg-green-600'
            : 'border-red-400/40 bg-red-500 text-white hover:bg-red-600'"
        >
          <svg
            v-if="tarea.completada"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            class="h-4 w-4"
          >
            <path d="m5 12 4 4L19 6" />
          </svg>

          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            class="h-4 w-4"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
        </button>

        

        <!-- TEXTO -->
        <div class="flex-1 min-w-0">
          <input
            v-if="tareaEditando === tarea.id"
            v-model="tituloEditado"
            type="text"
            autofocus
            @keyup.enter="guardarEdicion(tarea)"
            @keyup.esc="cancelarEdicion"
            class="w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          <span
            v-else
            class="block break-words text-sm"
            :class="tarea.completada
              ? 'text-gray-400 line-through'
              : 'text-gray-700'"
          >
            {{ tarea.titulo }}
          </span>
        </div>

        <!-- EDITAR -->
        <button
          v-if="tareaEditando !== tarea.id"
          type="button"
          @click="editarTarea(tarea)"
          title="Editar tarea"
          class="shrink-0 flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 hover:bg-blue-50 hover:text-blue-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            class="h-4 w-4"
          >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
          </svg>
        </button>

        <!-- GUARDAR EDICIÓN -->
        <button
          v-else
          type="button"
          @click="guardarEdicion(tarea)"
          title="Guardar cambios"
          class="shrink-0 flex h-8 w-8 items-center justify-center rounded-xl text-green-600 hover:bg-green-50"
        >
          ✓
        </button>

        <!-- ELIMINAR -->
        <button
          type="button"
          @click="eliminarTarea(tarea.id)"
          title="Eliminar tarea"
          class="shrink-0 text-gray-400 text-2xl leading-none hover:text-red-500"
        >
          ×
        </button>

      </li>
    </ul>

    <!-- MENSAJE VACÍO -->
    <p
      v-if="tareas.length === 0"
      class="text-center text-sm text-gray-400 mb-6"
    >
      No hay tareas registradas.
    </p>

    <!-- CONTADORES -->
    <div class="mt-4 flex items-center justify-between px-1 py-2">
      <span class="text-sm font-medium text-gray-500">
        {{ filtro === 'todas'
          ? 'Total de tareas'
          : filtro === 'pendientes'
            ? 'Tareas pendientes'
            : 'Tareas completadas' }}
      </span>

      <span
        class="text-sm font-bold"
        :class="filtro === 'todas'
          ? 'text-blue-600'
          : filtro === 'pendientes'
            ? 'text-red-500'
            : 'text-green-600'"
      >
        {{ tareasFiltradas.length }}
      </span>
    </div>

    <!-- TAREAS DE LA API -->
    <h2 class="text-lg font-bold text-gray-800 mb-4">
      Tareas Existentes
    </h2>

    <ul>
      <li
        v-for="tarea in tareasExistentes"
        :key="tarea.id"
      >
        {{ tarea.title }}
        <span v-if="tarea.completed">(Completada)</span>
        <span v-else>(Pendiente)</span>
      </li>
    </ul>

    <!-- API E IMPORTACIÓN -->
    <div class="mt-8 space-y-4">

      <button
        type="button"
        @click="obtenerDatos"
        :disabled="cargando"
        class="flex w-full items-center justify-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
      >
        {{ cargando ? 'Consultando la API...' : 'Consultar API' }}
      </button>

      <p v-if="error" class="text-sm text-red-500">
        {{ error }}
      </p>

      <button
        type="button"
        @click="importarTareas"
        :disabled="tareasExistentes.length === 0"
        class="flex w-full items-center justify-center gap-3 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-bold text-green-700 hover:bg-green-100 disabled:opacity-40"
      >
        Importar tareas de la API

        <span class="ml-auto">
          {{ tareasExistentes.length }}
        </span>
      </button>

    </div>

    <!-- AGREGAR TAREAS -->
    <form
      @submit.prevent="agregarTarea"
      class="space-y-3 mt-6"
    >
      <input
        v-model="nuevaTarea"
        type="text"
        placeholder="Escribe una tarea..."
        class="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />

      <div class="flex gap-3">

        <button
          type="submit"
          class="w-1/2 bg-blue-600 text-white font-semibold rounded-xl py-3 hover:bg-blue-700"
        >
          + Agregar tarea
        </button>

        <button
          type="button"
          @click="borrarTodas"
          class="w-1/2 bg-red-500 text-white font-semibold rounded-xl py-3 hover:bg-red-600"
        >
          × Borrar tareas
        </button>

      </div>

      <!-- ===================================== -->
      <!-- REPRODUCTOR Y BUSCADOR DE JAMENDO -->
      <!-- ===================================== -->

      <section class="mt-10 border-t border-gray-200 pt-7">

        <!-- ENCABEZADO -->
        <div class="flex items-center gap-3 mb-5">
          <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 text-white shadow-md">
            <span class="text-2xl">♫</span>
          </div>

          <div>
            <h2 class="text-xl font-bold text-gray-800">
              Música para ti
            </h2>
            <p class="text-xs text-gray-400">
              Descubre canciones con Jamendo
            </p>
          </div>
        </div>

        <!-- BUSCADOR -->
        <form
          @submit.prevent="buscarMusica"
          class="space-y-3"
        >
          <div class="relative">
            <input
              v-model="busquedaMusica"
              type="search"
              placeholder="Busca canciones, artistas o álbumes..."
              class="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-4 pr-4 text-sm text-gray-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <!-- TIPOS DE BÚSQUEDA -->
          <div class="grid grid-cols-4 gap-2">
            <button
              v-for="tipo in [
                { valor: 'todo', texto: 'Todo' },
                { valor: 'canciones', texto: 'Canciones' },
                { valor: 'artistas', texto: 'Artistas' },
                { valor: 'albumes', texto: 'Álbumes' }
              ]"
              :key="tipo.valor"
              type="button"
              @click="tipoBusqueda = tipo.valor"
              :class="tipoBusqueda === tipo.valor
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
              class="rounded-lg px-1 py-2 text-xs font-semibold transition"
            >
              {{ tipo.texto }}
            </button>
          </div>

          <!-- BOTÓN BUSCAR -->
          <button
            type="submit"
            :disabled="buscandoMusica || !busquedaMusica.trim()"
            class="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 py-3 font-bold text-white shadow-md transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span v-if="buscandoMusica">
              Buscando música...
            </span>

            <span v-else>
              🔍 Buscar música
            </span>
          </button>
        </form>

        <!-- ERROR -->
        <p
          v-if="errorMusica"
          class="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-500"
        >
          {{ errorMusica }}
        </p>

        <!-- RESULTADOS DE CANCIONES -->
        <div
          v-if="canciones.length"
          class="mt-7"
        >
          <h3 class="mb-3 font-bold text-gray-800">
            🎵 Canciones encontradas
          </h3>

          <div class="space-y-3">

            <div
              v-for="(cancion, index) in canciones"
              :key="cancion.id"
              class="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 transition hover:border-blue-200 hover:bg-blue-50/50"
            >

              <!-- PORTADA -->
              <img
                :src="cancion.image || cancion.album_image"
                :alt="cancion.name"
                class="h-14 w-14 shrink-0 rounded-lg bg-gray-200 object-cover"
              />

              <!-- INFORMACIÓN -->
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-bold text-gray-800">
                  {{ cancion.name }}
                </p>

                <p class="truncate text-xs text-gray-500">
                  {{ cancion.artist_name }}
                </p>

                <p class="mt-1 text-xs text-gray-400">
                  {{ formatoDuracion(cancion.duration) }}
                </p>
              </div>

              <!-- REPRODUCIR -->
              <button
                type="button"
                @click="
                  reproductor.actual?.id === cancion.id
                    ? (reproduciendo
                        ? audioPlayer.pause()
                        : audioPlayer.play())
                    : reproducirCancion(cancion, index)
                "
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-500/30 transition-all duration-300 hover:scale-110 hover:shadow-xl active:scale-90"
              >
                <svg
                  v-if="reproductor.actual?.id === cancion.id && reproduciendo"
                  class="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M7 5h4v14H7zM15 5h4v14h-4z"/>
                </svg>

                <svg
                  v-else
                  class="ml-0.5 h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </button>

            </div>

          </div>
        </div>

        <!-- RESULTADOS DE ARTISTAS -->
        <div
          v-if="artistas.length"
          class="mt-7"
        >
          <h3 class="mb-3 font-bold text-gray-800">
            🎤 Artistas
          </h3>

          <div class="grid grid-cols-2 gap-3">
            <div
              v-for="artista in artistas"
              :key="artista.id"
              class="rounded-xl border border-gray-100 bg-gray-50 p-3 text-center"
            >
              <img
                :src="artista.image"
                :alt="artista.name"
                class="mx-auto mb-2 h-20 w-20 rounded-full bg-gray-200 object-cover"
              />

              <p class="truncate text-sm font-bold text-gray-800">
                {{ artista.name }}
              </p>

              <button
                type="button"
                @click="verCancionesArtista(artista)"
                class="mt-2 rounded-lg bg-blue-100 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-200"
              >
                Ver canciones
              </button>
            </div>
          </div>
        </div>

        <!-- RESULTADOS DE ÁLBUMES -->
        <div
          v-if="albumes.length"
          class="mt-7"
        >
          <h3 class="mb-3 font-bold text-gray-800">
            💿 Álbumes
          </h3>

          <div class="grid grid-cols-2 gap-3">
            <div
              v-for="album in albumes"
              :key="album.id"
              class="rounded-xl border border-gray-100 bg-gray-50 p-3"
            >
              <img
                :src="album.image"
                :alt="album.name"
                class="mb-2 aspect-square w-full rounded-lg bg-gray-200 object-cover"
              />

              <p class="truncate text-sm font-bold text-gray-800">
                {{ album.name }}
              </p>

              <p class="truncate text-xs text-gray-500">
                {{ album.artist_name }}
              </p>

              <button
                type="button"
                @click="verCancionesAlbum(album)"
                class="mt-3 w-full rounded-lg bg-violet-100 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-200"
              >
                Ver canciones
              </button>
            </div>
          </div>
        </div>
        
        <!-- REPRODUCTOR -->
        <div
          v-if="reproductor.actual"
          class="mt-8 overflow-hidden rounded-3xl border border-violet-500/20 bg-gradient-to-br from-gray-950 via-slate-900 to-violet-950 p-5 text-white shadow-2xl"
        >
          <!-- INFORMACIÓN DE LA CANCIÓN -->
          <div class="mb-5 flex items-center gap-4">

            <img
              :src="reproductor.actual.image || reproductor.actual.album_image"
              class="h-20 w-20 rounded-2xl border border-white/10 object-cover shadow-xl"
              alt="Portada de canción"
            />

            <div class="min-w-0 flex-1">
              <p class="mb-1 text-xs font-semibold uppercase tracking-widest text-violet-400">
                Reproduciendo ahora
              </p>

              <p class="truncate text-base font-bold">
                {{ reproductor.actual.name }}
              </p>

              <p class="truncate text-sm text-gray-400">
                {{ reproductor.actual.artist_name }}
              </p>
            </div>

            <span class="text-3xl text-violet-400">♫</span>
          </div>

          <!-- AUDIO -->
          <audio
            ref="audioPlayer"
            :src="reproductor.actual.audio"
            autoplay
            preload="none"
            @play="reproduciendo = true"
            @pause="reproduciendo = false"
            @ended="siguienteCancion"
            class="hidden"
          ></audio>

          <!-- BARRA DE PROGRESO -->
          <div class="mb-5">
            <div class="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                class="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all"
                :style="{
                  width: audioPlayer && audioPlayer.duration
                    ? (audioPlayer.currentTime / audioPlayer.duration * 100) + '%'
                    : '0%'
                }"
              ></div>
            </div>

            <div class="mt-2 flex justify-between text-xs text-gray-400">
              <span>
                {{ audioPlayer ? formatoDuracion(audioPlayer.currentTime || 0) : '0:00' }}
              </span>
              <span>
                {{ formatoDuracion(reproductor.actual.duration) }}
              </span>
            </div>
          </div>

          <!-- BOTONES DEL REPRODUCTOR -->
          <div class="flex items-center justify-center gap-7">

            <button
              type="button"
              @click="anteriorCancion"
              :disabled="reproductor.indice <= 0"
              class="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-gray-200 transition hover:scale-110 hover:bg-white/20 disabled:opacity-30"
              title="Canción anterior"
            >
              <span class="text-xl">⏮</span>
            </button>

            <button
              type="button"
              @click="
                reproduciendo
                  ? audioPlayer.pause()
                  : audioPlayer.play()
              "
              class="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-white shadow-lg shadow-violet-500/30 transition hover:scale-110 active:scale-95"
              :title="reproduciendo ? 'Pausar' : 'Reproducir'"
            >
              <svg
                v-if="reproduciendo"
                class="h-7 w-7"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M7 5h4v14H7zM15 5h4v14h-4z"/>
              </svg>

              <svg
                v-else
                class="ml-1 h-7 w-7"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M8 5v14l11-7z"/>
              </svg>
            </button>

            <button
              type="button"
              @click="siguienteCancion"
              :disabled="reproductor.indice >= canciones.length - 1"
              class="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-gray-200 transition hover:scale-110 hover:bg-white/20 disabled:opacity-30"
              title="Siguiente canción"
            >
              <span class="text-xl">⏭</span>
            </button>

          </div>

          <!-- VOLUMEN -->
          <div class="mt-6 flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3">
            <span class="text-gray-400">🔉</span>

            <input
              v-model.number="volumen"
              type="range"
              min="0"
              max="1"
              step="0.05"
              class="h-1.5 flex-1 cursor-pointer accent-violet-500"
            />

            <span class="text-gray-400">🔊</span>

            <span class="w-9 text-right text-xs text-gray-400">
              {{ Math.round(volumen * 100) }}%
            </span>
          </div>

          <p class="mt-4 text-center text-xs tracking-wide text-gray-500">
            ♫ Música independiente · Jamendo
          </p>

        </div>


        <!-- MENSAJE INICIAL -->
        <div
          v-if="
            !canciones.length &&
            !artistas.length &&
            !albumes.length &&
            !errorMusica &&
            !buscandoMusica
          "
          class="mt-7 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center"
        >
          <div class="mb-2 text-4xl">🎧</div>

          <p class="text-sm font-semibold text-gray-700">
            ¿Qué quieres escuchar hoy?
          </p>

          <p class="mt-1 text-xs text-gray-400">
            Busca tus canciones, artistas y álbumes favoritos.
          </p>
        </div>

        <!-- ATRIBUCIÓN -->
        <p class="mt-5 text-center text-xs text-gray-400">
          Música proporcionada por
          <a
            href="https://www.jamendo.com/"
            target="_blank"
            rel="noopener noreferrer"
            class="font-semibold text-blue-500 hover:underline"
          >
            Jamendo
          </a>
        </p>

      </section>
    </form>

  </div>
</template>
