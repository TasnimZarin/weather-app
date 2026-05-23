import requests
import os
import re
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("OPENWEATHER_API_KEY")
BASE_URL = "http://api.openweathermap.org/data/2.5"
GEO_URL = "http://api.openweathermap.org/geo/1.0"


def parse_location(location: str):
    """
    Detects input type and returns (lat, lon) or None.
    Handles:
    - GPS coordinates: "40.7128,-74.0060"
    - Zip codes: "10001" or "M5V 3A8"
    - City names + landmarks: passed to geocoding API
    """
    location = location.strip()

    # --- GPS coordinates: "40.7128,-74.0060" or "40.7128, -74.0060" ---
    coord_pattern = r'^-?\d+\.?\d*\s*,\s*-?\d+\.?\d*$'
    if re.match(coord_pattern, location):
        parts = location.split(',')
        lat = float(parts[0].strip())
        lon = float(parts[1].strip())
        return lat, lon

    # --- US zip code: 5 digits ---
    if re.match(r'^\d{5}$', location):
        return get_coords_by_zip(location, "US")

    # --- Canadian postal code: "M5V 3A8" or "M5V3A8" ---
    if re.match(r'^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$', location):
        return get_coords_by_zip(location.replace(" ", ""), "CA")

    # --- UK postal code: "SW1A 1AA" etc ---
    if re.match(r'^[A-Za-z]{1,2}\d{1,2}[A-Za-z]?\s?\d[A-Za-z]{2}$', location):
        return get_coords_by_zip(location, "GB")

    # --- Everything else: city name, landmark, address ---
    return get_coords_by_name(location)


def get_coords_by_zip(zip_code: str, country_code: str):
    """Use OpenWeatherMap zip geocoding API"""
    url = f"{GEO_URL}/zip"
    params = {
        "zip": f"{zip_code},{country_code}",
        "appid": API_KEY
    }
    response = requests.get(url, params=params)
    if response.status_code != 200:
        return None
    data = response.json()
    return data.get("lat"), data.get("lon")


def get_coords_by_name(location: str):
def get_coords_by_name(location: str):
    url = f"{GEO_URL}/direct"
    clean_location = location.replace(",", " ").strip()
    params = {
        "q": clean_location,
        "limit": 1,
        "appid": API_KEY
    }
    response = requests.get(url, params=params)
    if response.status_code != 200:
        return None, None
    results = response.json()
    if not results:
        return None, None
    data = results[0]
    return data.get("lat"), data.get("lon")


def format_weather(data: dict):
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


def get_current_weather(location: str):
    coords = parse_location(location)
    if coords is None or coords[0] is None:
        return None

    lat, lon = coords
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

    return format_weather(response.json())


def get_forecast(location: str):
    coords = parse_location(location)
    if coords is None or coords[0] is None:
        return None, None

    lat, lon = coords
    return get_forecast_by_coords(lat, lon)


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

    return format_weather(response.json())


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