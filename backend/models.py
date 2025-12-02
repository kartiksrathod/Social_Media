from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone
import uuid

# ==================== USER MODELS ====================

class UserBase(BaseModel):
    username: str
    email: EmailStr
    bio: Optional[str] = ""
    avatar: Optional[str] = None

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserUpdate(BaseModel):
    bio: Optional[str] = None
    avatar: Optional[str] = None

class User(UserBase):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    followers: List[str] = Field(default_factory=list)  # List of user IDs
    following: List[str] = Field(default_factory=list)  # List of user IDs
    saved_posts: List[str] = Field(default_factory=list)  # List of saved post IDs
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserInDB(User):
    password_hash: str

class UserPublic(UserBase):
    id: str
    followers: List[str]
    following: List[str]
    followers_count: int = 0
    following_count: int = 0
    is_following: bool = False  # Whether current user follows this user

# ==================== POST MODELS ====================

class PostCreate(BaseModel):
    text: str
    image_url: Optional[str] = None

class Comment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    username: str
    avatar: Optional[str] = None
    text: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Post(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    author_id: str
    author_username: str
    author_avatar: Optional[str] = None
    text: str
    image_url: Optional[str] = None
    hashtags: List[str] = Field(default_factory=list)  # List of hashtags in post
    likes: List[str] = Field(default_factory=list)  # List of user IDs who liked
    comments: List[Comment] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PostPublic(Post):
    likes_count: int = 0
    comments_count: int = 0
    is_liked: bool = False  # Whether current user liked this post

# ==================== NOTIFICATION MODELS ====================

class Notification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str  # User who receives the notification
    actor_id: str  # User who performed the action
    actor_username: str
    actor_avatar: Optional[str] = None
    type: str  # "like", "comment", "follow"
    post_id: Optional[str] = None  # For like and comment notifications
    text: Optional[str] = None  # For comment notifications
    read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== AUTH MODELS ====================

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: Optional[str] = None
