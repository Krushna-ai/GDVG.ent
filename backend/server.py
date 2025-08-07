from fastapi import FastAPI, APIRouter, HTTPException, Query, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
from enum import Enum
import jwt
import hashlib
import base64
import pandas as pd
import io
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Settings
SECRET_KEY = os.environ.get('JWT_SECRET', 'gdvg-secret-key-2025')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Security
security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Enums for content types and genres
class ContentType(str, Enum):
    DRAMA = "drama"
    MOVIE = "movie"
    SERIES = "series"
    ANIME = "anime"

class ContentGenre(str, Enum):
    ROMANCE = "romance"
    COMEDY = "comedy"
    ACTION = "action"
    THRILLER = "thriller"
    HORROR = "horror"
    FANTASY = "fantasy"
    DRAMA = "drama"
    MYSTERY = "mystery"
    SLICE_OF_LIFE = "slice_of_life"
    HISTORICAL = "historical"
    CRIME = "crime"
    ADVENTURE = "adventure"

# Admin Models
class AdminUser(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    password_hash: str
    is_admin: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

# User Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    username: str
    password_hash: str
    first_name: str
    last_name: str
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    is_verified: bool = False
    is_active: bool = True
    joined_date: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    preferences: dict = Field(default_factory=dict)

class UserCreate(BaseModel):
    email: str
    username: str
    password: str
    first_name: str
    last_name: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserProfile(BaseModel):
    id: str
    email: str
    username: str
    first_name: str
    last_name: str
    avatar_url: Optional[str]
    bio: Optional[str]
    location: Optional[str]
    joined_date: datetime
    is_verified: bool

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    avatar_url: Optional[str] = None

class UserSettings(BaseModel):
    theme: str = "dark"
    language: str = "en"
    notifications: dict = Field(default_factory=lambda: {
        "email": True,
        "push": True,
        "social": True,
        "recommendations": True
    })
    privacy: dict = Field(default_factory=lambda: {
        "profile_public": True,
        "activity_public": True,
        "lists_public": True
    })

class AdminLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class AdminStats(BaseModel):
    total_content: int
    total_movies: int
    total_series: int
    total_dramas: int
    total_anime: int
    countries: int
    recent_additions: int

class BulkImportResult(BaseModel):
    success: bool
    total_rows: int
    successful_imports: int
    failed_imports: int
    errors: List[str]
    imported_content: List[str]  # List of imported content titles

# Content Models
class CastMember(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    character: str
    profile_image: Optional[str] = None

class CrewMember(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    role: str  # director, writer, producer, etc.
    profile_image: Optional[str] = None

class Content(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    original_title: Optional[str] = None
    poster_url: str
    banner_url: Optional[str] = None
    synopsis: str
    year: int
    country: str
    content_type: ContentType
    genres: List[ContentGenre]
    rating: float = Field(ge=0, le=10)
    episodes: Optional[int] = None
    duration: Optional[int] = None  # in minutes
    cast: List[CastMember] = []
    crew: List[CrewMember] = []
    streaming_platforms: List[str] = []
    tags: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ContentCreate(BaseModel):
    title: str
    original_title: Optional[str] = None
    poster_url: str  # base64 image data
    banner_url: Optional[str] = None  # base64 image data
    synopsis: str
    year: int
    country: str
    content_type: ContentType
    genres: List[ContentGenre]
    rating: float = Field(ge=0, le=10)
    episodes: Optional[int] = None
    duration: Optional[int] = None
    cast: List[CastMember] = []
    crew: List[CrewMember] = []
    streaming_platforms: List[str] = []
    tags: List[str] = []

class ContentUpdate(BaseModel):
    title: Optional[str] = None
    original_title: Optional[str] = None
    poster_url: Optional[str] = None
    banner_url: Optional[str] = None
    synopsis: Optional[str] = None
    year: Optional[int] = None
    country: Optional[str] = None
    content_type: Optional[ContentType] = None
    genres: Optional[List[ContentGenre]] = None
    rating: Optional[float] = None
    episodes: Optional[int] = None
    duration: Optional[int] = None
    cast: Optional[List[CastMember]] = None
    crew: Optional[List[CrewMember]] = None
    streaming_platforms: Optional[List[str]] = None
    tags: Optional[List[str]] = None

class ContentResponse(BaseModel):
    contents: List[Content]
    total: int
    page: int
    limit: int

# Authentication Functions
def hash_password(password: str) -> str:
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return hash_password(password) == hashed_password

def create_access_token(data: dict):
    """Create JWT access token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current admin user from JWT token"""
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        user_type: str = payload.get("type", "user")
        
        if user_type != "admin":
            raise HTTPException(status_code=401, detail="Admin access required")
            
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    admin = await db.admins.find_one({"username": username})
    if admin is None:
        raise HTTPException(status_code=401, detail="Admin not found")
    
    return AdminUser(**admin)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user from JWT token"""
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        user_type: str = payload.get("type", "user")
        
        if user_type != "user":
            raise HTTPException(status_code=401, detail="User access required")
            
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    user = await db.users.find_one({"id": user_id})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    if '_id' in user:
        del user['_id']
    
    return User(**user)

def validate_email(email: str) -> bool:
    """Validate email format"""
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password: str) -> bool:
    """Validate password strength (min 6 characters)"""
    return len(password) >= 6

def parse_excel_csv_file(file_content: bytes, filename: str) -> pd.DataFrame:
    """Parse Excel or CSV file content"""
    try:
        if filename.endswith('.xlsx') or filename.endswith('.xls'):
            df = pd.read_excel(io.BytesIO(file_content))
        elif filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(file_content))
        else:
            raise ValueError("Unsupported file format. Use .xlsx, .xls, or .csv")
        
        return df
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing file: {str(e)}")

def validate_and_convert_row(row: pd.Series) -> Optional[dict]:
    """Validate and convert a single row to content format"""
    try:
        # Required fields validation
        required_fields = ['title', 'year', 'country', 'content_type', 'synopsis', 'rating']
        for field in required_fields:
            if pd.isna(row.get(field)) or str(row.get(field)).strip() == '':
                return None
        
        # Parse genres (comma-separated string to list)
        genres = []
        if not pd.isna(row.get('genres')):
            genre_list = str(row['genres']).split(',')
            for genre in genre_list:
                clean_genre = genre.strip().lower().replace(' ', '_')
                if clean_genre in [g.value for g in ContentGenre]:
                    genres.append(clean_genre)
        
        # Parse streaming platforms
        streaming_platforms = []
        if not pd.isna(row.get('streaming_platforms')):
            streaming_platforms = [p.strip() for p in str(row['streaming_platforms']).split(',') if p.strip()]
        
        # Parse cast (JSON string or comma-separated names)
        cast = []
        if not pd.isna(row.get('cast')):
            cast_str = str(row['cast'])
            try:
                # Try to parse as JSON first
                cast_data = json.loads(cast_str)
                if isinstance(cast_data, list):
                    cast = [{"id": str(uuid.uuid4()), "name": member.get("name", ""), 
                            "character": member.get("character", ""), "profile_image": None} 
                           for member in cast_data if isinstance(member, dict) and member.get("name")]
            except:
                # Fallback to comma-separated names
                cast_names = [name.strip() for name in cast_str.split(',') if name.strip()]
                cast = [{"id": str(uuid.uuid4()), "name": name, "character": "", "profile_image": None} 
                       for name in cast_names]
        
        # Parse crew
        crew = []
        if not pd.isna(row.get('crew')):
            crew_str = str(row['crew'])
            try:
                crew_data = json.loads(crew_str)
                if isinstance(crew_data, list):
                    crew = [{"id": str(uuid.uuid4()), "name": member.get("name", ""), 
                            "role": member.get("role", ""), "profile_image": None} 
                           for member in crew_data if isinstance(member, dict) and member.get("name")]
            except:
                # Simple fallback - assume director
                crew = [{"id": str(uuid.uuid4()), "name": crew_str.strip(), "role": "director", "profile_image": None}]
        
        # Parse tags
        tags = []
        if not pd.isna(row.get('tags')):
            tags = [tag.strip() for tag in str(row['tags']).split(',') if tag.strip()]
        
        # Build content object
        content_data = {
            "id": str(uuid.uuid4()),
            "title": str(row['title']).strip(),
            "original_title": str(row.get('original_title', '')).strip() or None,
            "poster_url": str(row.get('poster_url', '')).strip() or "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",  # Default 1x1 transparent image
            "banner_url": str(row.get('banner_url', '')).strip() or None,
            "synopsis": str(row['synopsis']).strip(),
            "year": int(row['year']),
            "country": str(row['country']).strip(),
            "content_type": str(row['content_type']).lower().strip(),
            "genres": genres,
            "rating": float(row['rating']),
            "episodes": int(row['episodes']) if not pd.isna(row.get('episodes')) and str(row['episodes']).isdigit() else None,
            "duration": int(row['duration']) if not pd.isna(row.get('duration')) and str(row['duration']).isdigit() else None,
            "cast": cast,
            "crew": crew,
            "streaming_platforms": streaming_platforms,
            "tags": tags,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Validate content type
        if content_data['content_type'] not in [ct.value for ct in ContentType]:
            return None
        
        # Validate rating range
        if not (0 <= content_data['rating'] <= 10):
            return None
            
        return content_data
        
    except Exception as e:
        logger.error(f"Error validating row: {str(e)}")
        return None

# API Routes
@api_router.get("/")
async def root():
    return {"message": "Global Drama Verse Guide API"}

# User Authentication Routes
@api_router.post("/auth/register", response_model=UserProfile)
async def register_user(user_data: UserCreate):
    """User registration"""
    
    # Validate email format
    if not validate_email(user_data.email):
        raise HTTPException(status_code=400, detail="Invalid email format")
    
    # Validate password strength
    if not validate_password(user_data.password):
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long")
    
    # Check if email already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check if username already exists
    existing_username = await db.users.find_one({"username": user_data.username})
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Create new user
    user = User(
        email=user_data.email,
        username=user_data.username,
        password_hash=hash_password(user_data.password),
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        preferences={
            "theme": "dark",
            "language": "en",
            "notifications": {
                "email": True,
                "push": True,
                "social": True
            }
        }
    )
    
    # Insert into database
    await db.users.insert_one(user.dict())
    
    # Return user profile (without password)
    return UserProfile(
        id=user.id,
        email=user.email,
        username=user.username,
        first_name=user.first_name,
        last_name=user.last_name,
        avatar_url=user.avatar_url,
        bio=user.bio,
        location=user.location,
        joined_date=user.joined_date,
        is_verified=user.is_verified
    )

@api_router.post("/auth/login", response_model=Token)
async def login_user(user_data: UserLogin):
    """User login"""
    
    # Find user by email
    user = await db.users.find_one({"email": user_data.email})
    
    if not user or not verify_password(user_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is deactivated"
        )
    
    # Update last login
    await db.users.update_one(
        {"id": user["id"]}, 
        {"$set": {"last_login": datetime.utcnow()}}
    )
    
    # Create access token
    access_token = create_access_token(data={"sub": user["id"], "type": "user"})
    return {"access_token": access_token, "token_type": "bearer"}

@api_router.get("/auth/me", response_model=UserProfile)
async def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Get current user profile"""
    return UserProfile(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        avatar_url=current_user.avatar_url,
        bio=current_user.bio,
        location=current_user.location,
        joined_date=current_user.joined_date,
        is_verified=current_user.is_verified
    )

@api_router.get("/users/{username}", response_model=UserProfile)
async def get_user_profile(username: str):
    """Get public user profile"""
    user = await db.users.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if '_id' in user:
        del user['_id']
    
    user_obj = User(**user)
    return UserProfile(
        id=user_obj.id,
        email=user_obj.email,
        username=user_obj.username,
        first_name=user_obj.first_name,
        last_name=user_obj.last_name,
        avatar_url=user_obj.avatar_url,
        bio=user_obj.bio,
        location=user_obj.location,
        joined_date=user_obj.joined_date,
        is_verified=user_obj.is_verified
    )

# Admin Authentication Routes
@api_router.post("/admin/login", response_model=Token)
async def admin_login(admin_data: AdminLogin):
    """Admin login endpoint"""
    admin = await db.admins.find_one({"username": admin_data.username})
    
    if not admin or not verify_password(admin_data.password, admin["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    access_token = create_access_token(data={"sub": admin_data.username, "type": "admin"})
    return {"access_token": access_token, "token_type": "bearer"}

@api_router.get("/admin/stats", response_model=AdminStats)
async def get_admin_stats(current_admin: AdminUser = Depends(get_current_admin)):
    """Get admin dashboard statistics"""
    
    # Get total counts
    total_content = await db.content.count_documents({})
    total_movies = await db.content.count_documents({"content_type": "movie"})
    total_series = await db.content.count_documents({"content_type": "series"})
    total_dramas = await db.content.count_documents({"content_type": "drama"})
    total_anime = await db.content.count_documents({"content_type": "anime"})
    
    # Get unique countries count
    countries = await db.content.distinct("country")
    countries_count = len(countries)
    
    # Get recent additions (last 7 days)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    recent_additions = await db.content.count_documents({
        "created_at": {"$gte": seven_days_ago}
    })
    
    return AdminStats(
        total_content=total_content,
        total_movies=total_movies,
        total_series=total_series,
        total_dramas=total_dramas,
        total_anime=total_anime,
        countries=countries_count,
        recent_additions=recent_additions
    )

@api_router.get("/admin/me")
async def get_current_admin_info(current_admin: AdminUser = Depends(get_current_admin)):
    """Get current admin user info"""
    return {"username": current_admin.username, "is_admin": current_admin.is_admin}

@api_router.get("/content", response_model=ContentResponse)
async def get_content(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    country: Optional[str] = None,
    content_type: Optional[ContentType] = None,
    genre: Optional[ContentGenre] = None,
    year: Optional[int] = None
):
    """Get paginated content with optional filters"""
    skip = (page - 1) * limit
    
    # Build filter query
    filter_query = {}
    
    if search:
        filter_query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"original_title": {"$regex": search, "$options": "i"}},
            {"synopsis": {"$regex": search, "$options": "i"}},
            {"tags": {"$regex": search, "$options": "i"}}
        ]
    
    if country:
        filter_query["country"] = {"$regex": country, "$options": "i"}
    
    if content_type:
        filter_query["content_type"] = content_type
    
    if genre:
        filter_query["genres"] = genre
    
    if year:
        filter_query["year"] = year
    
    # Get total count
    total = await db.content.count_documents(filter_query)
    
    # Get paginated results
    cursor = db.content.find(filter_query).skip(skip).limit(limit).sort("created_at", -1)
    contents = await cursor.to_list(length=limit)
    
    # Convert ObjectId to string and create Content objects
    content_list = []
    for content in contents:
        if '_id' in content:
            del content['_id']
        content_list.append(Content(**content))
    
    return ContentResponse(
        contents=content_list,
        total=total,
        page=page,
        limit=limit
    )

@api_router.get("/content/{content_id}", response_model=Content)
async def get_content_by_id(content_id: str):
    """Get content by ID"""
    content = await db.content.find_one({"id": content_id})
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    if '_id' in content:
        del content['_id']
    
    return Content(**content)

@api_router.post("/content", response_model=Content)
async def create_content(content_data: ContentCreate):
    """Create new content"""
    content = Content(**content_data.dict())
    
    # Insert into database
    await db.content.insert_one(content.dict())
    
    return content

# Admin Content Management Routes
@api_router.post("/admin/content", response_model=Content)
async def admin_create_content(
    content_data: ContentCreate, 
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Admin: Create new content"""
    content = Content(**content_data.dict())
    
    # Insert into database
    await db.content.insert_one(content.dict())
    
    return content

@api_router.put("/admin/content/{content_id}", response_model=Content)
async def admin_update_content(
    content_id: str,
    content_data: ContentUpdate,
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Admin: Update existing content"""
    
    # Find existing content
    existing_content = await db.content.find_one({"id": content_id})
    if not existing_content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    # Update only provided fields
    update_data = {k: v for k, v in content_data.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    # Update in database
    await db.content.update_one({"id": content_id}, {"$set": update_data})
    
    # Return updated content
    updated_content = await db.content.find_one({"id": content_id})
    if '_id' in updated_content:
        del updated_content['_id']
    
    return Content(**updated_content)

@api_router.delete("/admin/content/{content_id}")
async def admin_delete_content(
    content_id: str,
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Admin: Delete content"""
    
    # Check if content exists
    existing_content = await db.content.find_one({"id": content_id})
    if not existing_content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    # Delete content
    await db.content.delete_one({"id": content_id})
    
    return {"message": "Content deleted successfully"}

@api_router.get("/admin/content", response_model=ContentResponse)
async def admin_get_content(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    country: Optional[str] = None,
    content_type: Optional[ContentType] = None,
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Admin: Get content with admin privileges"""
    skip = (page - 1) * limit
    
    # Build filter query
    filter_query = {}
    
    if search:
        filter_query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"original_title": {"$regex": search, "$options": "i"}},
            {"synopsis": {"$regex": search, "$options": "i"}},
            {"tags": {"$regex": search, "$options": "i"}}
        ]
    
    if country:
        filter_query["country"] = {"$regex": country, "$options": "i"}
    
    if content_type:
        filter_query["content_type"] = content_type
    
    # Get total count
    total = await db.content.count_documents(filter_query)
    
    # Get paginated results
    cursor = db.content.find(filter_query).skip(skip).limit(limit).sort("created_at", -1)
    contents = await cursor.to_list(length=limit)
    
    # Convert ObjectId to string and create Content objects
    content_list = []
    for content in contents:
        if '_id' in content:
            del content['_id']
        content_list.append(Content(**content))
    
    return ContentResponse(
        contents=content_list,
        total=total,
        page=page,
        limit=limit
    )

@api_router.post("/admin/bulk-import", response_model=BulkImportResult)
async def admin_bulk_import(
    file: UploadFile = File(...),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Admin: Bulk import content from Excel/CSV file"""
    
    # Validate file type
    if not file.filename.lower().endswith(('.xlsx', '.xls', '.csv')):
        raise HTTPException(
            status_code=400, 
            detail="Invalid file format. Please upload .xlsx, .xls, or .csv files only."
        )
    
    try:
        # Read file content
        file_content = await file.read()
        
        # Parse file
        df = parse_excel_csv_file(file_content, file.filename)
        
        if df.empty:
            raise HTTPException(status_code=400, detail="File is empty or has no valid data")
        
        # Process each row
        successful_imports = 0
        failed_imports = 0
        errors = []
        imported_content = []
        
        for index, row in df.iterrows():
            try:
                content_data = validate_and_convert_row(row)
                
                if content_data is None:
                    failed_imports += 1
                    errors.append(f"Row {index + 1}: Missing required fields or invalid data")
                    continue
                
                # Check if content already exists (by title and year)
                existing = await db.content.find_one({
                    "title": content_data["title"],
                    "year": content_data["year"]
                })
                
                if existing:
                    failed_imports += 1
                    errors.append(f"Row {index + 1}: Content '{content_data['title']}' ({content_data['year']}) already exists")
                    continue
                
                # Insert into database
                await db.content.insert_one(content_data)
                successful_imports += 1
                imported_content.append(f"{content_data['title']} ({content_data['year']})")
                
            except Exception as e:
                failed_imports += 1
                errors.append(f"Row {index + 1}: {str(e)}")
        
        return BulkImportResult(
            success=successful_imports > 0,
            total_rows=len(df),
            successful_imports=successful_imports,
            failed_imports=failed_imports,
            errors=errors[:20],  # Limit errors to first 20
            imported_content=imported_content[:20]  # Limit list to first 20
        )
        
    except Exception as e:
        logger.error(f"Bulk import error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error processing file: {str(e)}")

@api_router.get("/admin/bulk-import/template")
async def download_template(current_admin: AdminUser = Depends(get_current_admin)):
    """Admin: Download bulk import template"""
    
    template_data = {
        'title': ['Squid Game', 'Parasite'],
        'original_title': ['오징어 게임', '기생충'],
        'year': [2021, 2019],
        'country': ['South Korea', 'South Korea'],
        'content_type': ['series', 'movie'],
        'synopsis': [
            'A desperate group of people compete in children\'s games for a massive cash prize.',
            'A poor family schemes to become employed by a wealthy family.'
        ],
        'rating': [8.7, 8.5],
        'genres': ['thriller,drama,mystery', 'thriller,drama,comedy'],
        'episodes': [9, None],
        'duration': [None, 132],
        'cast': [
            '[{"name": "Lee Jung-jae", "character": "Seong Gi-hun"}]',
            '[{"name": "Song Kang-ho", "character": "Ki-taek"}]'
        ],
        'crew': [
            '[{"name": "Hwang Dong-hyuk", "role": "director"}]',
            '[{"name": "Bong Joon-ho", "role": "director"}]'
        ],
        'streaming_platforms': ['Netflix', 'Hulu,Amazon Prime'],
        'tags': ['survival,korean,psychological', 'oscar winner,social commentary'],
        'poster_url': ['', ''],  # Optional - will use default if empty
        'banner_url': ['', '']   # Optional
    }
    
    df = pd.DataFrame(template_data)
    
    # Create Excel file in memory
    excel_buffer = io.BytesIO()
    df.to_excel(excel_buffer, index=False, sheet_name='Content Template')
    excel_buffer.seek(0)
    
    return {
        "message": "Template structure",
        "columns": list(template_data.keys()),
        "required_columns": ["title", "year", "country", "content_type", "synopsis", "rating"],
        "optional_columns": ["original_title", "episodes", "duration", "cast", "crew", "streaming_platforms", "tags", "poster_url", "banner_url"],
        "sample_data": template_data
    }

@api_router.get("/trending", response_model=List[Content])
async def get_trending_content(limit: int = Query(10, ge=1, le=50)):
    """Get trending content (highest rated recent content)"""
    cursor = db.content.find().sort([("rating", -1), ("created_at", -1)]).limit(limit)
    contents = await cursor.to_list(length=limit)
    
    content_list = []
    for content in contents:
        if '_id' in content:
            del content['_id']
        content_list.append(Content(**content))
    
    return content_list

@api_router.get("/countries")
async def get_countries():
    """Get list of available countries"""
    countries = await db.content.distinct("country")
    return {"countries": sorted(countries)}

@api_router.get("/genres")
async def get_genres():
    """Get list of available genres"""
    return {"genres": [genre.value for genre in ContentGenre]}

@api_router.get("/content-types")
async def get_content_types():
    """Get list of available content types"""
    return {"content_types": [content_type.value for content_type in ContentType]}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    """Initialize database with sample data and admin user"""
    
    # Create default admin if not exists
    admin_exists = await db.admins.find_one({"username": "admin"})
    if not admin_exists:
        default_admin = AdminUser(
            username="admin",
            password_hash=hash_password("admin123"),
            is_admin=True
        )
        await db.admins.insert_one(default_admin.dict())
        logger.info("Created default admin user (username: admin, password: admin123)")
    
    # Check if content collection is empty
    count = await db.content.count_documents({})
    if count == 0:
        logger.info("Initializing database with sample content...")
        await populate_sample_data()

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

async def populate_sample_data():
    """Populate database with sample global content"""
    sample_content = [
        {
            "id": str(uuid.uuid4()),
            "title": "Squid Game",
            "original_title": "오징어 게임",
            "poster_url": "https://images.unsplash.com/photo-1633882595230-0969f5af2780?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwxfHxpbnRlcm5hdGlvbmFsJTIwbW92aWVzfGVufDB8fHx8MTc1MzUyNzI2OHww&ixlib=rb-4.1.0&q=85",
            "banner_url": "https://images.unsplash.com/photo-1710988486897-e933e4b0f72c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHwzfHxnbG9iYWwlMjBjaW5lbWF8ZW58MHx8fHwxNzUzNTI3MjU2fDA&ixlib=rb-4.1.0&q=85",
            "synopsis": "A desperate group of people compete in children's games for a massive cash prize, but the stakes are deadly.",
            "year": 2021,
            "country": "South Korea",
            "content_type": "series",
            "genres": ["thriller", "drama", "mystery"],
            "rating": 8.7,
            "episodes": 9,
            "cast": [
                {"id": str(uuid.uuid4()), "name": "Lee Jung-jae", "character": "Seong Gi-hun", "profile_image": None},
                {"id": str(uuid.uuid4()), "name": "Park Hae-soo", "character": "Cho Sang-woo", "profile_image": None}
            ],
            "crew": [
                {"id": str(uuid.uuid4()), "name": "Hwang Dong-hyuk", "role": "director", "profile_image": None}
            ],
            "streaming_platforms": ["Netflix"],
            "tags": ["survival", "korean", "psychological"],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Parasite",
            "original_title": "기생충",
            "poster_url": "https://images.unsplash.com/photo-1517486518908-97a5f91b325f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwzfHxpbnRlcm5hdGlvbmFsJTIwbW92aWVzfGVufDB8fHx8MTc1MzUyNzI2OHww&ixlib=rb-4.1.0&q=85",
            "banner_url": "https://images.unsplash.com/photo-1627133805103-ce2d34ccdd37?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHw0fHxnbG9iYWwlMjBjaW5lbWF8ZW58MHx8fHwxNzUzNTI3MjU2fDA&ixlib=rb-4.1.0&q=85",
            "synopsis": "A poor family schemes to become employed by a wealthy family and infiltrate their household by posing as unrelated, highly qualified individuals.",
            "year": 2019,
            "country": "South Korea",
            "content_type": "movie",
            "genres": ["thriller", "drama", "comedy"],
            "rating": 8.5,
            "duration": 132,
            "cast": [
                {"id": str(uuid.uuid4()), "name": "Song Kang-ho", "character": "Ki-taek", "profile_image": None},
                {"id": str(uuid.uuid4()), "name": "Lee Sun-kyun", "character": "Park Dong-ik", "profile_image": None}
            ],
            "crew": [
                {"id": str(uuid.uuid4()), "name": "Bong Joon-ho", "role": "director", "profile_image": None}
            ],
            "streaming_platforms": ["Hulu", "Amazon Prime"],
            "tags": ["oscar winner", "social commentary", "dark comedy"],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Your Name",
            "original_title": "君の名は。",
            "poster_url": "https://images.unsplash.com/photo-1539481915544-f5cd50562d66?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHw0fHxpbnRlcm5hdGlvbmFsJTIwbW92aWVzfGVufDB8fHx8MTc1MzUyNzI2OHww&ixlib=rb-4.1.0&q=85",
            "synopsis": "Two teenagers share a profound, magical connection upon discovering they are swapping bodies. Things manage to become even more complicated when the boy and girl decide to meet in person.",
            "year": 2016,
            "country": "Japan",
            "content_type": "anime",
            "genres": ["romance", "fantasy", "drama"],
            "rating": 8.4,
            "duration": 106,
            "cast": [
                {"id": str(uuid.uuid4()), "name": "Ryunosuke Kamiki", "character": "Taki Tachibana (voice)", "profile_image": None},
                {"id": str(uuid.uuid4()), "name": "Mone Kamishiraishi", "character": "Mitsuha Miyamizu (voice)", "profile_image": None}
            ],
            "crew": [
                {"id": str(uuid.uuid4()), "name": "Makoto Shinkai", "role": "director", "profile_image": None}
            ],
            "streaming_platforms": ["Crunchyroll", "Funimation"],
            "tags": ["anime", "body swap", "supernatural"],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "3 Idiots",
            "original_title": "3 Idiots",
            "poster_url": "https://images.unsplash.com/photo-1633882595230-0969f5af2780?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwxfHxpbnRlcm5hdGlvbmFsJTIwbW92aWVzfGVufDB8fHx8MTc1MzUyNzI2OHww&ixlib=rb-4.1.0&q=85",
            "synopsis": "Two friends are searching for their long lost companion. They revisit their college days and recall the memories of their friend who inspired them to think differently.",
            "year": 2009,
            "country": "India",
            "content_type": "movie",
            "genres": ["comedy", "drama"],
            "rating": 8.4,
            "duration": 170,
            "cast": [
                {"id": str(uuid.uuid4()), "name": "Aamir Khan", "character": "Rancho", "profile_image": None},
                {"id": str(uuid.uuid4()), "name": "R. Madhavan", "character": "Farhan", "profile_image": None},
                {"id": str(uuid.uuid4()), "name": "Sharman Joshi", "character": "Raju", "profile_image": None}
            ],
            "crew": [
                {"id": str(uuid.uuid4()), "name": "Rajkumar Hirani", "role": "director", "profile_image": None}
            ],
            "streaming_platforms": ["Netflix", "Amazon Prime"],
            "tags": ["bollywood", "friendship", "education"],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "The Handmaiden",
            "original_title": "아가씨",
            "poster_url": "https://images.unsplash.com/photo-1517486518908-97a5f91b325f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwzfHxpbnRlcm5hdGlvbmFsJTIwbW92aWVzfGVufDB8fHx8MTc1MzUyNzI2OHww&ixlib=rb-4.1.0&q=85",
            "synopsis": "A woman is hired as a handmaiden to a Japanese heiress, but secretly she is involved in a plot to defraud her.",
            "year": 2016,
            "country": "South Korea",
            "content_type": "movie",
            "genres": ["thriller", "drama", "mystery"],
            "rating": 8.1,
            "duration": 145,
            "cast": [
                {"id": str(uuid.uuid4()), "name": "Kim Min-hee", "character": "Lady Hideko", "profile_image": None},
                {"id": str(uuid.uuid4()), "name": "Kim Tae-ri", "character": "Sook-hee", "profile_image": None}
            ],
            "crew": [
                {"id": str(uuid.uuid4()), "name": "Park Chan-wook", "role": "director", "profile_image": None}
            ],
            "streaming_platforms": ["Amazon Prime", "Mubi"],
            "tags": ["psychological", "period drama", "lgbtq"],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Money Heist",
            "original_title": "La Casa de Papel",
            "poster_url": "https://images.unsplash.com/photo-1539481915544-f5cd50562d66?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHw0fHxpbnRlcm5hdGlvbmFsJTIwbW92aWVzfGVufDB8fHx8MTc1MzUyNzI2OHww&ixlib=rb-4.1.0&q=85",
            "synopsis": "A criminal mastermind who goes by 'The Professor' has a plan to pull off the biggest heist in recorded history -- to print billions of euros in the Royal Mint of Spain.",
            "year": 2017,
            "country": "Spain",
            "content_type": "series",
            "genres": ["crime", "thriller", "drama"],
            "rating": 8.2,
            "episodes": 41,
            "cast": [
                {"id": str(uuid.uuid4()), "name": "Álvaro Morte", "character": "The Professor", "profile_image": None},
                {"id": str(uuid.uuid4()), "name": "Úrsula Corberó", "character": "Tokyo", "profile_image": None}
            ],
            "crew": [
                {"id": str(uuid.uuid4()), "name": "Álex Pina", "role": "creator", "profile_image": None}
            ],
            "streaming_platforms": ["Netflix"],
            "tags": ["heist", "spanish", "resistance"],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    ]
    
    # Insert sample data
    await db.content.insert_many(sample_content)
    logger.info(f"Inserted {len(sample_content)} sample content items")