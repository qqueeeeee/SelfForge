from datetime import datetime

from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import declarative_base, relationship, sessionmaker 

DATABASE_URL = "sqlite:///./data1.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(bind=engine)

Base = declarative_base()



