import requests
import os
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("OPENWEATHER_API_KEY")
BASE_URL = "http://api.openweathermap.org/data/2.5"

def get_current_weather(location: str):
    url = f"{BASE_URL}/weather"
    params = {
        "q": location,
        "appid": API_KEY,
        "units": "metric"
    }
    response = requests.get(url, params=params)
    
    if response.status_code == 404:
        return None
    
    if response.status_code != 200:
        return None
        
    data = response.json()
    
    return {
        "location": data["name"],
        "country": data["sys"]["country"],
        "temperature": data["main"]["temp"],
        "feels_like": data["main"]["feels_like"],
        "humidity": data["main"]["humidity"],
        "description": data["weather"][0]["description"],
        "icon": data["weather"][0]["icon"],
        "wind_speed": data["wind"]["speed"]
    }

def get_forecast(location: str):
    url = f"{BASE_URL}/forecast"
    params = {
        "q": location,
        "appid": API_KEY,
        "units": "metric",
        "cnt": 40
    }
    response = requests.get(url, params=params)
    
    if response.status_code != 200:
        return None, None
    
    data = response.json()
    
    # --- 5-day forecast (one per day, midday preferred) ---
    daily = {}
    for item in data["list"]:
        date = item["dt_txt"].split(" ")[0]
        time = item["dt_txt"].split(" ")[1]
        if date not in daily or time == "12:00:00":
            daily[date] = {
                "date": date,
                "temperature": item["main"]["temp"],
                "description": item["weather"][0]["description"],
                "icon": item["weather"][0]["icon"],
                "humidity": item["main"]["humidity"]
            }
    
    # --- 3-hourly forecast for next 24 hours ---
    hourly = []
    for item in data["list"][:8]:
        hourly.append({
            "time": item["dt_txt"],
            "temperature": item["main"]["temp"],
            "description": item["weather"][0]["description"],
            "icon": item["weather"][0]["icon"],
            "humidity": item["main"]["humidity"]
        })
    
    return list(daily.values())[:5], hourly

def get_weather_by_coords(lat: float, lon: float):
    url = f"{BASE_URL}/weather"
    params = {
        "lat": lat,
        "lon": lon,
        "appid": API_KEY,
        "units": "metric"
    }
    response = requests.get(url, params=params)
    
    if response.status_code != 200:
        return None
        
    data = response.json()
    
    return {
        "location": data["name"],
        "country": data["sys"]["country"],
        "temperature": data["main"]["temp"],
        "feels_like": data["main"]["feels_like"],
        "humidity": data["main"]["humidity"],
        "description": data["weather"][0]["description"],
        "icon": data["weather"][0]["icon"],
        "wind_speed": data["wind"]["speed"]
    }

def get_forecast_by_coords(lat: float, lon: float):
    url = f"{BASE_URL}/forecast"
    params = {
        "lat": lat,
        "lon": lon,
        "appid": API_KEY,
        "units": "metric",
        "cnt": 40
    }
    response = requests.get(url, params=params)
    
    if response.status_code != 200:
        return None, None
    
    data = response.json()
    
    # --- 5-day forecast (one per day, midday preferred) ---
    daily = {}
    for item in data["list"]:
        date = item["dt_txt"].split(" ")[0]
        time = item["dt_txt"].split(" ")[1]
        if date not in daily or time == "12:00:00":
            daily[date] = {
                "date": date,
                "temperature": item["main"]["temp"],
                "description": item["weather"][0]["description"],
                "icon": item["weather"][0]["icon"],
                "humidity": item["main"]["humidity"]
            }
    
    # --- 3-hourly forecast for next 24 hours ---
    hourly = []
    for item in data["list"][:8]:
        hourly.append({
            "time": item["dt_txt"],
            "temperature": item["main"]["temp"],
            "description": item["weather"][0]["description"],
            "icon": item["weather"][0]["icon"],
            "humidity": item["main"]["humidity"]
        })
    
    return list(daily.values())[:5], hourly