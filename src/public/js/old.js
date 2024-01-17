function getRandomColor(){
    return "#" + ((1 << 24) * Math.random() | 0).toString(16).padStart(6, "0")
}

function getByID(){
    if(typeof volumeChartVar != 'undefined'){
        volumeChartVar.destroy();
        fullnessChartVar.destroy();
    }

    var requestBody = {
        "id": Number(document.getElementById('IDInput').value),
        "startDate": new Date(document.getElementById('startDate').value),
        "endDate": new Date(document.getElementById('endDate').value)
    }

    fetch('/old_data', {method: "POST", headers: {'Content-Type': 'application/json'}, body: JSON.stringify(requestBody)})
    .then(response => response.json())
    .then(jsonData => {
        var datasets = [];
        var materialNames = jsonData.data[0].materials.map(x => x.name);
    
        materialNames.forEach(function (material) {
            var materialData = jsonData.data.map(function (point) {
                return {
                    x: point.time,
                    y: point.materials.find(x => x.name === material).volume
                };
            });
    
            datasets.push({
                label: material,
                borderColor: getRandomColor(),
                data: materialData,
                fill: false,
            });
        });

        console.log(datasets)

        var volumeCtx = document.getElementById('volumeChart');
        volumeChartVar = new Chart(volumeCtx, {
        type: 'line',
        data: {
            datasets: datasets
        },
        options: {
            responsive: true,
            scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'day',
                            displayFormats: {
                                day: 'MMM d'
                            },
                        },
                        title: {
                            display: true,
                            text: 'Tarih'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Hacim'
                        }
                    }
                },
                maxHeight: 500
            }
        });

        datasets = []

        materialNames.forEach(function (material) {
            var materialData = jsonData.fullness.map(function (point) {
                return {
                    x: point.time,
                    y: point.materials.find(x => x.name === material).percent
                };
            });
    
            datasets.push({
                label: material,
                borderColor: getRandomColor(),
                data: materialData,
                fill: false,
            });
        });

        console.log(datasets)

        var fullnessCtx = document.getElementById('fullnessChart');
        fullnessChartVar = new Chart(fullnessCtx, {
        type: 'line',
        data: {
            datasets: datasets
        },
        options: {
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'day',
                            displayFormats: {
                                day: 'MMM d'
                            },
                        },
                        title: {
                            display: true,
                            text: 'Tarih'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Doluluk Oranı'
                        }
                    }
                }
            }
        });
    });
}

fetch('/api/user')
    .then(response => response.json())
    .then(data => {
        const UserLabel = document.getElementById("userLabel")

        UserLabel.innerText = "Kullanıcı: " + data["user"];
    });