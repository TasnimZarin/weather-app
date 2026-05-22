from sqlalchemy import Column, Integer, String, Float, DateTime
from database import Base
from datetime import datetime

class WeatherSearch(Base):
    __tablename__ = "weather_searches"

    id = Column(Integer, primary_key=True, index=True)
    location = Column(String, nullable=False)
    country = Column(String)
    temperature = Column(Float)
    feels_like = Column(Float)
    humidity = Column(Integer)
    description = Column(String)
    icon = Column(String)
    wind_speed = Column(Float)
    date_from = Column(String)
    date_to = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)