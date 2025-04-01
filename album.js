let currentAudio = null;
let currentPlayingButton = null;

// Cargar los detalles del álbum (imagen, título, artista)
async function fetchAlbumDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const albumId = urlParams.get('id');

    if (!albumId) {
        alert("No se encontró el álbum.");
        window.location.href = "index.html"; // Regresar si no hay ID
        return;
    }

    console.log(`Cargando detalles del álbum con ID: ${albumId}`);

    const url = `https://spotify23.p.rapidapi.com/albums/?ids=${albumId}`;
    const options = {
        method: 'GET',
        headers: {
            'x-rapidapi-key': 'b5bf02a74emsh5958147fb7322dfp149f6fjsn5be2e62c9d55',
            'x-rapidapi-host': 'spotify23.p.rapidapi.com'
        }
    };

    try {
        const response = await fetch(url, options);
        const data = await response.json();
        console.log('Respuesta de la API:', data);

        if (data.albums && data.albums.length > 0) {
            const album = data.albums[0];
            document.getElementById('album-cover').src = album.images[0].url;
            document.getElementById('album-title').innerText = album.name;
            document.getElementById('artist-name').innerText = album.artists[0].name;

            fetchTracks(albumId); // Obtener las canciones del álbum
        } else {
            alert("No se encontró el álbum.");
            window.location.href = "index.html";
        }
    } catch (error) {
        console.error("Error al obtener detalles del álbum:", error);
    }
}

// Función para regresar al índice
function goBack() {
    window.location.href = "index.html";
}

// Ejecutar la carga de datos cuando se abra la página
fetchAlbumDetails();

// Obtener canciones del álbum
async function fetchTracks(albumId) {
    const url = `https://spotify23.p.rapidapi.com/albums/?ids=${albumId}`;
    const options = {
        method: 'GET',
        headers: {
            'x-rapidapi-key': 'b5bf02a74emsh5958147fb7322dfp149f6fjsn5be2e62c9d55',
            'x-rapidapi-host': 'spotify23.p.rapidapi.com'
        }
    };

    try {
        const response = await fetch(url, options);
        const data = await response.json();
        console.log('Respuesta de canciones:', data);

        // Verificar dónde están las canciones en la estructura de la API
        if (data.albums && data.albums.length > 0) {
            const tracks = data.albums[0].tracks.items; // Verificar la estructura de la respuesta
            if (tracks && tracks.length > 0) {
                displayTracks(tracks);
            } else {
                document.getElementById('track-list').innerHTML = "<li class='list-group-item text-white bg-dark'>No se encontraron canciones</li>";
            }
        } else {
            console.error("No se encontraron álbumes en la respuesta de la API.");
        }
    } catch (error) {
        console.error("Error al obtener canciones:", error);
    }
}

// Mostrar las canciones en la lista y agregar un botón para reproducirlas
function displayTracks(tracks) {
    let tracksHTML = tracks.map(track => {
        const trackId = track.id;
        const trackName = track.name;
        const previewUrl = track.preview_url; // Verificar que esta propiedad existe

        return ` 
            <li class="list-group-item bg-dark text-white d-flex justify-content-between align-items-center">
                ${trackName}
                ${previewUrl ? `<button class="btn btn-primary btn-sm" onclick="playPreview('${previewUrl}', this)">▶</button>` : '<span class="text-muted">Sin vista previa</span>'}
            </li>
        `;
    }).join("");

    document.getElementById('track-list').innerHTML = tracksHTML;
}

// Función para reproducir previews
function playPreview(previewUrl, button) {
    if (!previewUrl) {
        alert("Esta canción no tiene vista previa disponible.");
        return;
    }

    if (currentAudio) {
        currentAudio.pause();
        if (currentPlayingButton) {
            currentPlayingButton.innerHTML = '▶';
        }
    }

    if (!currentAudio || currentAudio.src !== previewUrl) {
        currentAudio = new Audio(previewUrl);
        currentPlayingButton = button;

        currentAudio.play()
            .then(() => {
                button.innerHTML = '⏸';
            })
            .catch(error => {
                console.error("Error al reproducir:", error);
                alert("No se pudo iniciar la vista previa.");
            });

        currentAudio.onended = () => {
            button.innerHTML = '▶';
            currentAudio = null;
            currentPlayingButton = null;
        };
    } else {
        currentAudio = null;
        currentPlayingButton = null;
    }
}

