waypoints = []
depots = []

function getRandomColor(){
    return "#" + ((1 << 24) * Math.random() | 0).toString(16).padStart(6, "0")
}

function clearWaypoints() {
    map.eachLayer(function (layer) {
        if (layer instanceof L.Marker) {
            map.removeLayer(layer);
        }
    });
}

function addBins(){
    fetch('/data')
    .then(response => response.json())
    .then(data => {
    for (var list in data){
        var popupContent = `
            <div>
                <h2 id="idLabel">Numara: ${data[list]["id"]}</h2>
                <div class="chart-container">
                    <canvas id="typeChart"></canvas>
                </div>
                <div class="chart-container">
                    <canvas id="percentChart"></canvas>
                </div>
            </div>
        -`;
        var marker = L.marker([data[list]["lat"], data[list]["lng"]]).addTo(map).bindPopup(popupContent);
        marker.options.id = data[list]["id"];

        marker.on('popupopen', function (event) {
            var requestBody = {
                "id": event.popup._source.options.id
            };

            fetch('/bin_data', {method: "POST", headers: {'Content-Type': 'application/json'}, body: JSON.stringify(requestBody)})
            .then(response => response.json())
            .then(bin_data => {
                const typeCtx = document.getElementById('typeChart');

                new Chart(typeCtx, {
                    type: 'pie',
                    data: {
                        //labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
                        labels: bin_data["materials"].map(item => item.name),
                        datasets: [{
                            label: '# of Votes',
                            data: bin_data["materials"].map(item => item.volume),
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                position: 'top',
                                onClick: function(e, legendItem) {
                                    e.stopPropagation();
                                }
                            },
                            title: {
                                display: true,
                                text: 'Atık Türü'
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        var label = context.label || '';
                                        var value = context.parsed || 0;
                                        var total = context.dataset.data.reduce(function(acc, current) {
                                            return acc + current;
                                        }, 0);
                                        var percentage = ((value / total) * 100).toFixed(2) + '%';
                                        return label + ': ' + percentage + ' - ' + value + "m³";
                                    }
                                }
                            }
                        }
                    },
                });
            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });

            fetch('/bin_percent_data', {method: "POST", headers: {'Content-Type': 'application/json'}, body: JSON.stringify(requestBody)})
            .then(response => response.json())
            .then(percent_data => {
                const percentCtx = document.getElementById('percentChart');

                new Chart(percentCtx, {
                    type: 'polarArea',
                    data: {
                        //labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
                        labels: percent_data["percents"].map(item => item.name),
                        datasets: [{
                            label: 'Doluluk Yüzdesi',
                            data: percent_data["percents"].map(item => item.percent),
                        }]
                    },
                    options: {
                        responsive: true,
                        scales: {
                            r: {
                                pointLabels: {
                                    display: true,
                                    centerPointLabels: true,
                                    font: {
                                        size: 15
                                    }
                                },
                                min: 0,
                                max: 100,
                                stepSize: 10
                            },
                        },
                        plugins: {
                            legend: {
                                position: 'top',
                                onClick: function(e, legendItem) {
                                    e.stopPropagation();
                                }
                            },
                            title: {
                                display: true,
                                text: 'Atık Kutusu Doluluk Oranı'
                            }
                        }
                    },
                });
            });
        });
        waypoints.push({
            "id": data[list]["id"],
            "coordinates": L.latLng(data[list]["lat"], data[list]["lng"]),
        });
    }
    })
    .catch(error => {
    console.error('Error fetching data:', error);
    });
}

function addDepot(){
    fetch('/depot_data')
    .then(response => response.json())
    .then(data => {
        for (var list in data){
            var popupContent = `
            <div>
                <h1>Atık Toplama Merkezi ${data[list]["id"]}</h1>
            </div>`;

            var greenIcon = new L.Icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            });

            var marker = L.marker([data[list]["lat"], data[list]["lng"]], {icon: greenIcon}).addTo(map).bindPopup(popupContent);
            marker.options.id = data[list]["id"];
        }

        depots.push({
            "id": data[list]["id"],
            "coordinates": L.latLng(data[list]["lat"], data[list]["lng"]),
        });
    })
}

fetch('/api/user')
    .then(response => response.json())
    .then(data => {
        const UserLabel = document.getElementById("userLabel")

        UserLabel.innerText = "Kullanıcı: " + data["user"];
    });

const map = L.map('map').setView([40.80276, 29.43068], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

addBins();
addDepot();

var previousMarker = null;
var processing = false;

function onMapClick(e) {
    if (processing){
        return;
    }

    if (previousMarker) {
        map.removeLayer(previousMarker);
    }

    var selectionElement = document.getElementById("selection");

    var requestBody = {
        "waypoints": waypoints,
        "coordinates": e.latlng,
        "materialType": Number(selectionElement.value)
    }

    processing = true;

    fetch('/get_prediction', {method: "POST", headers: {'Content-Type': 'application/json'}, body: JSON.stringify(requestBody)})
    .then(response => response.json())
    .then(prediction => {
        var redIcon = new L.Icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });

        volume = prediction["volume"].substring(1)
        volume = volume.slice(0, -3)
    
        // Add a new marker at the clicked location
        var newMarker = L.marker(e.latlng, {icon: redIcon}).addTo(map)
            .bindPopup("<h1>Tahmini atık miktarı: " + volume + "m³</h1><br><h1>" + "Ortalama Kare Hatası: " + prediction["mse"] + "</h1>")
            .openPopup();

        processing = false;
    
        // Update the previousMarker variable
        previousMarker = newMarker;
    });
}

map.on('click', onMapClick);