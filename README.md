# 🌤️ WeatherApp

🌐 **Live App:** https://weather-app-sandy-five-60.vercel.app  
🔧 **Backend API Docs:** https://weather-app-iuet.onrender.com/docs  
📁 **GitHub:** https://github.com/TasnimZarin/weather-app

---

## 🚀 Features

### Client Side / Frontend
- 🔍 **Location input** — search by city name, zip/postal code, GPS coordinates, or landmark
- 📍 **Auto-detect location** — uses browser Geolocation API to get current location weather
- 🌡️ **Current weather** — temperature, feels like, humidity, wind speed, weather condition
- ⏰ **24-hour forecast** — 3-hour interval forecast for the next 24 hours
- 📅 **5-day forecast** — daily forecast with weather icons and descriptions
- ✅ **Error handling** — graceful error messages for invalid cities, API failures, empty input
- 📱 **Responsive design** — fully responsive across desktop, tablet, and mobile
- 🎯 **User guidance** — success/error notifications, loading states, tab navigation

### Server Side / Backend
- 💾 **CREATE** — save weather searches with location + date range to PostgreSQL with validation
- 📖 **READ** — retrieve all saved searches from database
- ✏️ **UPDATE** — edit saved searches with location validation
- 🗑️ **DELETE** — remove saved searches
- 📤 **Export** — download saved data as JSON or CSV

### Extra Features
- 🤖 **AI Recommendation** — Groq API (Llama 3.3 70B) generates personalized outfit and activity recommendations based on real-time weather using prompt engineering
- 🗺️ **Google Maps** — interactive embedded map for any searched location
- 📺 **YouTube Videos** — YouTube Data API v3 fetches travel videos for the searched location
- ⚡ **Async backend** — all FastAPI endpoints use async/await for non-blocking API calls
- 🔄 **Multiple API management** — OpenWeatherMap, Groq, YouTube, Google Maps all integrated

---

## 🛠️ Tech Stack

### Frontend
- **React.js** — component-based UI
- **Tailwind CSS** — responsive design with breakpoints (sm, md, lg)
- **Axios** — async HTTP requests to backend and LLM endpoints
- **CSS Grid + Flexbox** — responsive layout techniques

### Backend
- **FastAPI (Python)** — async REST API framework
- **PostgreSQL** — relational database for data persistence
- **SQLAlchemy** — ORM for database operations
- **Pydantic** — data validation and schemas
- **Groq API (Llama 3.3 70B)** — LLM integration for AI recommendations
- **OpenWeatherMap API** — real-time weather + 5-day forecast data
- **YouTube Data API v3** — location video search
- **Google Maps Embed** — interactive location maps
- **httpx** — async HTTP client for LLM API calls

### DevOps
- **Git/GitHub** — version control
- **Render** — backend deployment
- **Vercel** — frontend deployment

---

## 📱 Responsive Design Techniques
- Tailwind CSS responsive breakpoints: `grid-cols-1 md:grid-cols-3`
- CSS Flexbox for search bar: `flex flex-col md:flex-row`
- CSS Grid for forecast: `grid grid-cols-5`
- Horizontal scroll for hourly forecast on mobile: `overflow-x-auto`
- Max width container: `max-w-4xl mx-auto`

---

## 🤖 AI Integration — Prompt Engineering
The AI recommendation uses structured prompt engineering:
- **Context injection** — weather data (temperature, humidity, wind, condition) passed as context
- **Role prompting** — system role set as "helpful weather assistant"
- **Output constraints** — max 3 sentences, friendly tone
- **Specific instructions** — covers outfit, activities, and weather warnings

---

## 🗄️ Data Pipeline
1. **Ingestion** — fetch weather data from OpenWeatherMap API
2. **Cleaning** — filter and transform raw API response to extract relevant fields
3. **Transformation** — group 3-hourly forecast into daily summaries
4. **Storage** — persist to PostgreSQL with SQLAlchemy
5. **Export** — export stored data as JSON or CSV

---

## 🏃 How to Run Locally

### Prerequisites
- Python 3.9+
- Node.js 18+
- PostgreSQL

### Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create `.env` file in backend folder:

- OPENWEATHER_API_KEY=your_openweather_key
- GROQ_API_KEY=your_groq_key
- YOUTUBE_API_KEY=your_youtube_key
- DATABASE_URL=postgresql://username@localhost/weatherapp

Create database:
```bash
psql postgres
CREATE DATABASE weatherapp;
\q
```

Run backend:
```bash
uvicorn main:app --reload
```

- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

- Frontend: http://localhost:3000

---

## 📁 Project Structure

weather-app/
├── backend/
│   ├── main.py           # FastAPI endpoints (11 endpoints)
│   ├── models.py         # SQLAlchemy database models
│   ├── schemas.py        # Pydantic validation schemas
│   ├── database.py       # PostgreSQL connection
│   ├── weather.py        # OpenWeatherMap API integration
│   └── requirements.txt  # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── App.js        # Main React component
│   │   └── index.css     # Tailwind CSS imports
│   ├── tailwind.config.js
│   └── package.json
└── README.md

---

## 🔑 APIs Used
| API | Purpose | Type |
|-----|---------|------|
| OpenWeatherMap | Current weather + 5-day forecast | REST |
| Groq (Llama 3.3 70B) | AI weather recommendations | LLM |
| YouTube Data API v3 | Location travel videos | REST |
| Google Maps Embed | Interactive location map | Embed |

---

## 🎯 Skills Demonstrated
- ✅ Async API calls in React via axios to LLM and REST endpoints
- ✅ User interaction guidance through loading states, error messages, success notifications
- ✅ LLM integration with prompt engineering
- ✅ REST API design and integration
- ✅ Data pipeline — ingestion, cleaning, transformation, storage, export
- ✅ Full-stack development — Python backend + React frontend
- ✅ PostgreSQL CRUD with validation
- ✅ Responsive design across all devices
- ✅ Multiple API management (4 external APIs)
- ✅ Agile development practices