"""
Скрипт для удаления неиспользуемых таблиц из базы данных.
Удаляет таблицы: menu_items, card_progress, card_views
"""
import sqlite3
import sys

def remove_unused_tables():
    conn = sqlite3.connect('app.db')
    cursor = conn.cursor()
    
    unused_tables = ['menu_items', 'card_progress', 'card_views']
    
    print('Проверка неиспользуемых таблиц:')
    for table in unused_tables:
        cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table}'")
        if cursor.fetchone():
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            print(f'  {table}: {count} записей')
        else:
            print(f'  {table}: таблица не существует')
    
    print('\n⚠️  ВНИМАНИЕ: Это действие необратимо!')
    response = input('Удалить неиспользуемые таблицы? (yes/no): ')
    
    if response.lower() != 'yes':
        print('Отменено.')
        conn.close()
        return
    
    print('\nУдаление таблиц...')
    for table in unused_tables:
        try:
            cursor.execute(f"DROP TABLE IF EXISTS {table}")
            print(f'  ✓ {table} удалена')
        except Exception as e:
            print(f'  ✗ Ошибка при удалении {table}: {e}')
    
    conn.commit()
    conn.close()
    print('\n✅ Готово!')

if __name__ == '__main__':
    remove_unused_tables()

