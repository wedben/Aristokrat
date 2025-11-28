#!/usr/bin/env python3
"""
Скрипт для сброса пароля администратора
Использование: python reset_admin.py [новый_пароль]
"""

import sys
from app.database.session import SessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash

def reset_admin_password(new_password=None):
    """Сбросить пароль администратора"""
    db = SessionLocal()
    try:
        # Используем SQL напрямую, чтобы избежать проблем с отсутствующими колонками
        from sqlalchemy import text
        
        password = new_password or "Wersaderba12x.---."
        hashed_password = get_password_hash(password)
        
        # Проверяем, существует ли админ
        result = db.execute(text("SELECT id FROM users WHERE email = 'admin@aristokrat.com'"))
        admin_row = result.fetchone()
        
        if not admin_row:
            # Создаем админа
            db.execute(text("""
                INSERT INTO users (email, full_name, hashed_password, role, is_active)
                VALUES ('admin@aristokrat.com', 'Administrator', :password, 'admin', 1)
            """), {"password": hashed_password})
            print("✅ Администратор создан")
        else:
            # Обновляем пароль
            db.execute(text("""
                UPDATE users 
                SET hashed_password = :password, is_active = 1, email = 'admin@aristokrat.com'
                WHERE email = 'admin@aristokrat.com'
            """), {"password": hashed_password})
            print("✅ Пароль администратора обновлен")
        
        db.commit()
        print(f"\n📧 Email: admin@aristokrat.com")
        print(f"🔒 Пароль: {password}")
        print(f"\n✅ Готово! Теперь вы можете войти в систему.")
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    new_password = sys.argv[1] if len(sys.argv) > 1 else None
    reset_admin_password(new_password)

