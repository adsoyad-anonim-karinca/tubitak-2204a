fetch('/waste_data')
    .then(response => response.json())
    .then(bin_data => {
        const typeCtx = document.getElementById('wasteTypeChart');

        wasteChart = new Chart(typeCtx, {
            type: 'pie',
            data: {
                //labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
                labels: bin_data["wastes"].map(item => item.name),
                datasets: [{
                    label: '# of Votes',
                    data: bin_data["wastes"].map(item => item.volume),
                }]
            },
            options: {
                responsive: false,
                plugins: {
                    legend: {
                        position: 'top',
                        onClick: function(e, legendItem) {
                            e.stopPropagation();
                        }
                    },
                    title: {
                        display: true,
                        text: 'Atık Tipi Grafiği'
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
                },
            },
        });
    });

fetch('/fullness_data')
    .then(response => response.json())
    .then(percent_data => {
        const percentCtx = document.getElementById('fullnessChart');

        fullnesChart = new Chart(percentCtx, {
            type: 'polarArea',
            data: {
                //labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
                labels: percent_data["percents"].map(item => item.name),
                datasets: [{
                    label: 'Doluluk Oranı',
                    data: percent_data["percents"].map(item => item.percent),
                }]
            },
            options: {
                responsive: false,
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
                        text: 'Ortalama Atık Kutusu Doluluk Oranı'
                    }
                },
            },
        });
    });

function getByAddress(){
    var requestBody = {
        "address": document.getElementById('addressInput').value,
    }

    fetch('/bin_address', {method: "POST", headers: {'Content-Type': 'application/json'}, body: JSON.stringify(requestBody)})
    .then(response => response.json())
    .then(data => {
        document.getElementById('listBody').innerHTML = ''

        for(var id in data){
            document.getElementById('listBody').insertAdjacentHTML('beforeend', `
            <tr>
                <td>${data[id]["id"]}</td>
                <td>${data[id]["lat"]}°K</td>
                <td>${data[id]["lng"]}°D</td>
                <td>${data[id]["address"]}</td>
                <td>${data[id]["materials"][0]["volume"]}m³</td>
                <td>${data[id]["materials"][1]["volume"]}m³</td>
                <td>${data[id]["materials"][2]["volume"]}m³</td>
                <td>${data[id]["materials"][3]["volume"]}m³</td>
                <td>${data[id]["materials"][4]["volume"]}m³</td>
            </tr>
        `);
        }

        wasteChart.destroy();

        requestBody = {
            "bins": data,
        }

        fetch('/waste_data_bin', {method: "POST", headers: {'Content-Type': 'application/json'}, body: JSON.stringify(requestBody)})
        .then(response => response.json())
        .then(bin_data => {
            const typeCtx = document.getElementById('wasteTypeChart');

            wasteChart = new Chart(typeCtx, {
                type: 'pie',
                data: {
                    //labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
                    labels: bin_data["wastes"].map(item => item.name),
                    datasets: [{
                        label: '# of Votes',
                        data: bin_data["wastes"].map(item => item.volume),
                    }]
                },
                options: {
                    responsive: false,
                    plugins: {
                        legend: {
                            position: 'top',
                            onClick: function(e, legendItem) {
                                e.stopPropagation();
                            }
                        },
                        title: {
                            display: true,
                            text: 'Atık Tipi Grafiği'
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
                    },
                },
            });
        });

        fullnesChart.destroy();

        fetch('/fullness_data_bin', {method: "POST", headers: {'Content-Type': 'application/json'}, body: JSON.stringify(requestBody)})
        .then(response => response.json())
        .then(percent_data => {
            const percentCtx = document.getElementById('fullnessChart');

            fullnesChart = new Chart(percentCtx, {
                type: 'polarArea',
                data: {
                    //labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
                    labels: percent_data["percents"].map(item => item.name),
                    datasets: [{
                        label: 'Doluluk Oranı',
                        data: percent_data["percents"].map(item => item.percent),
                    }]
                },
                options: {
                    responsive: false,
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
                            text: 'Ortalama Atık Kutusu Doluluk Oranı'
                        }
                    },
                },
            });
        });
    });
}

function getByID(){
    var requestBody = {
        "id": Number(document.getElementById('IDInput').value),
    }

    fetch('/bin_id', {method: "POST", headers: {'Content-Type': 'application/json'}, body: JSON.stringify(requestBody)})
    .then(response => response.json())
    .then(data => {
        document.getElementById('listBody').innerHTML = ''

        for(var id in data){
            document.getElementById('listBody').insertAdjacentHTML('beforeend', `
                <tr>
                    <td>${data[id]["id"]}</td>
                    <td>${data[id]["lat"]}°K</td>
                    <td>${data[id]["lng"]}°D</td>
                    <td>${data[id]["address"]}</td>
                    <td>${data[id]["materials"][0]["volume"]}m³</td>
                    <td>${data[id]["materials"][1]["volume"]}m³</td>
                    <td>${data[id]["materials"][2]["volume"]}m³</td>
                    <td>${data[id]["materials"][3]["volume"]}m³</td>
                    <td>${data[id]["materials"][4]["volume"]}m³</td>
                </tr>
            `);
        }

        wasteChart.destroy();

        requestBody = {
            "bins": data,
        }

        fetch('/waste_data_bin', {method: "POST", headers: {'Content-Type': 'application/json'}, body: JSON.stringify(requestBody)})
        .then(response => response.json())
        .then(bin_data => {
            const typeCtx = document.getElementById('wasteTypeChart');

            wasteChart = new Chart(typeCtx, {
                type: 'pie',
                data: {
                    //labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
                    labels: bin_data["wastes"].map(item => item.name),
                    datasets: [{
                        label: '# of Votes',
                        data: bin_data["wastes"].map(item => item.volume),
                    }]
                },
                options: {
                    responsive: false,
                    plugins: {
                        legend: {
                            position: 'top',
                            onClick: function(e, legendItem) {
                                e.stopPropagation();
                            }
                        },
                        title: {
                            display: true,
                            text: 'Atık Tipi Grafiği'
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
                    },
                },
            });
        });

        fullnesChart.destroy();

        fetch('/fullness_data_bin', {method: "POST", headers: {'Content-Type': 'application/json'}, body: JSON.stringify(requestBody)})
        .then(response => response.json())
        .then(percent_data => {
            const percentCtx = document.getElementById('fullnessChart');

            fullnesChart = new Chart(percentCtx, {
                type: 'polarArea',
                data: {
                    //labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
                    labels: percent_data["percents"].map(item => item.name),
                    datasets: [{
                        label: 'Doluluk Oranı',
                        data: percent_data["percents"].map(item => item.percent),
                    }]
                },
                options: {
                    responsive: false,
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
                            text: 'Ortalama Atık Kutusu Doluluk Oranı'
                        }
                    },
                },
            });
        });
    });
}

fetch('/api/user')
    .then(response => response.json())
    .then(data => {
        const UserLabel = document.getElementById("userLabel")

        UserLabel.innerText = "Kullanıcı: " + data["user"];
    });