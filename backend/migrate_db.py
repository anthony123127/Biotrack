import pymysql
import os
from dotenv import load_dotenv

# Load environment variables if needed
# load_dotenv()

# Database configuration
# Based on database.py: mysql+pymysql://root:@localhost:3306/biotrackdb
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'biotrackdb',
    'port': 3306
}

def migrate():
    try:
        connection = pymysql.connect(**DB_CONFIG)
        with connection.cursor() as cursor:
            print("Connected to database.")

            # 1. Add privacy_consent and consent_timestamp columns
            print("Adding privacy columns to students table...")
            try:
                cursor.execute("ALTER TABLE students ADD COLUMN privacy_consent TINYINT(1) DEFAULT 0")
                cursor.execute("ALTER TABLE students ADD COLUMN consent_timestamp DATETIME NULL")
                print("Privacy columns added.")
            except Exception as e:
                print(f"Note: Privacy columns might already exist: {e}")

            # 1.1 Add multi-angle columns
            print("Adding multi-angle columns to students table...")
            try:
                cursor.execute("ALTER TABLE students ADD COLUMN PhotoPathLeft VARCHAR(255) NULL")
                cursor.execute("ALTER TABLE students ADD COLUMN PhotoPathRight VARCHAR(255) NULL")
                cursor.execute("ALTER TABLE students ADD COLUMN embedding_left LONGBLOB NULL")
                cursor.execute("ALTER TABLE students ADD COLUMN embedding_right LONGBLOB NULL")
                print("Multi-angle columns added.")
            except Exception as e:
                print(f"Note: Multi-angle columns might already exist: {e}")

            # 2. Change Year column to VARCHAR(50)
            print("Changing Year column to VARCHAR(50)...")
            try:
                # First, convert existing numeric years to strings like "1st Year" if desired, 
                # but for now just changing the type is enough.
                cursor.execute("ALTER TABLE students MODIFY COLUMN Year VARCHAR(50) NOT NULL")
                print("Year column modified.")
            except Exception as e:
                print(f"Error modifying Year column: {e}")

            # 3. Create users table for RBAC
            print("Creating users table...")
            create_users_table = """
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role ENUM('Admin', 'Staff', 'Registrar', 'Viewer') DEFAULT 'Viewer',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
            cursor.execute(create_users_table)
            print("Users table created.")

            # Add a default admin user if it doesn't exist
            # hash for 'admin123' (simplified for now, ideally use bcrypt)
            cursor.execute("SELECT id FROM users WHERE username = 'admin'")
            if not cursor.fetchone():
                print("Adding default admin user...")
                # In a real app, I'd use bcrypt here. For now, I'll use a placeholder or 
                # instructions for the user to set it.
                cursor.execute("INSERT INTO users (username, password_hash, role) VALUES ('admin', 'admin123', 'Admin')")
                print("Default admin user added.")

            connection.commit()
            print("Migration completed successfully.")

    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        if 'connection' in locals() and connection.open:
            connection.close()

if __name__ == "__main__":
    migrate()
