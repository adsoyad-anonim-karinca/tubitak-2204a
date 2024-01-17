import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error
from sklearn.preprocessing import StandardScaler
import sys

np.random.seed(42)
num_samples = 1000
"""
latitude = np.random.uniform(35.0, 45.0, num_samples)
longitude = np.random.uniform(25.0, 35.0, num_samples)
waste_amount = 100 + 5 * latitude - 3 * longitude + np.random.normal(0, 5, num_samples)"""

latitude = []
longitude = []
waste_amount = []

triplet = sys.argv[1].split(';')

for pair in triplet:
    lat, lng, vol = pair.split(',')
    latitude.append(float(lat))
    longitude.append(float(lng))
    waste_amount.append(float(vol))

#print(latitude[0], longitude[0], waste_amount[0])

data = pd.DataFrame({'Latitude': latitude, 'Longitude': longitude, 'WasteAmount': waste_amount})

X = data[['Latitude', 'Longitude']]
y = data['WasteAmount']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

model = RandomForestRegressor(n_estimators=100, random_state=42)

model.fit(X_train_scaled, y_train)

y_pred = model.predict(X_test_scaled)

mse = mean_squared_error(y_test, y_pred)
#print(f'Mean Squared Error: {mse}')

user_input_scaled = scaler.transform(np.array([list(map(float, sys.argv[2].split(',')))]))

predicted_waste_amount = model.predict(user_input_scaled)

print(f"{mse},{predicted_waste_amount}")
