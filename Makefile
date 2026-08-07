.PHONY: lint test build ci lint-fe lint-fe-fix

lint:
	vendor/bin/pint --test

lint-fe:
	npm run lint

lint-fe-fix:
	npm run lint:fix

test:
	php artisan test --compact

build:
	docker build --check .

ci: lint test build
	@echo "ci: all targets passed"
