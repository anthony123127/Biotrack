import pymysql

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

            # 1. Check and add privacy_consent
            print("Checking privacy_consent column...")
            cursor.execute("SHOW COLUMNS FROM students LIKE 'privacy_consent'")
            if not cursor.fetchone():
                print("Adding privacy_consent...")
                cursor.execute("ALTER TABLE students ADD COLUMN privacy_consent TINYINT(1) DEFAULT 0")
            
            # 2. Check and add consent_timestamp
            print("Checking consent_timestamp column...")
            cursor.execute("SHOW COLUMNS FROM students LIKE 'consent_timestamp'")
            if not cursor.fetchone():
                print("Adding consent_timestamp...")
                cursor.execute("ALTER TABLE students ADD COLUMN consent_timestamp DATETIME NULL")

            # 3. Check and add embedding
            print("Checking embedding column...")
            cursor.execute("SHOW COLUMNS FROM students LIKE 'embedding'")
            if not cursor.fetchone():
                print("Adding embedding...")
                cursor.execute("ALTER TABLE students ADD COLUMN embedding LONGBLOB NULL")

            # 4. Modify Year to VARCHAR
            print("Modifying Year column...")
            cursor.execute("ALTER TABLE students MODIFY COLUMN Year VARCHAR(50) NOT NULL")

            # 5. Check users table
            print("Checking users table...")
            cursor.execute("SHOW TABLES LIKE 'users'")
            if not cursor.fetchone():
                print("Creating users table...")
                cursor.execute("""
                    CREATE TABLE users (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        username VARCHAR(50) UNIQUE NOT NULL,
                        password_hash VARCHAR(255) NOT NULL,
                        role ENUM('Admin', 'Staff', 'Registrar', 'Viewer') DEFAULT 'Viewer',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                # Add default admin
                cursor.execute("INSERT INTO users (username, password_hash, role) VALUES ('admin', 'admin123', 'Admin')")

            connection.commit()
            print("Migration completed successfully.")

    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        if 'connection' in locals() and connection.open:
            connection.close()

if __name__ == "__main__":
    migrate()
