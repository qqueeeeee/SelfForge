# services/auth_service.py
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from jose import jwt
from sqlalchemy.orm import Session
from models import User
import os
from dotenv import load_dotenv

load_dotenv()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = "HS256"


def _get_secret_key() -> str:
    secret_key = os.getenv("SECRET_JWT_KEY")
    if not secret_key:
        raise RuntimeError("Missing SECRET_JWT_KEY environment variable.")
    return secret_key

class AuthService:
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def get_password_hash(password: str) -> str:
        return pwd_context.hash(password)
    
    @staticmethod
    def create_access_token(data: dict, expires_delta: timedelta = None) -> str: #type:ignore
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(minutes=15)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, _get_secret_key(), algorithm=ALGORITHM)
        return encoded_jwt
    
    @staticmethod
    def get_user_by_email(db: Session, email: str):
        return db.query(User).filter(User.email == email).first()
    
    @staticmethod
    def create_user(db: Session, email: str, password: str):
        hashed_password = AuthService.get_password_hash(password)
        db_user = User(
            email=email,
            hashed_password=hashed_password
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    
    @staticmethod
    def authenticate_user(db: Session, email: str, password: str):
        user = AuthService.get_user_by_email(db, email)
        if not user:
            return False
        if not AuthService.verify_password(password, user.hashed_password):
            return False
        return user
