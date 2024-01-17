const PATH = require('path')
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const { MongoClient, ServerApiVersion } = require("mongodb");
const fetch = require('node-fetch');
const { spawn } = require('child_process');

const app = express();
const port = 3000;

var jsonParser = bodyParser.json()
var urlencodedParser = bodyParser.urlencoded({ extended: true })

const sessionOptions = {
    secret: 'secrete',
    cookie: {
        maxAge: 299999999999999
    },
    saveUninitialized: true,
    resave:true
};

const uri = 'mongodb+srv://admin:bNuu8vW9kUbiqS6G@cluster0.wtdvhzu.mongodb.net/?retryWrites=true&w=majority';

const client = new MongoClient(uri,  {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        }
    }
);

async function GetDocument(query, options, collectionName) {
    try {
        const database = client.db("AtikDB");
        const collection = database.collection(collectionName);
        
        if ((await collection.countDocuments(query)) === 0) {
            console.log("No documents found!");
        }
        
        return await collection.findOne(query, options);
    } catch (e){
        console.log(e);
    }
}

async function GetDocuments(query, options, collectionName) {
    try {
        const database = client.db("AtikDB");
        const collection = database.collection(collectionName);
        
        const cursor = collection.find(query, options);

        
        if ((await collection.countDocuments(query)) === 0) {
            console.log("No documents found!");
        }
        
        return await cursor.toArray();
    } catch (e){
        console.log(e);
    }
}

async function ReplaceDocument(query, update, options, collectionName) {
    try {
        const database = client.db("AtikDB");
        const collection = database.collection(collectionName);

        collection.replaceOne(query, update, options); //option (upsert: true);
    } catch (e){
        console.log(e);
    }
}

async function UpdateDocument(query, update, options, collectionName) {
    try {
        const database = client.db("AtikDB");
        const collection = database.collection(collectionName);

        collection.updateOne(query, update, options); //option (upsert: true);
    } catch (e){
        console.log(e);
    }
}

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(session(sessionOptions))
app.use(express.static(PATH.join(__dirname, 'public')));

app.get('/login', (req, res) => {
    if(req.session.user != null){
        res.redirect('/')
    }

    res.sendFile(__dirname + '/public/html/login.html')
});

app.post('/login', async (req, res) => {
    try{
        console.log(req.body);

        var user;
        await GetDocument({"username": req.body.username}, {}, 'Users').then((result) => {
            user = result;
        });

        if (user) {
            if(req.body.password === user["password"]){
                req.session.user = user["username"];
                res.redirect('/');
            }else{
                res.send("Incorrect password");
            }
        }
        else {
            res.send("Username incorrect");
        }
    } catch (e){
        console.log(e);
        res.send("Internal server error");
    }
});

app.use(function(req, res, next) {
    if (req.session.user == null){
        res.redirect('/login');
    } else{
        next();
    }
});

app.get('/logout', (req, res) => {
    if (req.session) {
        req.session.destroy(function (err) {
            if (err) {
                return next(err);
            } else {
                return res.redirect('/login');
            }
        });
    } 
});

app.get('/api/user', (req, res) => {
    const user = req.session.user || null;
    res.json({ user });
});  

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/html/home.html');
});

app.get('/route', (req, res) => {
    res.sendFile(__dirname + '/public/html/route.html');
});

app.get('/data', (req, res) => {
    GetDocuments({}, {}, 'AtikDB').then((result) => {
        res.json(result);
    })
});

app.post('/bin_data', async (req, res) => {
    await GetDocument(req.body, {}, 'AtikDB').then((result) => {
        res.json(result);
    })
});

app.post('/bin_percent_data', async (req, res) => {
    await GetDocument(req.body, {}, 'AtikDB').then((result) => {
        var responseBody = {
            "percents": []
        };

        var materialArray = Array.from(result["materials"]);

        materialArray.forEach(element => {
            var newPercent = {
                "name": element["name"],
                "percent": ((element["volume"] / result["max_volume"]) * 100).toFixed(2)
            }

            responseBody["percents"].push(newPercent);
        });

        res.json(responseBody);
    })
});

app.get('/analytics', (req, res) => {
    res.sendFile(__dirname + '/public/html/analytics.html')
});

app.get('/waste_data', async (req, res) => {
    var wasteData = {
        "wastes": [
            {
                "name": "Plastik",
                "volume": 0,
            },
            {
                "name": "Evsel",
                "volume": 0,
            },
            {
                "name": "Cam",
                "volume": 0,
            },
            {
                "name": "Kağıt",
                "volume": 0,
            },
            {
                "name": "Metal",
                "volume": 0,
            },
        ]
    }

    await GetDocuments({}, {}, 'AtikDB').then((result) => {
        for(var id in result){
            const bin = result[id];

            var materialArray = Array.from(bin["materials"]);

            materialArray.forEach(element => {
                wasteData["wastes"].find(obj => obj["name"] === element["name"]).volume += element["volume"];
            });
        }

        res.json(wasteData);
    })
});

app.post('/waste_data_bin', async (req, res) => {
    var bins = Array.from(req.body["bins"]);

    var wasteData = {
        "wastes": [
            {
                "name": "Plastik",
                "volume": 0,
            },
            {
                "name": "Evsel",
                "volume": 0,
            },
            {
                "name": "Cam",
                "volume": 0,
            },
            {
                "name": "Kağıt",
                "volume": 0,
            },
            {
                "name": "Metal",
                "volume": 0,
            },
        ]
    }

    await GetDocuments({"id": { $in: bins.map(x => x["id"])}}, {}, 'AtikDB').then((result) => {
        for(var id in result){
            const bin = result[id];

            var materialArray = Array.from(bin["materials"]);

            materialArray.forEach(element => {
                wasteData["wastes"].find(obj => obj["name"] === element["name"]).volume += element["volume"];
            });
        }

        res.json(wasteData);
    })
});

app.get('/fullness_data', async (req, res) => {
    var fullnessData = {
        "percents": [
            {
                "name": "Plastik",
                "percent": 0
            },
            {
                "name": "Evsel",
                "percent": 0
            },
            {
                "name": "Cam",
                "percent": 0
            },
            {
                "name": "Kağıt",
                "percent": 0
            },
            {
                "name": "Metal",
                "percent": 0
            },
        ]
    }

    await GetDocuments({}, {}, 'AtikDB').then((result) => {
        for(var id in result){
            const bin = result[id];

            var materialArray = Array.from(bin["materials"]);

            materialArray.forEach(element => {
                let percent = (element["volume"] / bin["max_volume"]) * 100;

                fullnessData["percents"].find(obj => obj["name"] === element["name"]).percent += percent;
            });
        }

        for(var id in fullnessData["percents"]){
            fullnessData["percents"][id]["percent"] = (fullnessData["percents"][id]["percent"] / result.length).toFixed(2);
        }

        res.json(fullnessData);
    })
});

app.post('/fullness_data_bin', async (req, res) => {
    var bins = Array.from(req.body["bins"]);

    var fullnessData = {
        "percents": [
            {
                "name": "Plastik",
                "percent": 0
            },
            {
                "name": "Evsel",
                "percent": 0
            },
            {
                "name": "Cam",
                "percent": 0
            },
            {
                "name": "Kağıt",
                "percent": 0
            },
            {
                "name": "Metal",
                "percent": 0
            },
        ]
    }

    await GetDocuments({"id": { $in: bins.map(x => x["id"])}}, {}, 'AtikDB').then((result) => {
        for(var id in result){
            const bin = result[id];

            var materialArray = Array.from(bin["materials"]);

            materialArray.forEach(element => {
                let percent = (element["volume"] / bin["max_volume"]) * 100;

                fullnessData["percents"].find(obj => obj["name"] === element["name"]).percent += percent;
            });
        }

        for(var id in fullnessData["percents"]){
            fullnessData["percents"][id]["percent"] = (fullnessData["percents"][id]["percent"] / result.length).toFixed(2);
        }

        res.json(fullnessData);
    })
});

app.post('/bin_update', async (req, res) => {
    var jsondata = req.body;

    var query = {
        "id": jsondata["id"]
    }

    var address;
    var materials = [];

    var materialArray = Array.from(jsondata["materials"]);

    materialArray.forEach(element => {
        var newMaterial = {
            "name": element["name"],
            "volume": (jsondata["max_volume"] / jsondata["max_distance"]) * element["distance"]
        }
        materials.push(newMaterial);
    });

    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${jsondata["lat"]}&lon=${jsondata["lng"]}`)
    .then(response => response.json())
    .then(fetchData => {
        address = fetchData["display_name"];
    })
    .catch(error => console.error('Error:', error));

    await GetDocument(query, {}, 'AtikDB').then(async (result) => {
        oldMaterials = {
            "time": result["time"],
            "materials": result["materials"]
        }

        data = {
            "$set": {
                "id": jsondata["id"],
                "lat": jsondata["lat"],
                "lng": jsondata["lng"],
                "max_distance": jsondata["max_distance"],
                "max_volume": jsondata["max_volume"],
                "address": address,
                "materials": materials,
                "time": Date.now()
            },
            "$push": {
                "oldMaterials": oldMaterials
            }         
        }

        await UpdateDocument(query, data, {}, "AtikDB").then(() => {
            console.log("updated!");
        })
    })

    res.send("Updated!");
});

app.post('/bin_address', (req, res) => {
    console.log("Adres aldım");
    const regex = new RegExp(`.*${req.body["address"]}.*`, 'i');
    GetDocuments({"address": regex}, {}, "AtikDB").then((result) => {
        res.json(result);
    })
});

app.post('/bin_id', (req, res) => {
    console.log("ID aldım");
    GetDocuments({"id": req.body.id}, {}, "AtikDB").then((result) => {
        res.json(result);
    })
});

app.post('/get_route', async (req, res) => {
    var waypoints = Array.from(req.body["waypoints"]);

    var filteredWaypoints = await Promise.all(waypoints.map(async function (point) {
        var result = await GetDocument({"id": point["id"]}, {}, 'AtikDB');
        let percent = (result["materials"][req.body.materialType]["volume"] / result["max_volume"]) * 100;
        console.log(percent, req.body.minPercent, typeof req.body.minPercent);
        return percent > req.body.minPercent;
    }));

    waypoints = waypoints.filter((point, index) => filteredWaypoints[index]);

    if(waypoints.length === 0){
        res.json({"info": "Uygun atık kutusu bulunamadı"});
        return;
    }

    console.log(waypoints);

    const formattedData = `${req.body["depot"]["coordinates"]["lng"]},${req.body["depot"]["coordinates"]["lat"]};` + waypoints.map(point => `${point["coordinates"]["lng"]},${point["coordinates"]["lat"]}`).join(';');

    console.log(`http://router.project-osrm.org/table/v1/driving/${formattedData}?annotations=duration,distance`);

    fetch(`http://router.project-osrm.org/table/v1/driving/${formattedData}?annotations=duration,distance`)
    .then(response => response.json())
    .then(async data => {
        console.log(data["durations"]);
        console.log(data["distances"]);

        matrix = data["distances"];

        let formattedMatrix = '';

        for (let i = 0; i < matrix.length; i++) {
            for (let j = 0; j < matrix[i].length; j++) {
                formattedMatrix += matrix[i][j];
                if(j != matrix[i].length - 1){
                    formattedMatrix += ',';
                }
            }

            if(i != matrix[i].length - 1){
                formattedMatrix += ';';
            }
        }

        console.log(formattedMatrix);

        //capacity

        formattedCapacity = "0,"

        for(var index in waypoints){
            await GetDocument({"id": waypoints[index]["id"]}, {}, 'AtikDB').then((result) => {
                formattedCapacity += result["materials"][req.body.materialType]["volume"];
            });

            if(index != waypoints.length - 1){
                formattedCapacity += ',';
            }
        }

        const sum = matrix.reduce((acc, row) => acc.concat(row)).reduce((a, b) => a + b, 0);
        
        console.log(formattedCapacity)

        console.log(req.body["vehicleNum"])

        console.log(req.body["vehicleCapacity"])

        console.log(sum, typeof sum);

        const arguments = [formattedMatrix, formattedCapacity, req.body["vehicleNum"], req.body["vehicleCapacity"], sum.toString()];

        var pythonScriptPath = './tools/';

        if(req.body["tool"] == "ai"){
            pythonScriptPath += "ai.py";
        }else{
            pythonScriptPath += "route.py"
        }

        const pythonProcess = spawn('python', [pythonScriptPath, ...arguments]);

        //parsing output

        pythonProcess.stdout.on('data', (data) => {
            console.log(`Python Script Output: ${data}`);

            data = data.toString('utf-8');

            console.log(data);

            console.log(typeof data);

            var routes = {
                "routes": []
            }

            const lines = data.trim().split('\n');
            const parsedRoutes = lines.slice(0, -1).map(line => {
                const parts = line.split('|');

                if(parts.length == 4){
                    const vehicleID = parseInt(parts[0], 10);
                    const routeWaypoints = parts[1].split(',').map(Number);
                    const routeDistance = parseInt(parts[2], 10);
                    const routeLoad = parseInt(parts[3], 10);

                    return { vehicleID, routeWaypoints, routeDistance, routeLoad };
                }

                return 
            });

            console.log(parsedRoutes);

            for(var ind in parsedRoutes){
                parsedRoutes[ind]["routeWaypoints"] = parsedRoutes[ind]["routeWaypoints"].map(index => {
                    if(index != 0){
                        return waypoints[index - 1];
                    }else{
                        return req.body["depot"];
                    }
                })
            }

            routes["routes"] = parsedRoutes;

            var lastLineParts = lines[lines.length - 1].split('|')

            routes["totalDistance"] = parseInt(lastLineParts[0], 10)
            routes["totalLoad"] = parseInt(lastLineParts[1], 10)

            console.log(routes);
            res.json(routes);
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error(`Error from Python Script: ${data}`);
        });
        
        pythonProcess.on('close', (code) => {
            console.log(`Python Script Exited with Code: ${code}`);
        });
    })
});

app.get('/depot_data', (req, res) => {
    GetDocuments({}, {}, 'DepotDB').then((result) => {
        res.json(result);
    });
});

app.get('/new', (req, res) => {
    res.sendFile(__dirname + '/public/html/new.html')
});

app.post('/get_prediction', (req, res) => {
    var waypoints = Array.from(req.body["waypoints"]);
    var coordinates = req.body["coordinates"];

    GetDocuments({"id": { $in: waypoints.map(x => x["id"])}}, {}, 'AtikDB').then((result) => {
        formattedInput = result.map(item => `${item.lat},${item.lng},${item.materials[req.body.materialType]["volume"]}`).join(';')
        console.log(formattedInput);

        console.log(`${coordinates["lat"]},${coordinates["lng"]}`)

        const arguments = [formattedInput, `${coordinates["lat"]},${coordinates["lng"]}`];

        var pythonScriptPath = './tools/predict.py';

        const pythonProcess = spawn('python', [pythonScriptPath, ...arguments]);

        //parsing output

        pythonProcess.stdout.on('data', (data) => {
            console.log(`Python Script Output: ${data}`);

            data = data.toString('utf-8');

            console.log(data);

            console.log(typeof data);

            values = data.split(',')

            res.json({"mse": values[0], "volume": values[1]});
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error(`Error from Python Script: ${data}`);
        });
        
        pythonProcess.on('close', (code) => {
            console.log(`Python Script Exited with Code: ${code}`);
        });
    });
});

app.get('/old', (req, res) => {
    res.sendFile(__dirname + '/public/html/old.html')
});

app.post('/old_data', (req, res) => {
    GetDocument({"id": req.body.id},{},'AtikDB').then((result) => {
        var startDate = new Date(req.body.startDate);
        var endDate = new Date(req.body.endDate);

        result["oldMaterials"] = result["oldMaterials"].filter(item => {
            //console.log(startDate.toDateString(), endDate.toDateString(), item.time.toDateString())
            itemDate = new Date(item.time)
            return itemDate >= startDate && itemDate <= endDate;
        });

        var fullnessData = []

        var fullnessData = result["oldMaterials"].map(item => {
            const updatedMaterials = item.materials.map(material => {
                return {
                    ...material,
                    "percent": (material.volume / result["max_volume"] * 100).toFixed(2)
                };
            });

            return {
                ...item,
                "materials": updatedMaterials
            };
        })

        res.json({"data": result["oldMaterials"], "fullness": fullnessData});
    });
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});