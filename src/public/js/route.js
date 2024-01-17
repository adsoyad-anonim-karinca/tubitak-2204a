waypoints = []
depots = []
RouteControls = []

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

function updatePercentInput(value) {
    const numericValue = value.replace(/[^0-9.]/g, '');
  
    document.getElementById('selection3').value = numericValue + '%';
}

function updateMetricInput(value) {
    const numericValue = value.replace(/[^0-9.]/g, '');
  
    document.getElementById('selection5').value = numericValue + 'm³';
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
        `;
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

function getRoute(){
    RouteControls.forEach(element => {
        map.removeControl(element);
    });
    RouteControls = [];

    var selectionElement = document.getElementById("selection1");
    var selectionElement2 = document.getElementById("selection2");
    var selectionElement3 = document.getElementById("selection3");
    var selectionElement4 = document.getElementById("selection4");
    var selectionElement5 = document.getElementById("selection5"); 

    var requestBody = {
        "waypoints": waypoints,
        "depot": depots[0],
        "vehicleNum": Number(selectionElement4.value),
        "vehicleCapacity": Number(selectionElement5.value.slice(0, -2)),
        "tool": selectionElement.value,
        "materialType": Number(selectionElement2.value),
        "minPercent": Number(selectionElement3.value.slice(0, -1))
    }

    fetch('/get_route', {method: "POST", headers: {'Content-Type': 'application/json'}, body: JSON.stringify(requestBody)})
    .then(response => response.json())
    .then(data => {
        if(typeof data.info !== 'undefined'){
            alert(data.info);
            return;
        }

        console.log(data);

        routes = data["routes"]

        clearWaypoints();

        for(var index in routes){
            routeWaypoints = routes[index]["routeWaypoints"].map(item => item["coordinates"])

            var control = L.Routing.control({
                waypoints: routeWaypoints,
                plan: L.Routing.plan(routeWaypoints, {
                    createMarker: function(i, wp, n) {
                        var icon = new L.icon({
                            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                            iconSize: [25, 41],
                            iconAnchor: [12, 41],
                            popupAnchor: [1, -34],
                            shadowSize: [41, 41]
                        })

                        var marker = L.marker(wp.latLng, {
                            draggable: false,
                            icon: icon
                        });

                        console.log(i, n, i == 0 || i == n - 1);

                        if(i == 0 || i == n - 1){
                            marker.setIcon(L.icon({
                                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                                iconSize: [25, 41],
                                iconAnchor: [12, 41],
                                popupAnchor: [1, -34],
                                shadowSize: [41, 41]
                            }))
                        }

                        return marker
                    }
                }),
                addWaypoints: false,
                routeWhileDragging: false,
                lineOptions: {
                    styles: [
                        {color: 'black', opacity: 0.15, weight: 9}, 
                        {color: 'white', opacity: 0.8, weight: 6}, 
                        {color: getRandomColor(), opacity: 1, weight: 2}
                    ]
                }    
            }).addTo(map);

            RouteControls.push(control);
        }

        alertMsg = ""
        for(var index in routes){
            alertMsg += `${Number(index) + 1} numaralı aracın toplam atık yükü: ${routes[index]["routeLoad"]}m³\n`;
        }
        alert(alertMsg)
    })
}

function clearRoutes(){
    RouteControls.forEach(element => {
        map.removeControl(element);
    });
    RouteControls = [];

    addBins();
    addDepot();
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

/*
L.heatLayer([
    [40.823916, 29.39715, 1], // lat, lng, intensity
    [40.855251, 29.386579, 1],
], {radius: 1}).addTo(map);
*/