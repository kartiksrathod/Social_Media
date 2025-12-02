from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, UploadFile, File
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import re
from pathlib import Path
from typing import List, Optional
from datetime import datetime

# Import models and auth
from models import (
    User, UserCreate, UserLogin, UserUpdate, UserPublic, UserInDB,
    Post, PostCreate, PostPublic, Comment,
    Notification, Token
)
from auth import (
    get_password_hash, verify_password, create_access_token,
    get_current_user_id
)
from cloudinary_service import CloudinaryService

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Collections
users_collection = db.users
posts_collection = db.posts
notifications_collection = db.notifications

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ==================== HELPER FUNCTIONS ====================

async def get_current_user(user_id: str = Depends(get_current_user_id)) -> UserInDB:
    """Get the current user from the database."""
    user_data = await users_collection.find_one({"id": user_id}, {"_id": 0})
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
    return UserInDB(**user_data)

def serialize_datetime(obj):
    """Convert datetime objects to ISO strings for MongoDB."""
    if isinstance(obj, datetime):
        return obj.isoformat()
    return obj

def extract_hashtags(text: str) -> List[str]:
    """Extract hashtags from text."""
    # Find all hashtags (word characters after #)
    hashtags = re.findall(r'#(\w+)', text)
    # Return unique hashtags in lowercase
    return list(set([tag.lower() for tag in hashtags]))

def user_to_public(user: dict, current_user_id: Optional[str] = None) -> dict:
    """Convert user data to public format."""
    return {
        "id": user["id"],
        "username": user["username"],
        "email": user["email"],
        "bio": user.get("bio", ""),
        "avatar": user.get("avatar"),
        "followers": user.get("followers", []),
        "following": user.get("following", []),
        "followers_count": len(user.get("followers", [])),
        "following_count": len(user.get("following", [])),
        "is_following": current_user_id in user.get("followers", []) if current_user_id else False
    }

async def get_user_data(user_id: str) -> Optional[dict]:
    """Get user data by ID."""
    return await users_collection.find_one({"id": user_id}, {"_id": 0})

def post_to_public(post: dict, current_user_id: Optional[str] = None, saved_posts: List[str] = []) -> dict:
    """Convert post data to public format."""
    return {
        **post,
        "likes_count": len(post.get("likes", [])),
        "comments_count": len(post.get("comments", [])),
        "is_liked": current_user_id in post.get("likes", []) if current_user_id else False,
        "is_saved": post.get("id") in saved_posts if saved_posts else False
    }

# ==================== AUTHENTICATION ROUTES ====================

@api_router.post("/auth/signup", response_model=Token)
async def signup(user_data: UserCreate):
    """Create a new user account."""
    # Check if username already exists
    existing_user = await users_collection.find_one({"username": user_data.username}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # Check if email already exists
    existing_email = await users_collection.find_one({"email": user_data.email}, {"_id": 0})
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    user = UserInDB(
        **user_data.model_dump(exclude={"password"}),
        password_hash=get_password_hash(user_data.password)
    )
    
    # Convert to dict and serialize datetime
    user_dict = user.model_dump()
    user_dict["created_at"] = user_dict["created_at"].isoformat()
    
    await users_collection.insert_one(user_dict)
    
    # Create access token
    access_token = create_access_token(data={"sub": user.id})
    
    return Token(access_token=access_token)

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    """Login with username and password."""
    # Find user by username
    user_data = await users_collection.find_one({"username": credentials.username}, {"_id": 0})
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    user = UserInDB(**user_data)
    
    # Verify password
    if not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # Create access token
    access_token = create_access_token(data={"sub": user.id})
    
    return Token(access_token=access_token)

@api_router.get("/auth/me", response_model=UserPublic)
async def get_me(current_user: UserInDB = Depends(get_current_user)):
    """Get current user information."""
    return user_to_public(current_user.model_dump())

# ==================== USER ROUTES ====================

@api_router.get("/users/{username}", response_model=UserPublic)
async def get_user_profile(username: str, current_user_id: str = Depends(get_current_user_id)):
    """Get a user's profile by username."""
    user_data = await users_collection.find_one({"username": username}, {"_id": 0})
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user_to_public(user_data, current_user_id)

@api_router.put("/users/me", response_model=UserPublic)
async def update_profile(
    updates: UserUpdate,
    current_user: UserInDB = Depends(get_current_user)
):
    """Update current user's profile."""
    update_data = {k: v for k, v in updates.model_dump().items() if v is not None}
    
    if update_data:
        await users_collection.update_one(
            {"id": current_user.id},
            {"$set": update_data}
        )
    
    # Get updated user
    updated_user = await users_collection.find_one({"id": current_user.id}, {"_id": 0})
    return user_to_public(updated_user)

@api_router.post("/users/{user_id}/follow")
async def follow_user(user_id: str, current_user: UserInDB = Depends(get_current_user)):
    """Follow a user."""
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    
    # Check if target user exists
    target_user = await users_collection.find_one({"id": user_id}, {"_id": 0})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if already following
    if user_id in current_user.following:
        raise HTTPException(status_code=400, detail="Already following this user")
    
    # Add to following list
    await users_collection.update_one(
        {"id": current_user.id},
        {"$push": {"following": user_id}}
    )
    
    # Add to followers list of target user
    await users_collection.update_one(
        {"id": user_id},
        {"$push": {"followers": current_user.id}}
    )
    
    # Create notification
    notification = Notification(
        user_id=user_id,
        actor_id=current_user.id,
        actor_username=current_user.username,
        actor_avatar=current_user.avatar,
        type="follow"
    )
    notification_dict = notification.model_dump()
    notification_dict["created_at"] = notification_dict["created_at"].isoformat()
    await notifications_collection.insert_one(notification_dict)
    
    return {"message": "Successfully followed user"}

@api_router.post("/users/{user_id}/unfollow")
async def unfollow_user(user_id: str, current_user: UserInDB = Depends(get_current_user)):
    """Unfollow a user."""
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot unfollow yourself")
    
    # Check if currently following
    if user_id not in current_user.following:
        raise HTTPException(status_code=400, detail="Not following this user")
    
    # Remove from following list
    await users_collection.update_one(
        {"id": current_user.id},
        {"$pull": {"following": user_id}}
    )
    
    # Remove from followers list of target user
    await users_collection.update_one(
        {"id": user_id},
        {"$pull": {"followers": current_user.id}}
    )
    
    return {"message": "Successfully unfollowed user"}

@api_router.get("/users/search-test")
async def search_test(current_user_id: str = Depends(get_current_user_id)):
    """Test endpoint to debug dependency injection."""
    print(f"DEBUG: search_test called with current_user_id={current_user_id}")
    return {"message": "Test successful", "user_id": current_user_id}

@api_router.get("/users/search", response_model=List[UserPublic])
async def search_users(
    q: str,
    current_user_id: str = Depends(get_current_user_id)
):
    """Search users by username."""
    print(f"DEBUG: search_users called with q={q}, current_user_id={current_user_id}")
    
    try:
        users = await users_collection.find(
            {"username": {"$regex": q, "$options": "i"}},
            {"_id": 0}
        ).limit(20).to_list(20)
        
        print(f"DEBUG: Found {len(users)} users")
        
        result = [user_to_public(user, current_user_id) for user in users]
        print(f"DEBUG: Converted to {len(result)} public users")
        return result
    except Exception as e:
        print(f"DEBUG: Error in search_users: {e}")
        raise

@api_router.get("/users/suggested", response_model=List[UserPublic])
async def get_suggested_users(current_user: UserInDB = Depends(get_current_user)):
    """Get suggested users to follow."""
    # Get users that current user is not following
    users = await users_collection.find(
        {
            "id": {"$nin": [current_user.id] + current_user.following},
        },
        {"_id": 0}
    ).limit(5).to_list(5)
    
    return [user_to_public(user, current_user.id) for user in users]

# ==================== POST ROUTES ====================

@api_router.post("/posts", response_model=PostPublic)
async def create_post(
    post_data: PostCreate,
    current_user: UserInDB = Depends(get_current_user)
):
    """Create a new post."""
    # Extract hashtags from text
    hashtags = extract_hashtags(post_data.text)
    
    post = Post(
        author_id=current_user.id,
        author_username=current_user.username,
        author_avatar=current_user.avatar,
        text=post_data.text,
        image_url=post_data.image_url,
        hashtags=hashtags
    )
    
    # Convert to dict and serialize datetime
    post_dict = post.model_dump()
    post_dict["created_at"] = post_dict["created_at"].isoformat()
    
    await posts_collection.insert_one(post_dict)
    
    return post_to_public(post_dict, current_user.id, current_user.saved_posts)

@api_router.post("/posts/upload-image")
async def upload_post_image(
    file: UploadFile = File(...),
    current_user_id: str = Depends(get_current_user_id)
):
    """Upload an image for a post."""
    # Read file data
    file_data = await file.read()
    
    # Upload to Cloudinary
    result = await CloudinaryService.upload_image(file_data, folder="posts")
    
    return {"url": result["url"]}

@api_router.post("/users/upload-avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: UserInDB = Depends(get_current_user)
):
    """Upload a new avatar image."""
    # Read file data
    file_data = await file.read()
    
    # Upload to Cloudinary
    result = await CloudinaryService.upload_image(file_data, folder="avatars")
    
    # Update user avatar
    await users_collection.update_one(
        {"id": current_user.id},
        {"$set": {"avatar": result["url"]}}
    )
    
    return {"url": result["url"]}

@api_router.get("/posts/feed", response_model=List[PostPublic])
async def get_feed(
    limit: int = 20,
    current_user: UserInDB = Depends(get_current_user)
):
    """Get personalized feed of posts from followed users."""
    # Get posts from users that current user follows (plus own posts)
    following_ids = current_user.following + [current_user.id]
    
    posts = await posts_collection.find(
        {"author_id": {"$in": following_ids}},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    # Convert ISO strings back to datetime for serialization
    for post in posts:
        if isinstance(post.get("created_at"), str):
            post["created_at"] = datetime.fromisoformat(post["created_at"])
    
    return [post_to_public(post, current_user.id, current_user.saved_posts) for post in posts]

@api_router.get("/posts/explore", response_model=List[PostPublic])
async def get_explore_posts(
    limit: int = 20,
    current_user: UserInDB = Depends(get_current_user)
):
    """Get all recent posts for explore page."""
    posts = await posts_collection.find(
        {},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    # Convert ISO strings back to datetime
    for post in posts:
        if isinstance(post.get("created_at"), str):
            post["created_at"] = datetime.fromisoformat(post["created_at"])
    
    return [post_to_public(post, current_user.id, current_user.saved_posts) for post in posts]

@api_router.get("/posts/user/{username}", response_model=List[PostPublic])
async def get_user_posts(
    username: str,
    limit: int = 20,
    current_user_id: str = Depends(get_current_user_id)
):
    """Get posts by a specific user."""
    # Find user
    user = await users_collection.find_one({"username": username}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user's posts
    posts = await posts_collection.find(
        {"author_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    # Convert ISO strings back to datetime
    for post in posts:
        if isinstance(post.get("created_at"), str):
            post["created_at"] = datetime.fromisoformat(post["created_at"])
    
    return [post_to_public(post, current_user_id) for post in posts]

@api_router.post("/posts/{post_id}/like")
async def like_post(post_id: str, current_user: UserInDB = Depends(get_current_user)):
    """Like a post."""
    post = await posts_collection.find_one({"id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Check if already liked
    if current_user.id in post.get("likes", []):
        raise HTTPException(status_code=400, detail="Post already liked")
    
    # Add like
    await posts_collection.update_one(
        {"id": post_id},
        {"$push": {"likes": current_user.id}}
    )
    
    # Create notification (only if not own post)
    if post["author_id"] != current_user.id:
        notification = Notification(
            user_id=post["author_id"],
            actor_id=current_user.id,
            actor_username=current_user.username,
            actor_avatar=current_user.avatar,
            type="like",
            post_id=post_id
        )
        notification_dict = notification.model_dump()
        notification_dict["created_at"] = notification_dict["created_at"].isoformat()
        await notifications_collection.insert_one(notification_dict)
    
    return {"message": "Post liked successfully"}

@api_router.post("/posts/{post_id}/unlike")
async def unlike_post(post_id: str, current_user: UserInDB = Depends(get_current_user)):
    """Unlike a post."""
    post = await posts_collection.find_one({"id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Check if not liked
    if current_user.id not in post.get("likes", []):
        raise HTTPException(status_code=400, detail="Post not liked")
    
    # Remove like
    await posts_collection.update_one(
        {"id": post_id},
        {"$pull": {"likes": current_user.id}}
    )
    
    return {"message": "Post unliked successfully"}

@api_router.post("/posts/{post_id}/comments")
async def add_comment(
    post_id: str,
    comment_text: dict,
    current_user: UserInDB = Depends(get_current_user)
):
    """Add a comment to a post."""
    post = await posts_collection.find_one({"id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Create comment
    comment = Comment(
        user_id=current_user.id,
        username=current_user.username,
        avatar=current_user.avatar,
        text=comment_text.get("text", "")
    )
    
    comment_dict = comment.model_dump()
    comment_dict["created_at"] = comment_dict["created_at"].isoformat()
    
    # Add comment to post
    await posts_collection.update_one(
        {"id": post_id},
        {"$push": {"comments": comment_dict}}
    )
    
    # Create notification (only if not own post)
    if post["author_id"] != current_user.id:
        notification = Notification(
            user_id=post["author_id"],
            actor_id=current_user.id,
            actor_username=current_user.username,
            actor_avatar=current_user.avatar,
            type="comment",
            post_id=post_id,
            text=comment_text.get("text", "")
        )
        notification_dict = notification.model_dump()
        notification_dict["created_at"] = notification_dict["created_at"].isoformat()
        await notifications_collection.insert_one(notification_dict)
    
    return comment_dict

@api_router.get("/posts/{post_id}/comments", response_model=List[Comment])
async def get_comments(post_id: str):
    """Get comments for a post."""
    post = await posts_collection.find_one({"id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    return post.get("comments", [])

# ==================== NOTIFICATION ROUTES ====================

@api_router.get("/notifications", response_model=List[Notification])
async def get_notifications(
    limit: int = 20,
    current_user: UserInDB = Depends(get_current_user)
):
    """Get notifications for current user."""
    notifications = await notifications_collection.find(
        {"user_id": current_user.id},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    # Convert ISO strings back to datetime
    for notif in notifications:
        if isinstance(notif.get("created_at"), str):
            notif["created_at"] = datetime.fromisoformat(notif["created_at"])
    
    return notifications

@api_router.post("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    """Mark a notification as read."""
    result = await notifications_collection.update_one(
        {"id": notification_id, "user_id": current_user_id},
        {"$set": {"read": True}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"message": "Notification marked as read"}

@api_router.post("/notifications/read-all")
async def mark_all_notifications_read(current_user_id: str = Depends(get_current_user_id)):
    """Mark all notifications as read."""
    await notifications_collection.update_many(
        {"user_id": current_user_id, "read": False},
        {"$set": {"read": True}}
    )
    
    return {"message": "All notifications marked as read"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
