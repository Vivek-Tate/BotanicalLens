importScripts('/javascripts/idb-utility.js');

const dynamicCache= 'site-dynamic-v1';

// Use the install event to pre-cache all initial resources.
self.addEventListener('install', event => {
    console.log('Service Worker: Installing....');
    event.waitUntil((async () => {

        console.log('Service Worker: Caching App Shell at the moment......');
        try {
            const cache = await caches.open("static");
            cache.addAll([
                '/',
                '/addplant',
                '/contact-us',
                '/faq',
                '/manifest.json',
                '/javascripts/API.js',
                '/javascripts/local-storage.js',
                '/javascripts/index.js',
                '/javascripts/idb-utility.js',
                'https://maps.googleapis.com/maps/api/js?key=AIzaSyDvba_AADmYUKZcMBmOnZGD0xIxCYQxT1s&callback=initMap',
                '/stylesheets/style.css',
                '/stylesheets/partials/header_style.css',
                '/stylesheets/contact-styles.css',
                '/stylesheets/faq-styles.css',
                '/stylesheets/homepage/index.css',
                'https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.8/dist/umd/popper.min.js',
                'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.min.js',
                'https://cdn.jsdelivr.net/npm/uuid@8.3.2/dist/umd/uuidv4.min.js',
                '/css/bootstrap.min.css',
                '/images/logo/botanical-lens-logo.png',
                '/images/contact-us.svg',
                '/images/pink-rose.jpg',
                '/images/lily.jpeg',
                '/images/red-tick.jpg',
                '/images/blue_tick.png',
                '/images/add-plant.svg',
            ]);
            console.log('Service Worker: App Shell Cached');
        }
        catch{
            console.log("error occured while caching...")
        }

    })());
});

//clear cache on reload
self.addEventListener('activate', event => {
// Remove old caches
    event.waitUntil(
        (async () => {
            const keys = await caches.keys();
            return keys.map(async (cache) => {
                if(cache !== "static") {
                    console.log('Service Worker: Removing old cache: '+cache);
                    return await caches.delete(cache);
                }
            })
        })()
    )
})

// Fetch event to fetch from cache first
self.addEventListener('fetch', event => {
    event.respondWith((async () => {
        const cache = await caches.open("static");
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
            console.log('Service Worker: Fetching from Cache: ', event.request.url);
            return cachedResponse;
        }
        console.log('Service Worker: Fetching from URL: ', event.request.url);
        return fetch(event.request);
    })());
});

self.addEventListener('sync', event => {
    if (event.tag === 'sync-plant') {
        openSyncPlantsIDB().then((syncPostDB) => {
            getAllSyncPlants(syncPostDB).then((syncPlants) => {
                for (const syncPlant of syncPlants) {
                    const formData = new FormData();
                    for (const key in syncPlant) {
                        formData.append(key, syncPlant[key]);
                    }

                    fetch('http://localhost:3000/addplant', {
                        method: 'POST',
                        body: formData,


                    }).then(() => {
                        deleteSyncPlantFromIDB(syncPostDB, syncPlant.sightingId).then(() => {
                  // After registration is completed, navigate to home page
                            clients.matchAll().then(clients => {
                                clients.forEach(client => {
                                    client.navigate('/').then(() => {
                                    }).catch(err => {
                                        console.log("Client navigation failed: " + JSON.stringify(err));
                                    });
                                });
                            }).catch(err => {
                                console.log("Error matching clients: " + JSON.stringify(err));
                            });

                        }).catch((err) => {
                            console.error('Service Worker: Syncing new Todo: ', syncPlant, ' failed');
                        });
                        self.registration.showNotification('Plant Added', {
                            body: 'Plant Added successfully!',
                            icon: '/images/logo/Squared_Logo.png'
                        });
                    })

                }
            });
        });
    }
})