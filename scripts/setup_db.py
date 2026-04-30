#!/usr/bin/env python3
"""
Setup script to initialize Supabase database schema and seed sample data.
"""

import os
import sys
from pathlib import Path

try:
    from supabase import create_client, Client
except ImportError:
    print("Installing Supabase Python client...")
    os.system("pip install supabase")
    from supabase import create_client, Client

# Get environment variables
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables")
    print("Please ensure these are set in your .env.local file")
    sys.exit(1)

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def run_sql_file(file_path: str):
    """Execute SQL commands from a file."""
    with open(file_path, 'r') as f:
        sql_content = f.read()
    
    # Split by semicolon and execute each statement
    statements = [stmt.strip() for stmt in sql_content.split(';') if stmt.strip()]
    
    print(f"Executing {len(statements)} SQL statements from {file_path}...")
    
    try:
        # Execute SQL directly via Supabase's execute method
        for i, statement in enumerate(statements, 1):
            print(f"  [{i}/{len(statements)}] Executing statement...")
            supabase.postgrest.auth(SUPABASE_KEY).execute_sql(statement)
        
        print("✓ Database schema created successfully!")
        return True
    except Exception as e:
        print(f"✗ Error executing SQL: {e}")
        return False

def seed_sample_data():
    """Insert sample books and data."""
    print("\nSeeding sample data...")
    
    sample_books = [
        {
            "title": "The Great Gatsby",
            "author": "F. Scott Fitzgerald",
            "isbn": "978-0-7432-7356-5",
            "description": "A classic American novel set in the Jazz Age.",
            "category": "Fiction",
            "published_year": 1925,
            "total_copies": 5,
            "available_copies": 4,
            "cover_url": "https://images.unsplash.com/photo-1543002588-d4d36cf6d465?w=300"
        },
        {
            "title": "To Kill a Mockingbird",
            "author": "Harper Lee",
            "isbn": "978-0-06-112008-4",
            "description": "A gripping tale of racial injustice and childhood innocence.",
            "category": "Fiction",
            "published_year": 1960,
            "total_copies": 4,
            "available_copies": 3,
            "cover_url": "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=300"
        },
        {
            "title": "1984",
            "author": "George Orwell",
            "isbn": "978-0-452-26423-9",
            "description": "A dystopian novel about totalitarianism and surveillance.",
            "category": "Science Fiction",
            "published_year": 1949,
            "total_copies": 6,
            "available_copies": 5,
            "cover_url": "https://images.unsplash.com/photo-1507842217343-583f1904fdf0?w=300"
        },
        {
            "title": "Pride and Prejudice",
            "author": "Jane Austen",
            "isbn": "978-0-14-143951-8",
            "description": "A romance novel about social class and marriage.",
            "category": "Romance",
            "published_year": 1813,
            "total_copies": 4,
            "available_copies": 3,
            "cover_url": "https://images.unsplash.com/photo-1495446815901-a7297e45bb81?w=300"
        },
        {
            "title": "The Catcher in the Rye",
            "author": "J.D. Salinger",
            "isbn": "978-0-316-76948-0",
            "description": "A coming-of-age novel about teenage alienation.",
            "category": "Fiction",
            "published_year": 1951,
            "total_copies": 3,
            "available_copies": 2,
            "cover_url": "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300"
        },
        {
            "title": "The Hobbit",
            "author": "J.R.R. Tolkien",
            "isbn": "978-0-547-92871-2",
            "description": "An adventure fantasy about a hobbit and a magical ring.",
            "category": "Fantasy",
            "published_year": 1937,
            "total_copies": 5,
            "available_copies": 4,
            "cover_url": "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=300"
        }
    ]
    
    try:
        # Insert sample books
        for book in sample_books:
            try:
                supabase.table("books").insert(book).execute()
                print(f"  ✓ Added: {book['title']}")
            except Exception as e:
                # Book might already exist, that's fine
                print(f"  ℹ {book['title']}: {str(e)[:50]}")
        
        print("✓ Sample data seeded successfully!")
        return True
    except Exception as e:
        print(f"✗ Error seeding data: {e}")
        return False

def main():
    """Main setup function."""
    print("=" * 50)
    print("Online Library - Database Setup")
    print("=" * 50)
    
    # Run schema migration
    schema_file = Path(__file__).parent / "001_create_library_schema.sql"
    if not schema_file.exists():
        print(f"Error: Schema file not found at {schema_file}")
        sys.exit(1)
    
    if not run_sql_file(str(schema_file)):
        sys.exit(1)
    
    # Seed sample data
    if not seed_sample_data():
        print("Warning: There was an issue seeding data, but the schema was created.")
    
    print("\n" + "=" * 50)
    print("✓ Setup complete!")
    print("=" * 50)

if __name__ == "__main__":
    main()
