#!/usr/bin/env python3
import asyncio
import sys
import os

# Add the project root to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import get_db
from app.models.file import File
from sqlalchemy import select

async def check_files():
    print("Checking files in database...")
    async for db in get_db():
        try:
            stmt = select(File).limit(10)
            result = await db.execute(stmt)
            files = result.scalars().all()
            print(f'Found {len(files)} files:')
            for file in files:
                print(f'  File ID: {file.id}')
                print(f'  Name: {file.display_name}')
                print(f'  Status: {file.status}')
                print(f'  Is Public: {file.is_public}')
                print(f'  Owner ID: {file.owner_id}')
                print('  ---')
        except Exception as e:
            print(f"Error: {e}")
        break

if __name__ == "__main__":
    asyncio.run(check_files()) 