# Работа с PostgreSQL: просмотр данных и ежедневные бэкапы

## 1) Как посмотреть содержимое БД на своем ПК

Из корня проекта:

```bash
docker compose -f docker-compose.production.yml exec db psql -U aristokrat -d aristokrat
```

Полезные команды внутри `psql`:

- `\dt` - список таблиц
- `\d users` - структура таблицы `users`
- `SELECT * FROM users LIMIT 20;` - посмотреть строки
- `\q` - выход

Быстрый просмотр без входа в интерактивный режим:

```bash
docker compose -f docker-compose.production.yml exec -T db psql -U aristokrat -d aristokrat -c "SELECT id, email, role FROM users LIMIT 20;"
```

## 2) Ручной бэкап

```bash
chmod +x scripts/db-backup.sh scripts/db-restore.sh
./scripts/db-backup.sh
```

Файл бэкапа создается в директории `backups/` в формате `.sql.gz`.

## 3) Ежедневный автобэкап (cron)

Открыть crontab:

```bash
crontab -e
```

Добавить строку (каждый день в 03:30):

```cron
30 3 * * * cd /root/Aristokrat && /root/Aristokrat/scripts/db-backup.sh >> /var/log/aristokrat-db-backup.log 2>&1
```

Проверить:

```bash
crontab -l
```

## 4) Восстановление из бэкапа

```bash
./scripts/db-restore.sh backups/aristokrat_YYYY-MM-DD_HH-MM-SS.sql.gz
```

Скрипт перезапишет текущую базу данными из выбранного бэкапа.

## 5) Сколько хранить бэкапы

По умолчанию скрипт удаляет бэкапы старше 14 дней.

Можно изменить:

```bash
RETENTION_DAYS=30 ./scripts/db-backup.sh
```
