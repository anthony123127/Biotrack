from sqlalchemy import Column, Integer, String, Enum, DateTime
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum('Admin', 'Registrar', 'Security Guard'), default='Security Guard')
    created_at = Column(DateTime, default=datetime.utcnow)
