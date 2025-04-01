
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./ws.js')
            .then((registration) => {
                console.log('Service Worker registrado', registration.scope); 
            })
            .catch((error) => {
                console.log('Error al registrar el Service Worker:', error);
            });
    });
}


let currentArtist = null;
let currentAlbums = null;

// Búsqueda de artista
async function fetchArtist(artistName) {
    const url = `https://spotify23.p.rapidapi.com/search/?q=${encodeURIComponent(artistName)}&type=artists&limit=1`;
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

        if (data.artists && data.artists.items.length > 0) {
            currentArtist = data.artists.items[0].data;
            const artistId = currentArtist.uri.split(":")[2];

            displayArtistContent(currentArtist);
            fetchAlbums(artistId);
        } else {
            document.getElementById('content-container').innerHTML = "<p class='text-light'>No se encontró el artista</p>";
        }
    } catch (error) {
        console.error("Error en la búsqueda del artista:", error);
    }
}

// Mostrar información del artista
function displayArtistContent(artist) {
    const artistName = artist.profile.name;
    const artistImage = artist.visuals.avatarImage?.sources?.[0]?.url || 'https://via.placeholder.com/150';

    let artistHTML = `
        <div class="col-12 text-center">
            <img src="${artistImage}" alt="${artistName}" class="rounded-circle mb-3" width="150">
            <h2 class="text-light">${artistName}</h2>
        </div>
    `;

    document.getElementById('content-container').innerHTML = artistHTML;
}

// Búsqueda cuando se hace clic en el botón
document.getElementById('searchBtn').addEventListener('click', () => {
    const artistName = document.getElementById('searchInput').value.trim();
    if (artistName) {
        fetchArtist(artistName);
    }
});

// Obtener álbumes del artista
async function fetchAlbums(artistId) {
    const url = `https://spotify23.p.rapidapi.com/artist_albums/?id=${artistId}&offset=0&limit=10`;
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

        if (data.data.artist.discography.albums.items.length > 0) {
            currentAlbums = data.data.artist.discography.albums.items;
            displayAlbums(currentAlbums);
        } else {
            document.getElementById('albums-container').innerHTML = "<p class='text-light'>No se encontraron álbumes</p>";
        }
    } catch (error) {
        console.error("Error al obtener álbumes:", error);
    }
}

// Mostrar los álbumes en el index
function displayAlbums(albums) {
    let albumsHTML = albums.map(album => {
        const albumName = album.releases.items[0].name;
        const albumCover = album.releases.items[0].coverArt.sources[0].url;
        const albumId = album.releases.items[0].id;

        return `
            <div class="col-md-3">
                <div class="card bg-dark text-white album-card" data-album-id="${albumId}" onclick="redirectToAlbum('${albumId}')">
                    <img src="${albumCover}" class="card-img-top" alt="${albumName}">
                    <div class="card-body">
                        <h5 class="card-title">${albumName}</h5>
                    </div>
                </div>
            </div>
        `;
    }).join("");

    document.getElementById('albums-container').innerHTML = albumsHTML;
}

// Redirigir a album.html con caché
async function redirectToAlbum(albumId) {
    await cacheSearchResults(currentArtist, currentAlbums);
    window.location.href = `album.html?id=${albumId}`;
}

// Guardar en caché
async function cacheSearchResults(artist, albums) {
    if ('caches' in window) {
        const cache = await caches.open('spotify-search');
        const data = new Response(JSON.stringify({ artist, albums }));
        cache.put('/search-cache', data);
    }
}

// Cargar caché al regresar al index
async function loadCachedSearch() {
    if ('caches' in window) {
        const cache = await caches.open('spotify-search');
        const response = await cache.match('/search-cache');

        if (response) {
            const { artist, albums } = await response.json();
            displayArtistContent(artist);
            displayAlbums(albums);
        }
    }
}

// Cargar caché al iniciar el index.html
document.addEventListener("DOMContentLoaded", loadCachedSearch);

function searchAlbums(query) {
    const url = `https://spotify23.p.rapidapi.com/search/?q=${query}&type=albums&limit=10`;
    const options = {
        method: 'GET',
        headers: {
            'x-rapidapi-key': 'b5bf02a74emsh5958147fb7322dfp149f6fjsn5be2e62c9d55',
            'x-rapidapi-host': 'spotify23.p.rapidapi.com'
        }
    };

    // Verificar si ya tenemos la respuesta guardada en el cache
    caches.open('albumCache').then(cache => {
        cache.match(url).then(response => {
            if (response) {
                console.log("Resultados recuperados del cache");
                response.json().then(data => {
                    const albums = data.albums.items;
                    displayAlbums(albums);
                });
            } else {
                // Si no está en cache, hacer la solicitud a la API
                fetch(url, options)
                    .then(response => response.json())
                    .then(data => {
                        console.log("Resultados de búsqueda:", data);
                        const albums = data.albums.items;

                        // Guardar la respuesta en el cache
                        cache.put(url, new Response(JSON.stringify(data)));

                        if (albums.length > 0) {
                            displayAlbums(albums);
                        } else {
                            document.getElementById('album-list').innerHTML = "<p>No se encontraron álbumes</p>";
                        }
                    })
                    .catch(error => console.error("Error en la búsqueda:", error));
            }
        });
    });
}

document.addEventListener("DOMContentLoaded", function () {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('query');  // Recuperar el query de la URL

    if (query) {
        const url = `https://spotify23.p.rapidapi.com/search/?q=${query}&type=albums&limit=10`;

        // Verificar si los resultados ya están en cache
        caches.open('albumCache').then(cache => {
            cache.match(url).then(response => {
                if (response) {
                    console.log("Resultados recuperados del cache");
                    response.json().then(data => {
                        const albums = data.albums.items;
                        displayAlbums(albums);
                    });
                } else {
                    console.log("No se encontró en el cache, cargando desde la API");
                    fetch(url, options)
                        .then(response => response.json())
                        .then(data => {
                            const albums = data.albums.items;
                            displayAlbums(albums);
                        })
                        .catch(error => console.error("Error en la carga inicial:", error));
                }
            });
        });
    }
});
