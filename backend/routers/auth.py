from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from database import get_db
from models.user import User

router = APIRouter()


@router.post("/login")
def login(data: dict, db: Session = Depends(get_db)):
    username = data.get("username")
    password = data.get("password")

    user = db.query(User).filter(User.username == username).first()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # testing only
    if user.password_hash != password:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {
        "user": {
            "id": user.id,
            "username": user.username,
            "role": user.role
        }
    }


def role_required(allowed_roles: list):
    def checker(user_role: str = Header(None)):
        if not user_role:
            raise HTTPException(status_code=401, detail="Missing role")

        if user_role not in allowed_roles:
            raise HTTPException(status_code=403, detail="Access denied")

        return user_role

    return checker