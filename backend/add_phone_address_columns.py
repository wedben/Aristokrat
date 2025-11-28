#!/usr/bin/env python3
"""
Скрипт для добавления колонок phone и address в таблицу users
"""

from app.database.session import SessionLocal
from sqlalchemy import text

def add_columns():
    """Добавить колонки phone и address в таблицу users"""
    db = SessionLocal()
    try:
        # Проверяем, существуют ли колонки
        result = db.execute(text("PRAGMA table_info(users)"))
        columns = [row[1] for row in result.fetchall()]
        
        if 'phone' not in columns:
            db.execute(text("ALTER TABLE users ADD COLUMN phone VARCHAR"))
            print("✅ Колонка phone добавлена")
        else:
            print("ℹ️  Колонка phone уже существует")
        
        if 'address' not in columns:
            db.execute(text("ALTER TABLE users ADD COLUMN address VARCHAR"))
            print("✅ Колонка address добавлена")
        else:
            print("ℹ️  Колонка address уже существует")
        
        db.commit()
        print("\n✅ Готово! Колонки добавлены в таблицу users.")
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    add_columns()

