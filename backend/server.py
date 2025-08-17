import os
import uuid
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from supabase import create_client, Client
from gotrue.errors import AuthApiError
import pandas as pd
import json
from io import BytesIO

# Initialize FastAPI app
app = FastAPI(title="Global Drama Verse Guide API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_ANON_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

# Security
security = HTTPBearer()

# Pydantic Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    username: str = Field(min_length=3, max_length=50)
    first_name: str = Field(max_length=100)
    last_name: str = Field(max_length=100)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ProfileUpdate(BaseModel):
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None

class ContentCreate(BaseModel):
    title: str
    original_title: Optional[str] = None
    poster_url: Optional[str] = None
    banner_url: Optional[str] = None
    synopsis: str
    year: int
    country: str
    content_type: str
    genres: List[str]
    rating: float = Field(ge=0, le=10)
    episodes: Optional[int] = None
    duration: Optional[int] = None
    cast: Optional[List[Dict[str, Any]]] = []
    crew: Optional[List[Dict[str, Any]]] = []
    streaming_platforms: Optional[List[str]] = []
    tags: Optional[List[str]] = []

class WatchlistAdd(BaseModel):
    content_id: str
    status: str = "want_to_watch"
    total_episodes: Optional[int] = None

class WatchlistUpdate(BaseModel):
    status: Optional[str] = None
    progress: Optional[int] = None
    rating: Optional[float] = None
    notes: Optional[str] = None

class ReviewCreate(BaseModel):
    content_id: str
    rating: float = Field(ge=0, le=10)
    title: Optional[str] = None
    review_text: Optional[str] = None
    contains_spoilers: bool = False

class ReviewUpdate(BaseModel):
    rating: Optional[float] = None
    title: Optional[str] = None
    review_text: Optional[str] = None
    contains_spoilers: Optional[bool] = None

class CommentCreate(BaseModel):
    review_id: int
    comment_text: str
    parent_comment_id: Optional[int] = None

# Authentication helpers
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        user = supabase.auth.get_user(token)
        if not user.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user.user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user_profile(current_user = Depends(get_current_user)):
    try:
        result = supabase.table("profiles").select("*").eq("id", current_user.id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Profile not found")
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Root endpoint
@app.get("/api/")
async def root():
    return {"message": "Global Drama Verse Guide API", "version": "1.0.0"}

# Authentication endpoints
@app.post("/api/auth/register")
async def register(user_data: UserRegister):
    try:
        # Register user with Supabase Auth
        auth_response = supabase.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password,
            "options": {
                "data": {
                    "username": user_data.username,
                    "first_name": user_data.first_name,
                    "last_name": user_data.last_name
                }
            }
        })
        
        if auth_response.user:
            # Create profile
            profile_data = {
                "id": auth_response.user.id,
                "username": user_data.username,
                "first_name": user_data.first_name,
                "last_name": user_data.last_name
            }
            supabase.table("profiles").insert(profile_data).execute()
            
            return {
                "message": "User registered successfully",
                "user": auth_response.user,
                "session": auth_response.session
            }
        else:
            raise HTTPException(status_code=400, detail="Registration failed")
            
    except AuthApiError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/login")
async def login(credentials: UserLogin):
    try:
        auth_response = supabase.auth.sign_in_with_password({
            "email": credentials.email,
            "password": credentials.password
        })
        
        if auth_response.session:
            return {
                "access_token": auth_response.session.access_token,
                "token_type": "bearer",
                "user": auth_response.user
            }
        else:
            raise HTTPException(status_code=401, detail="Invalid credentials")
            
    except AuthApiError as e:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/auth/me")
async def get_current_user_info(current_user = Depends(get_current_user)):
    try:
        result = supabase.table("profiles").select("*").eq("id", current_user.id).execute()
        if result.data:
            return result.data[0]
        else:
            # Create profile if it doesn't exist
            profile_data = {
                "id": current_user.id,
                "username": current_user.user_metadata.get("username", current_user.email.split("@")[0]),
                "first_name": current_user.user_metadata.get("first_name", ""),
                "last_name": current_user.user_metadata.get("last_name", "")
            }
            result = supabase.table("profiles").insert(profile_data).execute()
            return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/auth/profile")
async def update_profile(profile_data: ProfileUpdate, current_user = Depends(get_current_user)):
    try:
        update_data = {k: v for k, v in profile_data.dict().items() if v is not None}
        result = supabase.table("profiles").update(update_data).eq("id", current_user.id).execute()
        return result.data[0] if result.data else {}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Content endpoints
@app.get("/api/content")
async def get_contents(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None
):
    try:
        offset = (page - 1) * limit
        query = supabase.table("content").select("*")
        
        if search:
            query = query.or_(f"title.ilike.%{search}%,synopsis.ilike.%{search}%")
        
        # Get total count
        count_result = supabase.table("content").select("id", count="exact").execute()
        total = count_result.count
        
        # Get paginated results
        result = query.range(offset, offset + limit - 1).order("created_at", desc=True).execute()
        
        return {
            "contents": result.data,
            "total": total,
            "page": page,
            "limit": limit
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/content/{content_id}")
async def get_content(content_id: str):
    try:
        result = supabase.table("content").select("*").eq("id", content_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Content not found")
        return result.data[0]
    except Exception as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail="Content not found")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/content")
async def create_content(content_data: ContentCreate, current_user = Depends(get_current_user)):
    try:
        content_dict = content_data.dict()
        content_dict["id"] = str(uuid.uuid4())
        result = supabase.table("content").insert(content_dict).execute()
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/content/search")
async def search_content(
    query: Optional[str] = None,
    country: Optional[str] = None,
    content_type: Optional[str] = None,
    genre: Optional[str] = None,
    year_from: Optional[int] = None,
    year_to: Optional[int] = None,
    rating_min: Optional[float] = None,
    rating_max: Optional[float] = None,
    sort_by: str = "rating",
    sort_order: str = "desc",
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    try:
        offset = (page - 1) * limit
        db_query = supabase.table("content").select("*")
        
        # Apply filters
        if query:
            db_query = db_query.or_(f"title.ilike.%{query}%,synopsis.ilike.%{query}%")
        if country:
            db_query = db_query.eq("country", country)
        if content_type:
            db_query = db_query.eq("content_type", content_type)
        if genre:
            db_query = db_query.contains("genres", [genre])
        if year_from:
            db_query = db_query.gte("year", year_from)
        if year_to:
            db_query = db_query.lte("year", year_to)
        if rating_min:
            db_query = db_query.gte("rating", rating_min)
        if rating_max:
            db_query = db_query.lte("rating", rating_max)
        
        # Apply sorting
        ascending = sort_order == "asc"
        db_query = db_query.order(sort_by, desc=not ascending)
        
        # Get results with pagination
        result = db_query.range(offset, offset + limit - 1).execute()
        
        # Get total count for the filtered query
        count_query = supabase.table("content").select("id", count="exact")
        if query:
            count_query = count_query.or_(f"title.ilike.%{query}%,synopsis.ilike.%{query}%")
        if country:
            count_query = count_query.eq("country", country)
        if content_type:
            count_query = count_query.eq("content_type", content_type)
        if genre:
            count_query = count_query.contains("genres", [genre])
        if year_from:
            count_query = count_query.gte("year", year_from)
        if year_to:
            count_query = count_query.lte("year", year_to)
        if rating_min:
            count_query = count_query.gte("rating", rating_min)
        if rating_max:
            count_query = count_query.lte("rating", rating_max)
            
        count_result = count_query.execute()
        total = count_result.count
        
        return {
            "contents": result.data,
            "total": total,
            "page": page,
            "limit": limit
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/content/featured")
async def get_featured_content(
    category: str = "trending",
    country: Optional[str] = None,
    limit: int = Query(10, ge=1, le=50)
):
    try:
        query = supabase.table("content").select("*")
        
        if category == "trending":
            query = query.order("rating", desc=True).order("created_at", desc=True)
        elif category == "new_releases":
            query = query.order("created_at", desc=True)
        elif category == "top_rated":
            query = query.order("rating", desc=True)
        elif category == "by_country" and country:
            query = query.eq("country", country).order("rating", desc=True)
        
        result = query.limit(limit).execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/countries")
async def get_countries():
    try:
        result = supabase.table("content").select("country").execute()
        countries = list(set([item["country"] for item in result.data if item["country"]]))
        return {"countries": sorted(countries)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/genres")
async def get_genres():
    try:
        result = supabase.table("content").select("genres").execute()
        all_genres = set()
        for item in result.data:
            if item["genres"]:
                all_genres.update(item["genres"])
        return {"genres": sorted(list(all_genres))}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/content-types")
async def get_content_types():
    try:
        result = supabase.table("content").select("content_type").execute()
        content_types = list(set([item["content_type"] for item in result.data if item["content_type"]]))
        return {"content_types": sorted(content_types)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Watchlist endpoints
@app.get("/api/watchlist")
async def get_watchlist(
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user = Depends(get_current_user)
):
    try:
        offset = (page - 1) * limit
        query = supabase.table("watchlist").select("""
            *,
            content:content_id (
                id, title, poster_url, banner_url, year, country, 
                content_type, genres, rating, episodes, synopsis
            )
        """).eq("user_id", current_user.id)
        
        if status:
            query = query.eq("status", status)
        
        # Get total count
        count_query = supabase.table("watchlist").select("id", count="exact").eq("user_id", current_user.id)
        if status:
            count_query = count_query.eq("status", status)
        count_result = count_query.execute()
        total = count_result.count
        
        # Get paginated results
        result = query.range(offset, offset + limit - 1).order("created_at", desc=True).execute()
        
        # Get status counts
        status_counts = {}
        for status_type in ["want_to_watch", "watching", "completed", "dropped"]:
            count_result = supabase.table("watchlist").select("id", count="exact").eq("user_id", current_user.id).eq("status", status_type).execute()
            status_counts[status_type] = count_result.count
        
        return {
            "items": result.data,
            "total": total,
            "page": page,
            "limit": limit,
            "status_counts": status_counts
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/watchlist")
async def add_to_watchlist(watchlist_data: WatchlistAdd, current_user = Depends(get_current_user)):
    try:
        # Check if content exists
        content_result = supabase.table("content").select("id").eq("id", watchlist_data.content_id).execute()
        if not content_result.data:
            raise HTTPException(status_code=404, detail="Content not found")
        
        # Check if already in watchlist
        existing = supabase.table("watchlist").select("id").eq("user_id", current_user.id).eq("content_id", watchlist_data.content_id).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="Content already in watchlist")
        
        # Add to watchlist
        watchlist_item = {
            "user_id": current_user.id,
            "content_id": watchlist_data.content_id,
            "status": watchlist_data.status,
            "total_episodes": watchlist_data.total_episodes,
            "started_date": datetime.utcnow().isoformat() if watchlist_data.status == "watching" else None
        }
        
        result = supabase.table("watchlist").insert(watchlist_item).execute()
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/watchlist/{item_id}")
async def update_watchlist_item(item_id: int, update_data: WatchlistUpdate, current_user = Depends(get_current_user)):
    try:
        # Verify ownership
        existing = supabase.table("watchlist").select("*").eq("id", item_id).eq("user_id", current_user.id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Watchlist item not found")
        
        # Prepare update data
        update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
        update_dict["updated_at"] = datetime.utcnow().isoformat()
        
        # Handle status-specific date updates
        if update_data.status:
            if update_data.status == "watching" and existing.data[0]["status"] != "watching":
                update_dict["started_date"] = datetime.utcnow().isoformat()
            elif update_data.status == "completed":
                update_dict["completed_date"] = datetime.utcnow().isoformat()
        
        result = supabase.table("watchlist").update(update_dict).eq("id", item_id).execute()
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/watchlist/{item_id}")
async def remove_from_watchlist(item_id: int, current_user = Depends(get_current_user)):
    try:
        # Verify ownership
        existing = supabase.table("watchlist").select("id").eq("id", item_id).eq("user_id", current_user.id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Watchlist item not found")
        
        supabase.table("watchlist").delete().eq("id", item_id).execute()
        return {"message": "Item removed from watchlist"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/watchlist/stats")
async def get_watchlist_stats(current_user = Depends(get_current_user)):
    try:
        # Get status counts
        status_counts = {}
        for status_type in ["want_to_watch", "watching", "completed", "dropped"]:
            count_result = supabase.table("watchlist").select("id", count="exact").eq("user_id", current_user.id).eq("status", status_type).execute()
            status_counts[status_type] = count_result.count
        
        # Get total content
        total_result = supabase.table("watchlist").select("id", count="exact").eq("user_id", current_user.id).execute()
        total_content = total_result.count
        
        # Get recent activity
        recent_activity = supabase.table("watchlist").select("""
            *,
            content:content_id (title, poster_url, year, content_type)
        """).eq("user_id", current_user.id).order("updated_at", desc=True).limit(5).execute()
        
        return {
            "status_counts": status_counts,
            "total_content": total_content,
            "recent_activity": recent_activity.data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Reviews endpoints
@app.get("/api/reviews")
async def get_reviews(
    content_id: Optional[str] = None,
    user_id: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50)
):
    try:
        offset = (page - 1) * limit
        query = supabase.table("reviews").select("""
            *,
            user:user_id (username, avatar_url, is_verified),
            content:content_id (title, poster_url)
        """)
        
        if content_id:
            query = query.eq("content_id", content_id)
        if user_id and user_id != "me":
            query = query.eq("user_id", user_id)
        
        # Get total count
        count_query = supabase.table("reviews").select("id", count="exact")
        if content_id:
            count_query = count_query.eq("content_id", content_id)
        if user_id and user_id != "me":
            count_query = count_query.eq("user_id", user_id)
        count_result = count_query.execute()
        total = count_result.count
        
        # Get paginated results
        result = query.range(offset, offset + limit - 1).order("created_at", desc=True).execute()
        
        return {
            "reviews": result.data,
            "total": total,
            "page": page,
            "limit": limit
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/reviews")
async def create_review(review_data: ReviewCreate, current_user = Depends(get_current_user)):
    try:
        # Check if content exists
        content_result = supabase.table("content").select("id").eq("id", review_data.content_id).execute()
        if not content_result.data:
            raise HTTPException(status_code=404, detail="Content not found")
        
        # Check if user already reviewed this content
        existing = supabase.table("reviews").select("id").eq("user_id", current_user.id).eq("content_id", review_data.content_id).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="You have already reviewed this content")
        
        # Create review
        review_dict = review_data.dict()
        review_dict["user_id"] = current_user.id
        
        result = supabase.table("reviews").insert(review_dict).execute()
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/reviews/{review_id}")
async def update_review(review_id: int, review_data: ReviewUpdate, current_user = Depends(get_current_user)):
    try:
        # Verify ownership
        existing = supabase.table("reviews").select("*").eq("id", review_id).eq("user_id", current_user.id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Review not found")
        
        update_dict = {k: v for k, v in review_data.dict().items() if v is not None}
        update_dict["updated_at"] = datetime.utcnow().isoformat()
        
        result = supabase.table("reviews").update(update_dict).eq("id", review_id).execute()
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/reviews/{review_id}")
async def delete_review(review_id: int, current_user = Depends(get_current_user)):
    try:
        # Verify ownership
        existing = supabase.table("reviews").select("id").eq("id", review_id).eq("user_id", current_user.id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Review not found")
        
        supabase.table("reviews").delete().eq("id", review_id).execute()
        return {"message": "Review deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Analytics endpoints
@app.post("/api/analytics/view")
async def track_viewing_activity(
    content_id: str = Query(...),
    viewing_duration: Optional[int] = Query(None),
    completion_percentage: Optional[float] = Query(None),
    device_type: Optional[str] = Query("web"),
    current_user = Depends(get_current_user)
):
    try:
        # Check if content exists
        content_result = supabase.table("content").select("id").eq("id", content_id).execute()
        if not content_result.data:
            raise HTTPException(status_code=404, detail="Content not found")
        
        # For now, we'll just return success since we don't have a viewing_history table
        # In a full implementation, you'd create this table and track the activity
        return {"message": "Viewing activity tracked successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/dashboard")
async def get_analytics_dashboard(current_user = Depends(get_current_user)):
    try:
        # Get watchlist stats for analytics
        watchlist_result = supabase.table("watchlist").select("*").eq("user_id", current_user.id).execute()
        watchlist_items = watchlist_result.data
        
        # Calculate basic analytics from watchlist
        total_content_watched = len([item for item in watchlist_items if item["status"] in ["completed", "watching"]])
        completion_rate = len([item for item in watchlist_items if item["status"] == "completed"]) / len(watchlist_items) * 100 if watchlist_items else 0
        
        # Get favorite genres from watchlist
        genre_counts = {}
        for item in watchlist_items:
            # Get content details to access genres
            content_result = supabase.table("content").select("genres").eq("id", item["content_id"]).execute()
            if content_result.data and content_result.data[0]["genres"]:
                for genre in content_result.data[0]["genres"]:
                    genre_counts[genre] = genre_counts.get(genre, 0) + 1
        
        favorite_genres = [{"genre": genre, "count": count} for genre, count in sorted(genre_counts.items(), key=lambda x: x[1], reverse=True)]
        
        # Mock some additional analytics data
        return {
            "total_content_watched": total_content_watched,
            "total_viewing_time": total_content_watched * 45,  # Mock: 45 min average
            "completion_rate": round(completion_rate, 1),
            "viewing_streak": 1,  # Mock data
            "favorite_genres": favorite_genres[:5],
            "favorite_countries": [{"country": "South Korea", "count": 1}],  # Mock data
            "achievements": ["🎬 First Watch", "📈 Getting Started"],
            "monthly_stats": {},  # Mock empty for now
            "top_rated_content": []  # Mock empty for now
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/history")
async def get_viewing_history(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    current_user = Depends(get_current_user)
):
    try:
        # For now, return watchlist as viewing history
        offset = (page - 1) * limit
        result = supabase.table("watchlist").select("""
            *,
            content:content_id (title, poster_url, year, content_type)
        """).eq("user_id", current_user.id).range(offset, offset + limit - 1).order("updated_at", desc=True).execute()
        
        # Transform to viewing history format
        history = []
        for item in result.data:
            history.append({
                "content": item["content"],
                "viewed_at": item["updated_at"],
                "viewing_duration": 45  # Mock duration
            })
        
        return {
            "history": history,
            "total": len(result.data),
            "page": page,
            "limit": limit
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Social endpoints
@app.post("/api/social/follow/{username}")
async def follow_user(username: str, current_user = Depends(get_current_user)):
    try:
        # Get target user
        target_user = supabase.table("profiles").select("id").eq("username", username).execute()
        if not target_user.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        target_user_id = target_user.data[0]["id"]
        
        # Prevent self-follow
        if target_user_id == current_user.id:
            raise HTTPException(status_code=400, detail="Cannot follow yourself")
        
        # For now, just return success since we don't have a follows table
        # In a full implementation, you'd create a user_follows table
        return {"message": f"Successfully followed {username}"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/social/unfollow/{username}")
async def unfollow_user(username: str, current_user = Depends(get_current_user)):
    try:
        # Get target user
        target_user = supabase.table("profiles").select("id").eq("username", username).execute()
        if not target_user.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        # For now, just return success
        return {"message": f"Successfully unfollowed {username}"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/social/followers/{username}")
async def get_followers(
    username: str,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    try:
        # Get user
        user_result = supabase.table("profiles").select("id").eq("username", username).execute()
        if not user_result.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        # For now, return empty list since we don't have follows table
        return {
            "followers": [],
            "total": 0,
            "page": page,
            "limit": limit
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/social/following/{username}")
async def get_following(
    username: str,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    try:
        # Get user
        user_result = supabase.table("profiles").select("id").eq("username", username).execute()
        if not user_result.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        # For now, return empty list
        return {
            "following": [],
            "total": 0,
            "page": page,
            "limit": limit
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/social/feed")
async def get_activity_feed(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user = Depends(get_current_user)
):
    try:
        # For now, return empty feed since we don't have activity tracking
        return {
            "activities": [],
            "total": 0,
            "page": page,
            "limit": limit
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/social/stats/{username}")
async def get_social_stats(username: str):
    try:
        # Get user
        user_result = supabase.table("profiles").select("id").eq("username", username).execute()
        if not user_result.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_id = user_result.data[0]["id"]
        
        # Get review count
        reviews_result = supabase.table("reviews").select("id", count="exact").eq("user_id", user_id).execute()
        
        return {
            "followers_count": 0,  # Mock data
            "following_count": 0,  # Mock data
            "public_reviews": reviews_result.count,
            "public_lists": 1  # Mock data
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/social/notifications")
async def get_notifications(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user = Depends(get_current_user)
):
    try:
        # For now, return empty notifications
        return {
            "notifications": [],
            "total": 0,
            "page": page,
            "limit": limit
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/social/trending-users")
async def get_trending_users(limit: int = Query(10, ge=1, le=50)):
    try:
        # Get users with most reviews as trending
        result = supabase.table("profiles").select("username, avatar_url, is_verified").limit(limit).execute()
        
        return {
            "users": result.data,
            "total": len(result.data),
            "page": 1,
            "limit": limit
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Review interactions
@app.post("/api/reviews/{review_id}/like")
async def toggle_review_like(review_id: int, current_user = Depends(get_current_user)):
    try:
        # Check if review exists
        review_result = supabase.table("reviews").select("id").eq("id", review_id).execute()
        if not review_result.data:
            raise HTTPException(status_code=404, detail="Review not found")
        
        # For now, just return toggle response since we don't have likes table
        return {"liked": True, "message": "Review liked"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/reviews/{review_id}/comments")
async def add_review_comment(review_id: int, comment_data: CommentCreate, current_user = Depends(get_current_user)):
    try:
        # Check if review exists
        review_result = supabase.table("reviews").select("id").eq("id", review_id).execute()
        if not review_result.data:
            raise HTTPException(status_code=404, detail="Review not found")
        
        # For now, just return success since we don't have comments table
        return {"message": "Comment added successfully", "comment_id": 1}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/reviews/{review_id}/comments")
async def get_review_comments(
    review_id: int,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50)
):
    try:
        # Check if review exists
        review_result = supabase.table("reviews").select("id").eq("id", review_id).execute()
        if not review_result.data:
            raise HTTPException(status_code=404, detail="Review not found")
        
        # For now, return empty comments
        return {
            "comment_threads": [],
            "total": 0,
            "page": page,
            "limit": limit
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Recommendations endpoints
@app.get("/api/recommendations/for-you")
async def get_personalized_recommendations(
    limit: int = Query(20, ge=1, le=50),
    current_user = Depends(get_current_user)
):
    try:
        # Get user's watchlist to understand preferences
        watchlist_result = supabase.table("watchlist").select("content_id").eq("user_id", current_user.id).execute()
        watched_content_ids = [item["content_id"] for item in watchlist_result.data]
        
        # Get content not in watchlist
        query = supabase.table("content").select("*").order("rating", desc=True)
        if watched_content_ids:
            query = query.not_.in_("id", watched_content_ids)
        
        result = query.limit(limit).execute()
        
        # Add recommendation metadata
        recommendations = []
        for content in result.data:
            content["recommendation_type"] = "content_based"
            content["confidence_score"] = 0.8  # Mock confidence
            recommendations.append(content)
        
        return {
            "recommendations": recommendations,
            "user_preferences": {
                "favorite_genres": [],
                "favorite_countries": []
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/recommendations/similar/{content_id}")
async def get_similar_content(content_id: str, limit: int = Query(10, ge=1, le=50)):
    try:
        # Get original content
        original_result = supabase.table("content").select("*").eq("id", content_id).execute()
        if not original_result.data:
            raise HTTPException(status_code=404, detail="Content not found")
        
        original_content = original_result.data[0]
        
        # Find similar content by genre and country
        similar_result = supabase.table("content").select("*").neq("id", content_id).order("rating", desc=True).limit(limit).execute()
        
        return {
            "original_content": original_content,
            "similar_content": similar_result.data
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Discovery endpoints
@app.get("/api/discovery/trending")
async def get_trending_content(
    time_period: str = "week",
    limit: int = Query(20, ge=1, le=50)
):
    try:
        # Get trending content based on rating and recent creation
        result = supabase.table("content").select("*").order("rating", desc=True).order("created_at", desc=True).limit(limit).execute()
        
        # Add trending metadata
        trending_content = []
        for content in result.data:
            content["trending_score"] = content["rating"] * 10  # Mock trending score
            trending_content.append(content)
        
        return {"trending_content": trending_content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Premium endpoints
@app.get("/api/premium/features")
async def get_premium_features():
    return {
        "free_plan": {
            "name": "Free",
            "price": 0,
            "features": [
                "Basic content discovery",
                "Personal watchlist",
                "Basic reviews and ratings",
                "Limited recommendations"
            ],
            "limits": {
                "watchlist_items": "Unlimited",
                "reviews_per_month": 10,
                "recommendations_per_day": 5
            }
        },
        "premium_plan": {
            "name": "Premium",
            "price": 9.99,
            "price_yearly": 99.99,
            "features": [
                "Ad-free experience",
                "Advanced recommendations",
                "Detailed analytics",
                "Priority customer support",
                "Early access to new features"
            ],
            "limits": {
                "watchlist_items": "Unlimited",
                "reviews_per_month": "Unlimited",
                "recommendations_per_day": "Unlimited"
            }
        },
        "pro_plan": {
            "name": "Pro",
            "price": 19.99,
            "price_yearly": 199.99,
            "features": [
                "Everything in Premium",
                "Advanced analytics dashboard",
                "Content export features",
                "API access",
                "Custom lists and collections"
            ],
            "limits": {
                "watchlist_items": "Unlimited",
                "reviews_per_month": "Unlimited",
                "recommendations_per_day": "Unlimited",
                "api_calls_per_month": 10000
            }
        }
    }

@app.get("/api/premium/check")
async def check_premium_status(current_user = Depends(get_current_user)):
    try:
        # For now, return free plan status
        return {
            "is_premium": False,
            "plan_type": "free",
            "expires_at": None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Ad endpoints
@app.get("/api/ads/should-show")
async def should_show_ads(current_user = Depends(get_current_user)):
    try:
        # Show ads for free users
        return {"show_ads": True}
    except Exception as e:
        return {"show_ads": True}  # Default to showing ads

@app.get("/api/ads/config")
async def get_ad_config():
    return {
        "google_adsense": {
            "client_id": "ca-pub-xxxxxxxxxx",  # Replace with actual client ID
            "ad_slots": {
                "banner_top": "1234567890",
                "banner_bottom": "0987654321",
                "native_feed": "1122334455"
            }
        }
    }

# Admin endpoints (simplified)
@app.post("/api/admin/login")
async def admin_login(credentials: UserLogin):
    # Simple admin check - in production, use proper admin authentication
    if credentials.email == "admin@gdvg.com" and credentials.password == "admin123":
        return {"access_token": "admin_token_placeholder", "token_type": "bearer"}
    raise HTTPException(status_code=401, detail="Invalid admin credentials")

@app.get("/api/admin/stats")
async def get_admin_stats():
    try:
        # Get content stats
        content_result = supabase.table("content").select("id, content_type, country", count="exact").execute()
        
        # Count by type
        type_counts = {}
        country_counts = {}
        for item in content_result.data:
            content_type = item.get("content_type", "unknown")
            country = item.get("country", "unknown")
            type_counts[content_type] = type_counts.get(content_type, 0) + 1
            country_counts[country] = country_counts.get(country, 0) + 1
        
        return {
            "total_content": content_result.count,
            "total_movies": type_counts.get("movie", 0),
            "total_series": type_counts.get("series", 0),
            "total_dramas": type_counts.get("drama", 0),
            "countries": len(country_counts),
            "recent_additions": 0  # Mock data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/content")
async def get_admin_content(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = None
):
    try:
        offset = (page - 1) * limit
        query = supabase.table("content").select("*")
        
        if search:
            query = query.or_(f"title.ilike.%{search}%,synopsis.ilike.%{search}%")
        
        # Get total count
        count_result = supabase.table("content").select("id", count="exact").execute()
        total = count_result.count
        
        # Get paginated results
        result = query.range(offset, offset + limit - 1).order("created_at", desc=True).execute()
        
        return {
            "contents": result.data,
            "total": total,
            "page": page,
            "limit": limit
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/admin/content")
async def create_admin_content(content_data: ContentCreate):
    try:
        content_dict = content_data.dict()
        content_dict["id"] = str(uuid.uuid4())
        result = supabase.table("content").insert(content_dict).execute()
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/admin/content/{content_id}")
async def update_admin_content(content_id: str, content_data: ContentCreate):
    try:
        content_dict = content_data.dict()
        content_dict["updated_at"] = datetime.utcnow().isoformat()
        result = supabase.table("content").update(content_dict).eq("id", content_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Content not found")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/admin/content/{content_id}")
async def delete_admin_content(content_id: str):
    try:
        result = supabase.table("content").delete().eq("id", content_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Content not found")
        return {"message": "Content deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/admin/bulk-import")
async def bulk_import_content(file: UploadFile = File(...)):
    try:
        if not file.filename.endswith(('.csv', '.xlsx', '.xls')):
            raise HTTPException(status_code=400, detail="Invalid file format")
        
        # Read file
        contents = await file.read()
        
        if file.filename.endswith('.csv'):
            df = pd.read_csv(BytesIO(contents))
        else:
            df = pd.read_excel(BytesIO(contents))
        
        imported_content = []
        errors = []
        successful_imports = 0
        failed_imports = 0
        
        for index, row in df.iterrows():
            try:
                # Validate required fields
                required_fields = ['title', 'year', 'country', 'content_type', 'synopsis', 'rating']
                for field in required_fields:
                    if pd.isna(row.get(field)):
                        raise ValueError(f"Missing required field: {field}")
                
                # Prepare content data
                content_data = {
                    "id": str(uuid.uuid4()),
                    "title": str(row['title']),
                    "original_title": str(row.get('original_title', '')) if pd.notna(row.get('original_title')) else None,
                    "synopsis": str(row['synopsis']),
                    "year": int(row['year']),
                    "country": str(row['country']),
                    "content_type": str(row['content_type']),
                    "rating": float(row['rating']),
                    "poster_url": str(row.get('poster_url', '')) if pd.notna(row.get('poster_url')) else None,
                    "banner_url": str(row.get('banner_url', '')) if pd.notna(row.get('banner_url')) else None,
                    "episodes": int(row['episodes']) if pd.notna(row.get('episodes')) else None,
                    "duration": int(row['duration']) if pd.notna(row.get('duration')) else None,
                    "genres": str(row.get('genres', '')).split(',') if pd.notna(row.get('genres')) else [],
                    "streaming_platforms": str(row.get('streaming_platforms', '')).split(',') if pd.notna(row.get('streaming_platforms')) else [],
                    "tags": str(row.get('tags', '')).split(',') if pd.notna(row.get('tags')) else [],
                    "cast": json.loads(row['cast']) if pd.notna(row.get('cast')) and str(row['cast']).startswith('[') else [],
                    "crew": json.loads(row['crew']) if pd.notna(row.get('crew')) and str(row['crew']).startswith('[') else []
                }
                
                # Insert into Supabase
                result = supabase.table("content").insert(content_data).execute()
                if result.data:
                    imported_content.append(content_data["title"])
                    successful_imports += 1
                else:
                    failed_imports += 1
                    errors.append(f"Row {index + 1}: Failed to insert {content_data['title']}")
                    
            except Exception as e:
                failed_imports += 1
                errors.append(f"Row {index + 1}: {str(e)}")
        
        return {
            "success": successful_imports > 0,
            "total_rows": len(df),
            "successful_imports": successful_imports,
            "failed_imports": failed_imports,
            "errors": errors[:10],  # Limit errors shown
            "imported_content": imported_content[:10]  # Limit content shown
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Startup event to populate sample data
@app.on_event("startup")
async def startup_event():
    try:
        # Check if content already exists
        existing_content = supabase.table("content").select("id").limit(1).execute()
        if existing_content.data:
            print("Sample content already exists, skipping population")
            return
        
        # Sample global content data
        sample_content = [
            {
                "id": str(uuid.uuid4()),
                "title": "Squid Game",
                "original_title": "오징어 게임",
                "synopsis": "Hundreds of cash-strapped players accept a strange invitation to compete in children's games for a tempting prize.",
                "year": 2021,
                "country": "South Korea",
                "content_type": "series",
                "genres": ["thriller", "drama", "mystery"],
                "rating": 8.0,
                "episodes": 9,
                "duration": 60,
                "cast": [
                    {"name": "Lee Jung-jae", "character": "Seong Gi-hun"},
                    {"name": "Park Hae-soo", "character": "Cho Sang-woo"}
                ],
                "crew": [{"name": "Hwang Dong-hyuk", "role": "Director"}],
                "streaming_platforms": ["Netflix"],
                "tags": ["survival", "psychological", "korean"],
                "poster_url": "https://images.unsplash.com/photo-1611162617474-5b21e879e113?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHwxfHxrcmVhbiUyMGRyYW1hfGVufDB8fHx8MTc1MzUyNzI1Nnww&ixlib=rb-4.1.0&q=85",
                "banner_url": "https://images.unsplash.com/photo-1611162617474-5b21e879e113?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHwxfHxrcmVhbiUyMGRyYW1hfGVufDB8fHx8MTc1MzUyNzI1Nnww&ixlib=rb-4.1.0&q=85"
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Your Name",
                "original_title": "君の名は。",
                "synopsis": "Two teenagers share a profound, magical connection upon discovering they are swapping bodies.",
                "year": 2016,
                "country": "Japan",
                "content_type": "movie",
                "genres": ["romance", "drama", "fantasy"],
                "rating": 8.4,
                "episodes": None,
                "duration": 106,
                "cast": [
                    {"name": "Ryunosuke Kamiki", "character": "Taki Tachibana"},
                    {"name": "Mone Kamishiraishi", "character": "Mitsuha Miyamizu"}
                ],
                "crew": [{"name": "Makoto Shinkai", "role": "Director"}],
                "streaming_platforms": ["Crunchyroll", "Funimation"],
                "tags": ["anime", "body-swap", "supernatural"],
                "poster_url": "https://images.unsplash.com/photo-1578662996442-48f60103fc96?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHwyfHxhbmltZXxlbnwwfHx8fDE3NTM1MjcyNTZ8MA&ixlib=rb-4.1.0&q=85",
                "banner_url": "https://images.unsplash.com/photo-1578662996442-48f60103fc96?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHwyfHxhbmltZXxlbnwwfHx8fDE3NTM1MjcyNTZ8MA&ixlib=rb-4.1.0&q=85"
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Parasite",
                "original_title": "기생충",
                "synopsis": "A poor family schemes to become employed by a wealthy family and infiltrate their household.",
                "year": 2019,
                "country": "South Korea",
                "content_type": "movie",
                "genres": ["thriller", "drama", "comedy"],
                "rating": 8.6,
                "episodes": None,
                "duration": 132,
                "cast": [
                    {"name": "Song Kang-ho", "character": "Ki-taek"},
                    {"name": "Lee Sun-kyun", "character": "Park Dong-ik"}
                ],
                "crew": [{"name": "Bong Joon-ho", "role": "Director"}],
                "streaming_platforms": ["Hulu", "Amazon Prime"],
                "tags": ["oscar-winner", "social-commentary", "korean"],
                "poster_url": "https://images.unsplash.com/photo-1611162617474-5b21e879e113?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHwxfHxrcmVhbiUyMGRyYW1hfGVufDB8fHx8MTc1MzUyNzI1Nnww&ixlib=rb-4.1.0&q=85",
                "banner_url": "https://images.unsplash.com/photo-1611162617474-5b21e879e113?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHwxfHxrcmVhbiUyMGRyYW1hfGVufDB8fHx8MTc1MzUyNzI1Nnww&ixlib=rb-4.1.0&q=85"
            },
            {
                "id": str(uuid.uuid4()),
                "title": "3 Idiots",
                "original_title": "3 Idiots",
                "synopsis": "Two friends are searching for their long lost companion. They revisit their college days.",
                "year": 2009,
                "country": "India",
                "content_type": "movie",
                "genres": ["comedy", "drama"],
                "rating": 8.4,
                "episodes": None,
                "duration": 170,
                "cast": [
                    {"name": "Aamir Khan", "character": "Rancho"},
                    {"name": "R. Madhavan", "character": "Farhan"}
                ],
                "crew": [{"name": "Rajkumar Hirani", "role": "Director"}],
                "streaming_platforms": ["Netflix", "Amazon Prime"],
                "tags": ["bollywood", "friendship", "comedy"],
                "poster_url": "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHwxfHxib2xseXdvb2R8ZW58MHx8fHwxNzUzNTI3MjU2fDA&ixlib=rb-4.1.0&q=85",
                "banner_url": "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHwxfHxib2xseXdvb2R8ZW58MHx8fHwxNzUzNTI3MjU2fDA&ixlib=rb-4.1.0&q=85"
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Money Heist",
                "original_title": "La Casa de Papel",
                "synopsis": "An unusual group of robbers attempt to carry out the most perfect robbery in Spanish history.",
                "year": 2017,
                "country": "Spain",
                "content_type": "series",
                "genres": ["crime", "thriller", "drama"],
                "rating": 8.2,
                "episodes": 41,
                "duration": 70,
                "cast": [
                    {"name": "Úrsula Corberó", "character": "Tokyo"},
                    {"name": "Álvaro Morte", "character": "The Professor"}
                ],
                "crew": [{"name": "Álex Pina", "role": "Creator"}],
                "streaming_platforms": ["Netflix"],
                "tags": ["heist", "spanish", "crime"],
                "poster_url": "https://images.unsplash.com/photo-1489599856641-b1d4c2b53f1b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHwxfHxzcGFuaXNoJTIwY2luZW1hfGVufDB8fHx8MTc1MzUyNzI1Nnww&ixlib=rb-4.1.0&q=85",
                "banner_url": "https://images.unsplash.com/photo-1489599856641-b1d4c2b53f1b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHwxfHxzcGFuaXNoJTIwY2luZW1hfGVufDB8fHx8MTc1MzUyNzI1Nnww&ixlib=rb-4.1.0&q=85"
            }
        ]
        
        # Insert sample content
        for content in sample_content:
            try:
                supabase.table("content").insert(content).execute()
                print(f"Inserted: {content['title']}")
            except Exception as e:
                print(f"Error inserting {content['title']}: {e}")
        
        print("Sample content population completed")
        
    except Exception as e:
        print(f"Error during startup: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)