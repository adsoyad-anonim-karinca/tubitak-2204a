# Define the JSON data
$jsonData = @{
    lat = 40.855251
    lng = 29.386579
    id = 20
    max_distance = 200
    max_volume = 100
    materials = @(
        @{
            name = "Plastik"
            distance = 150
        },
        @{
            name = "Evsel"
            distance = 200
        },
        @{
            name = "Cam"
            distance = 150
        },
        @{
            name = "Kağıt"
            distance = 100
        },
        @{
            name = "Metal"
            distance = 50
        }
    )
} | ConvertTo-Json

# Set the API endpoint URL
$apiEndpoint = 'http://localhost:3000/bin_update'

# Set headers (optional)
$headers = @{
    'Content-Type' = 'application/json' # Include if your API requires authentication
}

echo $jsonData

# Make the HTTP POST request
$response = Invoke-RestMethod -Uri $apiEndpoint -Method Post -Headers $headers -Body $jsonData

# Display the response
$response