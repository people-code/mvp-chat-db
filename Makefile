.PHONY: dev down

dev:
	docker compose up -d --wait db
	npm run db:migrate
	npm run db:seed
	npm run dev

down:
	docker compose down
