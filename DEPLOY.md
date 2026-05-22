# Monote — VPS 배포 가이드

## 요구 사항

- Ubuntu 22.04+ VPS
- Docker + Docker Compose v2
- 도메인 (Cloudflare 또는 직접 DNS 설정)

---

## 1. 서버 초기 설정

```bash
# Docker 설치
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Docker Compose v2 확인
docker compose version
```

## 2. 코드 배포

```bash
# 서버에 클론
git clone https://github.com/youruser/monote.git /srv/monote
cd /srv/monote

# 환경변수 설정
cp .env.production.example .env
nano .env   # DB_PASSWORD, NEXTAUTH_SECRET, NEXTAUTH_URL, DOMAIN 설정
```

## 3. SSL 인증서 발급 (Let's Encrypt)

nginx.conf 의 `YOURDOMAIN.COM` 을 실제 도메인으로 교체한 뒤:

```bash
# 인증서 발급 (Certbot 컨테이너 실행)
docker compose --profile ssl run --rm certbot

# 확인
ls /var/lib/docker/volumes/monote_certbot_certs/_data/live/
```

## 4. 앱 시작

```bash
# 빌드 및 실행 (최초)
docker compose up -d --build

# 로그 확인
docker compose logs -f app

# DB 마이그레이션은 Dockerfile CMD에서 자동 실행됨
# 시드 데이터 (선택사항)
docker compose exec app npx tsx prisma/seed.ts
```

## 5. 업데이트

```bash
cd /srv/monote
git pull
docker compose up -d --build app
# 이전 이미지 정리
docker image prune -f
```

## 6. 인증서 자동 갱신 (cron)

```bash
# crontab -e 에 추가
0 3 * * * cd /srv/monote && docker compose --profile ssl run --rm certbot renew --quiet && docker compose exec nginx nginx -s reload
```

## 7. 백업

```bash
# DB 덤프
docker compose exec db pg_dump -U monote monote_db > backup_$(date +%Y%m%d).sql

# 업로드 파일
tar -czf uploads_$(date +%Y%m%d).tar.gz $(docker volume inspect monote_uploads_data --format '{{.Mountpoint}}')
```

## 8. 방화벽 설정

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## 구조

```
VPS
├── Nginx (80/443) — SSL 종료, 정적 파일 서빙, 프록시
├── Next.js App (3000) — 앱 서버 + Socket.io
└── PostgreSQL (5432) — 데이터베이스 (외부 노출 안 함)
```

업로드 파일은 Docker volume `monote_uploads_data` 에 저장되며 Nginx가 직접 서빙합니다.
