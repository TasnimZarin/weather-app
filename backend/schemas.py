from pydantic import BaseModel, validator
from typing import Optional
from datetime import datetime

class WeatherSearchCreate(BaseModel):
    location: str
    date_from: Optional[str] = None
    date_to: Optional[str] = None

    @validator('location')
    def location_must_not_be_empty(cls, v):
        if not v.strip():
            raise ValueError('Location cannot be empty')
        return v

class WeatherSearchUpdate(BaseModel):
    location: Optional[str] = None
    temperature: Optional[float] = None
    description: Optional[str] = None

class WeatherSearchResponse(BaseModel):
    id: int
    location: str
    country: Optional[str]
    temperature: Optional[float]
    feels_like: Optional[float]
    humidity: Optional[int]
    description: Optional[str]
    icon: Optional[str]
    wind_speed: Optional[float]
    date_from: Optional[str]
    date_to: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True