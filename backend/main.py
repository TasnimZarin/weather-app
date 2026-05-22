from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import json
import csv
import io
import os
import httpx
from dotenv import load_dotenv

from groq import Groq
from database import engine, get_db, Base
from models import WeatherSearch
from schemas import WeatherSearchCreate, WeatherSearchUpdate, WeatherSearchResponse
from weather import get_current_weather, get_forecast, get_weather_by_coords, get_forecast_by_coords

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")

# Create all database tables
Base.metadata.create_all(bind=engine)

# Create FastAPI app
app = FastAPI(
    title="Weather App",
    description="PM Accelerator - Built by Zarin Tasnim"
)

# Allow React frontend to talk to our backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================
# WEATHER ENDPOINTS
# =====================

@app.get("/weather/current")
async def current_weather(location: str):
    data = get_current_weather(location)
    if data is None:
        raise HTTPException(status_code=404, detail="City not found. Please check the spelling and try again.")
    return data

@app.get("/weather/forecast")
async def weather_forecast(location: str):
    daily, hourly = get_forecast(location)
    if daily is None:
        raise HTTPException(status_code=404, detail="City not found. Please check the spelling and try again.")
    return {"daily": daily, "hourly": hourly}

@app.get("/weather/coords")
async def weather_by_coords(lat: float, lon: float):
    data = get_weather_by_coords(lat, lon)
    if data is None:
        raise HTTPException(status_code=404, detail="Location not found")
    daily, hourly = get_forecast_by_coords(lat, lon)
    return {"current": data, "daily": daily, "hourly": hourly}

# =====================
# AI RECOMMENDATION
# =====================

@app.get("/weather/recommend")
async def get_recommendation(location: str):
    
    # Step 1: get current weather
    weather = get_current_weather(location)
    if weather is None:
        raise HTTPException(status_code=404, detail="City not found")

    # Step 2: build prompt
    prompt = f"""
    The weather in {weather['location']}, {weather['country']} is:
    - Temperature: {weather['temperature']}°C
    - Feels like: {weather['feels_like']}°C
    - Condition: {weather['description']}
    - Humidity: {weather['humidity']}%
    - Wind speed: {weather['wind_speed']} m/s

    Based on this weather, give a short friendly recommendation covering:
    1. What to wear
    2. Best activities for this weather
    3. Any weather warnings or tips

    Keep it concise, helpful and friendly. Max 3 sentences.
    """

    # Step 3: call Groq API
    client = Groq(api_key=GROQ_API_KEY)
    chat_completion = client.chat.completions.create(
        messages=[
            {"role": "system", "content": "You are a helpful weather assistant."},
            {"role": "user", "content": prompt}
        ],
        model="llama-3.3-70b-versatile",
    )

    recommendation = chat_completion.choices[0].message.content

    return {
        "location": weather["location"],
        "weather": weather,
        "recommendation": recommendation
    }

# =====================
# YOUTUBE ENDPOINT
# =====================

@app.get("/weather/youtube")
async def get_youtube_videos(location: str):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://www.googleapis.com/youtube/v3/search",
            params={
                "q": f"{location} city travel",
                "part": "snippet",
                "maxResults": 3,
                "type": "video",
                "key": YOUTUBE_API_KEY
            }
        )

    if response.status_code != 200:
        raise HTTPException(status_code=503, detail="YouTube service unavailable")

    data = response.json()
    videos = []
    for item in data.get("items", []):
        videos.append({
            "title": item["snippet"]["title"],
            "video_id": item["id"]["videoId"],
            "thumbnail": item["snippet"]["thumbnails"]["medium"]["url"],
            "url": f"https://www.youtube.com/watch?v={item['id']['videoId']}"
        })

    return {"videos": videos}

# =====================
# CRUD ENDPOINTS
# =====================

@app.post("/searches", response_model=WeatherSearchResponse)
async def create_search(search: WeatherSearchCreate, db: Session = Depends(get_db)):
    # Validate location exists
    weather_data = get_current_weather(search.location)
    if weather_data is None:
        raise HTTPException(status_code=404, detail="City not found")

    # Validate date range if provided
    if search.date_from and search.date_to:
        if search.date_from > search.date_to:
            raise HTTPException(status_code=400, detail="date_from must be before date_to")

    # Create database record
    db_search = WeatherSearch(
        location=weather_data["location"],
        country=weather_data["country"],
        temperature=weather_data["temperature"],
        feels_like=weather_data["feels_like"],
        humidity=weather_data["humidity"],
        description=weather_data["description"],
        icon=weather_data["icon"],
        wind_speed=weather_data["wind_speed"],
        date_from=search.date_from,
        date_to=search.date_to
    )
    db.add(db_search)
    db.commit()
    db.refresh(db_search)
    return db_search

@app.get("/searches", response_model=List[WeatherSearchResponse])
async def get_searches(db: Session = Depends(get_db)):
    searches = db.query(WeatherSearch).all()
    return searches

@app.put("/searches/{search_id}", response_model=WeatherSearchResponse)
async def update_search(search_id: int, search: WeatherSearchUpdate, db: Session = Depends(get_db)):
    db_search = db.query(WeatherSearch).filter(WeatherSearch.id == search_id).first()
    if db_search is None:
        raise HTTPException(status_code=404, detail="Search not found")

    if search.location:
        weather_data = get_current_weather(search.location)
        if weather_data is None:
            raise HTTPException(status_code=404, detail="City not found")
        db_search.location = weather_data["location"]
        db_search.country = weather_data["country"]
        db_search.temperature = weather_data["temperature"]

    if search.description:
        db_search.description = search.description

    db.commit()
    db.refresh(db_search)
    return db_search

@app.delete("/searches/{search_id}")
async def delete_search(search_id: int, db: Session = Depends(get_db)):
    db_search = db.query(WeatherSearch).filter(WeatherSearch.id == search_id).first()
    if db_search is None:
        raise HTTPException(status_code=404, detail="Search not found")
    db.delete(db_search)
    db.commit()
    return {"message": "Search deleted successfully"}

# =====================
# EXPORT ENDPOINTS
# =====================

@app.get("/searches/export/json")
async def export_json(db: Session = Depends(get_db)):
    searches = db.query(WeatherSearch).all()
    data = []
    for s in searches:
        data.append({
            "id": s.id,
            "location": s.location,
            "country": s.country,
            "temperature": s.temperature,
            "humidity": s.humidity,
            "description": s.description,
            "date_from": s.date_from,
            "date_to": s.date_to,
            "created_at": str(s.created_at)
        })
    return data

@app.get("/searches/export/csv")
async def export_csv(db: Session = Depends(get_db)):
    searches = db.query(WeatherSearch).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "location", "country", "temperature",
                     "humidity", "description", "date_from", "date_to", "created_at"])
    for s in searches:
        writer.writerow([s.id, s.location, s.country, s.temperature,
                        s.humidity, s.description, s.date_from, s.date_to, s.created_at])
    output.seek(0)
    return {"csv": output.getvalue()}